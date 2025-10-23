import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { format } from 'https://esm.sh/date-fns@3.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DailySummaryPayload {
  event: string;
  company_id: string;
  date: string;
  timestamp: string;
  summary: {
    total_employees: number;
    total_punch_records: number;
    total_hours: number;
  };
  by_jobsite: Array<{
    jobsite_id: string;
    jobsite_name: string;
    total_hours: number;
    employees: Array<{
      user_id: string;
      name: string;
      hours: number;
      records: number;
    }>;
  }>;
  text_summary: string;
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

  // Fetch company timezone setting
  const { data: companySettings } = await supabase
    .from('company_settings')
    .select('timezone')
    .eq('company_id', companyId)
    .single();
  
  const timezone = companySettings?.timezone || 'America/Toronto';
  console.log(`Using timezone: ${timezone}`);

  // Fetch punch data for the day (only completed punches with both check-in and check-out)
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
        id,
        name
      )
    `)
    .eq('company_id', companyId)
    .gte('check_in_time', `${date}T00:00:00`)
    .lte('check_in_time', `${date}T23:59:59`)
    .not('check_in_time', 'is', null)
    .not('check_out_time', 'is', null);

  if (punchesError) {
    console.error('Error fetching punches:', punchesError);
    throw punchesError;
  }

  if (!punches || punches.length === 0) {
    console.log('No punches found for the day');
    return {
      event: 'daily_punch_summary',
      company_id: companyId,
      date: date,
      timestamp: new Date().toISOString(),
      summary: {
        total_employees: 0,
        total_punch_records: 0,
        total_hours: 0,
      },
      by_jobsite: [],
      text_summary: '',
    };
  }

  // Build nested structure: jobsite → employees
  const jobsiteMap = new Map<string, {
    jobsite_id: string;
    jobsite_name: string;
    total_hours: number;
    employees: Map<string, {
      user_id: string;
      name: string;
      hours: number;
      records: number;
    }>;
  }>();
  
  let totalHours = 0;
  const totalEmployees = new Set<string>();

  punches.forEach((punch: any) => {
    const checkIn = new Date(punch.check_in_time);
    const checkOut = new Date(punch.check_out_time);
    const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    
    const userId = punch.user_id;
    const employeeName = punch.user_profiles
      ? `${punch.user_profiles.first_name} ${punch.user_profiles.last_name}`
      : 'Unknown Employee';
    const jobsiteId = punch.jobsite_id || 'unknown';
    const jobsiteName = punch.jobsites?.name || 'Unknown Jobsite';
    
    totalEmployees.add(userId);
    totalHours += hours;
    
    // Ensure jobsite exists in map
    if (!jobsiteMap.has(jobsiteId)) {
      jobsiteMap.set(jobsiteId, {
        jobsite_id: jobsiteId,
        jobsite_name: jobsiteName,
        total_hours: 0,
        employees: new Map(),
      });
    }
    
    const jobsite = jobsiteMap.get(jobsiteId)!;
    jobsite.total_hours += hours;
    
    // Ensure employee exists in jobsite
    if (!jobsite.employees.has(userId)) {
      jobsite.employees.set(userId, {
        user_id: userId,
        name: employeeName,
        hours: 0,
        records: 0,
      });
    }
    
    const employee = jobsite.employees.get(userId)!;
    employee.hours += hours;
    employee.records += 1;
  });

  // Convert maps to arrays and sort
  const byJobsite = Array.from(jobsiteMap.values())
    .map(jobsite => ({
      jobsite_id: jobsite.jobsite_id,
      jobsite_name: jobsite.jobsite_name,
      total_hours: Math.round(jobsite.total_hours * 100) / 100,
      employees: Array.from(jobsite.employees.values())
        .map(emp => ({
          user_id: emp.user_id,
          name: emp.name,
          hours: Math.round(emp.hours * 100) / 100,
          records: emp.records,
        }))
        .sort((a, b) => b.hours - a.hours), // Sort by hours DESC
    }))
    .sort((a, b) => a.jobsite_name.localeCompare(b.jobsite_name)); // Sort by name ASC

  // Generate text summary
  const textSummary = byJobsite
    .map(jobsite => {
      const employeeLines = jobsite.employees
        .map(emp => `- ${emp.name} — ${emp.hours}h`)
        .join('\n');
      return `${jobsite.jobsite_name}\n${employeeLines}`;
    })
    .join('\n\n');

  const payload: DailySummaryPayload = {
    event: 'daily_punch_summary',
    company_id: companyId,
    date: date,
    timestamp: new Date().toISOString(),
    summary: {
      total_employees: totalEmployees.size,
      total_punch_records: punches.length,
      total_hours: Math.round(totalHours * 100) / 100,
    },
    by_jobsite: byJobsite,
    text_summary: textSummary,
  };

  console.log(`Summary generated: ${payload.summary.total_employees} employees, ${payload.summary.total_punch_records} punches, ${payload.summary.total_hours} hours across ${byJobsite.length} jobsites`);

  return payload;
}

// Send webhook with retry logic
async function sendWebhook(
  webhookUrl: string,
  payload: DailySummaryPayload,
  secret: string | null,
  retryCount: number = 0
): Promise<{ success: boolean; statusCode: number | null; response: string | null; error: string | null }> {
  const payloadString = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Webhook-Event': 'daily_punch_summary',
    'X-Webhook-Timestamp': new Date().toISOString(),
    'X-Company-ID': payload.company_id,
  };

  // Add signature if secret is provided
  if (secret) {
    const signature = await generateSignature(payloadString, secret);
    headers['X-Webhook-Signature'] = signature;
  }

  console.log(`Sending webhook to ${webhookUrl} (attempt ${retryCount + 1})`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      body: payloadString,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
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
        error: `HTTP ${response.status}: ${responseText.substring(0, 200)}`,
      };
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      console.error(`❌ Webhook timeout after 10 seconds`);
      return {
        success: false,
        statusCode: null,
        response: null,
        error: 'Request timeout: The webhook endpoint did not respond within 10 seconds',
      };
    }
    
    // Handle network errors
    console.error(`❌ Webhook error (attempt ${retryCount + 1}):`, error.message);
    return {
      success: false,
      statusCode: null,
      response: null,
      error: `Network error: ${error.message}`,
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
    const { company_id, date, webhookUrl, webhookSecret, isTest } = await req.json();

    if (!company_id) {
      return new Response(
        JSON.stringify({ error: 'company_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetDate = date || format(new Date(), 'yyyy-MM-dd');

    console.log(`Processing daily webhook for company ${company_id} on ${targetDate}`);

    let finalWebhookUrl: string;
    let finalWebhookSecret: string | null;

    if (isTest) {
      // Test mode: use provided URL and secret
      if (!webhookUrl) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'webhook_url is required for test mode' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      finalWebhookUrl = webhookUrl;
      finalWebhookSecret = webhookSecret || null;
      console.log('🧪 Test mode: using provided webhook URL');
    } else {
      // Normal mode: fetch from database
      const { data: companySettings, error: companyError } = await supabase
        .from('company_settings')
        .select('webhook_url, webhook_secret, webhook_enabled, company_id, timezone')
        .eq('company_id', company_id)
        .single();

      if (companyError) {
        console.error('Error fetching company settings:', companyError);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Company settings not found' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!companySettings.webhook_enabled || !companySettings.webhook_url) {
        console.log('Webhooks are disabled or URL not configured');
        return new Response(
          JSON.stringify({ 
            success: false,
            message: 'Webhooks not enabled for this company' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      finalWebhookUrl = companySettings.webhook_url;
      finalWebhookSecret = companySettings.webhook_secret;
    }

    // Fetch and prepare payload
    const payload = await fetchDailySummaryData(supabase, company_id, targetDate);

    // Attempt to send webhook (with one retry)
    let result = await sendWebhook(finalWebhookUrl, payload, finalWebhookSecret, 0);

    if (!result.success) {
      console.log('First attempt failed, retrying...');
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
      result = await sendWebhook(finalWebhookUrl, payload, finalWebhookSecret, 1);
    }

    // Log the delivery attempt (skip in test mode)
    if (!isTest) {
      await logWebhookDelivery(
        supabase,
        company_id,
        'daily_punch_summary',
        finalWebhookUrl,
        payload,
        result.success ? 'success' : 'failed',
        result.statusCode,
        result.response,
        result.error,
        result.success ? 0 : 1
      );
    }

    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook sent successfully',
          statusCode: result.statusCode,
          response: result.response,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Webhook delivery failed after retry',
          error: result.error,
          statusCode: result.statusCode,
          response: result.response,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
