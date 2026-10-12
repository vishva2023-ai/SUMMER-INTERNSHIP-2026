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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      confirmation_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          submission_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          submission_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          submission_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmation_tokens_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["submission_id"]
          },
        ]
      }
      submissions: {
        Row: {
          academic_year: string
          certificate_file_path: string | null
          certificate_filename: string | null
          created_at: string
          department: string
          drive_certificate_id: string | null
          drive_folder_id: string | null
          drive_pdf_id: string | null
          drive_ppt_id: string | null
          drive_sync_status: string
          email: string
          faculty_guide: string | null
          faculty_name: string
          id: string
          internship_company: string
          mobile_number: string
          panel_number: number
          pdf_file_path: string | null
          pdf_filename: string | null
          ppt_file_path: string | null
          ppt_filename: string | null
          project_title: string
          registration_number: string
          review_date: string
          school: string
          sheet_sync_status: string
          student_name: string
          submission_id: string
          submission_status: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          certificate_file_path?: string | null
          certificate_filename?: string | null
          created_at?: string
          department: string
          drive_certificate_id?: string | null
          drive_folder_id?: string | null
          drive_pdf_id?: string | null
          drive_ppt_id?: string | null
          drive_sync_status?: string
          email: string
          faculty_guide?: string | null
          faculty_name: string
          id?: string
          internship_company: string
          mobile_number: string
          panel_number: number
          pdf_file_path?: string | null
          pdf_filename?: string | null
          ppt_file_path?: string | null
          ppt_filename?: string | null
          project_title: string
          registration_number: string
          review_date: string
          school: string
          sheet_sync_status?: string
          student_name: string
          submission_id: string
          submission_status?: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          certificate_file_path?: string | null
          certificate_filename?: string | null
          created_at?: string
          department?: string
          drive_certificate_id?: string | null
          drive_folder_id?: string | null
          drive_pdf_id?: string | null
          drive_ppt_id?: string | null
          drive_sync_status?: string
          email?: string
          faculty_guide?: string | null
          faculty_name?: string
          id?: string
          internship_company?: string
          mobile_number?: string
          panel_number?: number
          pdf_file_path?: string | null
          pdf_filename?: string | null
          ppt_file_path?: string | null
          ppt_filename?: string | null
          project_title?: string
          registration_number?: string
          review_date?: string
          school?: string
          sheet_sync_status?: string
          student_name?: string
          submission_id?: string
          submission_status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      next_submission_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
