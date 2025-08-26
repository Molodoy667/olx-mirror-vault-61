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
      business_profiles: {
        Row: {
          business_name: string
          business_type: string | null
          created_at: string | null
          description: string | null
          id: string
          user_id: string
          verification_status: string | null
          verified_at: string | null
          website: string | null
        }
        Insert: {
          business_name: string
          business_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          user_id: string
          verification_status?: string | null
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          business_name?: string
          business_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          user_id?: string
          verification_status?: string | null
          verified_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      business_verification_requests: {
        Row: {
          admin_notes: string | null
          business_name: string
          business_type: string | null
          created_at: string
          description: string | null
          documents: Json | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tax_id: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          business_name: string
          business_type?: string | null
          created_at?: string
          description?: string | null
          documents?: Json | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          business_name?: string
          business_type?: string | null
          created_at?: string
          description?: string | null
          documents?: Json | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          name_uk: string
          order_index: number | null
          parent_id: string | null
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          name_uk: string
          order_index?: number | null
          parent_id?: string | null
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_uk?: string
          order_index?: number | null
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          listing_id: string | null
          participant1_id: string
          participant2_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          listing_id?: string | null
          participant1_id: string
          participant2_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          listing_id?: string | null
          participant1_id?: string
          participant2_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_contacts: {
        Row: {
          contact_type: string
          contacted_by: string | null
          created_at: string
          id: string
          listing_id: string
        }
        Insert: {
          contact_type: string
          contacted_by?: string | null
          created_at?: string
          id?: string
          listing_id: string
        }
        Update: {
          contact_type?: string
          contacted_by?: string | null
          created_at?: string
          id?: string
          listing_id?: string
        }
        Relationships: []
      }
      listing_likes: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: []
      }
      listing_stats: {
        Row: {
          contacts_total: number | null
          id: string
          likes_total: number | null
          listing_id: string
          updated_at: string
          views_today: number | null
          views_total: number | null
          views_week: number | null
        }
        Insert: {
          contacts_total?: number | null
          id?: string
          likes_total?: number | null
          listing_id: string
          updated_at?: string
          views_today?: number | null
          views_total?: number | null
          views_week?: number | null
        }
        Update: {
          contacts_total?: number | null
          id?: string
          likes_total?: number | null
          listing_id?: string
          updated_at?: string
          views_today?: number | null
          views_total?: number | null
          views_week?: number | null
        }
        Relationships: []
      }
      listing_views: {
        Row: {
          id: string
          ip_address: string | null
          listing_id: string
          user_agent: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          listing_id: string
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          listing_id?: string
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          auto_repost: boolean | null
          boost_count: number | null
          business_listing: boolean | null
          category_id: string | null
          condition: string | null
          contact_phone: string | null
          contact_preferred: string | null
          created_at: string | null
          currency: string | null
          delivery_options: string[] | null
          description: string | null
          featured_until: string | null
          id: string
          images: string[] | null
          is_promoted: boolean | null
          is_vip: boolean | null
          location: string
          negotiable: boolean | null
          price: number | null
          promoted_at: string | null
          promoted_until: string | null
          promotion_type: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
          views: number | null
          vip_until: string | null
        }
        Insert: {
          auto_repost?: boolean | null
          boost_count?: number | null
          business_listing?: boolean | null
          category_id?: string | null
          condition?: string | null
          contact_phone?: string | null
          contact_preferred?: string | null
          created_at?: string | null
          currency?: string | null
          delivery_options?: string[] | null
          description?: string | null
          featured_until?: string | null
          id?: string
          images?: string[] | null
          is_promoted?: boolean | null
          is_vip?: boolean | null
          location: string
          negotiable?: boolean | null
          price?: number | null
          promoted_at?: string | null
          promoted_until?: string | null
          promotion_type?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          views?: number | null
          vip_until?: string | null
        }
        Update: {
          auto_repost?: boolean | null
          boost_count?: number | null
          business_listing?: boolean | null
          category_id?: string | null
          condition?: string | null
          contact_phone?: string | null
          contact_preferred?: string | null
          created_at?: string | null
          currency?: string | null
          delivery_options?: string[] | null
          description?: string | null
          featured_until?: string | null
          id?: string
          images?: string[] | null
          is_promoted?: boolean | null
          is_vip?: boolean | null
          location?: string
          negotiable?: boolean | null
          price?: number | null
          promoted_at?: string | null
          promoted_until?: string | null
          promotion_type?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views?: number | null
          vip_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          name_uk: string
          parent_id: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          name_uk: string
          parent_id?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          name_uk?: string
          parent_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          listing_id: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          listing_id?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          listing_id?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          changed_at: string
          id: string
          listing_id: string
          new_price: number | null
          old_price: number | null
        }
        Insert: {
          changed_at?: string
          id?: string
          listing_id: string
          new_price?: number | null
          old_price?: number | null
        }
        Update: {
          changed_at?: string
          id?: string
          listing_id?: string
          new_price?: number | null
          old_price?: number | null
        }
        Relationships: []
      }
      price_offers: {
        Row: {
          buyer_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          listing_id: string
          message: string | null
          offered_price: number
          seller_id: string
          status: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          listing_id: string
          message?: string | null
          offered_price: number
          seller_id: string
          status?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          listing_id?: string
          message?: string | null
          offered_price?: number
          seller_id?: string
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          business_description: string | null
          business_name: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          location: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
          username: string | null
          verification_badge: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          business_description?: string | null
          business_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_verified?: boolean | null
          location?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          username?: string | null
          verification_badge?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          business_description?: string | null
          business_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          location?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          username?: string | null
          verification_badge?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          created_at: string
          id: string
          listing_id: string
          question: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string
          id?: string
          listing_id: string
          question: string
          user_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          question?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          listing_id: string
          reason: string
          resolved_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          listing_id: string
          reason: string
          resolved_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          listing_id?: string
          reason?: string
          resolved_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          listing_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          category_id: string | null
          condition: string | null
          created_at: string
          id: string
          last_notification_sent: string | null
          location: string | null
          max_price: number | null
          min_price: number | null
          name: string
          notifications_enabled: boolean | null
          only_promoted: boolean | null
          only_with_photo: boolean | null
          query: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          last_notification_sent?: string | null
          location?: string | null
          max_price?: number | null
          min_price?: number | null
          name: string
          notifications_enabled?: boolean | null
          only_promoted?: boolean | null
          only_with_photo?: boolean | null
          query?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          last_notification_sent?: string | null
          location?: string | null
          max_price?: number | null
          min_price?: number | null
          name?: string
          notifications_enabled?: boolean | null
          only_promoted?: boolean | null
          only_with_photo?: boolean | null
          query?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      search_queries: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          query_text: string
          query_type: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          query_text: string
          query_type?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          query_text?: string
          query_type?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tariff_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          duration_days: number
          id: string
          is_active: boolean
          name: string
          price: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          duration_days: number
          id?: string
          is_active?: boolean
          name: string
          price: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rated_user_id: string
          rater_user_id: string
          rating: number
          transaction_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rated_user_id: string
          rater_user_id: string
          rating: number
          transaction_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rated_user_id?: string
          rater_user_id?: string
          rating?: number
          transaction_id?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          expires_at: string
          id: string
          listing_id: string | null
          payment_amount: number
          payment_currency: string
          started_at: string
          status: string
          tariff_plan_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          expires_at: string
          id?: string
          listing_id?: string | null
          payment_amount: number
          payment_currency?: string
          started_at?: string
          status?: string
          tariff_plan_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          listing_id?: string | null
          payment_amount?: number
          payment_currency?: string
          started_at?: string
          status?: string
          tariff_plan_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_tariff_plan_id_fkey"
            columns: ["tariff_plan_id"]
            isOneToOne: false
            referencedRelation: "tariff_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_stats: {
        Row: {
          active_listings: number | null
          inactive_listings: number | null
          total_categories: number | null
          total_favorites: number | null
          total_messages: number | null
          total_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_notification: {
        Args: {
          p_data?: Json
          p_message?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      get_popular_cities: {
        Args: { limit_count?: number }
        Returns: {
          city_name: string
          search_count: number
        }[]
      }
      has_active_business_subscription: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_moderator: {
        Args: { user_id: string }
        Returns: boolean
      }
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
