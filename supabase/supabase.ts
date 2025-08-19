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
      individual_tickets: {
        Row: {
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string | null
          id: string
          is_user_linked: boolean | null
          linked_user_id: string | null
          medical_validated: boolean | null
          participant_id: string
          qr_code_data: string
          status: string | null
          ticket_id: string
          ticket_number: string
          updated_at: string | null
        }
        Insert: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          id?: string
          is_user_linked?: boolean | null
          linked_user_id?: string | null
          medical_validated?: boolean | null
          participant_id: string
          qr_code_data: string
          status?: string | null
          ticket_id: string
          ticket_number: string
          updated_at?: string | null
        }
        Update: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          id?: string
          is_user_linked?: boolean | null
          linked_user_id?: string | null
          medical_validated?: boolean | null
          participant_id?: string
          qr_code_data?: string
          status?: string | null
          ticket_id?: string
          ticket_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "individual_tickets_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_tickets_linked_user_id_fkey"
            columns: ["linked_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_tickets_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_tickets_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_totals"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "individual_tickets_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
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
          stripe_onboarding_completed: boolean | null
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
          stripe_onboarding_completed?: boolean | null
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
          stripe_onboarding_completed?: boolean | null
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
      participant_extras: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          participant_id: string
          quantity: number
          race_extra_id: string
          total_price_cents: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string | null
          currency?: string
          id?: string
          participant_id: string
          quantity?: number
          race_extra_id: string
          total_price_cents: number
          unit_price_cents: number
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          participant_id?: string
          quantity?: number
          race_extra_id?: string
          total_price_cents?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "participant_extras_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_extras_race_extra_id_fkey"
            columns: ["race_extra_id"]
            isOneToOne: false
            referencedRelation: "race_extras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_extras_race_extra_id_fkey"
            columns: ["race_extra_id"]
            isOneToOne: false
            referencedRelation: "race_extras_with_availability"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          bib_number: string | null
          bid_number: string | null
          birthdate: string
          certificate_url: string | null
          certificate_validated: boolean | null
          checkin_at: string | null
          created_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string
          id: string
          last_name: string
          medical_notes: string | null
          ticket_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bib_number?: string | null
          bid_number?: string | null
          birthdate: string
          certificate_url?: string | null
          certificate_validated?: boolean | null
          checkin_at?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender: string
          id?: string
          last_name: string
          medical_notes?: string | null
          ticket_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bib_number?: string | null
          bid_number?: string | null
          birthdate?: string
          certificate_url?: string | null
          certificate_validated?: boolean | null
          checkin_at?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string
          id?: string
          last_name?: string
          medical_notes?: string | null
          ticket_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_totals"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "participants_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "ticket_totals"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "payments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_orders: {
        Row: {
          cart_items: Json
          commission_config: Json | null
          contact_info: Json
          created_at: string
          currency: string
          expires_at: string
          id: string
          status: string
          stripe_payment_intent_id: string | null
          total_amount_cents: number
          user_id: string
        }
        Insert: {
          cart_items: Json
          commission_config?: Json | null
          contact_info: Json
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount_cents: number
          user_id: string
        }
        Update: {
          cart_items?: Json
          commission_config?: Json | null
          contact_info?: Json
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount_cents?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          medical_notes: string | null
          onboarding_completed: boolean | null
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          gender?: string | null
          id: string
          last_name?: string | null
          medical_notes?: string | null
          onboarding_completed?: boolean | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          medical_notes?: string | null
          onboarding_completed?: boolean | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      race_extras: {
        Row: {
          created_at: string | null
          currency: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          max_quantity_per_participant: number | null
          name: string
          price_cents: number
          race_id: string
          total_available_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          max_quantity_per_participant?: number | null
          name: string
          price_cents: number
          race_id: string
          total_available_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          max_quantity_per_participant?: number | null
          name?: string
          price_cents?: number
          race_id?: string
          total_available_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "race_extras_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
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
          contact_email: string | null
          contact_first_name: string | null
          contact_last_name: string | null
          contact_phone: string | null
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
          contact_email?: string | null
          contact_first_name?: string | null
          contact_last_name?: string | null
          contact_phone?: string | null
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
          contact_email?: string | null
          contact_first_name?: string | null
          contact_last_name?: string | null
          contact_phone?: string | null
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
      race_extras_with_availability: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          display_order: number | null
          id: string | null
          is_active: boolean | null
          max_quantity_per_participant: number | null
          name: string | null
          price_cents: number | null
          race_id: string | null
          remaining_quantity: number | null
          total_available_quantity: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "race_extras_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_totals: {
        Row: {
          currency: string | null
          extras_total_cents: number | null
          participants_count: number | null
          race_id: string | null
          race_price_cents: number | null
          race_total_cents: number | null
          subtotal_cents: number | null
          ticket_id: string | null
        }
        Relationships: [
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
    Functions: {
      clean_slug: {
        Args: { input_text: string }
        Returns: string
      }
      cleanup_expired_pending_orders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      complete_pending_order: {
        Args: { order_id: string }
        Returns: undefined
      }
      create_individual_ticket: {
        Args: {
          p_is_user_linked?: boolean
          p_linked_user_id?: string
          p_participant_id: string
          p_qr_code_data: string
          p_ticket_id: string
          p_ticket_number: string
        }
        Returns: undefined
      }
      generate_qr_code_data: {
        Args: { participant_uuid: string; ticket_uuid: string }
        Returns: string
      }
      generate_slug: {
        Args: { input_text: string }
        Returns: string
      }
      generate_ticket_number: {
        Args: Record<PropertyKey, never>
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
      get_participant_extras_total: {
        Args: { participant_uuid: string }
        Returns: number
      }
      get_pending_order: {
        Args: { order_id: string; payment_intent_id: string }
        Returns: {
          cart_items: Json
          commission_config: Json
          contact_info: Json
          created_at: string
          currency: string
          expires_at: string
          id: string
          status: string
          stripe_payment_intent_id: string
          total_amount_cents: number
          user_id: string
        }[]
      }
      get_ticket_extras_total: {
        Args: { ticket_uuid: string }
        Returns: number
      }
      verify_individual_ticket: {
        Args:
          | { p_event_id: string; p_qr_code_data: string }
          | {
              p_participant_id: string
              p_qr_code_data: string
              p_ticket_id: string
            }
        Returns: {
          checked_in_at: string
          event_location: string
          event_name: string
          medical_validated: boolean
          participant_bib_number: string
          participant_birthdate: string
          participant_certificate_url: string
          participant_full_name: string
          participant_gender: string
          participant_id: string
          race_distance_km: number
          race_name: string
          race_start_time: string
          status: string
          ticket_id: string
          ticket_number: string
        }[]
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
