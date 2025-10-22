import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { format } from 'https://esm.sh/date-fns@3.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DailySummaryPayload {
  company_id: string;
  date: string;
  generatedAt: string;
  totals: {
    employees: number;
    punchRecords: number;
    hours: number;
  };
  employees: Array<{
    name: string;
    hours: number;
    jobsite: string;
  }>;
  jobsites: Array<{
    jobsiteName: string;
    hours: number;
  }>;
}

// Generate HMAC-SHA256 signature
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Log webhook delivery attempt
async function logWebhookDelivery(
  supabase: any,
  companyId: string,
  eventType: string,
  webhookUrl: string,
  payload: DailySummaryPayload,
  status: string,
  httpStatusCode: number | null,
  responseBody: string | null,
  errorMessage: string | null,
  retryCount: number = 0
) {
  const { error } = await supabase
    .from('webhook_logs')
    .insert({
      company_id: companyId,
      event_type: eventType,
      webhook_url: webhookUrl,
      payload: payload,
      status: status,
      http_status_code: httpStatusCode,
      response_body: responseBody,
      error_message: errorMessage,
      retry_count: retryCount,
    });

  if (error) {
    console.error('Failed to log webhook delivery:', error);
  }
}

// Fetch daily summary data
async function fetchDailySummaryData(
  supabase: any,
  companyId: string,
  date: string
): Promise<DailySummaryPayload> {
  console.log(`Fetching daily summary for company ${companyId} on ${date}`);

  // Fetch punch data for the day
  const { data: punches, error: punchesError } = await supabase
    .from('timesheets')
    .select(`
      id,
      user_id,
      jobsite_id,
      check_in_time,
      check_out_time,
      status,
      user_profiles:user_id (
        first_name,
        last_name
      ),
      jobsites:jobsite_id (
        name
      )
    `)
    .eq('company_id', companyId)
    .gte('check_in_time', `${date}T00:00:00`)
    .lt('check_in_time', `${date}T23:59:59`)
    .not('check_in_time', 'is', null);

  if (punchesError) {
    console.error('Error fetching punches:', punchesError);
    throw punchesError;
  }

  if (!punches || punches.length === 0) {
    console.log('No punches found for the day');
    return {
      company_id: companyId,
      date: date,
      generatedAt: new Date().toISOString(),
      totals: {
        employees: 0,
        punchRecords: 0,
        hours: 0,
      },
      employees: [],
      jobsites: [],
    };
  }

  // Calculate hours and aggregate data
  const employeeMap = new Map<string, { name: string; hours: number; jobsite: string }>();
  const jobsiteMap = new Map<string, { jobsiteName: string; hours: number }>();
  let totalHours = 0;

  punches.forEach((punch: any) => {
    if (!punch.check_out_time) return; // Skip incomplete punches

    const checkIn = new Date(punch.check_in_time);
    const checkOut = new Date(punch.check_out_time);
    const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

    const employeeName = punch.user_profiles
      ? `${punch.user_profiles.first_name} ${punch.user_profiles.last_name}`
      : 'Unknown Employee';
    const jobsiteName = punch.jobsites?.name || 'Unknown Jobsite';

    // Aggregate by employee
    if (!employeeMap.has(employeeName)) {
      employeeMap.set(employeeName, {
        name: employeeName,
        hours: 0,
        jobsite: jobsiteName,
      });
    }
    const empData = employeeMap.get(employeeName)!;
    empData.hours += hours;

    // Aggregate by jobsite
    if (!jobsiteMap.has(jobsiteName)) {
      jobsiteMap.set(jobsiteName, {
        jobsiteName: jobsiteName,
        hours: 0,
      });
    }
    const jobData = jobsiteMap.get(jobsiteName)!;
    jobData.hours += hours;

    totalHours += hours;
  });

  const payload: DailySummaryPayload = {
    company_id: companyId,
    date: date,
    generatedAt: new Date().toISOString(),
    totals: {
      employees: employeeMap.size,
      punchRecords: punches.length,
      hours: Math.round(totalHours * 100) / 100,
    },
    employees: Array.from(employeeMap.values()).map((emp) => ({
      name: emp.name,
      hours: Math.round(emp.hours * 100) / 100,
      jobsite: emp.jobsite,
    })),
    jobsites: Array.from(jobsiteMap.values()).map((job) => ({
      jobsiteName: job.jobsiteName,
      hours: Math.round(job.hours * 100) / 100,
    })),
  };

  console.log(`Summary generated: ${payload.totals.employees} employees, ${payload.totals.punchRecords} punches, ${payload.totals.hours} hours`);

  return payload;
}

// Send webhook with retry logic
async function sendWebhook(
  webhookUrl: string,
  payload: DailySummaryPayload,
  secret: string | null,
  retryCount: number = 0
): Promise<{ success: boolean; statusCode: number | null; response: string | null; error: string | null }> {
  try {
    const payloadString = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': 'daily_summary',
      'X-Webhook-Timestamp': new Date().toISOString(),
      'X-Company-ID': payload.company_id,
    };

    // Add signature if secret is provided
    if (secret) {
      const signature = await generateSignature(payloadString, secret);
      headers['X-Webhook-Signature'] = signature;
    }

    console.log(`Sending webhook to ${webhookUrl} (attempt ${retryCount + 1})`);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      body: payloadString,
    });

    const responseText = await response.text();

    if (response.ok) {
      console.log(`✅ Webhook sent successfully (${response.status})`);
      return {
        success: true,
        statusCode: response.status,
        response: responseText,
        error: null,
      };
    } else {
      console.error(`❌ Webhook failed with status ${response.status}: ${responseText}`);
      return {
        success: false,
        statusCode: response.status,
        response: responseText,
        error: `HTTP ${response.status}: ${responseText}`,
      };
    }
  } catch (error: any) {
    console.error(`❌ Webhook error (attempt ${retryCount + 1}):`, error.message);
    return {
      success: false,
      statusCode: null,
      response: null,
      error: error.message,
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { company_id, date } = await req.json();

    if (!company_id) {
      return new Response(
        JSON.stringify({ error: 'company_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetDate = date || format(new Date(), 'yyyy-MM-dd');

    console.log(`Processing daily webhook for company ${company_id} on ${targetDate}`);

    // Fetch company webhook settings
    const { data: companySettings, error: companyError } = await supabase
      .from('company_settings')
      .select('webhook_url, webhook_secret, webhook_enabled, company_id')
      .eq('company_id', company_id)
      .single();

    if (companyError) {
      console.error('Error fetching company settings:', companyError);
      return new Response(
        JSON.stringify({ error: 'Company settings not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!companySettings.webhook_enabled || !companySettings.webhook_url) {
      console.log('Webhooks are disabled or URL not configured');
      return new Response(
        JSON.stringify({ message: 'Webhooks not enabled for this company' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch and prepare payload
    const payload = await fetchDailySummaryData(supabase, company_id, targetDate);

    // Attempt to send webhook (with one retry)
    let result = await sendWebhook(companySettings.webhook_url, payload, companySettings.webhook_secret, 0);

    if (!result.success) {
      console.log('First attempt failed, retrying...');
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
      result = await sendWebhook(companySettings.webhook_url, payload, companySettings.webhook_secret, 1);
    }

    // Log the delivery attempt
    await logWebhookDelivery(
      supabase,
      company_id,
      'daily_summary',
      companySettings.webhook_url,
      payload,
      result.success ? 'success' : 'failed',
      result.statusCode,
      result.response,
      result.error,
      result.success ? 0 : 1
    );

    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook sent successfully',
          statusCode: result.statusCode,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Webhook delivery failed after retry',
          error: result.error,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
