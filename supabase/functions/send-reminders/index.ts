import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Email wrapper function (moved from utils to avoid import issues)
interface EmailWrapperData {
  bodyText: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyLogo?: string;
}

function createEmailWrapper(data: EmailWrapperData): string {
  const {
    bodyText,
    companyName = 'StackBuild',
    companyAddress = '',
    companyPhone = '',
    companyLogo = ''
  } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email from ${companyName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px;">
          ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" style="max-height: 60px; margin-bottom: 10px;" />` : ''}
          <h1 style="color: #333; margin: 0; font-size: 24px;">${companyName}</h1>
        </div>
        
        <!-- Body Content -->
        <div style="color: #555; line-height: 1.6; margin-bottom: 30px;">
          ${bodyText.replace(/\n/g, '<br>')}
        </div>
        
        <!-- Footer -->
        <div style="border-top: 2px solid #eee; padding-top: 20px; text-align: center; color: #888; font-size: 12px;">
          <p style="margin: 0;"><strong>${companyName}</strong></p>
          ${companyAddress ? `<p style="margin: 5px 0;">${companyAddress}</p>` : ''}
          ${companyPhone ? `<p style="margin: 5px 0;">${companyPhone}</p>` : ''}
          <p style="margin: 10px 0 0;">This is an automated message from ${companyName}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

interface Company {
  id: string;
  name: string;
  status: string;
  subscription_status: string;
  company_settings: {
    enable_invoice_reminders: boolean;
    invoice_reminder_days_before: number;
    invoice_overdue_reminder_days: number;
    enable_quote_reminders: boolean;
    quote_reminder_days: number;
    company_email: string;
    company_name: string;
    company_address?: string;
    company_phone?: string;
    company_logo_url?: string;
  };
}

interface Invoice {
  id: string;
  invoice_number: string;
  title: string;
  client_company: string;
  client_email: string;
  total_amount: number;
  due_date: string;
  status: string;
  company_id: string;
}

interface Quote {
  id: string;
  quote_number: string;
  project_name: string;
  client_name: string;
  client_email: string;
  total_amount: number;
  quote_date: string;
  status: string;
  company_id: string;
}

interface EmailTemplate {
  subject: string;
  body_text: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log('📧 Starting daily reminder process...');
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        status,
        subscription_status,
        company_settings (
          enable_invoice_reminders,
          invoice_reminder_days_before,
          invoice_overdue_reminder_days,
          enable_quote_reminders,
          quote_reminder_days,
          company_email,
          company_name,
          company_address,
          company_phone,
          company_logo_url
        )
      `)
      .eq('status', 'active')
      .in('subscription_status', ['active', 'trialing']);

    if (companiesError) {
      console.error('❌ Error fetching companies:', companiesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch companies' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🏢 Processing ${companies?.length || 0} active companies`);

    for (const company of companies || []) {
      await processCompanyReminders(company as Company);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${companies?.length || 0} companies` 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🔥 Error in send-reminders function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

async function processCompanyReminders(company: Company) {
  const settings = company.company_settings;
  if (!settings) {
    console.log(`⚠️ No settings found for ${company.name}`);
    return;
  }

  console.log(`📌 Processing reminders for: ${company.name}`);

  if (settings.enable_invoice_reminders) {
    await processInvoiceReminders(company, settings);
  }

  if (settings.enable_quote_reminders) {
    await processQuoteReminders(company, settings);
  }
}

/* -------------------- INVOICE REMINDERS -------------------- */
async function processInvoiceReminders(company: Company, settings: any) {
  const today = new Date();
  const beforeDueDate = new Date(today);
  beforeDueDate.setDate(today.getDate() + settings.invoice_reminder_days_before);
  
  const overdueDateCheck = new Date(today);
  overdueDateCheck.setDate(today.getDate() - settings.invoice_overdue_reminder_days);

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('company_id', company.id)
    .in('status', ['pending', 'sent'])
    .or(`due_date.eq.${beforeDueDate.toISOString().split('T')[0]},due_date.eq.${overdueDateCheck.toISOString().split('T')[0]}`);

  if (error) {
    console.error(`❌ Error fetching invoices for ${company.name}:`, error);
    return;
  }

  for (const invoice of invoices || []) {
    const invoiceDueDate = new Date(invoice.due_date);
    const isBeforeDue = invoiceDueDate.toDateString() === beforeDueDate.toDateString();
    const isOverdue = invoiceDueDate.toDateString() === overdueDateCheck.toDateString();

    if (isBeforeDue || isOverdue) {
      const reminderType = isOverdue ? 'overdue' : 'before_due';
      const alreadySent = await checkReminderSent(company.id, 'invoice', invoice.id, reminderType);
      if (alreadySent) {
        console.log(`⏩ Reminder already sent for invoice ${invoice.invoice_number}`);
        continue;
      }
      await sendInvoiceReminder(company, invoice as Invoice, reminderType, settings);
    }
  }
}

/* -------------------- QUOTE REMINDERS -------------------- */
async function processQuoteReminders(company: Company, settings: any) {
  const today = new Date();
  const reminderDate = new Date(today);
  reminderDate.setDate(today.getDate() - settings.quote_reminder_days);

  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('company_id', company.id)
    .eq('status', 'sent')
    .eq('quote_date', reminderDate.toISOString().split('T')[0]);

  if (error) {
    console.error(`❌ Error fetching quotes for ${company.name}:`, error);
    return;
  }

  for (const quote of quotes || []) {
    const alreadySent = await checkReminderSent(company.id, 'quote', quote.id, 'follow_up');
    if (alreadySent) {
      console.log(`⏩ Reminder already sent for quote ${quote.quote_number}`);
      continue;
    }
    await sendQuoteReminder(company, quote as Quote, settings);
  }
}

/* -------------------- CHECK REMINDER -------------------- */
async function checkReminderSent(companyId: string, type: string, recordId: string, reminderType: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('reminder_logs')
    .select('id')
    .eq('company_id', companyId)
    .eq('type', type)
    .eq('record_id', recordId)
    .gte('sent_at', `${today}T00:00:00.000Z`)
    .lt('sent_at', `${today}T23:59:59.999Z`)
    .limit(1);

  if (error) {
    console.error('❌ Error checking reminder logs:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}

/* -------------------- SEND REMINDERS -------------------- */
async function sendInvoiceReminder(company: Company, invoice: Invoice, reminderType: string, settings: any) {
  try {
    const reminderStage = reminderType === 'overdue' ? 'overdue' : 'before_due';
    const template = await getEmailTemplate(company.id, 'invoice', reminderStage);

    // Replace placeholders in plain text template
    const bodyText = template.body_text
      .replace(/{{client_name}}/g, invoice.client_company)
      .replace(/{{invoice_number}}/g, invoice.invoice_number)
      .replace(/{{total_amount}}/g, invoice.total_amount.toFixed(2))
      .replace(/{{due_date}}/g, new Date(invoice.due_date).toLocaleDateString());

    const html = createEmailWrapper({
      subject: template.subject,
      bodyText,
      companyName: settings.company_name,
      companyAddress: settings.company_address,
      companyPhone: settings.company_phone,
      companyLogo: settings.company_logo_url
    });

    await supabase.functions.invoke('send-email', {
      body: { to: invoice.client_email, subject: template.subject, html }
    });

    await logReminder(company.id, 'invoice', invoice.id);
    console.log(`✅ Invoice reminder sent for ${invoice.invoice_number}`);

  } catch (error) {
    console.error(`❌ Error sending invoice reminder for ${invoice.invoice_number}:`, error);
  }
}

async function sendQuoteReminder(company: Company, quote: Quote, settings: any) {
  try {
    const template = await getEmailTemplate(company.id, 'quote', 'follow_up');

    const bodyText = template.body_text
      .replace(/{{client_name}}/g, quote.client_name)
      .replace(/{{quote_number}}/g, quote.quote_number)
      .replace(/{{total_amount}}/g, quote.total_amount.toFixed(2));

    const html = createEmailWrapper({
      subject: template.subject,
      bodyText,
      companyName: settings.company_name,
      companyAddress: settings.company_address,
      companyPhone: settings.company_phone,
      companyLogo: settings.company_logo_url
    });

    await supabase.functions.invoke('send-email', {
      body: { to: quote.client_email, subject: template.subject, html }
    });

    await logReminder(company.id, 'quote', quote.id);
    console.log(`✅ Quote reminder sent for ${quote.quote_number}`);

  } catch (error) {
    console.error(`❌ Error sending quote reminder for ${quote.quote_number}:`, error);
  }
}

/* -------------------- EMAIL TEMPLATE HANDLING -------------------- */
async function getEmailTemplate(companyId: string, templateType: string, reminderStage: string = 'general'): Promise<EmailTemplate> {
  const { data: stageTemplate } = await supabase
    .from('email_templates')
    .select('subject, body_text')
    .eq('company_id', companyId)
    .eq('template_type', templateType)
    .eq('reminder_stage', reminderStage)
    .single();

  if (stageTemplate) return stageTemplate;

  const { data: generalTemplate } = await supabase
    .from('email_templates')
    .select('subject, body_text')
    .eq('company_id', companyId)
    .eq('template_type', templateType)
    .eq('reminder_stage', 'general')
    .single();

  if (generalTemplate) return generalTemplate;

  return getDefaultTemplate(templateType, reminderStage);
}

function getDefaultTemplate(templateType: string, reminderStage: string = 'general'): EmailTemplate {
  if (templateType === 'invoice') {
    return {
      subject: reminderStage === 'overdue' ? 'URGENT: Overdue Invoice {{invoice_number}}' : 'Invoice {{invoice_number}} Due Soon',
      body_text: reminderStage === 'overdue'
        ? 'Dear {{client_name}}, your invoice {{invoice_number}} is overdue. Amount due: ${{total_amount}}. Please make payment immediately.'
        : 'Dear {{client_name}}, this is a friendly reminder that your invoice {{invoice_number}} is due soon. Amount: ${{total_amount}}.'
    };
  } else {
    return {
      subject: 'Following up on Quote {{quote_number}}',
      body_text: 'Dear {{client_name}}, just following up on your quote {{quote_number}} for ${{total_amount}}. Let us know if you have questions.'
    };
  }
}

/* -------------------- LOG REMINDER -------------------- */
async function logReminder(companyId: string, type: string, recordId: string) {
  const { error } = await supabase
    .from('reminder_logs')
    .insert({
      company_id: companyId,
      type: type,
      record_id: recordId,
      sent_at: new Date().toISOString()
    });

  if (error) {
    console.error('❌ Error logging reminder:', error);
  }
}

serve(handler);
