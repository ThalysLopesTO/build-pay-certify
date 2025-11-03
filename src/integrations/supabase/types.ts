export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      attention_report_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          report_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          report_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attention_report_attachments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "attention_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      attention_reports: {
        Row: {
          company_id: string
          created_at: string
          id: string
          jobsite_id: string
          message: string
          report_date: string
          report_time: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          jobsite_id: string
          message: string
          report_date: string
          report_time: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          jobsite_id?: string
          message?: string
          report_date?: string
          report_time?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attention_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attention_reports_jobsite_id_fkey"
            columns: ["jobsite_id"]
            isOneToOne: false
            referencedRelation: "jobsites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attention_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "attention_reports_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          company_id: string
          created_at: string
          edited_by_user_id: string | null
          employee_id: string | null
          id: string
          new_clock_in: string | null
          new_clock_out: string | null
          new_jobsite_id: string | null
          note: string | null
          original_clock_in: string | null
          original_clock_out: string | null
          original_jobsite_id: string | null
          timesheet_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          edited_by_user_id?: string | null
          employee_id?: string | null
          id?: string
          new_clock_in?: string | null
          new_clock_out?: string | null
          new_jobsite_id?: string | null
          note?: string | null
          original_clock_in?: string | null
          original_clock_out?: string | null
          original_jobsite_id?: string | null
          timesheet_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          edited_by_user_id?: string | null
          employee_id?: string | null
          id?: string
          new_clock_in?: string | null
          new_clock_out?: string | null
          new_jobsite_id?: string | null
          note?: string | null
          original_clock_in?: string | null
          original_clock_out?: string | null
          original_jobsite_id?: string | null
          timesheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_edited_by_user_id_fkey"
            columns: ["edited_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "timesheets"
            referencedColumns: ["id"]
          },
        ]
      }
      bills_expenses: {
        Row: {
          amount: number
          attachment_url: string | null
          category_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          end_date: string | null
          expense_date: string
          expense_title: string
          id: string
          is_recurring: boolean | null
          notes: string | null
          parent_recurring_bill_id: string | null
          payment_method: string | null
          payment_status: string
          recurrence_frequency: string | null
          start_date: string | null
          transaction_type: string
          updated_at: string
          vendor_payee: string
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          category_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          expense_date: string
          expense_title: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          parent_recurring_bill_id?: string | null
          payment_method?: string | null
          payment_status?: string
          recurrence_frequency?: string | null
          start_date?: string | null
          transaction_type?: string
          updated_at?: string
          vendor_payee: string
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          expense_date?: string
          expense_title?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          parent_recurring_bill_id?: string | null
          payment_method?: string | null
          payment_status?: string
          recurrence_frequency?: string | null
          start_date?: string | null
          transaction_type?: string
          updated_at?: string
          vendor_payee?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bills_expenses_parent_recurring_bill_id_fkey"
            columns: ["parent_recurring_bill_id"]
            isOneToOne: false
            referencedRelation: "bills_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_requests: {
        Row: {
          company_id: string
          created_at: string
          id: string
          notes: string | null
          request_date: string
          requested_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          request_date?: string
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          request_date?: string
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      change_orders: {
        Row: {
          attachments: string[] | null
          company_id: string
          cost: number | null
          created_at: string
          created_by: string
          description: string
          end_date: string | null
          id: string
          order_type: string
          project_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          attachments?: string[] | null
          company_id: string
          cost?: number | null
          created_at?: string
          created_by: string
          description: string
          end_date?: string | null
          id?: string
          order_type?: string
          project_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          attachments?: string[] | null
          company_id?: string
          cost?: number | null
          created_at?: string
          created_by?: string
          description?: string
          end_date?: string | null
          id?: string
          order_type?: string
          project_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          company_rules_text: string | null
          created_at: string
          created_by_super_admin: boolean | null
          employee_limit: number | null
          expiration_date: string | null
          grace_period_end_date: string | null
          id: string
          license_expires_at: string | null
          license_key: string
          logo_url: string | null
          name: string
          plan: string | null
          plan_features: Json | null
          plan_type: string | null
          registration_date: string | null
          rules_updated_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_verified: boolean | null
          subscription_end_date: string | null
          subscription_override: boolean | null
          subscription_status: string | null
          trial_end_date: string | null
          updated_at: string
          webhook_enabled: boolean | null
          webhook_events: string[] | null
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          company_rules_text?: string | null
          created_at?: string
          created_by_super_admin?: boolean | null
          employee_limit?: number | null
          expiration_date?: string | null
          grace_period_end_date?: string | null
          id?: string
          license_expires_at?: string | null
          license_key?: string
          logo_url?: string | null
          name: string
          plan?: string | null
          plan_features?: Json | null
          plan_type?: string | null
          registration_date?: string | null
          rules_updated_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_verified?: boolean | null
          subscription_end_date?: string | null
          subscription_override?: boolean | null
          subscription_status?: string | null
          trial_end_date?: string | null
          updated_at?: string
          webhook_enabled?: boolean | null
          webhook_events?: string[] | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          company_rules_text?: string | null
          created_at?: string
          created_by_super_admin?: boolean | null
          employee_limit?: number | null
          expiration_date?: string | null
          grace_period_end_date?: string | null
          id?: string
          license_expires_at?: string | null
          license_key?: string
          logo_url?: string | null
          name?: string
          plan?: string | null
          plan_features?: Json | null
          plan_type?: string | null
          registration_date?: string | null
          rules_updated_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_verified?: boolean | null
          subscription_end_date?: string | null
          subscription_override?: boolean | null
          subscription_status?: string | null
          trial_end_date?: string | null
          updated_at?: string
          webhook_enabled?: boolean | null
          webhook_events?: string[] | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      company_phones: {
        Row: {
          category: string
          company_id: string
          created_at: string
          created_by: string | null
          extension: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone_number: string
          updated_at: string
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          created_by?: string | null
          extension?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone_number: string
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          extension?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_registration_requests: {
        Row: {
          admin_email: string
          admin_first_name: string
          admin_last_name: string
          admin_password: string | null
          admin_user_id: string | null
          approved_at: string | null
          approved_by: string | null
          company_address: string | null
          company_email: string
          company_id: string | null
          company_name: string
          company_phone: string | null
          created_at: string
          id: string
          rejection_reason: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          admin_email: string
          admin_first_name: string
          admin_last_name: string
          admin_password?: string | null
          admin_user_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_address?: string | null
          company_email: string
          company_id?: string | null
          company_name: string
          company_phone?: string | null
          created_at?: string
          id?: string
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          admin_email?: string
          admin_first_name?: string
          admin_last_name?: string
          admin_password?: string | null
          admin_user_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_address?: string | null
          company_email?: string
          company_id?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          id?: string
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_registration_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_id: string | null
          company_logo_url: string | null
          company_name: string
          company_phone: string | null
          company_rules_text: string | null
          created_at: string
          enable_invoice_reminders: boolean | null
          enable_quote_reminders: boolean | null
          hst_number: string | null
          id: string
          invoice_overdue_reminder_days: number | null
          invoice_reminder_days_before: number | null
          quote_reminder_days: number | null
          show_tax_breakdown_to_employees: boolean | null
          start_date: string | null
          tax_percentage: number | null
          timesheet_frequency: string
          timezone: string
          updated_at: string
          weather_latitude: number | null
          weather_location_name: string | null
          weather_longitude: number | null
          webhook_enabled: boolean | null
          webhook_secret: string | null
          webhook_url: string | null
          week_ending_day: number | null
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_id?: string | null
          company_logo_url?: string | null
          company_name: string
          company_phone?: string | null
          company_rules_text?: string | null
          created_at?: string
          enable_invoice_reminders?: boolean | null
          enable_quote_reminders?: boolean | null
          hst_number?: string | null
          id?: string
          invoice_overdue_reminder_days?: number | null
          invoice_reminder_days_before?: number | null
          quote_reminder_days?: number | null
          show_tax_breakdown_to_employees?: boolean | null
          start_date?: string | null
          tax_percentage?: number | null
          timesheet_frequency?: string
          timezone?: string
          updated_at?: string
          weather_latitude?: number | null
          weather_location_name?: string | null
          weather_longitude?: number | null
          webhook_enabled?: boolean | null
          webhook_secret?: string | null
          webhook_url?: string | null
          week_ending_day?: number | null
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_id?: string | null
          company_logo_url?: string | null
          company_name?: string
          company_phone?: string | null
          company_rules_text?: string | null
          created_at?: string
          enable_invoice_reminders?: boolean | null
          enable_quote_reminders?: boolean | null
          hst_number?: string | null
          id?: string
          invoice_overdue_reminder_days?: number | null
          invoice_reminder_days_before?: number | null
          quote_reminder_days?: number | null
          show_tax_breakdown_to_employees?: boolean | null
          start_date?: string | null
          tax_percentage?: number | null
          timesheet_frequency?: string
          timezone?: string
          updated_at?: string
          weather_latitude?: number | null
          weather_location_name?: string | null
          weather_longitude?: number | null
          webhook_enabled?: boolean | null
          webhook_secret?: string | null
          webhook_url?: string | null
          week_ending_day?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_report_comments: {
        Row: {
          comment_text: string
          company_id: string
          created_at: string
          daily_report_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_text: string
          company_id: string
          created_at?: string
          daily_report_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_text?: string
          company_id?: string
          created_at?: string
          daily_report_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_report_comments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_report_comments_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_report_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          company_id: string
          created_at: string
          id: string
          jobsite_id: string
          photos: string[] | null
          report_date: string
          submitted_by: string
          summary: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          jobsite_id: string
          photos?: string[] | null
          report_date?: string
          submitted_by: string
          summary: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          jobsite_id?: string
          photos?: string[] | null
          report_date?: string
          submitted_by?: string
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_jobsite_id_fkey"
            columns: ["jobsite_id"]
            isOneToOne: false
            referencedRelation: "jobsites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      default_rules: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          title?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_html: string
          company_id: string
          created_at: string
          id: string
          reminder_stage: string | null
          subject: string
          template_type: string
          updated_at: string
        }
        Insert: {
          body_html: string
          company_id: string
          created_at?: string
          id?: string
          reminder_stage?: string | null
          subject: string
          template_type: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          company_id?: string
          created_at?: string
          id?: string
          reminder_stage?: string | null
          subject?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_certificates: {
        Row: {
          certificate_name: string
          certificate_type: string
          company_id: string
          created_at: string
          employee_id: string | null
          expiry_date: string | null
          file_url: string | null
          id: string
          status: string
          updated_at: string
          upload_date: string
          uploaded_by: string | null
        }
        Insert: {
          certificate_name: string
          certificate_type: string
          company_id: string
          created_at?: string
          employee_id?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          status?: string
          updated_at?: string
          upload_date?: string
          uploaded_by?: string | null
        }
        Update: {
          certificate_name?: string
          certificate_type?: string
          company_id?: string
          created_at?: string
          employee_id?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          status?: string
          updated_at?: string
          upload_date?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_certificates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_certificates_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      equipment_usage_log: {
        Row: {
          assigned_by: string
          company_id: string
          created_at: string
          employee_id: string
          equipment_id: string
          id: string
          jobsite_id: string
          notes: string | null
          return_time: string | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          company_id: string
          created_at?: string
          employee_id: string
          equipment_id: string
          id?: string
          jobsite_id: string
          notes?: string | null
          return_time?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          company_id?: string
          created_at?: string
          employee_id?: string
          equipment_id?: string
          id?: string
          jobsite_id?: string
          notes?: string | null
          return_time?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_usage_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_usage_log_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_usage_log_jobsite_id_fkey"
            columns: ["jobsite_id"]
            isOneToOne: false
            referencedRelation: "jobsites"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          category_level: string
          category_type: string
          company_id: string
          created_at: string
          id: string
          name: string
          parent_category_id: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category_level?: string
          category_type?: string
          company_id: string
          created_at?: string
          id?: string
          name: string
          parent_category_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category_level?: string
          category_type?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          parent_category_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          brand: string
          company_id: string
          created_at: string
          created_by: string | null
          equipment_name: string
          id: string
          jobsite_id: string
          return_date: string | null
          sku: string
          start_date: string
          updated_at: string
        }
        Insert: {
          brand: string
          company_id: string
          created_at?: string
          created_by?: string | null
          equipment_name: string
          id?: string
          jobsite_id: string
          return_date?: string | null
          sku: string
          start_date: string
          updated_at?: string
        }
        Update: {
          brand?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          equipment_name?: string
          id?: string
          jobsite_id?: string
          return_date?: string | null
          sku?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "inventory_jobsite_id_fkey"
            columns: ["jobsite_id"]
            isOneToOne: false
            referencedRelation: "jobsites"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_address: string | null
          client_company: string
          client_email: string
          client_phone: string | null
          company_id: string | null
          created_at: string
          discount: number | null
          due_date: string
          id: string
          invoice_number: string
          jobsite_id: string | null
          notes: string | null
          receipt_file_url: string | null
          sent_date: string | null
          status: string
          subtotal: number
          tax: number | null
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_address?: string | null
          client_company: string
          client_email: string
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          discount?: number | null
          due_date: string
          id?: string
          invoice_number: string
          jobsite_id?: string | null
          notes?: string | null
          receipt_file_url?: string | null
          sent_date?: string | null
          status?: string
          subtotal?: number
          tax?: number | null
          title: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          client_address?: string | null
          client_company?: string
          client_email?: string
          client_phone?: string | null
          company_id?: string | null
          created_at?: string
          discount?: number | null
          due_date?: string
          id?: string
          invoice_number?: string
          jobsite_id?: string | null
          notes?: string | null
          receipt_file_url?: string | null
          sent_date?: string | null
          status?: string
          subtotal?: number
          tax?: number | null
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_jobsite_id_fkey"
            columns: ["jobsite_id"]
            isOneToOne: false
            referencedRelation: "jobsites"
            referencedColumns: ["id"]
          },
        ]
      }
      jobsite_foremen: {
        Row: {
          created_at: string
          foreman_id: string
          id: string
          jobsite_id: string
        }
        Insert: {
          created_at?: string
          foreman_id: string
          id?: string
          jobsite_id: string
        }
        Update: {
          created_at?: string
          foreman_id?: string
          id?: string
          jobsite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobsite_foremen_jobsite_id_fkey"
            columns: ["jobsite_id"]
            isOneToOne: false
            referencedRelation: "jobsites"
            referencedColumns: ["id"]
          },
        ]
      }
      jobsite_schedule_items: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          duration: number | null
          end_date: string
          id: string
          jobsite_id: string
          parent_id: string | null
          progress: number
          sort_order: number
          start_date: string
          task_text: string
          task_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          duration?: number | null
          end_date: string
          id?: string
          jobsite_id: string
          parent_id?: string | null
          progress?: number
          sort_order?: number
          start_date: string
          task_text: string
          task_type?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          duration?: number | null
          end_date?: string
          id?: string
          jobsite_id?: string
          parent_id?: string | null
          progress?: number
          sort_order?: number
          start_date?: string
          task_text?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobsite_schedule_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobsite_schedule_items_jobsite_id_fkey"
            columns: ["jobsite_id"]
            isOneToOne: false
            referencedRelation: "jobsites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobsite_schedule_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "jobsite_schedule_items"
            referencedColumns: ["id"]
          },
        ]
      }
      jobsite_tasks: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          jobsite_id: string
          start_date: string
          status: string
          task_name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          jobsite_id: string
          start_date: string
          status?: string
          task_name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          jobsite_id?: string
          start_date?: string
          status?: string
          task_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobsite_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "jobsite_tasks_jobsite_id_fkey"
            columns: ["jobsite_id"]
            isOneToOne: false
            referencedRelation: "jobsites"
            referencedColumns: ["id"]
          },
        ]
      }
      jobsites: {
        Row: {
          address: string | null
          assigned_foreman_id: string | null
          company_id: string | null
          completion_date: string | null
          created_at: string
          due_date: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          starting_date: string | null
          status: string
        }
        Insert: {
          address?: string | null
          assigned_foreman_id?: string | null
          company_id?: string | null
          completion_date?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          starting_date?: string | null
          status?: string
        }
        Update: {
          address?: string | null
          assigned_foreman_id?: string | null
          company_id?: string | null
          completion_date?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          starting_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobsites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      material_catalog_items: {
        Row: {
          category: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          sku: string | null
          sort_order: number
          spec_size: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          sku?: string | null
          sort_order?: number
          spec_size?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          sku?: string | null
          sort_order?: number
          spec_size?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_catalog_items_category_id_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      material_categories: {
        Row: {
          category_level: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          parent_category_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_level?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_category_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_level?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_category_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      material_request_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          material_request_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          material_request_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          material_request_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_request_attachments_material_request_id_fkey"
            columns: ["material_request_id"]
            isOneToOne: false
            referencedRelation: "material_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      material_request_line_items: {
        Row: {
          catalog_item_id: string | null
          created_at: string
          id: string
          is_custom: boolean
          line_order: number
          material_name: string
          material_request_id: string
          notes: string | null
          quantity: number
          spec_override: string | null
          unit: string
        }
        Insert: {
          catalog_item_id?: string | null
          created_at?: string
          id?: string
          is_custom?: boolean
          line_order?: number
          material_name: string
          material_request_id: string
          notes?: string | null
          quantity: number
          spec_override?: string | null
          unit: string
        }
        Update: {
          catalog_item_id?: string | null
          created_at?: string
          id?: string
          is_custom?: boolean
          line_order?: number
          material_name?: string
          material_request_id?: string
          notes?: string | null
          quantity?: number
          spec_override?: string | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_catalog_item"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "material_catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_material_request"
            columns: ["material_request_id"]
            isOneToOne: false
            referencedRelation: "material_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      material_requests: {
        Row: {
          company_id: string | null
          created_at: string
          delivery_date: string
          delivery_time: string
          floor_unit: string | null
          has_line_items: boolean
          id: string
          jobsite_id: string
          material_list: string
          status: Database["public"]["Enums"]["request_status"]
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          delivery_date: string
          delivery_time: string
          floor_unit?: string | null
          has_line_items?: boolean
          id?: string
          jobsite_id: string
          material_list: string
          status?: Database["public"]["Enums"]["request_status"]
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          delivery_date?: string
          delivery_time?: string
          floor_unit?: string | null
          has_line_items?: boolean
          id?: string
          jobsite_id?: string
          material_list?: string
          status?: Database["public"]["Enums"]["request_status"]
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_requests_jobsite_id_fkey"
            columns: ["jobsite_id"]
            isOneToOne: false
            referencedRelation: "jobsites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_requests_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      material_takeoff_notes: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          jobsite_id: string
          takeoff_notes: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          jobsite_id: string
          takeoff_notes?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          jobsite_id?: string
          takeoff_notes?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_takeoff_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "material_takeoff_notes_jobsite_id_fkey"
            columns: ["jobsite_id"]
            isOneToOne: false
            referencedRelation: "jobsites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_takeoff_notes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      missed_punch_requests: {
        Row: {
          attachment_url: string | null
          company_id: string
          corrected_time_in: string | null
          corrected_time_out: string | null
          created_at: string
          decline_reason: string | null
          deleted: boolean | null
          edited_at: string | null
          edited_by: string | null
          employee_id: string
          id: string
          jobsite_id: string
          punch_type: Database["public"]["Enums"]["punch_type"]
          reason: string
          request_date: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          supervisor_on_site: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          company_id: string
          corrected_time_in?: string | null
          corrected_time_out?: string | null
          created_at?: string
          decline_reason?: string | null
          deleted?: boolean | null
          edited_at?: string | null
          edited_by?: string | null
          employee_id: string
          id?: string
          jobsite_id: string
          punch_type: Database["public"]["Enums"]["punch_type"]
          reason: string
          request_date: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          supervisor_on_site: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          company_id?: string
          corrected_time_in?: string | null
          corrected_time_out?: string | null
          created_at?: string
          decline_reason?: string | null
          deleted?: boolean | null
          edited_at?: string | null
          edited_by?: string | null
          employee_id?: string
          id?: string
          jobsite_id?: string
          punch_type?: Database["public"]["Enums"]["punch_type"]
          reason?: string
          request_date?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          supervisor_on_site?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_missed_punch_requests_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_missed_punch_requests_jobsite"
            columns: ["jobsite_id"]
            isOneToOne: false
            referencedRelation: "jobsites"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          is_dismissed: boolean
          is_read: boolean
          redirect_to: string | null
          related_id: string | null
          target_user_id: string | null
          title: string
          type: string
          updated_at: string
          user_role: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description: string
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          redirect_to?: string | null
          related_id?: string | null
          target_user_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_role: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          redirect_to?: string | null
          related_id?: string | null
          target_user_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_role?: string
        }
        Relationships: []
      }
      password_reset_logs: {
        Row: {
          admin_user_id: string | null
          company_id: string
          created_at: string
          id: string
          reset_timestamp: string
          target_user_email: string
          target_user_id: string | null
          target_user_name: string
        }
        Insert: {
          admin_user_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          reset_timestamp?: string
          target_user_email: string
          target_user_id?: string | null
          target_user_name: string
        }
        Update: {
          admin_user_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          reset_timestamp?: string
          target_user_email?: string
          target_user_id?: string | null
          target_user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "password_reset_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          updated_at: string
          used: boolean
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          updated_at?: string
          used?: boolean
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          updated_at?: string
          used?: boolean
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      phone_categories: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_line_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          quantity: number
          quote_id: string
          unit_price: number
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          quantity?: number
          quote_id: string
          unit_price?: number
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          quote_id?: string
          unit_price?: number
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_date: string | null
          client_address: string | null
          client_company: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          company_id: string
          created_at: string
          created_by: string | null
          declined_date: string | null
          discount: number | null
          expiry_date: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          project_name: string
          quote_date: string
          quote_number: string
          sent_date: string | null
          status: string
          subtotal: number
          tax: number | null
          template: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          accepted_date?: string | null
          client_address?: string | null
          client_company?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          declined_date?: string | null
          discount?: number | null
          expiry_date?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          project_name: string
          quote_date?: string
          quote_number: string
          sent_date?: string | null
          status?: string
          subtotal?: number
          tax?: number | null
          template?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          accepted_date?: string | null
          client_address?: string | null
          client_company?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          declined_date?: string | null
          discount?: number | null
          expiry_date?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          project_name?: string
          quote_date?: string
          quote_number?: string
          sent_date?: string | null
          status?: string
          subtotal?: number
          tax?: number | null
          template?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quotes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_access_log: {
        Row: {
          accessed_at: string | null
          accessed_by: string | null
          action: string
          details: Json | null
          id: string
          ip_address: unknown
          request_id: string | null
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string | null
          accessed_by?: string | null
          action: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          request_id?: string | null
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string | null
          accessed_by?: string | null
          action?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          request_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      registration_audit_log: {
        Row: {
          action: string
          details: Json | null
          id: string
          ip_address: unknown
          performed_at: string | null
          performed_by: string | null
          request_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          performed_at?: string | null
          performed_by?: string | null
          request_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          performed_at?: string | null
          performed_by?: string | null
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_audit_log_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "company_registration_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_audit_log_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "company_registration_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_logs: {
        Row: {
          company_id: string
          created_at: string
          id: string
          record_id: string
          sent_at: string
          type: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          record_id: string
          sent_at?: string
          type: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          record_id?: string
          sent_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_visible: boolean
          menu_item_id: string
          role: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_visible?: boolean
          menu_item_id: string
          role: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          menu_item_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_templates: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          file_url: string
          id: string
          template_name: string
          updated_at: string
          upload_date: string
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          file_url: string
          id?: string
          template_name: string
          updated_at?: string
          upload_date?: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          file_url?: string
          id?: string
          template_name?: string
          updated_at?: string
          upload_date?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_templates_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          employee_limit: number | null
          features: Json | null
          id: string
          name: string
          plan_type: string
          price_monthly: number | null
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_limit?: number | null
          features?: Json | null
          id?: string
          name: string
          plan_type: string
          price_monthly?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_limit?: number | null
          features?: Json | null
          id?: string
          name?: string
          plan_type?: string
          price_monthly?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          company_id: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          employee_limit: number | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          company_id?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          employee_limit?: number | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          company_id?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          employee_limit?: number | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          company_id: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone_number: string | null
          supplier_type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone_number?: string | null
          supplier_type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone_number?: string | null
          supplier_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          check_in_location: string | null
          check_in_time: string | null
          check_out_location: string | null
          check_out_time: string | null
          company_id: string
          created_at: string
          hours_worked: number | null
          id: string
          jobsite_id: string
          status: string
          updated_at: string
          user_id: string | null
          work_note: string | null
        }
        Insert: {
          check_in_location?: string | null
          check_in_time?: string | null
          check_out_location?: string | null
          check_out_time?: string | null
          company_id: string
          created_at?: string
          hours_worked?: number | null
          id?: string
          jobsite_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
          work_note?: string | null
        }
        Update: {
          check_in_location?: string | null
          check_in_time?: string | null
          check_out_location?: string | null
          check_out_time?: string | null
          company_id?: string
          created_at?: string
          hours_worked?: number | null
          id?: string
          jobsite_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          work_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_jobsite_id_fkey"
            columns: ["jobsite_id"]
            isOneToOne: false
            referencedRelation: "jobsites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          address: string | null
          company_id: string | null
          cpp_rate: number | null
          created_at: string
          ei_rate: number | null
          email: string | null
          first_name: string | null
          hourly_rate: number | null
          id: string
          income_tax_rate: number | null
          is_active: boolean
          last_name: string | null
          pending_approval: boolean | null
          phone: string | null
          photo_url: string | null
          position: string | null
          role: string
          stripe_verification_status: string | null
          stripe_verified: boolean | null
          trade: string | null
          updated_at: string
          user_id: string
          worker_type: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          cpp_rate?: number | null
          created_at?: string
          ei_rate?: number | null
          email?: string | null
          first_name?: string | null
          hourly_rate?: number | null
          id?: string
          income_tax_rate?: number | null
          is_active?: boolean
          last_name?: string | null
          pending_approval?: boolean | null
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          role?: string
          stripe_verification_status?: string | null
          stripe_verified?: boolean | null
          trade?: string | null
          updated_at?: string
          user_id: string
          worker_type?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          cpp_rate?: number | null
          created_at?: string
          ei_rate?: number | null
          email?: string | null
          first_name?: string | null
          hourly_rate?: number | null
          id?: string
          income_tax_rate?: number | null
          is_active?: boolean
          last_name?: string | null
          pending_approval?: boolean | null
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          role?: string
          stripe_verification_status?: string | null
          stripe_verified?: boolean | null
          trade?: string | null
          updated_at?: string
          user_id?: string
          worker_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          company_id: string
          created_at: string
          id: string
          jobsite_id: string | null
          license_plate: string | null
          make: string
          model: string
          notes: string | null
          status: string
          updated_at: string
          vehicle_name: string
          vehicle_type: string
          vin: string | null
          year: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          jobsite_id?: string | null
          license_plate?: string | null
          make: string
          model: string
          notes?: string | null
          status?: string
          updated_at?: string
          vehicle_name: string
          vehicle_type: string
          vin?: string | null
          year?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          jobsite_id?: string | null
          license_plate?: string | null
          make?: string
          model?: string
          notes?: string | null
          status?: string
          updated_at?: string
          vehicle_name?: string
          vehicle_type?: string
          vin?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_jobsite_id_fkey"
            columns: ["jobsite_id"]
            isOneToOne: false
            referencedRelation: "jobsites"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          company_id: string
          created_at: string | null
          error_message: string | null
          event_type: string
          http_status_code: number | null
          id: string
          payload: Json
          response_body: string | null
          retry_count: number | null
          sent_at: string | null
          status: string
          webhook_url: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          error_message?: string | null
          event_type: string
          http_status_code?: number | null
          id?: string
          payload: Json
          response_body?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status: string
          webhook_url: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          http_status_code?: number | null
          id?: string
          payload?: Json
          response_body?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_timesheet_audit_logs: {
        Row: {
          changes: Json
          company_id: string
          created_at: string
          edited_at: string
          edited_by_user_id: string | null
          id: string
          notes: string | null
          timesheet_id: string
        }
        Insert: {
          changes: Json
          company_id: string
          created_at?: string
          edited_at?: string
          edited_by_user_id?: string | null
          id?: string
          notes?: string | null
          timesheet_id: string
        }
        Update: {
          changes?: Json
          company_id?: string
          created_at?: string
          edited_at?: string
          edited_by_user_id?: string | null
          id?: string
          notes?: string | null
          timesheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_timesheet_audit_logs_edited_by_user_id_fkey"
            columns: ["edited_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "weekly_timesheet_audit_logs_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "weekly_timesheets_old"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_timesheets: {
        Row: {
          additional_expense: number | null
          company_id: string | null
          cpp: number | null
          cpp_rate: number | null
          created_at: string
          ei: number | null
          ei_rate: number | null
          employee_name: string | null
          gross_pay: number | null
          hourly_rate: number
          hours_pay: number
          id: string
          income_tax: number | null
          income_tax_rate: number | null
          is_manual_entry: boolean | null
          jobsite_id: string
          manual_entry_name: string | null
          notes: string | null
          periods: Json[] | null
          status: string
          submitted_by: string | null
          tax: number | null
          tax_included: boolean | null
          total_hours: number | null
          total_pay: number
          updated_at: string
          updated_by: string | null
          week_start_date: string
          worker_type: string | null
        }
        Insert: {
          additional_expense?: number | null
          company_id?: string | null
          cpp?: number | null
          cpp_rate?: number | null
          created_at?: string
          ei?: number | null
          ei_rate?: number | null
          employee_name?: string | null
          gross_pay?: number | null
          hourly_rate: number
          hours_pay?: number
          id?: string
          income_tax?: number | null
          income_tax_rate?: number | null
          is_manual_entry?: boolean | null
          jobsite_id: string
          manual_entry_name?: string | null
          notes?: string | null
          periods?: Json[] | null
          status?: string
          submitted_by?: string | null
          tax?: number | null
          tax_included?: boolean | null
          total_hours?: number | null
          total_pay?: number
          updated_at?: string
          updated_by?: string | null
          week_start_date: string
          worker_type?: string | null
        }
        Update: {
          additional_expense?: number | null
          company_id?: string | null
          cpp?: number | null
          cpp_rate?: number | null
          created_at?: string
          ei?: number | null
          ei_rate?: number | null
          employee_name?: string | null
          gross_pay?: number | null
          hourly_rate?: number
          hours_pay?: number
          id?: string
          income_tax?: number | null
          income_tax_rate?: number | null
          is_manual_entry?: boolean | null
          jobsite_id?: string
          manual_entry_name?: string | null
          notes?: string | null
          periods?: Json[] | null
          status?: string
          submitted_by?: string | null
          tax?: number | null
          tax_included?: boolean | null
          total_hours?: number | null
          total_pay?: number
          updated_at?: string
          updated_by?: string | null
          week_start_date?: string
          worker_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_timesheets_2_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_timesheets_2_jobsite_id_fkey"
            columns: ["jobsite_id"]
            isOneToOne: false
            referencedRelation: "jobsites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_timesheets_2_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      weekly_timesheets_old: {
        Row: {
          additional_expense: number | null
          calculated_tax: number | null
          company_id: string | null
          cpp_rate: number | null
          created_at: string
          ei_rate: number | null
          employee_name: string | null
          friday_hours: number | null
          gross_pay: number | null
          hourly_rate: number
          id: string
          income_tax_rate: number | null
          is_manual_entry: boolean | null
          jobsite_id: string
          manual_entry_name: string | null
          monday_hours: number | null
          notes: string | null
          periods: Json[] | null
          saturday_hours: number | null
          status: string
          submitted_by: string | null
          sunday_hours: number | null
          tax_included: boolean | null
          thursday_hours: number | null
          total_hours: number | null
          tuesday_hours: number | null
          updated_at: string
          updated_by: string | null
          wednesday_hours: number | null
          week_start_date: string
          worker_type: string | null
        }
        Insert: {
          additional_expense?: number | null
          calculated_tax?: number | null
          company_id?: string | null
          cpp_rate?: number | null
          created_at?: string
          ei_rate?: number | null
          employee_name?: string | null
          friday_hours?: number | null
          gross_pay?: number | null
          hourly_rate: number
          id?: string
          income_tax_rate?: number | null
          is_manual_entry?: boolean | null
          jobsite_id: string
          manual_entry_name?: string | null
          monday_hours?: number | null
          notes?: string | null
          periods?: Json[] | null
          saturday_hours?: number | null
          status?: string
          submitted_by?: string | null
          sunday_hours?: number | null
          tax_included?: boolean | null
          thursday_hours?: number | null
          total_hours?: number | null
          tuesday_hours?: number | null
          updated_at?: string
          updated_by?: string | null
          wednesday_hours?: number | null
          week_start_date: string
          worker_type?: string | null
        }
        Update: {
          additional_expense?: number | null
          calculated_tax?: number | null
          company_id?: string | null
          cpp_rate?: number | null
          created_at?: string
          ei_rate?: number | null
          employee_name?: string | null
          friday_hours?: number | null
          gross_pay?: number | null
          hourly_rate?: number
          id?: string
          income_tax_rate?: number | null
          is_manual_entry?: boolean | null
          jobsite_id?: string
          manual_entry_name?: string | null
          monday_hours?: number | null
          notes?: string | null
          periods?: Json[] | null
          saturday_hours?: number | null
          status?: string
          submitted_by?: string | null
          sunday_hours?: number | null
          tax_included?: boolean | null
          thursday_hours?: number | null
          total_hours?: number | null
          tuesday_hours?: number | null
          updated_at?: string
          updated_by?: string | null
          wednesday_hours?: number | null
          week_start_date?: string
          worker_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_timesheets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_timesheets_jobsite_id_fkey"
            columns: ["jobsite_id"]
            isOneToOne: false
            referencedRelation: "jobsites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_timesheets_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      company_registration_summary: {
        Row: {
          admin_email_display: string | null
          admin_first_name_display: string | null
          admin_last_name_display: string | null
          company_email_display: string | null
          company_name: string | null
          created_at: string | null
          id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_email_display?: never
          admin_first_name_display?: never
          admin_last_name_display?: never
          company_email_display?: never
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_email_display?: never
          admin_first_name_display?: never
          admin_last_name_display?: never
          company_email_display?: never
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_missed_punch_request:
        | { Args: { request_id: string }; Returns: Json }
        | { Args: { approver_id: string; request_id: string }; Returns: Json }
      calculate_invoice_totals: {
        Args: { invoice_id_param: string }
        Returns: undefined
      }
      calculate_quote_totals: {
        Args: { quote_id_param: string }
        Returns: undefined
      }
      can_add_employee: { Args: { company_id_param: string }; Returns: boolean }
      can_add_employee_with_subscription: {
        Args: { company_id_param: string }
        Returns: boolean
      }
      can_admin_update_profile: {
        Args: {
          new_company_id: string
          new_role: string
          target_user_id: string
        }
        Returns: boolean
      }
      can_self_update_profile: {
        Args: {
          new_company_id: string
          new_role: string
          target_user_id: string
        }
        Returns: boolean
      }
      check_bills_due_soon: { Args: never; Returns: undefined }
      check_bills_overdue: { Args: never; Returns: undefined }
      check_expiring_certificates: { Args: never; Returns: undefined }
      check_invoices_due_soon: { Args: never; Returns: undefined }
      check_invoices_overdue: { Args: never; Returns: undefined }
      check_overdue_jobsites: { Args: never; Returns: undefined }
      cleanup_expired_password_reset_tokens: { Args: never; Returns: undefined }
      cleanup_old_notifications: { Args: never; Returns: undefined }
      convert_quote_to_invoice: {
        Args: { quote_id_param: string }
        Returns: string
      }
      delete_employee: { Args: { employee_user_id: string }; Returns: Json }
      fix_biweekly_timesheet_totals: {
        Args: never
        Returns: {
          hours_fixed: boolean
          new_total_hours: number
          old_total_hours: number
          timesheet_id: string
        }[]
      }
      fn_clip_minutes: { Args: { ts: string; tz: string }; Returns: string }
      generate_biweekly_json: {
        Args: {
          fri_h?: number
          mon_h?: number
          sat_h?: number
          start_date: string
          sun_h?: number
          thu_h?: number
          tue_h?: number
          wed_h?: number
        }
        Returns: string
      }
      generate_invoice_number: { Args: never; Returns: string }
      generate_quote_number: { Args: never; Returns: string }
      generate_recurring_bills: { Args: never; Returns: undefined }
      get_companies_with_status: {
        Args: never
        Returns: {
          created_at: string
          days_until_expiry: number
          expiration_date: string
          id: string
          is_expired: boolean
          name: string
          registration_date: string
          status: string
        }[]
      }
      get_company_employee_count: {
        Args: { company_id_param: string }
        Returns: number
      }
      get_company_plan_details: {
        Args: { company_id_param: string }
        Returns: {
          can_add_employees: boolean
          current_employee_count: number
          employee_limit: number
          plan_name: string
          plan_type: string
          price_monthly: number
          subscription_end_date: string
          subscription_status: string
        }[]
      }
      get_current_user_company_id: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_material_takeoff_notes: {
        Args: { p_company_id: string }
        Returns: {
          company_id: string
          created_at: string
          created_by: string
          id: string
          jobsite_address: string
          jobsite_id: string
          jobsite_name: string
          takeoff_notes: string
          updated_at: string
          updated_by: string
        }[]
      }
      get_user_company_id: { Args: never; Returns: string }
      get_user_company_id_safe: { Args: never; Returns: string }
      get_user_profile_for_join: {
        Args: { user_id_param: string }
        Returns: {
          first_name: string
          last_name: string
          photo_url: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_company_admin: { Args: never; Returns: boolean }
      is_company_license_active: { Args: never; Returns: boolean }
      is_company_license_expired: {
        Args: { company_id_param: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      is_user_admin: { Args: never; Returns: boolean }
      is_user_admin_for_company: {
        Args: { target_company_id: string }
        Returns: boolean
      }
      is_user_super_admin: { Args: never; Returns: boolean }
      permanently_delete_employee: {
        Args: { employee_user_id: string }
        Returns: Json
      }
      reactivate_employee: { Args: { employee_user_id: string }; Returns: Json }
      rpc_time_summary_details:
        | {
            Args: {
              p_company_id: string
              p_employee_id: string
              p_end_date: string
              p_jobsite_id: string
              p_start_date: string
              p_tz: string
            }
            Returns: {
              check_in_location: string
              check_in_time: string
              check_out_location: string
              check_out_time: string
              date: string
              hours_worked: number
              id: string
              location_distance: number
              notes: string
              status: string
            }[]
          }
        | {
            Args: {
              p_company_id: string
              p_employee_id: string
              p_end_date: string
              p_start_date: string
              p_timezone?: string
            }
            Returns: {
              check_in_time: string
              check_out_time: string
              hours_worked: number
              jobsite_id: string
              jobsite_name: string
              punch_date: string
              status: string
            }[]
          }
        | {
            Args: {
              p_company_id: string
              p_employee_id: string
              p_end_date: string
              p_jobsite_id: string
              p_start_date: string
              p_timezone: string
            }
            Returns: {
              check_in_time: string
              check_out_time: string
              hours_worked: number
              jobsite_name: string
              punch_date: string
              status: string
            }[]
          }
      rpc_time_summary_headers: {
        Args: {
          p_company_id: string
          p_employee_ids?: string[]
          p_end_date: string
          p_jobsite_ids?: string[]
          p_start_date: string
          p_statuses?: string[]
          p_tz?: string
        }
        Returns: {
          employee_id: string
          employee_name: string
          employee_photo: string
          employee_position: string
          employee_role: string
          employee_trade: string
          has_flags: boolean
          jobsite_id: string
          jobsite_name: string
          total_minutes: number
          total_punches: number
        }[]
      }
      run_daily_notification_checks: { Args: never; Returns: undefined }
      seed_default_role_permissions: {
        Args: { company_uuid: string }
        Returns: undefined
      }
      user_has_admin_role: { Args: never; Returns: boolean }
    }
    Enums: {
      punch_type: "in" | "out" | "both"
      request_status:
        | "pending"
        | "ordered"
        | "delivered"
        | "archived"
        | "approved"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      punch_type: ["in", "out", "both"],
      request_status: [
        "pending",
        "ordered",
        "delivered",
        "archived",
        "approved",
      ],
    },
  },
} as const
