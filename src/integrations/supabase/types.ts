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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ab_test_results: {
        Row: {
          confidence_level: number | null
          conversion_rate: number | null
          conversions: number | null
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          start_date: string
          statistical_significance: boolean | null
          suggestion_id: string | null
          test_name: string
          updated_at: string
          variant: string
          visitors: number | null
          winner: string | null
        }
        Insert: {
          confidence_level?: number | null
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date: string
          statistical_significance?: boolean | null
          suggestion_id?: string | null
          test_name: string
          updated_at?: string
          variant: string
          visitors?: number | null
          winner?: string | null
        }
        Update: {
          confidence_level?: number | null
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          statistical_significance?: boolean | null
          suggestion_id?: string | null
          test_name?: string
          updated_at?: string
          variant?: string
          visitors?: number | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_results_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "optimization_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          related_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          related_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      admin_profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          last_login?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clarity_insights: {
        Row: {
          coordinates: Json | null
          created_at: string
          description: string | null
          element_selector: string | null
          element_text: string | null
          id: string
          impact_score: number | null
          insight_type: string
          session_id: string
          severity: string
          status: string | null
          suggested_fix: string | null
          updated_at: string
        }
        Insert: {
          coordinates?: Json | null
          created_at?: string
          description?: string | null
          element_selector?: string | null
          element_text?: string | null
          id?: string
          impact_score?: number | null
          insight_type: string
          session_id: string
          severity?: string
          status?: string | null
          suggested_fix?: string | null
          updated_at?: string
        }
        Update: {
          coordinates?: Json | null
          created_at?: string
          description?: string | null
          element_selector?: string | null
          element_text?: string | null
          id?: string
          impact_score?: number | null
          insight_type?: string
          session_id?: string
          severity?: string
          status?: string | null
          suggested_fix?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clarity_insights_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "clarity_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      clarity_sessions: {
        Row: {
          clicks: number | null
          conversion_value: number | null
          created_at: string
          dead_clicks: number | null
          device_type: string | null
          end_time: string | null
          form_abandonments: number | null
          form_submissions: number | null
          id: string
          page_views: number | null
          project_id: string
          rage_clicks: number | null
          referrer: string | null
          scroll_depth: number | null
          session_duration: number | null
          session_id: string
          start_time: string
          updated_at: string
          url: string
          user_agent: string | null
        }
        Insert: {
          clicks?: number | null
          conversion_value?: number | null
          created_at?: string
          dead_clicks?: number | null
          device_type?: string | null
          end_time?: string | null
          form_abandonments?: number | null
          form_submissions?: number | null
          id?: string
          page_views?: number | null
          project_id: string
          rage_clicks?: number | null
          referrer?: string | null
          scroll_depth?: number | null
          session_duration?: number | null
          session_id: string
          start_time: string
          updated_at?: string
          url: string
          user_agent?: string | null
        }
        Update: {
          clicks?: number | null
          conversion_value?: number | null
          created_at?: string
          dead_clicks?: number | null
          device_type?: string | null
          end_time?: string | null
          form_abandonments?: number | null
          form_submissions?: number | null
          id?: string
          page_views?: number | null
          project_id?: string
          rage_clicks?: number | null
          referrer?: string | null
          scroll_depth?: number | null
          session_duration?: number | null
          session_id?: string
          start_time?: string
          updated_at?: string
          url?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      client_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          country_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_processed: boolean | null
          name: string
          phone: string
          subject: string | null
        }
        Insert: {
          country_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_processed?: boolean | null
          name: string
          phone: string
          subject?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_processed?: boolean | null
          name?: string
          phone?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          handwerker_id: string
          homeowner_id: string
          id: string
          last_message_at: string | null
          lead_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          handwerker_id: string
          homeowner_id: string
          id?: string
          last_message_at?: string | null
          lead_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          handwerker_id?: string
          homeowner_id?: string
          id?: string
          last_message_at?: string | null
          lead_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          address: string | null
          created_at: string | null
          emergency: string
          hotline: string
          id: string
          is_active: boolean | null
          locale: string
          name: string
          opening_hours: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          emergency: string
          hotline: string
          id: string
          is_active?: boolean | null
          locale: string
          name: string
          opening_hours?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          emergency?: string
          hotline?: string
          id?: string
          is_active?: boolean | null
          locale?: string
          name?: string
          opening_hours?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          created_at: string
          email: string
          email_sent: boolean
          first_name: string
          forwarded_at: string | null
          forwarded_to: string | null
          id: string
          last_name: string
          location: string
          notes: string | null
          phone: string
          remarks: string | null
          status: string
          updated_at: string
          visit_date: string
          wohnort: string
        }
        Insert: {
          created_at?: string
          email: string
          email_sent?: boolean
          first_name: string
          forwarded_at?: string | null
          forwarded_to?: string | null
          id?: string
          last_name: string
          location: string
          notes?: string | null
          phone: string
          remarks?: string | null
          status?: string
          updated_at?: string
          visit_date: string
          wohnort: string
        }
        Update: {
          created_at?: string
          email?: string
          email_sent?: boolean
          first_name?: string
          forwarded_at?: string | null
          forwarded_to?: string | null
          id?: string
          last_name?: string
          location?: string
          notes?: string | null
          phone?: string
          remarks?: string | null
          status?: string
          updated_at?: string
          visit_date?: string
          wohnort?: string
        }
        Relationships: []
      }
      handwerker_approval_history: {
        Row: {
          action: string
          admin_email: string
          admin_id: string
          created_at: string
          handwerker_profile_id: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          admin_email: string
          admin_id: string
          created_at?: string
          handwerker_profile_id: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          admin_email?: string
          admin_id?: string
          created_at?: string
          handwerker_profile_id?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handwerker_approval_history_handwerker_profile_id_fkey"
            columns: ["handwerker_profile_id"]
            isOneToOne: false
            referencedRelation: "handwerker_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handwerker_approval_history_handwerker_profile_id_fkey"
            columns: ["handwerker_profile_id"]
            isOneToOne: false
            referencedRelation: "handwerker_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      handwerker_profiles: {
        Row: {
          bank_name: string | null
          bio: string | null
          business_address: string | null
          business_canton: string | null
          business_city: string | null
          business_license: string | null
          business_zip: string | null
          categories: Database["public"]["Enums"]["handwerker_category"][]
          company_legal_form: string | null
          company_name: string | null
          created_at: string
          email: string | null
          first_name: string | null
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          iban: string | null
          id: string
          insurance_valid_until: string | null
          is_verified: boolean | null
          languages: string[] | null
          last_name: string | null
          liability_insurance_policy_number: string | null
          liability_insurance_provider: string | null
          logo_url: string | null
          mwst_number: string | null
          personal_address: string | null
          personal_canton: string | null
          personal_city: string | null
          personal_zip: string | null
          phone_number: string | null
          portfolio_urls: string[] | null
          response_time_hours: number | null
          search_text: unknown
          service_areas: string[]
          tax_id: string | null
          trade_license_number: string | null
          uid_number: string | null
          updated_at: string
          user_id: string | null
          verification_documents: string[] | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          bank_name?: string | null
          bio?: string | null
          business_address?: string | null
          business_canton?: string | null
          business_city?: string | null
          business_license?: string | null
          business_zip?: string | null
          categories?: Database["public"]["Enums"]["handwerker_category"][]
          company_legal_form?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          iban?: string | null
          id?: string
          insurance_valid_until?: string | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_name?: string | null
          liability_insurance_policy_number?: string | null
          liability_insurance_provider?: string | null
          logo_url?: string | null
          mwst_number?: string | null
          personal_address?: string | null
          personal_canton?: string | null
          personal_city?: string | null
          personal_zip?: string | null
          phone_number?: string | null
          portfolio_urls?: string[] | null
          response_time_hours?: number | null
          search_text?: unknown
          service_areas?: string[]
          tax_id?: string | null
          trade_license_number?: string | null
          uid_number?: string | null
          updated_at?: string
          user_id?: string | null
          verification_documents?: string[] | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          bank_name?: string | null
          bio?: string | null
          business_address?: string | null
          business_canton?: string | null
          business_city?: string | null
          business_license?: string | null
          business_zip?: string | null
          categories?: Database["public"]["Enums"]["handwerker_category"][]
          company_legal_form?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          iban?: string | null
          id?: string
          insurance_valid_until?: string | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_name?: string | null
          liability_insurance_policy_number?: string | null
          liability_insurance_provider?: string | null
          logo_url?: string | null
          mwst_number?: string | null
          personal_address?: string | null
          personal_canton?: string | null
          personal_city?: string | null
          personal_zip?: string | null
          phone_number?: string | null
          portfolio_urls?: string[] | null
          response_time_hours?: number | null
          search_text?: unknown
          service_areas?: string[]
          tax_id?: string | null
          trade_license_number?: string | null
          uid_number?: string | null
          updated_at?: string
          user_id?: string | null
          verification_documents?: string[] | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      handwerker_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_type: string
          proposals_limit: number
          proposals_used_this_period: number
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_type?: string
          proposals_limit?: number
          proposals_used_this_period?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_type?: string
          proposals_limit?: number
          proposals_used_this_period?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_proposals: {
        Row: {
          attachments: string[] | null
          client_viewed_at: string | null
          created_at: string
          estimated_duration_days: number | null
          handwerker_id: string
          id: string
          lead_id: string
          message: string
          price_max: number
          price_min: number
          responded_at: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          submitted_at: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          attachments?: string[] | null
          client_viewed_at?: string | null
          created_at?: string
          estimated_duration_days?: number | null
          handwerker_id: string
          id?: string
          lead_id: string
          message: string
          price_max: number
          price_min: number
          responded_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          submitted_at?: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          attachments?: string[] | null
          client_viewed_at?: string | null
          created_at?: string
          estimated_duration_days?: number | null
          handwerker_id?: string
          id?: string
          lead_id?: string
          message?: string
          price_max?: number
          price_min?: number
          responded_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          submitted_at?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_purchases: {
        Row: {
          buyer_id: string
          contacted_at: string | null
          id: string
          lead_id: string
          price: number
          purchased_at: string
          quote_submitted_at: string | null
          request_id: string | null
        }
        Insert: {
          buyer_id: string
          contacted_at?: string | null
          id?: string
          lead_id: string
          price: number
          purchased_at?: string
          quote_submitted_at?: string | null
          request_id?: string | null
        }
        Update: {
          buyer_id?: string
          contacted_at?: string | null
          id?: string
          lead_id?: string
          price?: number
          purchased_at?: string
          quote_submitted_at?: string | null
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_purchases_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_views: {
        Row: {
          id: string
          lead_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          lead_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          lead_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_views_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          accepted_proposal_id: string | null
          address: string | null
          budget_max: number | null
          budget_min: number | null
          budget_type: Database["public"]["Enums"]["budget_type"]
          canton: Database["public"]["Enums"]["canton"]
          category: Database["public"]["Enums"]["handwerker_category"]
          city: string
          created_at: string
          description: string
          expires_at: string | null
          id: string
          lat: number | null
          lng: number | null
          max_purchases: number | null
          media_urls: string[] | null
          owner_id: string
          proposal_deadline: string | null
          proposals_count: number | null
          purchased_count: number | null
          quality_score: number | null
          request_id: string | null
          search_text: unknown
          status: Database["public"]["Enums"]["lead_status"]
          title: string
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"]
          zip: string
        }
        Insert: {
          accepted_proposal_id?: string | null
          address?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: Database["public"]["Enums"]["budget_type"]
          canton: Database["public"]["Enums"]["canton"]
          category: Database["public"]["Enums"]["handwerker_category"]
          city: string
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          max_purchases?: number | null
          media_urls?: string[] | null
          owner_id: string
          proposal_deadline?: string | null
          proposals_count?: number | null
          purchased_count?: number | null
          quality_score?: number | null
          request_id?: string | null
          search_text?: unknown
          status?: Database["public"]["Enums"]["lead_status"]
          title: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          zip: string
        }
        Update: {
          accepted_proposal_id?: string | null
          address?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: Database["public"]["Enums"]["budget_type"]
          canton?: Database["public"]["Enums"]["canton"]
          category?: Database["public"]["Enums"]["handwerker_category"]
          city?: string
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          max_purchases?: number | null
          media_urls?: string[] | null
          owner_id?: string
          proposal_deadline?: string | null
          proposals_count?: number | null
          purchased_count?: number | null
          quality_score?: number | null
          request_id?: string | null
          search_text?: unknown
          status?: Database["public"]["Enums"]["lead_status"]
          title?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_accepted_proposal_id_fkey"
            columns: ["accepted_proposal_id"]
            isOneToOne: false
            referencedRelation: "lead_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_pages: {
        Row: {
          country_id: string
          created_at: string | null
          id: string
          imprint: string
          privacy_policy: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          country_id: string
          created_at?: string | null
          id?: string
          imprint: string
          privacy_policy: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string | null
          id?: string
          imprint?: string
          privacy_policy?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_pages_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: true
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      magic_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          token: string
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          token: string
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          token?: string
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: string[] | null
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          lead_id: string
          message_type: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          attachments?: string[] | null
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          lead_id: string
          message_type?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          attachments?: string[] | null
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          message_type?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_suggestions: {
        Row: {
          based_on_insights: string[] | null
          created_at: string
          description: string
          estimated_conversion_lift: number | null
          expected_impact: string | null
          id: string
          implementation_code: string | null
          implementation_effort: string | null
          priority_score: number | null
          status: string | null
          suggestion_type: string
          test_hypothesis: string | null
          title: string
          updated_at: string
        }
        Insert: {
          based_on_insights?: string[] | null
          created_at?: string
          description: string
          estimated_conversion_lift?: number | null
          expected_impact?: string | null
          id?: string
          implementation_code?: string | null
          implementation_effort?: string | null
          priority_score?: number | null
          status?: string | null
          suggestion_type: string
          test_hypothesis?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          based_on_insights?: string[] | null
          created_at?: string
          description?: string
          estimated_conversion_lift?: number | null
          expected_impact?: string | null
          id?: string
          implementation_code?: string | null
          implementation_effort?: string | null
          priority_score?: number | null
          status?: string | null
          suggestion_type?: string
          test_hypothesis?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content_type: string
          created_at: string | null
          fields: Json
          id: string
          page_key: string
          page_type: string | null
          seo: Json | null
          status: string
          updated_at: string | null
          updated_by: string | null
          url: string | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          fields?: Json
          id?: string
          page_key: string
          page_type?: string | null
          seo?: Json | null
          status?: string
          updated_at?: string | null
          updated_by?: string | null
          url?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          fields?: Json
          id?: string
          page_key?: string
          page_type?: string | null
          seo?: Json | null
          status?: string
          updated_at?: string | null
          updated_by?: string | null
          url?: string | null
        }
        Relationships: []
      }
      pmax_analytics: {
        Row: {
          avg_session_duration: number | null
          campaign_id: string | null
          clarity_session_count: number | null
          clicks: number | null
          conversion_value: number | null
          conversions: number | null
          cost: number | null
          cpa: number | null
          cpc: number | null
          created_at: string
          ctr: number | null
          date: string
          form_completion_rate: number | null
          id: string
          impressions: number | null
          mobile_issues_count: number | null
          traffic_quality_score: number | null
          updated_at: string
        }
        Insert: {
          avg_session_duration?: number | null
          campaign_id?: string | null
          clarity_session_count?: number | null
          clicks?: number | null
          conversion_value?: number | null
          conversions?: number | null
          cost?: number | null
          cpa?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date: string
          form_completion_rate?: number | null
          id?: string
          impressions?: number | null
          mobile_issues_count?: number | null
          traffic_quality_score?: number | null
          updated_at?: string
        }
        Update: {
          avg_session_duration?: number | null
          campaign_id?: string | null
          clarity_session_count?: number | null
          clicks?: number | null
          conversion_value?: number | null
          conversions?: number | null
          cost?: number | null
          cpa?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          form_completion_rate?: number | null
          id?: string
          impressions?: number | null
          mobile_issues_count?: number | null
          traffic_quality_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          canton: Database["public"]["Enums"]["canton"] | null
          city: string | null
          company_name: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          first_name: string | null
          full_name: string | null
          hourly_rate: number | null
          id: string
          languages: string[] | null
          last_name: string | null
          phone: string | null
          updated_at: string
          verified_level: number | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          canton?: Database["public"]["Enums"]["canton"] | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          first_name?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id: string
          languages?: string[] | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          verified_level?: number | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          canton?: Database["public"]["Enums"]["canton"] | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          first_name?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          languages?: string[] | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          verified_level?: number | null
          zip?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: string
          country_id: string
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          priority: number | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          category?: string
          country_id: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          priority?: number | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          category?: string
          country_id?: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          priority?: number | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          cleanliness_rating: number | null
          comment: string | null
          communication_rating: number | null
          created_at: string
          handwerker_response: string | null
          id: string
          is_public: boolean | null
          is_verified: boolean | null
          lead_id: string
          punctuality_rating: number | null
          quality_rating: number | null
          rating: number
          response_at: string | null
          reviewed_id: string
          reviewer_id: string
          title: string | null
          value_rating: number | null
          would_recommend: boolean | null
        }
        Insert: {
          cleanliness_rating?: number | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          handwerker_response?: string | null
          id?: string
          is_public?: boolean | null
          is_verified?: boolean | null
          lead_id: string
          punctuality_rating?: number | null
          quality_rating?: number | null
          rating: number
          response_at?: string | null
          reviewed_id: string
          reviewer_id: string
          title?: string | null
          value_rating?: number | null
          would_recommend?: boolean | null
        }
        Update: {
          cleanliness_rating?: number | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          handwerker_response?: string | null
          id?: string
          is_public?: boolean | null
          is_verified?: boolean | null
          lead_id?: string
          punctuality_rating?: number | null
          quality_rating?: number | null
          rating?: number
          response_at?: string | null
          reviewed_id?: string
          reviewer_id?: string
          title?: string | null
          value_rating?: number | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      site_seo_settings: {
        Row: {
          default_meta_description: string | null
          default_meta_title: string | null
          default_og_image: string | null
          google_analytics_id: string | null
          google_search_console_verification: string | null
          gtm_container_id: string | null
          id: string
          robots_txt: string
          site_name: string | null
          sitemap_last_generated: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          default_meta_description?: string | null
          default_meta_title?: string | null
          default_og_image?: string | null
          google_analytics_id?: string | null
          google_search_console_verification?: string | null
          gtm_container_id?: string | null
          id?: string
          robots_txt?: string
          site_name?: string | null
          sitemap_last_generated?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          default_meta_description?: string | null
          default_meta_title?: string | null
          default_og_image?: string | null
          google_analytics_id?: string | null
          google_search_console_verification?: string | null
          gtm_container_id?: string | null
          id?: string
          robots_txt?: string
          site_name?: string | null
          sitemap_last_generated?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      snippets: {
        Row: {
          country_id: string
          created_at: string | null
          id: string
          image_url: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
        }
        Insert: {
          country_id: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: string
        }
        Update: {
          country_id?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "snippets_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          extra_lead_price: number
          id: string
          included_leads: number
          max_views: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: string
          updated_at: string
          used_leads: number | null
          used_views: number
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string
          current_period_end: string
          current_period_start?: string
          extra_lead_price?: number
          id?: string
          included_leads?: number
          max_views?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          updated_at?: string
          used_leads?: number | null
          used_views?: number
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          extra_lead_price?: number
          id?: string
          included_leads?: number
          max_views?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          updated_at?: string
          used_leads?: number | null
          used_views?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      handwerker_profiles_public: {
        Row: {
          bio: string | null
          business_canton: string | null
          business_city: string | null
          business_zip: string | null
          categories:
            | Database["public"]["Enums"]["handwerker_category"][]
            | null
          company_legal_form: string | null
          company_name: string | null
          created_at: string | null
          first_name: string | null
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string | null
          is_verified: boolean | null
          languages: string[] | null
          last_name: string | null
          logo_url: string | null
          portfolio_urls: string[] | null
          response_time_hours: number | null
          search_text: unknown
          service_areas: string[] | null
          updated_at: string | null
          user_id: string | null
          verification_status: string | null
          verified_at: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          business_canton?: string | null
          business_city?: string | null
          business_zip?: string | null
          categories?:
            | Database["public"]["Enums"]["handwerker_category"][]
            | null
          company_legal_form?: string | null
          company_name?: string | null
          created_at?: string | null
          first_name?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_name?: string | null
          logo_url?: string | null
          portfolio_urls?: string[] | null
          response_time_hours?: number | null
          search_text?: unknown
          service_areas?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string | null
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          business_canton?: string | null
          business_city?: string | null
          business_zip?: string | null
          categories?:
            | Database["public"]["Enums"]["handwerker_category"][]
            | null
          company_legal_form?: string | null
          company_name?: string | null
          created_at?: string | null
          first_name?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_name?: string | null
          logo_url?: string | null
          portfolio_urls?: string[] | null
          response_time_hours?: number | null
          search_text?: unknown
          service_areas?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string | null
          verified_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      handwerker_rating_stats: {
        Row: {
          average_rating: number | null
          review_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      budget_ranges_overlap: {
        Args: {
          lead_max: number
          lead_min: number
          search_max: number
          search_min: number
        }
        Returns: boolean
      }
      can_submit_proposal: {
        Args: { handwerker_user_id: string }
        Returns: boolean
      }
      delete_expired_contact_requests: { Args: never; Returns: undefined }
      delete_expired_magic_tokens: { Args: never; Returns: undefined }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_users_with_roles: {
        Args: never
        Returns: {
          company_assignments: Json
          created_at: string
          email: string
          full_name: string
          role: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      setup_admin_user: {
        Args: { user_email: string; user_name: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "department_admin"
        | "user"
        | "super_admin"
        | "handwerker"
        | "client"
      budget_type: "fixed" | "hourly" | "estimate"
      canton:
        | "AG"
        | "AI"
        | "AR"
        | "BE"
        | "BL"
        | "BS"
        | "FR"
        | "GE"
        | "GL"
        | "GR"
        | "JU"
        | "LU"
        | "NE"
        | "NW"
        | "OW"
        | "SG"
        | "SH"
        | "SO"
        | "SZ"
        | "TG"
        | "TI"
        | "UR"
        | "VD"
        | "VS"
        | "ZG"
        | "ZH"
      handwerker_category:
        | "elektriker"
        | "sanitaer"
        | "heizung"
        | "klimatechnik"
        | "maler"
        | "gipser"
        | "bodenleger"
        | "plattenleger"
        | "schreiner"
        | "maurer"
        | "zimmermann"
        | "dachdecker"
        | "fassadenbauer"
        | "gartenbau"
        | "pflasterarbeiten"
        | "zaun_torbau"
        | "fenster_tueren"
        | "kuechenbau"
        | "badumbau"
        | "umzug"
        | "reinigung"
        | "schlosserei"
        | "spengler"
        | "metallbau"
        | "holzbau"
        | "mauerarbeit"
        | "betonarbeiten"
        | "fundament"
        | "kernbohrungen"
        | "abbruch_durchbruch"
        | "renovierung_sonstige"
        | "garage_carport"
        | "aussenarbeiten_sonstige"
        | "parkett_laminat"
        | "teppich_pvc_linoleum"
        | "bodenfliese"
        | "bodenbelag_sonstige"
        | "elektro_hausinstallationen"
        | "elektro_unterverteilung"
        | "elektro_stoerung_notfall"
        | "elektro_beleuchtung"
        | "elektro_geraete_anschliessen"
        | "elektro_netzwerk_multimedia"
        | "elektro_sprechanlage"
        | "elektro_smart_home"
        | "elektro_wallbox"
        | "elektro_bauprovisorium"
        | "elektro_erdung_blitzschutz"
        | "elektro_sicherheitsnachweis"
        | "elektro_zaehler_anmeldung"
        | "elektro_notstrom"
        | "elektro_kleinauftraege"
        | "fussbodenheizung"
        | "boiler"
        | "klimaanlage_lueftung"
        | "waermepumpen"
        | "cheminee_kamin_ofen"
        | "solarheizung"
        | "photovoltaik"
        | "batteriespeicher"
        | "heizung_sonstige"
        | "badezimmer"
        | "badewanne_dusche"
        | "klempnerarbeiten"
        | "sanitaer_sonstige"
        | "kuechenplanung"
        | "kuechengeraete"
        | "arbeitsplatten"
        | "kueche_sonstige"
        | "moebelbau"
        | "moebelrestauration"
        | "holzarbeiten_innen"
        | "metallarbeiten_innen"
        | "treppen"
        | "innenausbau_sonstige"
        | "aufloesung_entsorgung"
        | "individuelle_anfrage"
        | "bau_renovation"
        | "elektroinstallationen"
        | "heizung_klima"
        | "innenausbau_schreiner"
        | "bodenbelaege"
        | "kueche"
        | "garten_umgebung"
        | "reinigung_hauswartung"
        | "raeumung_entsorgung"
      lead_status:
        | "draft"
        | "active"
        | "closed"
        | "cancelled"
        | "paused"
        | "completed"
        | "deleted"
      proposal_status: "pending" | "accepted" | "rejected" | "withdrawn"
      subscription_plan:
        | "starter"
        | "professional"
        | "enterprise"
        | "free"
        | "monthly"
        | "6_month"
        | "annual"
      swiss_canton:
        | "AG"
        | "AI"
        | "AR"
        | "BE"
        | "BL"
        | "BS"
        | "FR"
        | "GE"
        | "GL"
        | "GR"
        | "JU"
        | "LU"
        | "NE"
        | "NW"
        | "OW"
        | "SG"
        | "SH"
        | "SO"
        | "SZ"
        | "TG"
        | "TI"
        | "UR"
        | "VD"
        | "VS"
        | "ZG"
        | "ZH"
      urgency_level: "today" | "this_week" | "this_month" | "planning"
      user_role: "homeowner" | "handwerker" | "admin"
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
      app_role: [
        "admin",
        "department_admin",
        "user",
        "super_admin",
        "handwerker",
        "client",
      ],
      budget_type: ["fixed", "hourly", "estimate"],
      canton: [
        "AG",
        "AI",
        "AR",
        "BE",
        "BL",
        "BS",
        "FR",
        "GE",
        "GL",
        "GR",
        "JU",
        "LU",
        "NE",
        "NW",
        "OW",
        "SG",
        "SH",
        "SO",
        "SZ",
        "TG",
        "TI",
        "UR",
        "VD",
        "VS",
        "ZG",
        "ZH",
      ],
      handwerker_category: [
        "elektriker",
        "sanitaer",
        "heizung",
        "klimatechnik",
        "maler",
        "gipser",
        "bodenleger",
        "plattenleger",
        "schreiner",
        "maurer",
        "zimmermann",
        "dachdecker",
        "fassadenbauer",
        "gartenbau",
        "pflasterarbeiten",
        "zaun_torbau",
        "fenster_tueren",
        "kuechenbau",
        "badumbau",
        "umzug",
        "reinigung",
        "schlosserei",
        "spengler",
        "metallbau",
        "holzbau",
        "mauerarbeit",
        "betonarbeiten",
        "fundament",
        "kernbohrungen",
        "abbruch_durchbruch",
        "renovierung_sonstige",
        "garage_carport",
        "aussenarbeiten_sonstige",
        "parkett_laminat",
        "teppich_pvc_linoleum",
        "bodenfliese",
        "bodenbelag_sonstige",
        "elektro_hausinstallationen",
        "elektro_unterverteilung",
        "elektro_stoerung_notfall",
        "elektro_beleuchtung",
        "elektro_geraete_anschliessen",
        "elektro_netzwerk_multimedia",
        "elektro_sprechanlage",
        "elektro_smart_home",
        "elektro_wallbox",
        "elektro_bauprovisorium",
        "elektro_erdung_blitzschutz",
        "elektro_sicherheitsnachweis",
        "elektro_zaehler_anmeldung",
        "elektro_notstrom",
        "elektro_kleinauftraege",
        "fussbodenheizung",
        "boiler",
        "klimaanlage_lueftung",
        "waermepumpen",
        "cheminee_kamin_ofen",
        "solarheizung",
        "photovoltaik",
        "batteriespeicher",
        "heizung_sonstige",
        "badezimmer",
        "badewanne_dusche",
        "klempnerarbeiten",
        "sanitaer_sonstige",
        "kuechenplanung",
        "kuechengeraete",
        "arbeitsplatten",
        "kueche_sonstige",
        "moebelbau",
        "moebelrestauration",
        "holzarbeiten_innen",
        "metallarbeiten_innen",
        "treppen",
        "innenausbau_sonstige",
        "aufloesung_entsorgung",
        "individuelle_anfrage",
        "bau_renovation",
        "elektroinstallationen",
        "heizung_klima",
        "innenausbau_schreiner",
        "bodenbelaege",
        "kueche",
        "garten_umgebung",
        "reinigung_hauswartung",
        "raeumung_entsorgung",
      ],
      lead_status: [
        "draft",
        "active",
        "closed",
        "cancelled",
        "paused",
        "completed",
        "deleted",
      ],
      proposal_status: ["pending", "accepted", "rejected", "withdrawn"],
      subscription_plan: [
        "starter",
        "professional",
        "enterprise",
        "free",
        "monthly",
        "6_month",
        "annual",
      ],
      swiss_canton: [
        "AG",
        "AI",
        "AR",
        "BE",
        "BL",
        "BS",
        "FR",
        "GE",
        "GL",
        "GR",
        "JU",
        "LU",
        "NE",
        "NW",
        "OW",
        "SG",
        "SH",
        "SO",
        "SZ",
        "TG",
        "TI",
        "UR",
        "VD",
        "VS",
        "ZG",
        "ZH",
      ],
      urgency_level: ["today", "this_week", "this_month", "planning"],
      user_role: ["homeowner", "handwerker", "admin"],
    },
  },
} as const
