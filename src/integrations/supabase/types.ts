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
      canton_tax_defaults: {
        Row: {
          canton: Database["public"]["Enums"]["swiss_canton"]
          church_tax_rate: number | null
          id: string
          income_tax_rate: number | null
          tax_free_threshold: number | null
          updated_at: string
        }
        Insert: {
          canton: Database["public"]["Enums"]["swiss_canton"]
          church_tax_rate?: number | null
          id?: string
          income_tax_rate?: number | null
          tax_free_threshold?: number | null
          updated_at?: string
        }
        Update: {
          canton?: Database["public"]["Enums"]["swiss_canton"]
          church_tax_rate?: number | null
          id?: string
          income_tax_rate?: number | null
          tax_free_threshold?: number | null
          updated_at?: string
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
      companies: {
        Row: {
          address: string | null
          canton: Database["public"]["Enums"]["swiss_canton"] | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          postal_code: string | null
          standard_work_hours: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          canton?: Database["public"]["Enums"]["swiss_canton"] | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          standard_work_hours?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          canton?: Database["public"]["Enums"]["swiss_canton"] | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          standard_work_hours?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          bank_iban: string | null
          bank_name: string | null
          bank_swift: string | null
          company_id: string
          created_at: string
          id: string
          letterhead_footer: string | null
          letterhead_header: string | null
          logo_url: string | null
          mwst_number: string | null
          pdf_template_settings: Json | null
          signature_name: string | null
          signature_title: string | null
          signature_url: string | null
          uid_number: string | null
          updated_at: string
        }
        Insert: {
          bank_iban?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          company_id: string
          created_at?: string
          id?: string
          letterhead_footer?: string | null
          letterhead_header?: string | null
          logo_url?: string | null
          mwst_number?: string | null
          pdf_template_settings?: Json | null
          signature_name?: string | null
          signature_title?: string | null
          signature_url?: string | null
          uid_number?: string | null
          updated_at?: string
        }
        Update: {
          bank_iban?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          company_id?: string
          created_at?: string
          id?: string
          letterhead_footer?: string | null
          letterhead_header?: string | null
          logo_url?: string | null
          mwst_number?: string | null
          pdf_template_settings?: Json | null
          signature_name?: string | null
          signature_title?: string | null
          signature_url?: string | null
          uid_number?: string | null
          updated_at?: string
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
      documents: {
        Row: {
          created_at: string
          created_by: string | null
          document_type: string
          employee_id: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          period_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_type: string
          employee_id: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          period_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_type?: string
          employee_id?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          period_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_insurance_settings: {
        Row: {
          ahv_rate: number | null
          alv_rate: number | null
          bvg_eligible: boolean | null
          bvg_rate: number | null
          created_at: string
          custom_deductions: Json | null
          employee_id: string
          id: string
          ktg_rate: number | null
          updated_at: string
          uvg_rate: number | null
        }
        Insert: {
          ahv_rate?: number | null
          alv_rate?: number | null
          bvg_eligible?: boolean | null
          bvg_rate?: number | null
          created_at?: string
          custom_deductions?: Json | null
          employee_id: string
          id?: string
          ktg_rate?: number | null
          updated_at?: string
          uvg_rate?: number | null
        }
        Update: {
          ahv_rate?: number | null
          alv_rate?: number | null
          bvg_eligible?: boolean | null
          bvg_rate?: number | null
          created_at?: string
          custom_deductions?: Json | null
          employee_id?: string
          id?: string
          ktg_rate?: number | null
          updated_at?: string
          uvg_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_insurance_settings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_vacation_settings: {
        Row: {
          carry_over_days: number | null
          created_at: string
          employee_id: string
          id: string
          max_carry_over: number | null
          updated_at: string
          vacation_calculation_method: string | null
          vacation_days_per_year: number | null
        }
        Insert: {
          carry_over_days?: number | null
          created_at?: string
          employee_id: string
          id?: string
          max_carry_over?: number | null
          updated_at?: string
          vacation_calculation_method?: string | null
          vacation_days_per_year?: number | null
        }
        Update: {
          carry_over_days?: number | null
          created_at?: string
          employee_id?: string
          id?: string
          max_carry_over?: number | null
          updated_at?: string
          vacation_calculation_method?: string | null
          vacation_days_per_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_vacation_settings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          ahv_number: string | null
          bank_name: string | null
          base_salary: number | null
          canton: Database["public"]["Enums"]["swiss_canton"] | null
          city: string | null
          company_id: string
          country: string | null
          created_at: string
          currency: string | null
          date_of_birth: string | null
          department: string | null
          email: string | null
          employee_number: string | null
          employment_status:
            | Database["public"]["Enums"]["employment_status"]
            | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          end_date: string | null
          first_name: string
          gender: string | null
          iban: string | null
          id: string
          job_title: string | null
          last_name: string
          mobile: string | null
          nationality: string | null
          permit_expiry: string | null
          permit_type: string | null
          phone: string | null
          postal_code: string | null
          probation_end_date: string | null
          salary_period: string | null
          start_date: string | null
          updated_at: string
          user_id: string | null
          weekly_hours: number | null
        }
        Insert: {
          address?: string | null
          ahv_number?: string | null
          bank_name?: string | null
          base_salary?: number | null
          canton?: Database["public"]["Enums"]["swiss_canton"] | null
          city?: string | null
          company_id: string
          country?: string | null
          created_at?: string
          currency?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          employee_number?: string | null
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          end_date?: string | null
          first_name: string
          gender?: string | null
          iban?: string | null
          id?: string
          job_title?: string | null
          last_name: string
          mobile?: string | null
          nationality?: string | null
          permit_expiry?: string | null
          permit_type?: string | null
          phone?: string | null
          postal_code?: string | null
          probation_end_date?: string | null
          salary_period?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string | null
          weekly_hours?: number | null
        }
        Update: {
          address?: string | null
          ahv_number?: string | null
          bank_name?: string | null
          base_salary?: number | null
          canton?: Database["public"]["Enums"]["swiss_canton"] | null
          city?: string | null
          company_id?: string
          country?: string | null
          created_at?: string
          currency?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          employee_number?: string | null
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          end_date?: string | null
          first_name?: string
          gender?: string | null
          iban?: string | null
          id?: string
          job_title?: string | null
          last_name?: string
          mobile?: string | null
          nationality?: string | null
          permit_expiry?: string | null
          permit_type?: string | null
          phone?: string | null
          postal_code?: string | null
          probation_end_date?: string | null
          salary_period?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string | null
          weekly_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      handwerker_profiles: {
        Row: {
          bio: string | null
          business_license: string | null
          categories: Database["public"]["Enums"]["handwerker_category"][]
          created_at: string
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string
          insurance_valid_until: string | null
          is_verified: boolean | null
          languages: string[] | null
          portfolio_urls: string[] | null
          response_time_hours: number | null
          search_text: unknown | null
          service_areas: string[]
          updated_at: string
          user_id: string
          verification_documents: string[] | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          business_license?: string | null
          categories?: Database["public"]["Enums"]["handwerker_category"][]
          created_at?: string
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          insurance_valid_until?: string | null
          is_verified?: boolean | null
          languages?: string[] | null
          portfolio_urls?: string[] | null
          response_time_hours?: number | null
          search_text?: unknown | null
          service_areas?: string[]
          updated_at?: string
          user_id: string
          verification_documents?: string[] | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          business_license?: string | null
          categories?: Database["public"]["Enums"]["handwerker_category"][]
          created_at?: string
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          insurance_valid_until?: string | null
          is_verified?: boolean | null
          languages?: string[] | null
          portfolio_urls?: string[] | null
          response_time_hours?: number | null
          search_text?: unknown | null
          service_areas?: string[]
          updated_at?: string
          user_id?: string
          verification_documents?: string[] | null
          website?: string | null
        }
        Relationships: []
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
          purchased_count: number | null
          quality_score: number | null
          search_text: unknown | null
          status: Database["public"]["Enums"]["lead_status"]
          title: string
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"]
          zip: string
        }
        Insert: {
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
          purchased_count?: number | null
          quality_score?: number | null
          search_text?: unknown | null
          status?: Database["public"]["Enums"]["lead_status"]
          title: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          zip: string
        }
        Update: {
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
          purchased_count?: number | null
          quality_score?: number | null
          search_text?: unknown | null
          status?: Database["public"]["Enums"]["lead_status"]
          title?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          zip?: string
        }
        Relationships: []
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
      organization_admins: {
        Row: {
          company_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payroll_calculations: {
        Row: {
          ahv_deduction: number | null
          alv_deduction: number | null
          base_salary: number
          bonus_amount: number | null
          bvg_deduction: number | null
          created_at: string
          employee_id: string
          gross_salary: number
          id: string
          ktg_deduction: number | null
          net_salary: number
          other_deductions: number | null
          overtime_amount: number | null
          overtime_hours: number | null
          period_id: string
          tax_deduction: number | null
          total_deductions: number
          updated_at: string
          uvg_deduction: number | null
          ytd_deductions: number | null
          ytd_gross: number | null
          ytd_net: number | null
        }
        Insert: {
          ahv_deduction?: number | null
          alv_deduction?: number | null
          base_salary: number
          bonus_amount?: number | null
          bvg_deduction?: number | null
          created_at?: string
          employee_id: string
          gross_salary: number
          id?: string
          ktg_deduction?: number | null
          net_salary: number
          other_deductions?: number | null
          overtime_amount?: number | null
          overtime_hours?: number | null
          period_id: string
          tax_deduction?: number | null
          total_deductions: number
          updated_at?: string
          uvg_deduction?: number | null
          ytd_deductions?: number | null
          ytd_gross?: number | null
          ytd_net?: number | null
        }
        Update: {
          ahv_deduction?: number | null
          alv_deduction?: number | null
          base_salary?: number
          bonus_amount?: number | null
          bvg_deduction?: number | null
          created_at?: string
          employee_id?: string
          gross_salary?: number
          id?: string
          ktg_deduction?: number | null
          net_salary?: number
          other_deductions?: number | null
          overtime_amount?: number | null
          overtime_hours?: number | null
          period_id?: string
          tax_deduction?: number | null
          total_deductions?: number
          updated_at?: string
          uvg_deduction?: number | null
          ytd_deductions?: number | null
          ytd_gross?: number | null
          ytd_net?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_calculations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_calculations_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          company_id: string
          created_at: string
          end_date: string
          id: string
          name: string
          period_type: Database["public"]["Enums"]["payroll_period_type"] | null
          processed_at: string | null
          processed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["payroll_status"] | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          end_date: string
          id?: string
          name: string
          period_type?:
            | Database["public"]["Enums"]["payroll_period_type"]
            | null
          processed_at?: string | null
          processed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["payroll_status"] | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          period_type?:
            | Database["public"]["Enums"]["payroll_period_type"]
            | null
          processed_at?: string | null
          processed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["payroll_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_periods_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          email: string
          first_name: string | null
          full_name: string | null
          hourly_rate: number | null
          id: string
          languages: string[] | null
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
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
          email: string
          first_name?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id: string
          languages?: string[] | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
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
          email?: string
          first_name?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          languages?: string[] | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          verified_level?: number | null
          zip?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          share_token: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          share_token: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          share_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          comment: string | null
          created_at: string
          id: string
          is_public: boolean | null
          lead_id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
          title: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          lead_id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
          title?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          lead_id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
      task_media: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_type: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_media_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          completed_by_name: string | null
          completion_notes: string | null
          created_at: string
          creator_name: string | null
          description: string | null
          id: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by_name?: string | null
          completion_notes?: string | null
          created_at?: string
          creator_name?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by_name?: string | null
          completion_notes?: string | null
          created_at?: string
          creator_name?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          employee_id: string | null
          end_time: string | null
          hourly_rate: number | null
          id: string
          is_billable: boolean | null
          project_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["time_entry_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          employee_id?: string | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          is_billable?: boolean | null
          project_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["time_entry_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          employee_id?: string | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          is_billable?: boolean | null
          project_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["time_entry_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_settings: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          language: string | null
          notification_preferences: Json | null
          signature_url: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          language?: string | null
          notification_preferences?: Json | null
          signature_url?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          language?: string | null
          notification_preferences?: Json | null
          signature_url?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vacation_balances: {
        Row: {
          carried_over_days: number | null
          created_at: string
          employee_id: string
          id: string
          remaining_days: number | null
          total_days: number | null
          updated_at: string
          used_days: number | null
          year: number
        }
        Insert: {
          carried_over_days?: number | null
          created_at?: string
          employee_id: string
          id?: string
          remaining_days?: number | null
          total_days?: number | null
          updated_at?: string
          used_days?: number | null
          year: number
        }
        Update: {
          carried_over_days?: number | null
          created_at?: string
          employee_id?: string
          id?: string
          remaining_days?: number | null
          total_days?: number | null
          updated_at?: string
          used_days?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vacation_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_records: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          days_requested: number
          description: string | null
          employee_id: string
          end_date: string
          id: string
          rejection_reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["vacation_status"] | null
          updated_at: string
          vacation_type: Database["public"]["Enums"]["vacation_type"]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_requested: number
          description?: string | null
          employee_id: string
          end_date: string
          id?: string
          rejection_reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["vacation_status"] | null
          updated_at?: string
          vacation_type: Database["public"]["Enums"]["vacation_type"]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_requested?: number
          description?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          rejection_reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["vacation_status"] | null
          updated_at?: string
          vacation_type?: Database["public"]["Enums"]["vacation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "vacation_records_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacation_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
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
      delete_expired_contact_requests: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_users_with_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          company_assignments: Json
          created_at: string
          email: string
          full_name: string
          role: string
          user_id: string
        }[]
      }
      setup_admin_user: {
        Args: { user_email: string; user_name: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "department_admin" | "user" | "super_admin"
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
      employment_status: "active" | "inactive" | "terminated"
      employment_type: "full_time" | "part_time" | "temporary" | "intern"
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
      lead_status:
        | "draft"
        | "active"
        | "closed"
        | "cancelled"
        | "paused"
        | "completed"
        | "deleted"
      payroll_period_type: "monthly" | "weekly" | "bi_weekly"
      payroll_status: "draft" | "calculated" | "approved" | "paid"
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
      time_entry_status: "draft" | "submitted" | "approved" | "rejected"
      urgency_level: "today" | "this_week" | "this_month" | "planning"
      user_role: "homeowner" | "handwerker" | "admin"
      vacation_status: "pending" | "approved" | "rejected"
      vacation_type: "annual" | "sick" | "maternity" | "paternity" | "unpaid"
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
      app_role: ["admin", "department_admin", "user", "super_admin"],
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
      employment_status: ["active", "inactive", "terminated"],
      employment_type: ["full_time", "part_time", "temporary", "intern"],
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
      payroll_period_type: ["monthly", "weekly", "bi_weekly"],
      payroll_status: ["draft", "calculated", "approved", "paid"],
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
      time_entry_status: ["draft", "submitted", "approved", "rejected"],
      urgency_level: ["today", "this_week", "this_month", "planning"],
      user_role: ["homeowner", "handwerker", "admin"],
      vacation_status: ["pending", "approved", "rejected"],
      vacation_type: ["annual", "sick", "maternity", "paternity", "unpaid"],
    },
  },
} as const
