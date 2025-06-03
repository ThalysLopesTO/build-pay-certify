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
      company_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
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
          company_logo_url?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          hst_number?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
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
          created_at: string
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      material_requests: {
        Row: {
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
            foreignKeyName: "material_requests_jobsite_id_fkey"
            columns: ["jobsite_id"]
            isOneToOne: false
            referencedRelation: "jobsites"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_timesheets: {
        Row: {
          created_at: string
          friday_hours: number | null
          gross_pay: number | null
          hourly_rate: number
          id: string
          jobsite_id: string
          monday_hours: number | null
          saturday_hours: number | null
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
          created_at?: string
          friday_hours?: number | null
          gross_pay?: number | null
          hourly_rate: number
          id?: string
          jobsite_id: string
          monday_hours?: number | null
          saturday_hours?: number | null
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
          created_at?: string
          friday_hours?: number | null
          gross_pay?: number | null
          hourly_rate?: number
          id?: string
          jobsite_id?: string
          monday_hours?: number | null
          saturday_hours?: number | null
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
      is_admin: {
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
