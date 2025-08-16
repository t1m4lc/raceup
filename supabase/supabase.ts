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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      events: {
        Row: {
          banner_url: string | null
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          location: string
          logo_url: string | null
          name: string
          organization_id: string
          previous_event_id: string | null
          slug: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          location: string
          logo_url?: string | null
          name: string
          organization_id: string
          previous_event_id?: string | null
          slug: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          location?: string
          logo_url?: string | null
          name?: string
          organization_id?: string
          previous_event_id?: string | null
          slug?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_previous_event_id_fkey"
            columns: ["previous_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          banner_url: string | null
          created_at: string | null
          description: string | null
          founder_id: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          stripe_account_id: string | null
          updated_at: string | null
          volunteers: string[] | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          founder_id: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          stripe_account_id?: string | null
          updated_at?: string | null
          volunteers?: string[] | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          founder_id?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          stripe_account_id?: string | null
          updated_at?: string | null
          volunteers?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          birthdate: string
          certificate_url: string | null
          certificate_validated: boolean | null
          checkin_at: string | null
          created_at: string | null
          full_name: string
          gender: string
          id: string
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          birthdate: string
          certificate_url?: string | null
          certificate_validated?: boolean | null
          checkin_at?: string | null
          created_at?: string | null
          full_name: string
          gender: string
          id?: string
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          birthdate?: string
          certificate_url?: string | null
          certificate_validated?: boolean | null
          checkin_at?: string | null
          created_at?: string | null
          full_name?: string
          gender?: string
          id?: string
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          application_fee_cents: number
          commission_allocation: Json | null
          commission_fixed_cents: number | null
          commission_variable_cents: number | null
          created_at: string | null
          id: string
          status: string
          stripe_payment_intent_id: string
          stripe_payment_method: string | null
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          application_fee_cents: number
          commission_allocation?: Json | null
          commission_fixed_cents?: number | null
          commission_variable_cents?: number | null
          created_at?: string | null
          id?: string
          status: string
          stripe_payment_intent_id: string
          stripe_payment_method?: string | null
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          application_fee_cents?: number
          commission_allocation?: Json | null
          commission_fixed_cents?: number | null
          commission_variable_cents?: number | null
          created_at?: string | null
          id?: string
          status?: string
          stripe_payment_intent_id?: string
          stripe_payment_method?: string | null
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      races: {
        Row: {
          created_at: string | null
          currency: string
          distance_km: number
          elevation_m: number | null
          event_id: string
          id: string
          max_participants: number | null
          name: string
          price_cents: number
          slug: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          distance_km: number
          elevation_m?: number | null
          event_id: string
          id?: string
          max_participants?: number | null
          name: string
          price_cents: number
          slug: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          distance_km?: number
          elevation_m?: number | null
          event_id?: string
          id?: string
          max_participants?: number | null
          name?: string
          price_cents?: number
          slug?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "races_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          quantity: number
          race_id: string
          status: string | null
          stripe_payment_intent_id: string | null
          total_price_cents: number
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          quantity?: number
          race_id: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_price_cents: number
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          quantity?: number
          race_id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_price_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_slug: {
        Args: { input_text: string }
        Returns: string
      }
      generate_slug: {
        Args: { input_text: string }
        Returns: string
      }
      generate_unique_edition_slug: {
        Args: { event_name: string; year: number }
        Returns: string
      }
      generate_unique_slug: {
        Args: { base_slug: string; id_to_exclude?: string; table_name: string }
        Returns: string
      }
    }
    Enums: {
      register_state_enum: "not_open" | "open" | "closed"
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
      register_state_enum: ["not_open", "open", "closed"],
    },
  },
} as const
