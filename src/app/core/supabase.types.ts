export type Json = boolean | number | string | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          source_code: string;
          name: string;
          street: string;
          street_number: string;
          neighborhood: string;
          locality: string;
          department: string;
          phone: string;
          region: string;
          sector: string;
          scope: string;
          category: string;
          permanence: string;
          operating_period: string;
          email: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_code: string;
          name: string;
          street?: string;
          street_number?: string;
          neighborhood?: string;
          locality?: string;
          department?: string;
          phone?: string;
          region?: string;
          sector?: string;
          scope?: string;
          category?: string;
          permanence?: string;
          operating_period?: string;
          email?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          source_code?: string;
          name?: string;
          street?: string;
          street_number?: string;
          neighborhood?: string;
          locality?: string;
          department?: string;
          phone?: string;
          region?: string;
          sector?: string;
          scope?: string;
          category?: string;
          permanence?: string;
          operating_period?: string;
          email?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      jujuy_localities: {
        Row: {
          id: string;
          name: string;
          normalized_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'player' | 'admin';
          birth_date: string | null;
          province: string;
          locality: string;
          locality_id: string | null;
          locality_source: 'jujuy_catalog' | 'manual' | 'legacy';
          school_id: string | null;
          school_membership: string;
          school_role: string;
          school: string;
          course: string;
          waste_separation: string[];
          composting: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string;
          role?: 'player' | 'admin';
          birth_date?: string | null;
          province?: string;
          locality?: string;
          locality_id?: string | null;
          locality_source?: 'jujuy_catalog' | 'manual' | 'legacy';
          school_id?: string | null;
          school_membership?: string;
          school_role?: string;
          school?: string;
          course?: string;
          waste_separation?: string[];
          composting?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          name?: string;
          role?: 'player' | 'admin';
          birth_date?: string | null;
          province?: string;
          locality?: string;
          locality_id?: string | null;
          locality_source?: 'jujuy_catalog' | 'manual' | 'legacy';
          school_id?: string | null;
          school_membership?: string;
          school_role?: string;
          school?: string;
          course?: string;
          waste_separation?: string[];
          composting?: string[];
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      public_profiles: {
        Row: {
          user_id: string;
          school_id: string | null;
          name: string;
          school: string;
          course: string;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          school_id?: string | null;
          name: string;
          school?: string;
          course?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          school_id?: string | null;
          name?: string;
          school?: string;
          course?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      game_results: {
        Row: {
          id: string;
          user_id: string;
          stage_id: string;
          score: number;
          raw_score: number | null;
          score_breakdown: Json;
          correct: number;
          mistakes: number;
          remaining_seconds: number;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stage_id: string;
          score: number;
          raw_score?: number | null;
          score_breakdown?: Json;
          correct?: number;
          mistakes?: number;
          remaining_seconds?: number;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          score?: number;
          raw_score?: number | null;
          score_breakdown?: Json;
          correct?: number;
          mistakes?: number;
          remaining_seconds?: number;
          completed_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      leaderboard: {
        Row: {
          position: number | null;
          user_id: string | null;
          name: string | null;
          school_id: string | null;
          school: string | null;
          course: string | null;
          score: number | null;
          completed_stages: number | null;
          last_played_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type SchoolInsert = Database['public']['Tables']['schools']['Insert'];
export type SchoolRow = Database['public']['Tables']['schools']['Row'];
export type SchoolUpdate = Database['public']['Tables']['schools']['Update'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type GameResultInsert = Database['public']['Tables']['game_results']['Insert'];
export type GameResultRow = Database['public']['Tables']['game_results']['Row'];
export type GameResultUpdate = Database['public']['Tables']['game_results']['Update'];
export type LeaderboardRow = Database['public']['Views']['leaderboard']['Row'];
