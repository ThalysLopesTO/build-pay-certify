export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          submitted_by: string
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
          submitted_by: string
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
          submitted_by?: string
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
        ]
      }
      audit_logs: {
        Row: {
          company_id: string
          created_at: string
          edited_by_user_id: string
          employee_id: string
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
          edited_by_user_id: string
          employee_id: string
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
          edited_by_user_id?: string
          employee_id?: string
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
          created_by: string
          expense_date: string
          expense_title: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string
          updated_at: string
          vendor_payee: string
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          category_id?: string | null
          company_id: string
          created_at?: string
          created_by: string
          expense_date: string
          expense_title: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          updated_at?: string
          vendor_payee: string
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          expense_date?: string
          expense_title?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
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
        ]
      }
      cancellation_requests: {
        Row: {
          company_id: string
          created_at: string
          id: string
          notes: string | null
          request_date: string
          requested_by: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          request_date?: string
          requested_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          request_date?: string
          requested_by?: string
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
        ]
      }
      companies: {
        Row: {
          company_rules_text: string | null
          created_at: string
          employee_limit: number | null
          expiration_date: string | null
          id: string
          license_expires_at: string | null
          license_key: string
          logo_url: string | null
          name: string
          plan: string | null
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
          updated_at: string
        }
        Insert: {
          company_rules_text?: string | null
          created_at?: string
          employee_limit?: number | null
          expiration_date?: string | null
          id?: string
          license_expires_at?: string | null
          license_key?: string
          logo_url?: string | null
          name: string
          plan?: string | null
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
          updated_at?: string
        }
        Update: {
          company_rules_text?: string | null
          created_at?: string
          employee_limit?: number | null
          expiration_date?: string | null
          id?: string
          license_expires_at?: string | null
          license_key?: string
          logo_url?: string | null
          name?: string
          plan?: string | null
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
          hst_number: string | null
          id: string
          updated_at: string
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
          hst_number?: string | null
          id?: string
          updated_at?: string
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
          hst_number?: string | null
          id?: string
          updated_at?: string
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
      employee_certificates: {
        Row: {
          certificate_name: string
          certificate_type: string
          company_id: string
          created_at: string
          employee_id: string
          expiry_date: string
          file_url: string | null
          id: string
          status: string
          updated_at: string
          upload_date: string
          uploaded_by: string
        }
        Insert: {
          certificate_name: string
          certificate_type: string
          company_id: string
          created_at?: string
          employee_id: string
          expiry_date: string
          file_url?: string | null
          id?: string
          status?: string
          updated_at?: string
          upload_date?: string
          uploaded_by: string
        }
        Update: {
          certificate_name?: string
          certificate_type?: string
          company_id?: string
          created_at?: string
          employee_id?: string
          expiry_date?: string
          file_url?: string | null
          id?: string
          status?: string
          updated_at?: string
          upload_date?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
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
        ]
      }
      inventory: {
        Row: {
          brand: string
          company_id: string
          created_at: string
          created_by: string
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
          created_by: string
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
          created_by?: string
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
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
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
          client_company: string
          client_email: string
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
          client_company: string
          client_email: string
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
          client_company?: string
          client_email?: string
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
      jobsite_tasks: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
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
          created_by: string
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
          created_by?: string
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
          company_id: string | null
          created_at: string
          due_date: string | null
          id: string
          name: string
          starting_date: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          name: string
          starting_date?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          name?: string
          starting_date?: string | null
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
      material_requests: {
        Row: {
          company_id: string | null
          created_at: string
          delivery_date: string
          delivery_time: string
          floor_unit: string | null
          id: string
          jobsite_id: string
          material_list: string
          status: Database["public"]["Enums"]["request_status"]
          submitted_by: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          delivery_date: string
          delivery_time: string
          floor_unit?: string | null
          id?: string
          jobsite_id: string
          material_list: string
          status?: Database["public"]["Enums"]["request_status"]
          submitted_by: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          delivery_date?: string
          delivery_time?: string
          floor_unit?: string | null
          id?: string
          jobsite_id?: string
          material_list?: string
          status?: Database["public"]["Enums"]["request_status"]
          submitted_by?: string
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
        ]
      }
      material_takeoff_notes: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          id: string
          jobsite_id: string
          takeoff_notes: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          jobsite_id: string
          takeoff_notes?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          jobsite_id?: string
          takeoff_notes?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_takeoff_notes_jobsite_id_fkey"
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
          created_by: string
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
          created_by: string
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
          created_by?: string
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
            foreignKeyName: "quotes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
          uploaded_by: string
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
          uploaded_by: string
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
          uploaded_by?: string
        }
        Relationships: []
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
        ]
      }
      user_profiles: {
        Row: {
          company_id: string
          created_at: string
          first_name: string | null
          hourly_rate: number | null
          id: string
          last_name: string | null
          pending_approval: boolean | null
          position: string | null
          role: string
          stripe_verification_status: string | null
          stripe_verified: boolean | null
          trade: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          first_name?: string | null
          hourly_rate?: number | null
          id?: string
          last_name?: string | null
          pending_approval?: boolean | null
          position?: string | null
          role?: string
          stripe_verification_status?: string | null
          stripe_verified?: boolean | null
          trade?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          first_name?: string | null
          hourly_rate?: number | null
          id?: string
          last_name?: string | null
          pending_approval?: boolean | null
          position?: string | null
          role?: string
          stripe_verification_status?: string | null
          stripe_verified?: boolean | null
          trade?: string | null
          updated_at?: string
          user_id?: string
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
      weekly_timesheet_audit_logs: {
        Row: {
          changes: Json
          company_id: string
          created_at: string
          edited_at: string
          edited_by_user_id: string
          id: string
          notes: string | null
          timesheet_id: string
        }
        Insert: {
          changes: Json
          company_id: string
          created_at?: string
          edited_at?: string
          edited_by_user_id: string
          id?: string
          notes?: string | null
          timesheet_id: string
        }
        Update: {
          changes?: Json
          company_id?: string
          created_at?: string
          edited_at?: string
          edited_by_user_id?: string
          id?: string
          notes?: string | null
          timesheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_timesheet_audit_logs_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "weekly_timesheets"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_timesheets: {
        Row: {
          additional_expense: number | null
          company_id: string | null
          created_at: string
          friday_hours: number | null
          gross_pay: number | null
          hourly_rate: number
          id: string
          jobsite_id: string
          monday_hours: number | null
          notes: string | null
          saturday_hours: number | null
          status: string
          submitted_by: string
          sunday_hours: number | null
          thursday_hours: number | null
          total_hours: number | null
          tuesday_hours: number | null
          updated_at: string
          wednesday_hours: number | null
          week_start_date: string
        }
        Insert: {
          additional_expense?: number | null
          company_id?: string | null
          created_at?: string
          friday_hours?: number | null
          gross_pay?: number | null
          hourly_rate: number
          id?: string
          jobsite_id: string
          monday_hours?: number | null
          notes?: string | null
          saturday_hours?: number | null
          status?: string
          submitted_by: string
          sunday_hours?: number | null
          thursday_hours?: number | null
          total_hours?: number | null
          tuesday_hours?: number | null
          updated_at?: string
          wednesday_hours?: number | null
          week_start_date: string
        }
        Update: {
          additional_expense?: number | null
          company_id?: string | null
          created_at?: string
          friday_hours?: number | null
          gross_pay?: number | null
          hourly_rate?: number
          id?: string
          jobsite_id?: string
          monday_hours?: number | null
          notes?: string | null
          saturday_hours?: number | null
          status?: string
          submitted_by?: string
          sunday_hours?: number | null
          thursday_hours?: number | null
          total_hours?: number | null
          tuesday_hours?: number | null
          updated_at?: string
          wednesday_hours?: number | null
          week_start_date?: string
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
      [_ in never]: never
    }
    Functions: {
      calculate_invoice_totals: {
        Args: { invoice_id_param: string }
        Returns: undefined
      }
      calculate_quote_totals: {
        Args: { quote_id_param: string }
        Returns: undefined
      }
      can_add_employee: {
        Args: { company_id_param: string }
        Returns: boolean
      }
      can_add_employee_with_subscription: {
        Args: { company_id_param: string }
        Returns: boolean
      }
      check_expiring_certificates: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_overdue_jobsites: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      convert_quote_to_invoice: {
        Args: { quote_id_param: string }
        Returns: string
      }
      delete_employee: {
        Args: { employee_user_id: string }
        Returns: Json
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_quote_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_companies_with_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          status: string
          registration_date: string
          expiration_date: string
          created_at: string
          is_expired: boolean
          days_until_expiry: number
        }[]
      }
      get_company_employee_count: {
        Args: { company_id_param: string }
        Returns: number
      }
      get_company_plan_details: {
        Args: { company_id_param: string }
        Returns: {
          plan_type: string
          plan_name: string
          price_monthly: number
          employee_limit: number
          current_employee_count: number
          subscription_status: string
          subscription_end_date: string
          can_add_employees: boolean
        }[]
      }
      get_material_takeoff_notes: {
        Args: { p_company_id: string }
        Returns: {
          id: string
          jobsite_id: string
          company_id: string
          takeoff_notes: string
          created_at: string
          updated_at: string
          created_by: string
          updated_by: string
          jobsite_name: string
          jobsite_address: string
        }[]
      }
      get_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_users_banned_this_hour: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          banned_until: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_company_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_company_license_active: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_company_license_expired: {
        Args: { company_id_param: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      request_status: "pending" | "ordered" | "delivered" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      request_status: ["pending", "ordered", "delivered", "archived"],
    },
  },
} as const
