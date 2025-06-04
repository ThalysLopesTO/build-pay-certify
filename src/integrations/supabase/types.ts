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
      companies: {
        Row: {
          created_at: string
          expiration_date: string | null
          id: string
          license_key: string
          name: string
          plan: string | null
          registration_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiration_date?: string | null
          id?: string
          license_key?: string
          name: string
          plan?: string | null
          registration_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiration_date?: string | null
          id?: string
          license_key?: string
          name?: string
          plan?: string | null
          registration_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_registration_requests: {
        Row: {
          admin_email: string
          admin_first_name: string
          admin_last_name: string
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
          created_at: string
          hst_number: string | null
          id: string
          updated_at: string
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_id?: string | null
          company_logo_url?: string | null
          company_name: string
          company_phone?: string | null
          created_at?: string
          hst_number?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_id?: string | null
          company_logo_url?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          hst_number?: string | null
          id?: string
          updated_at?: string
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
      jobsites: {
        Row: {
          address: string | null
          company_id: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
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
      generate_invoice_number: {
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
      get_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_company_admin: {
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
