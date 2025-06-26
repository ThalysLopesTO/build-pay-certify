
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  )

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader)
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    console.log('🔄 Syncing subscription for user:', user.id)

    // Get user's company and existing subscription data
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('User profile not found')
    }

    // Check if user is super admin (bypass subscription check)
    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userProfile?.role === 'super_admin') {
      console.log('✅ Super admin detected, bypassing subscription validation')
      return new Response(JSON.stringify({ 
        success: true, 
        subscription: { status: 'active', plan_type: 'enterprise', employee_limit: null },
        message: 'Super admin access granted'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Get company data including subscription_override flag
    const { data: company } = await supabaseClient
      .from('companies')
      .select('stripe_customer_id, stripe_subscription_id, subscription_override, plan_type, employee_limit')
      .eq('id', profile.company_id)
      .single()

    // Check for subscription override
    if (company?.subscription_override) {
      console.log('✅ Company has subscription override, granting access')
      
      // Create/update subscription record with override status
      await supabaseClient
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          company_id: profile.company_id,
          status: 'active',
          plan_type: company.plan_type || 'enterprise',
          employee_limit: company.employee_limit,
        })

      return new Response(JSON.stringify({ 
        success: true, 
        subscription: { 
          status: 'active', 
          plan_type: company.plan_type || 'enterprise', 
          employee_limit: company.employee_limit 
        },
        message: 'Company subscription override active'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (!company?.stripe_customer_id || !company?.stripe_subscription_id) {
      console.log('⚠️ No Stripe subscription found for company')
      
      // Create/update subscription record as inactive
      await supabaseClient
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          company_id: profile.company_id,
          status: 'inactive',
          plan_type: 'free',
          employee_limit: 0,
        })

      return new Response(JSON.stringify({ 
        success: true, 
        subscription: { status: 'inactive', plan_type: 'free', employee_limit: 0 },
        needsSubscription: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Fetch subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id)
    const customer = await stripe.customers.retrieve(company.stripe_customer_id)

    console.log('📊 Stripe subscription status:', subscription.status)

    // Determine plan type and employee limit
    let planType = 'free'
    let employeeLimit = 0

    if (subscription.items.data.length > 0) {
      const priceId = subscription.items.data[0].price.id
      // Map price IDs to plans (you'll need to update these with your actual Stripe price IDs)
      if (priceId.includes('basic')) {
        planType = 'basic'
        employeeLimit = 10
      } else if (priceId.includes('premium')) {
        planType = 'premium'
        employeeLimit = 20
      } else if (priceId.includes('enterprise')) {
        planType = 'enterprise'
        employeeLimit = null // unlimited
      }
    }

    // Update subscription in database
    const subscriptionData = {
      user_id: user.id,
      company_id: profile.company_id,
      stripe_customer_id: company.stripe_customer_id,
      stripe_subscription_id: company.stripe_subscription_id,
      status: subscription.status,
      plan_type: planType,
      employee_limit: employeeLimit,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    }

    const { error: syncError } = await supabaseClient
      .from('subscriptions')
      .upsert(subscriptionData)

    if (syncError) {
      console.error('❌ Failed to sync subscription:', syncError)
      throw syncError
    }

    // Also update company record
    await supabaseClient
      .from('companies')
      .update({
        subscription_status: subscription.status,
        plan_type: planType,
        employee_limit: employeeLimit,
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
      })
      .eq('id', profile.company_id)

    console.log('✅ Subscription synced successfully')

    const needsSubscription = subscription.status !== 'active'

    return new Response(JSON.stringify({ 
      success: true, 
      subscription: {
        status: subscription.status,
        plan_type: planType,
        employee_limit: employeeLimit,
        current_period_end: subscription.current_period_end,
      },
      needsSubscription 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('💥 Subscription sync error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        needsSubscription: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
