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
      agent_notes: {
        Row: {
          agent_name: string
          content: string
          created_at: string | null
          embedding: string | null
          importance: number | null
          note_id: string
          topic: string | null
        }
        Insert: {
          agent_name: string
          content: string
          created_at?: string | null
          embedding?: string | null
          importance?: number | null
          note_id?: string
          topic?: string | null
        }
        Update: {
          agent_name?: string
          content?: string
          created_at?: string | null
          embedding?: string | null
          importance?: number | null
          note_id?: string
          topic?: string | null
        }
        Relationships: []
      }
      creative_patterns: {
        Row: {
          created_at: string | null
          emotion_tags: string[] | null
          hook_text: string | null
          notes: string | null
          observed_performance: Json | null
          pattern_id: string
          product_id: string | null
          structure: string | null
          style_tags: string[] | null
        }
        Insert: {
          created_at?: string | null
          emotion_tags?: string[] | null
          hook_text?: string | null
          notes?: string | null
          observed_performance?: Json | null
          pattern_id?: string
          product_id?: string | null
          structure?: string | null
          style_tags?: string[] | null
        }
        Update: {
          created_at?: string | null
          emotion_tags?: string[] | null
          hook_text?: string | null
          notes?: string | null
          observed_performance?: Json | null
          pattern_id?: string
          product_id?: string | null
          structure?: string | null
          style_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "creative_patterns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      embeddings: {
        Row: {
          created_at: string | null
          embedding: string
          embedding_id: string
          metadata: Json | null
          reference_id: string
          reference_type: string
        }
        Insert: {
          created_at?: string | null
          embedding: string
          embedding_id?: string
          metadata?: Json | null
          reference_id: string
          reference_type: string
        }
        Update: {
          created_at?: string | null
          embedding?: string
          embedding_id?: string
          metadata?: Json | null
          reference_id?: string
          reference_type?: string
        }
        Relationships: []
      }
      experiments: {
        Row: {
          asset_id: string | null
          created_at: string | null
          experiment_id: string
          hypothesis: string | null
          product_id: string | null
          script_id: string | null
          variation_label: string | null
        }
        Insert: {
          asset_id?: string | null
          created_at?: string | null
          experiment_id?: string
          hypothesis?: string | null
          product_id?: string | null
          script_id?: string | null
          variation_label?: string | null
        }
        Update: {
          asset_id?: string | null
          created_at?: string | null
          experiment_id?: string
          hypothesis?: string | null
          product_id?: string | null
          script_id?: string | null
          variation_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "video_assets"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "experiments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "experiments_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["script_id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          collected_at: string | null
          comment_count: number | null
          completion_rate: number | null
          like_count: number | null
          metric_id: string
          post_id: string | null
          share_count: number | null
          view_count: number | null
          watch_time_ms: number | null
        }
        Insert: {
          collected_at?: string | null
          comment_count?: number | null
          completion_rate?: number | null
          like_count?: number | null
          metric_id?: string
          post_id?: string | null
          share_count?: number | null
          view_count?: number | null
          watch_time_ms?: number | null
        }
        Update: {
          collected_at?: string | null
          comment_count?: number | null
          completion_rate?: number | null
          like_count?: number | null
          metric_id?: string
          post_id?: string | null
          share_count?: number | null
          view_count?: number | null
          watch_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "published_posts"
            referencedColumns: ["post_id"]
          },
        ]
      }
      product_creative_contexts: {
        Row: {
          created_at: string | null
          id: string
          pattern_id: string
          product_id: string
          snapshot_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pattern_id: string
          product_id: string
          snapshot_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pattern_id?: string
          product_id?: string
          snapshot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_creative_contexts_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "creative_patterns"
            referencedColumns: ["pattern_id"]
          },
          {
            foreignKeyName: "product_creative_contexts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_creative_contexts_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "trend_snapshots"
            referencedColumns: ["snapshot_id"]
          },
        ]
      }
      products: {
        Row: {
          affiliate_link: string | null
          brand: string | null
          category: string | null
          content_brief: string | null
          created_at: string | null
          currency: string
          demo_ideas: Json
          description: string | null
          image_url: string | null
          key_features: Json
          meta: Json | null
          name: string
          objections: Json
          price_usd: number | null
          primary_benefit: string | null
          product_id: string
          source_platform: string
          status: string
          target_audience: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_link?: string | null
          brand?: string | null
          category?: string | null
          content_brief?: string | null
          created_at?: string | null
          currency?: string
          demo_ideas?: Json
          description?: string | null
          image_url?: string | null
          key_features?: Json
          meta?: Json | null
          name: string
          objections?: Json
          price_usd?: number | null
          primary_benefit?: string | null
          product_id?: string
          source_platform: string
          status?: string
          target_audience?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_link?: string | null
          brand?: string | null
          category?: string | null
          content_brief?: string | null
          created_at?: string | null
          currency?: string
          demo_ideas?: Json
          description?: string | null
          image_url?: string | null
          key_features?: Json
          meta?: Json | null
          name?: string
          objections?: Json
          price_usd?: number | null
          primary_benefit?: string | null
          product_id?: string
          source_platform?: string
          status?: string
          target_audience?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      published_posts: {
        Row: {
          caption: string | null
          correlation_id: string | null
          created_at: string | null
          experiment_id: string | null
          hashtags: string[] | null
          platform: string
          platform_post_id: string | null
          post_id: string
          posted_at: string | null
          workflow_id: string | null
        }
        Insert: {
          caption?: string | null
          correlation_id?: string | null
          created_at?: string | null
          experiment_id?: string | null
          hashtags?: string[] | null
          platform: string
          platform_post_id?: string | null
          post_id?: string
          posted_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          caption?: string | null
          correlation_id?: string | null
          created_at?: string | null
          experiment_id?: string | null
          hashtags?: string[] | null
          platform?: string
          platform_post_id?: string | null
          post_id?: string
          posted_at?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "published_posts_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["experiment_id"]
          },
        ]
      }
      raw_videos: {
        Row: {
          author: string | null
          caption: string | null
          collected_at: string | null
          comment_count: number | null
          created_at: string | null
          external_id: string
          hashtags: string[] | null
          id: string
          like_count: number | null
          platform: string
          share_count: number | null
          view_count: number | null
        }
        Insert: {
          author?: string | null
          caption?: string | null
          collected_at?: string | null
          comment_count?: number | null
          created_at?: string | null
          external_id: string
          hashtags?: string[] | null
          id?: string
          like_count?: number | null
          platform: string
          share_count?: number | null
          view_count?: number | null
        }
        Update: {
          author?: string | null
          caption?: string | null
          collected_at?: string | null
          comment_count?: number | null
          created_at?: string | null
          external_id?: string
          hashtags?: string[] | null
          id?: string
          like_count?: number | null
          platform?: string
          share_count?: number | null
          view_count?: number | null
        }
        Relationships: []
      }
      scripts: {
        Row: {
          created_at: string | null
          creative_pattern_id: string | null
          creative_variables: Json | null
          cta: string | null
          hook: string | null
          outline: string | null
          product_id: string | null
          script_id: string
          script_text: string
          title: string | null
          trend_reference: string | null
        }
        Insert: {
          created_at?: string | null
          creative_pattern_id?: string | null
          creative_variables?: Json | null
          cta?: string | null
          hook?: string | null
          outline?: string | null
          product_id?: string | null
          script_id?: string
          script_text: string
          title?: string | null
          trend_reference?: string | null
        }
        Update: {
          created_at?: string | null
          creative_pattern_id?: string | null
          creative_variables?: Json | null
          cta?: string | null
          hook?: string | null
          outline?: string | null
          product_id?: string | null
          script_id?: string
          script_text?: string
          title?: string | null
          trend_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scripts_creative_pattern_id_fkey"
            columns: ["creative_pattern_id"]
            isOneToOne: false
            referencedRelation: "creative_patterns"
            referencedColumns: ["pattern_id"]
          },
          {
            foreignKeyName: "scripts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "scripts_trend_reference_fkey"
            columns: ["trend_reference"]
            isOneToOne: false
            referencedRelation: "trend_snapshots"
            referencedColumns: ["snapshot_id"]
          },
        ]
      }
      style_templates: {
        Row: {
          colors: Json
          created_at: string | null
          description: string | null
          fonts: Json
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          transitions: Json | null
          updated_at: string | null
        }
        Insert: {
          colors: Json
          created_at?: string | null
          description?: string | null
          fonts: Json
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          transitions?: Json | null
          updated_at?: string | null
        }
        Update: {
          colors?: Json
          created_at?: string | null
          description?: string | null
          fonts?: Json
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          transitions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_events: {
        Row: {
          agent_name: string | null
          correlation_id: string | null
          created_at: string | null
          event_category: string | null
          event_id: string
          event_type: string
          message: string | null
          metadata: Json | null
          payload: Json | null
          severity: string | null
          workflow_id: string | null
        }
        Insert: {
          agent_name?: string | null
          correlation_id?: string | null
          created_at?: string | null
          event_category?: string | null
          event_id?: string
          event_type: string
          message?: string | null
          metadata?: Json | null
          payload?: Json | null
          severity?: string | null
          workflow_id?: string | null
        }
        Update: {
          agent_name?: string | null
          correlation_id?: string | null
          created_at?: string | null
          event_category?: string | null
          event_id?: string
          event_type?: string
          message?: string | null
          metadata?: Json | null
          payload?: Json | null
          severity?: string | null
          workflow_id?: string | null
        }
        Relationships: []
      }
      trend_snapshots: {
        Row: {
          competition_score: number | null
          popularity_score: number | null
          product_id: string
          raw_source_data: Json | null
          snapshot_id: string
          snapshot_time: string | null
          tiktok_trend_tags: string[] | null
          velocity_score: number | null
        }
        Insert: {
          competition_score?: number | null
          popularity_score?: number | null
          product_id: string
          raw_source_data?: Json | null
          snapshot_id?: string
          snapshot_time?: string | null
          tiktok_trend_tags?: string[] | null
          velocity_score?: number | null
        }
        Update: {
          competition_score?: number | null
          popularity_score?: number | null
          product_id?: string
          raw_source_data?: Json | null
          snapshot_id?: string
          snapshot_time?: string | null
          tiktok_trend_tags?: string[] | null
          velocity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trend_snapshots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      video_assets: {
        Row: {
          asset_id: string
          created_at: string | null
          duration_seconds: number | null
          layout: string | null
          metadata: Json | null
          script_id: string | null
          storage_path: string
          style_tags: string[] | null
          thumbnail_path: string | null
          tone: string | null
        }
        Insert: {
          asset_id?: string
          created_at?: string | null
          duration_seconds?: number | null
          layout?: string | null
          metadata?: Json | null
          script_id?: string | null
          storage_path: string
          style_tags?: string[] | null
          thumbnail_path?: string | null
          tone?: string | null
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          duration_seconds?: number | null
          layout?: string | null
          metadata?: Json | null
          script_id?: string | null
          storage_path?: string
          style_tags?: string[] | null
          thumbnail_path?: string | null
          tone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_assets_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["script_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
