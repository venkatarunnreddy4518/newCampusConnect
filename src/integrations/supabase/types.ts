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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      club_memberships: {
        Row: {
          club_id: string
          id: string
          joined_at: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          max_members: number | null
          name: string
          poster_url: string | null
          trailer_url: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          max_members?: number | null
          name: string
          poster_url?: string | null
          trailer_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          max_members?: number | null
          name?: string
          poster_url?: string | null
          trailer_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          is_live: boolean
          max_capacity: number | null
          name: string
          poster_url: string | null
          stream_url: string | null
          trailer_url: string | null
          updated_at: string
          venue: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          is_live?: boolean
          max_capacity?: number | null
          name: string
          poster_url?: string | null
          stream_url?: string | null
          trailer_url?: string | null
          updated_at?: string
          venue: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          is_live?: boolean
          max_capacity?: number | null
          name?: string
          poster_url?: string | null
          stream_url?: string | null
          trailer_url?: string | null
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      live_matches: {
        Row: {
          batting_team: string
          created_at: string
          created_by: string | null
          detail: string | null
          extras_a: number
          extras_b: number
          id: string
          match_format: string
          overs_a: string
          overs_b: string
          score_a: number
          score_b: number
          sport: string
          status: string
          team_a: string
          team_b: string
          updated_at: string
          wickets_a: number
          wickets_b: number
        }
        Insert: {
          batting_team?: string
          created_at?: string
          created_by?: string | null
          detail?: string | null
          extras_a?: number
          extras_b?: number
          id?: string
          match_format?: string
          overs_a?: string
          overs_b?: string
          score_a?: number
          score_b?: number
          sport?: string
          status?: string
          team_a: string
          team_b: string
          updated_at?: string
          wickets_a?: number
          wickets_b?: number
        }
        Update: {
          batting_team?: string
          created_at?: string
          created_by?: string | null
          detail?: string | null
          extras_a?: number
          extras_b?: number
          id?: string
          match_format?: string
          overs_a?: string
          overs_b?: string
          score_a?: number
          score_b?: number
          sport?: string
          status?: string
          team_a?: string
          team_b?: string
          updated_at?: string
          wickets_a?: number
          wickets_b?: number
        }
        Relationships: []
      }
      match_scorecard: {
        Row: {
          balls: number | null
          batting_order: number | null
          created_at: string
          dismissal: string | null
          economy: number | null
          fours: number | null
          id: string
          maidens: number | null
          match_id: string
          overs_bowled: string | null
          player_name: string
          role: string
          runs: number | null
          runs_conceded: number | null
          sixes: number | null
          strike_rate: number | null
          team: string
          wickets_taken: number | null
        }
        Insert: {
          balls?: number | null
          batting_order?: number | null
          created_at?: string
          dismissal?: string | null
          economy?: number | null
          fours?: number | null
          id?: string
          maidens?: number | null
          match_id: string
          overs_bowled?: string | null
          player_name: string
          role?: string
          runs?: number | null
          runs_conceded?: number | null
          sixes?: number | null
          strike_rate?: number | null
          team: string
          wickets_taken?: number | null
        }
        Update: {
          balls?: number | null
          batting_order?: number | null
          created_at?: string
          dismissal?: string | null
          economy?: number | null
          fours?: number | null
          id?: string
          maidens?: number | null
          match_id?: string
          overs_bowled?: string | null
          player_name?: string
          role?: string
          runs?: number | null
          runs_conceded?: number | null
          sixes?: number | null
          strike_rate?: number | null
          team?: string
          wickets_taken?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_scorecard_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "live_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          permission: Database["public"]["Enums"]["permission_type"]
          resource_id: string | null
          scope: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission: Database["public"]["Enums"]["permission_type"]
          resource_id?: string | null
          scope?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["permission_type"]
          resource_id?: string | null
          scope?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          achievements: string[] | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          github_url: string | null
          gmail_url: string | null
          id: string
          linkedin_url: string | null
          updated_at: string
          year: string | null
        }
        Insert: {
          achievements?: string[] | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          gmail_url?: string | null
          id: string
          linkedin_url?: string | null
          updated_at?: string
          year?: string | null
        }
        Update: {
          achievements?: string[] | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          gmail_url?: string | null
          id?: string
          linkedin_url?: string | null
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          event_category: string
          event_date: string | null
          event_name: string
          event_venue: string | null
          id: string
          registered_at: string
          status: string
          user_id: string
        }
        Insert: {
          event_category: string
          event_date?: string | null
          event_name: string
          event_venue?: string | null
          id?: string
          registered_at?: string
          status?: string
          user_id: string
        }
        Update: {
          event_category?: string
          event_date?: string | null
          event_name?: string
          event_venue?: string | null
          id?: string
          registered_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["permission_type"]
          _resource_id?: string
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      permission_type:
        | "event_manager"
        | "club_manager"
        | "registration_manager"
        | "content_moderator"
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
      app_role: ["admin", "moderator", "user"],
      permission_type: [
        "event_manager",
        "club_manager",
        "registration_manager",
        "content_moderator",
      ],
    },
  },
} as const
