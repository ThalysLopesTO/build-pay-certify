import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { format } from 'https://esm.sh/date-fns@3.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Starting daily webhook trigger for all companies');

    // Get all companies with webhooks enabled
    const { data: settings, error } = await supabase
      .from('company_settings')
      .select('company_id, company_name, webhook_url, webhook_enabled')
      .eq('webhook_enabled', true)
      .not('webhook_url', 'is', null);

    if (error) {
      console.error('Error fetching company settings:', error);
      throw error;
    }

    if (!settings || settings.length === 0) {
      console.log('No companies with webhooks enabled');
      return new Response(
        JSON.stringify({ message: 'No companies with webhooks enabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${settings.length} companies with webhooks enabled`);

    const today = format(new Date(), 'yyyy-MM-dd');
    const results = [];

    // Trigger webhook for each company
    for (const companySetting of settings) {
      console.log(`Triggering webhook for ${companySetting.company_name} (${companySetting.company_id})`);

      try {
        const response = await supabase.functions.invoke('send-daily-webhook', {
          body: {
            company_id: companySetting.company_id,
            date: today,
          },
        });

        results.push({
          company_id: companySetting.company_id,
          company_name: companySetting.company_name,
          success: !response.error,
          error: response.error?.message || null,
        });

        console.log(`✅ Webhook triggered for ${companySetting.company_name}`);
      } catch (error: any) {
        console.error(`❌ Failed to trigger webhook for ${companySetting.company_name}:`, error.message);
        results.push({
          company_id: companySetting.company_id,
          company_name: companySetting.company_name,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`✅ Complete: ${successCount}/${settings.length} webhooks triggered successfully`);

    return new Response(
      JSON.stringify({
        message: `Triggered webhooks for ${settings.length} companies`,
        results: results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
