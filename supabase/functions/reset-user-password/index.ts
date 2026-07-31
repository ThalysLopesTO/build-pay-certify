import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!serviceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'Server misconfigured: missing service role key' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')

    // Get the current user from the token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth failed:', authError?.message)
      return new Response(
        JSON.stringify({ error: `Unauthorized: ${authError?.message ?? 'no user'}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }


    // Get the admin's profile in their ACTIVE company (multi-company aware)
    const { data: adminRows, error: adminError } = await supabaseClient
      .from('user_profiles')
      .select('role, company_id')
      .eq('user_id', user.id)

    if (adminError || !adminRows || adminRows.length === 0) {
      console.error('Admin profile lookup failed:', adminError?.message, 'user:', user.id)
      return new Response(
        JSON.stringify({ error: `Admin profile not found${adminError ? `: ${adminError.message}` : ''}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }


    const { data: callerActiveCompanyId } = await supabaseClient
      .rpc('get_active_company_id_for', { p_user_id: user.id })
    const adminProfile =
      adminRows.find((r) => r.role === 'super_admin') ||
      adminRows.find((r) => r.company_id === callerActiveCompanyId) ||
      adminRows[0]

    const { targetUserId, newPassword, targetUserEmail, targetUserName } = await req.json()

    if (!targetUserId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get target user's profile(s) — they may belong to multiple companies
    const { data: targetRows, error: targetError } = await supabaseClient
      .from('user_profiles')
      .select('role, company_id')
      .eq('user_id', targetUserId)

    if (targetError || !targetRows || targetRows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Check if the requesting user is a super_admin
    const isSuperAdmin = adminProfile.role === 'super_admin';
    let targetProfile = targetRows[0]

    // Super admins can reset ANY user's password (including other admins, but not other super_admins)
    if (isSuperAdmin) {
      // Super admins cannot reset other super admin passwords
      if (targetRows.some((r) => r.role === 'super_admin')) {
        return new Response(
          JSON.stringify({ error: 'Cannot reset password for other Super Admins' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
      // Super admin can proceed - skip company and role checks
    } else {
      // For regular admins: the target must be a member of the admin's company,
      // and their role IN THAT COMPANY is what gets checked
      const targetInCompany = targetRows.find((r) => r.company_id === adminProfile.company_id)
      if (!targetInCompany) {
        return new Response(
          JSON.stringify({ error: 'Cannot reset password for users from different companies' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
      targetProfile = targetInCompany

      // Check permissions based on roles for non-super admins
      const canReset = (adminRole: string, targetRole: string): boolean => {
        // Company Admins can reset passwords for Employee, Foreman, Manager (but not Admin)
        if (adminRole === 'admin') {
          return targetRole !== 'admin' && targetRole !== 'super_admin'
        }
        
        // Managers can reset passwords for Employee and Foreman (but not Manager or Admin)
        if (adminRole === 'management') {
          return targetRole === 'employee' || targetRole === 'foreman'
        }
        
        return false
      }

      if (!canReset(adminProfile.role, targetProfile.role)) {
        console.error('Permission denied:', adminProfile.role, '->', targetProfile.role)
        return new Response(
          JSON.stringify({ error: `Insufficient permissions: a ${adminProfile.role} cannot reset a ${targetProfile.role}'s password` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
    }



    // Update the user's password using admin API
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return new Response(
        JSON.stringify({ error: `Failed to update password: ${updateError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }


    // Log the password reset for accountability
    const { error: logError } = await supabaseClient
      .from('password_reset_logs')
      .insert({
        admin_user_id: user.id,
        target_user_id: targetUserId,
        target_user_email: targetUserEmail || 'unknown',
        target_user_name: targetUserName || 'unknown',
        company_id: adminProfile.company_id
      })

    if (logError) {
      console.warn('Failed to log password reset:', logError)
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Password reset successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: `Internal server error: ${(error as Error)?.message ?? 'unknown'}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )

  }
})