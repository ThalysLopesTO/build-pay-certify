
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

  try {
    const { planType, customerEmail, isUnauthenticated } = await req.json()

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (planType === 'enterprise') {
      return new Response(
        JSON.stringify({
          redirectTo: 'mailto:sales@yourdomain.com?subject=Enterprise Plan Inquiry'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .select('stripe_price_id, price_monthly, employee_limit')
      .eq('plan_type', planType)
      .single()

    if (error || !plan?.stripe_price_id) {
      throw new Error('Invalid or missing Stripe Price ID for selected plan.')
    }

    // Determine success URL based on authentication status
    const successUrl = isUnauthenticated 
      ? `${req.headers.get('origin')}/register?session_id={CHECKOUT_SESSION_ID}`
      : `${req.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: `${req.headers.get('origin')}/pricing`,
      customer_email: customerEmail,
      metadata: {
        plan_type: planType,
        price_monthly: plan.price_monthly?.toString() || '0',
        employee_limit: plan.employee_limit?.toString() || 'unlimited',
        is_unauthenticated_signup: isUnauthenticated ? 'true' : 'false'
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
