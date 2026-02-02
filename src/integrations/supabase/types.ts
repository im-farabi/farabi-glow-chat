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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_usages: {
        Row: {
          ai_id: string | null
          id: string
          prompt: string
          response_length: number | null
          viewed_at: string | null
        }
        Insert: {
          ai_id?: string | null
          id?: string
          prompt: string
          response_length?: number | null
          viewed_at?: string | null
        }
        Update: {
          ai_id?: string | null
          id?: string
          prompt?: string
          response_length?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usages_ai_id_fkey"
            columns: ["ai_id"]
            isOneToOne: false
            referencedRelation: "custom_ais"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          anonymous_user_id: string
          content: string
          created_at: string
          has_image: boolean | null
          id: string
          mode: string | null
          role: string
          session_id: string
        }
        Insert: {
          anonymous_user_id: string
          content: string
          created_at?: string
          has_image?: boolean | null
          id?: string
          mode?: string | null
          role: string
          session_id: string
        }
        Update: {
          anonymous_user_id?: string
          content?: string
          created_at?: string
          has_image?: boolean | null
          id?: string
          mode?: string | null
          role?: string
          session_id?: string
        }
        Relationships: []
      }
      custom_ais: {
        Row: {
          anonymous_user_id: string
          created_at: string | null
          full_instructions: string
          id: string
          is_published: boolean | null
          name: string
          random_id: string
          short_description: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          anonymous_user_id: string
          created_at?: string | null
          full_instructions: string
          id?: string
          is_published?: boolean | null
          name: string
          random_id: string
          short_description: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          anonymous_user_id?: string
          created_at?: string | null
          full_instructions?: string
          id?: string
          is_published?: boolean | null
          name?: string
          random_id?: string
          short_description?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      daily_analytics: {
        Row: {
          countries: Json | null
          date: string
          id: string
          total_messages: number | null
          total_sessions: number | null
          total_unique_users: number | null
          updated_at: string
        }
        Insert: {
          countries?: Json | null
          date: string
          id?: string
          total_messages?: number | null
          total_sessions?: number | null
          total_unique_users?: number | null
          updated_at?: string
        }
        Update: {
          countries?: Json | null
          date?: string
          id?: string
          total_messages?: number | null
          total_sessions?: number | null
          total_unique_users?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: string
          anonymous_user_id: string
          created_at: string
          donation_type: string
          id: string
          message: string | null
        }
        Insert: {
          amount: string
          anonymous_user_id: string
          created_at?: string
          donation_type: string
          id?: string
          message?: string | null
        }
        Update: {
          amount?: string
          anonymous_user_id?: string
          created_at?: string
          donation_type?: string
          id?: string
          message?: string | null
        }
        Relationships: []
      }
      note_views: {
        Row: {
          device_type: string | null
          id: string
          note_id: string
          user_agent: string | null
          viewed_at: string | null
        }
        Insert: {
          device_type?: string | null
          id?: string
          note_id: string
          user_agent?: string | null
          viewed_at?: string | null
        }
        Update: {
          device_type?: string | null
          id?: string
          note_id?: string
          user_agent?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_views_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "shared_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_notes: {
        Row: {
          anonymous_user_id: string
          color_theme: string
          created_at: string
          description: string
          id: string
          password: string | null
          short_description: string | null
          slug: string
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          anonymous_user_id: string
          color_theme?: string
          created_at?: string
          description: string
          id?: string
          password?: string | null
          short_description?: string | null
          slug: string
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          anonymous_user_id?: string
          color_theme?: string
          created_at?: string
          description?: string
          id?: string
          password?: string | null
          short_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          total_generations: number
          total_spent: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          total_generations?: number
          total_spent?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          total_generations?: number
          total_spent?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          anonymous_user_id: string
          country_code: string | null
          country_name: string | null
          id: string
          ip_address: unknown
          last_activity: string
          session_end: string | null
          session_id: string
          session_start: string
          user_agent: string | null
        }
        Insert: {
          anonymous_user_id: string
          country_code?: string | null
          country_name?: string | null
          id?: string
          ip_address?: unknown
          last_activity?: string
          session_end?: string | null
          session_id: string
          session_start?: string
          user_agent?: string | null
        }
        Update: {
          anonymous_user_id?: string
          country_code?: string | null
          country_name?: string | null
          id?: string
          ip_address?: unknown
          last_activity?: string
          session_end?: string | null
          session_id?: string
          session_start?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      user_websites: {
        Row: {
          anonymous_user_id: string
          created_at: string
          css_content: string | null
          html_content: string
          id: string
          is_published: boolean
          js_content: string | null
          slug: string
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          anonymous_user_id: string
          created_at?: string
          css_content?: string | null
          html_content: string
          id?: string
          is_published?: boolean
          js_content?: string | null
          slug: string
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          anonymous_user_id?: string
          created_at?: string
          css_content?: string | null
          html_content?: string
          id?: string
          is_published?: boolean
          js_content?: string | null
          slug?: string
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: []
      }
      verifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          roblox_user_id: string | null
          roblox_username: string | null
          verification_code: string
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          roblox_user_id?: string | null
          roblox_username?: string | null
          verification_code: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          roblox_user_id?: string | null
          roblox_username?: string | null
          verification_code?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      webgen_history: {
        Row: {
          cost: number
          created_at: string | null
          id: string
          model: string
          prompt: string | null
          success: boolean | null
          user_id: string
        }
        Insert: {
          cost: number
          created_at?: string | null
          id?: string
          model: string
          prompt?: string | null
          success?: boolean | null
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string | null
          id?: string
          model?: string
          prompt?: string | null
          success?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      youtube_transcripts: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          summary: string | null
          title: string | null
          transcript: string
          video_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          summary?: string | null
          title?: string | null
          transcript: string
          video_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          summary?: string | null
          title?: string | null
          transcript?: string
          video_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_verifications: { Args: never; Returns: undefined }
      delete_expired_transcripts: { Args: never; Returns: undefined }
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
    Enums: {},
  },
} as const
