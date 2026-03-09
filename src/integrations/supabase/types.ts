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
      challenge_participants: {
        Row: {
          challenge_id: string
          completed: boolean
          created_at: string
          id: string
          points_earned: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          created_at?: string
          id?: string
          points_earned?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          created_at?: string
          id?: string
          points_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          badge_name: string
          category: string
          created_at: string
          description: string | null
          end_date: string
          id: string
          point_multiplier: number
          start_date: string
          title: string
        }
        Insert: {
          badge_name?: string
          category: string
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          point_multiplier?: number
          start_date: string
          title: string
        }
        Update: {
          badge_name?: string
          category?: string
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          point_multiplier?: number
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reaction: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reaction: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          created_at: string
          downvotes: number
          id: string
          is_pinned: boolean | null
          parent_comment_id: string | null
          reel_id: string
          text: string
          upvotes: number
          user_id: string
        }
        Insert: {
          created_at?: string
          downvotes?: number
          id?: string
          is_pinned?: boolean | null
          parent_comment_id?: string | null
          reel_id: string
          text: string
          upvotes?: number
          user_id: string
        }
        Update: {
          created_at?: string
          downvotes?: number
          id?: string
          is_pinned?: boolean | null
          parent_comment_id?: string | null
          reel_id?: string
          text?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_reel_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_reel_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_reel_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_reel_id_fkey"
            columns: ["related_reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          badges: string[] | null
          bio: string | null
          coins: number
          cover_photo: string | null
          created_at: string
          creator_points: number
          current_badge: string | null
          email: string
          followers_count: number | null
          following_count: number | null
          github_url: string | null
          helper_points: number
          id: string
          is_elite_creator: boolean
          is_private: boolean | null
          is_verified_creator: boolean
          knowledge_points: number
          last_upload_date: string | null
          level: number
          linkedin_url: string | null
          name: string
          open_to_collab: boolean | null
          pinned_reel_id: string | null
          portfolio_url: string | null
          reputation_score: number
          skill_points: Json
          skill_tags: string[] | null
          streak_count: number
          total_score: number
          total_watch_hours: number | null
          updated_at: string
          user_id: string
          username: string | null
          weekly_fpa: number
          xp: number
        }
        Insert: {
          avatar?: string | null
          badges?: string[] | null
          bio?: string | null
          coins?: number
          cover_photo?: string | null
          created_at?: string
          creator_points?: number
          current_badge?: string | null
          email?: string
          followers_count?: number | null
          following_count?: number | null
          github_url?: string | null
          helper_points?: number
          id?: string
          is_elite_creator?: boolean
          is_private?: boolean | null
          is_verified_creator?: boolean
          knowledge_points?: number
          last_upload_date?: string | null
          level?: number
          linkedin_url?: string | null
          name?: string
          open_to_collab?: boolean | null
          pinned_reel_id?: string | null
          portfolio_url?: string | null
          reputation_score?: number
          skill_points?: Json
          skill_tags?: string[] | null
          streak_count?: number
          total_score?: number
          total_watch_hours?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
          weekly_fpa?: number
          xp?: number
        }
        Update: {
          avatar?: string | null
          badges?: string[] | null
          bio?: string | null
          coins?: number
          cover_photo?: string | null
          created_at?: string
          creator_points?: number
          current_badge?: string | null
          email?: string
          followers_count?: number | null
          following_count?: number | null
          github_url?: string | null
          helper_points?: number
          id?: string
          is_elite_creator?: boolean
          is_private?: boolean | null
          is_verified_creator?: boolean
          knowledge_points?: number
          last_upload_date?: string | null
          level?: number
          linkedin_url?: string | null
          name?: string
          open_to_collab?: boolean | null
          pinned_reel_id?: string | null
          portfolio_url?: string | null
          reputation_score?: number
          skill_points?: Json
          skill_tags?: string[] | null
          streak_count?: number
          total_score?: number
          total_watch_hours?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
          weekly_fpa?: number
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_pinned_reel_id_fkey"
            columns: ["pinned_reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_likes: {
        Row: {
          created_at: string
          id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_likes_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_saves: {
        Row: {
          created_at: string
          id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_saves_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          authenticity_factor: number
          avg_watch_percent: number
          category: string
          completion_rate: number
          created_at: string
          description: string | null
          difficulty: string
          engagement_score: number
          final_points_awarded: number
          id: string
          is_best_solution: boolean
          is_featured: boolean
          is_reported: boolean
          is_repost: boolean | null
          liked_by: string[]
          likes_count: number
          original_creator_id: string | null
          original_reel_id: string | null
          parent_reel_id: string | null
          reach_score: number
          saves_count: number
          shares_count: number
          thumbnail_url: string | null
          title: string
          total_views: number
          uploaded_by: string
          video_quality_multiplier: number
          video_url: string
        }
        Insert: {
          authenticity_factor?: number
          avg_watch_percent?: number
          category: string
          completion_rate?: number
          created_at?: string
          description?: string | null
          difficulty: string
          engagement_score?: number
          final_points_awarded?: number
          id?: string
          is_best_solution?: boolean
          is_featured?: boolean
          is_reported?: boolean
          is_repost?: boolean | null
          liked_by?: string[]
          likes_count?: number
          original_creator_id?: string | null
          original_reel_id?: string | null
          parent_reel_id?: string | null
          reach_score?: number
          saves_count?: number
          shares_count?: number
          thumbnail_url?: string | null
          title: string
          total_views?: number
          uploaded_by: string
          video_quality_multiplier?: number
          video_url: string
        }
        Update: {
          authenticity_factor?: number
          avg_watch_percent?: number
          category?: string
          completion_rate?: number
          created_at?: string
          description?: string | null
          difficulty?: string
          engagement_score?: number
          final_points_awarded?: number
          id?: string
          is_best_solution?: boolean
          is_featured?: boolean
          is_reported?: boolean
          is_repost?: boolean | null
          liked_by?: string[]
          likes_count?: number
          original_creator_id?: string | null
          original_reel_id?: string | null
          parent_reel_id?: string | null
          reach_score?: number
          saves_count?: number
          shares_count?: number
          thumbnail_url?: string | null
          title?: string
          total_views?: number
          uploaded_by?: string
          video_quality_multiplier?: number
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "reels_parent_reel_id_fkey"
            columns: ["parent_reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      validation_votes: {
        Row: {
          created_at: string
          id: string
          reel_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          reel_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_votes_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_history: {
        Row: {
          created_at: string
          id: string
          points_awarded: number
          reel_id: string
          user_id: string
          watch_percent: number
        }
        Insert: {
          created_at?: string
          id?: string
          points_awarded?: number
          reel_id: string
          user_id: string
          watch_percent?: number
        }
        Update: {
          created_at?: string
          id?: string
          points_awarded?: number
          reel_id?: string
          user_id?: string
          watch_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "watch_history_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      toggle_like: {
        Args: {
          p_reel_id: string
          p_user_id: string
          p_is_like: boolean
        }
        Returns: undefined
      }
      toggle_follow: {
        Args: {
          p_target_user_id: string
          p_current_user_id: string
          p_is_following: boolean
        }
        Returns: undefined
      }
      award_xp: {
        Args: {
          target_user_id: string
          xp_amount: number
          points_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
