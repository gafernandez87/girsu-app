export type Json = boolean | number | string | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'player' | 'admin';
          school: string;
          course: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string;
          role?: 'player' | 'admin';
          school?: string;
          course?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          name?: string;
          role?: 'player' | 'admin';
          school?: string;
          course?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      public_profiles: {
        Row: {
          user_id: string;
          name: string;
          school: string;
          course: string;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          school?: string;
          course?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
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

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type GameResultInsert = Database['public']['Tables']['game_results']['Insert'];
export type GameResultRow = Database['public']['Tables']['game_results']['Row'];
export type GameResultUpdate = Database['public']['Tables']['game_results']['Update'];
export type LeaderboardRow = Database['public']['Views']['leaderboard']['Row'];
