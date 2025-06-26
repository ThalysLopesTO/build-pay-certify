
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
      throw new Error('Missing Stripe signature or webhook secret')
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const planType = session.metadata?.plan_type || 'basic'
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        
        // Update company with subscription info
        const { error } = await supabaseClient
          .from('companies')
          .update({
            plan_type: planType,
            subscription_status: 'active',
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            employee_limit: planType === 'basic' ? 10 : planType === 'premium' ? 20 : null
          })
          .eq('stripe_customer_id', session.customer)

        if (error) {
          console.error('Error updating company:', error)
        }
        break
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          
          await supabaseClient
            .from('companies')
            .update({
              subscription_status: 'active',
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0]
            })
            .eq('stripe_subscription_id', subscription.id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          await supabaseClient
            .from('companies')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        await supabaseClient
          .from('companies')
          .update({ 
            subscription_status: 'canceled',
            subscription_end_date: new Date().toISOString().split('T')[0]
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
