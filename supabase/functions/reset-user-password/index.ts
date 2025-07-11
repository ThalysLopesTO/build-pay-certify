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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Get the current user from the token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Get the admin's profile to check permissions
    const { data: adminProfile, error: adminError } = await supabaseClient
      .from('user_profiles')
      .select('role, company_id')
      .eq('user_id', user.id)
      .single()

    if (adminError || !adminProfile) {
      return new Response(
        JSON.stringify({ error: 'Admin profile not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const { targetUserId, newPassword, targetUserEmail, targetUserName } = await req.json()

    if (!targetUserId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get target user's profile to check if reset is allowed
    const { data: targetProfile, error: targetError } = await supabaseClient
      .from('user_profiles')
      .select('role, company_id')
      .eq('user_id', targetUserId)
      .single()

    if (targetError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Check if admin and target are from the same company
    if (adminProfile.company_id !== targetProfile.company_id) {
      return new Response(
        JSON.stringify({ error: 'Cannot reset password for users from different companies' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Check permissions based on roles
    const canReset = (adminRole: string, targetRole: string): boolean => {
      // Admins can reset passwords for Employee, Foreman, Manager (but not Admin)
      if (adminRole === 'admin' || adminRole === 'super_admin') {
        return targetRole !== 'admin' && targetRole !== 'super_admin'
      }
      
      // Managers can reset passwords for Employee and Foreman (but not Manager or Admin)
      if (adminRole === 'management') {
        return targetRole === 'employee' || targetRole === 'foreman'
      }
      
      return false
    }

    if (!canReset(adminProfile.role, targetProfile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to reset this user\'s password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Update the user's password using admin API
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update password' }),
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
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})