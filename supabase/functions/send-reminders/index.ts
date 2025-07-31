import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  body_html: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log('Starting daily reminder process...');
    
    // Get all active companies with their settings
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
          company_name
        )
      `)
      .eq('status', 'active')
      .in('subscription_status', ['active', 'trialing']);

    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch companies' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing ${companies?.length || 0} active companies`);

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
    console.error('Error in send-reminders function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

async function processCompanyReminders(company: Company) {
  const settings = company.company_settings;
  if (!settings) {
    console.log(`No settings found for company ${company.name}`);
    return;
  }

  console.log(`Processing reminders for company: ${company.name}`);

  // Process invoice reminders
  if (settings.enable_invoice_reminders) {
    await processInvoiceReminders(company, settings);
  }

  // Process quote reminders
  if (settings.enable_quote_reminders) {
    await processQuoteReminders(company, settings);
  }
}

async function processInvoiceReminders(company: Company, settings: any) {
  const today = new Date();
  const beforeDueDate = new Date();
  beforeDueDate.setDate(today.getDate() + settings.invoice_reminder_days_before);
  
  const overdueDateCheck = new Date();
  overdueDateCheck.setDate(today.getDate() - settings.invoice_overdue_reminder_days);

  // Get unpaid invoices
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('company_id', company.id)
    .in('status', ['pending', 'sent'])
    .or(`due_date.eq.${beforeDueDate.toISOString().split('T')[0]},due_date.eq.${overdueDateCheck.toISOString().split('T')[0]}`);

  if (error) {
    console.error(`Error fetching invoices for company ${company.name}:`, error);
    return;
  }

  for (const invoice of invoices || []) {
    const invoiceDueDate = new Date(invoice.due_date);
    const isBeforeDue = invoiceDueDate.toDateString() === beforeDueDate.toDateString();
    const isOverdue = invoiceDueDate.toDateString() === overdueDateCheck.toDateString();

    if (isBeforeDue || isOverdue) {
      const reminderType = isOverdue ? 'overdue' : 'before_due';
      
      // Check if reminder already sent today
      const alreadySent = await checkReminderSent(company.id, 'invoice', invoice.id, reminderType);
      if (alreadySent) {
        console.log(`Reminder already sent for invoice ${invoice.invoice_number}`);
        continue;
      }

      await sendInvoiceReminder(company, invoice as Invoice, reminderType, settings);
    }
  }
}

async function processQuoteReminders(company: Company, settings: any) {
  const today = new Date();
  const reminderDate = new Date();
  reminderDate.setDate(today.getDate() - settings.quote_reminder_days);

  // Get open quotes
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('company_id', company.id)
    .eq('status', 'sent')
    .eq('quote_date', reminderDate.toISOString().split('T')[0]);

  if (error) {
    console.error(`Error fetching quotes for company ${company.name}:`, error);
    return;
  }

  for (const quote of quotes || []) {
    // Check if reminder already sent today
    const alreadySent = await checkReminderSent(company.id, 'quote', quote.id, 'reminder');
    if (alreadySent) {
      console.log(`Reminder already sent for quote ${quote.quote_number}`);
      continue;
    }

    await sendQuoteReminder(company, quote as Quote, settings);
  }
}

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
    console.error('Error checking reminder logs:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}

async function sendInvoiceReminder(company: Company, invoice: Invoice, reminderType: string, settings: any) {
  try {
    // Get email template
    const template = await getEmailTemplate(company.id, 'invoice');
    
    const subject = template.subject
      .replace('{{company_name}}', settings.company_name || company.name)
      .replace('{{invoice_number}}', invoice.invoice_number)
      .replace('{{client_company}}', invoice.client_company);

    const bodyHtml = template.body_html
      .replace(/{{company_name}}/g, settings.company_name || company.name)
      .replace(/{{invoice_number}}/g, invoice.invoice_number)
      .replace(/{{client_company}}/g, invoice.client_company)
      .replace(/{{client_name}}/g, invoice.client_company)
      .replace(/{{invoice_amount}}/g, `$${invoice.total_amount.toFixed(2)}`)
      .replace(/{{due_date}}/g, new Date(invoice.due_date).toLocaleDateString())
      .replace(/{{invoice_link}}/g, `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/invoice/${invoice.id}`)
      .replace(/{{reminder_type}}/g, reminderType === 'overdue' ? 'OVERDUE' : 'DUE SOON');

    // Send email via send-email function
    const emailResponse = await supabase.functions.invoke('send-email', {
      body: {
        to: invoice.client_email,
        subject: subject,
        html: bodyHtml
      }
    });

    if (emailResponse.error) {
      console.error(`Failed to send invoice reminder for ${invoice.invoice_number}:`, emailResponse.error);
      return;
    }

    // Log the reminder
    await logReminder(company.id, 'invoice', invoice.id);
    console.log(`Invoice reminder sent for ${invoice.invoice_number} to ${invoice.client_email}`);

  } catch (error) {
    console.error(`Error sending invoice reminder for ${invoice.invoice_number}:`, error);
  }
}

async function sendQuoteReminder(company: Company, quote: Quote, settings: any) {
  try {
    // Get email template
    const template = await getEmailTemplate(company.id, 'quote');
    
    const subject = template.subject
      .replace('{{company_name}}', settings.company_name || company.name)
      .replace('{{quote_number}}', quote.quote_number)
      .replace('{{client_name}}', quote.client_name);

    const bodyHtml = template.body_html
      .replace(/{{company_name}}/g, settings.company_name || company.name)
      .replace(/{{quote_number}}/g, quote.quote_number)
      .replace(/{{client_name}}/g, quote.client_name)
      .replace(/{{project_name}}/g, quote.project_name)
      .replace(/{{quote_amount}}/g, `$${quote.total_amount.toFixed(2)}`)
      .replace(/{{quote_date}}/g, new Date(quote.quote_date).toLocaleDateString())
      .replace(/{{quote_link}}/g, `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/quote/${quote.id}`);

    // Send email via send-email function
    const emailResponse = await supabase.functions.invoke('send-email', {
      body: {
        to: quote.client_email,
        subject: subject,
        html: bodyHtml
      }
    });

    if (emailResponse.error) {
      console.error(`Failed to send quote reminder for ${quote.quote_number}:`, emailResponse.error);
      return;
    }

    // Log the reminder
    await logReminder(company.id, 'quote', quote.id);
    console.log(`Quote reminder sent for ${quote.quote_number} to ${quote.client_email}`);

  } catch (error) {
    console.error(`Error sending quote reminder for ${quote.quote_number}:`, error);
  }
}

async function getEmailTemplate(companyId: string, templateType: string): Promise<EmailTemplate> {
  const { data: template, error } = await supabase
    .from('email_templates')
    .select('subject, body_html')
    .eq('company_id', companyId)
    .eq('template_type', templateType)
    .single();

  if (error || !template) {
    // Return default template
    console.log(`Using default template for ${templateType}`);
    return getDefaultTemplate(templateType);
  }

  return template;
}

function getDefaultTemplate(templateType: string): EmailTemplate {
  if (templateType === 'invoice') {
    return {
      subject: 'Invoice Reminder - {{invoice_number}} from {{company_name}}',
      body_html: `
        <html>
          <body>
            <h2>Invoice Reminder - {{reminder_type}}</h2>
            <p>Dear {{client_company}},</p>
            <p>This is a reminder regarding invoice {{invoice_number}} for {{invoice_amount}}.</p>
            <p><strong>Due Date:</strong> {{due_date}}</p>
            <p>You can view and pay your invoice by clicking the link below:</p>
            <p><a href="{{invoice_link}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Invoice</a></p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>{{company_name}}</p>
          </body>
        </html>
      `
    };
  } else {
    return {
      subject: 'Quote Follow-up - {{quote_number}} from {{company_name}}',
      body_html: `
        <html>
          <body>
            <h2>Quote Follow-up</h2>
            <p>Dear {{client_name}},</p>
            <p>We wanted to follow up on quote {{quote_number}} for {{project_name}} in the amount of {{quote_amount}}.</p>
            <p><strong>Quote Date:</strong> {{quote_date}}</p>
            <p>You can review the quote details by clicking the link below:</p>
            <p><a href="{{quote_link}}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Quote</a></p>
            <p>If you have any questions or would like to proceed, please let us know.</p>
            <p>Best regards,<br>{{company_name}}</p>
          </body>
        </html>
      `
    };
  }
}

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
    console.error('Error logging reminder:', error);
  }
}

serve(handler);