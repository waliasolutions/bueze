/**
 * Column projections for list queries (SSOT).
 *
 * Every list view must select only the columns it renders — `select('*')` pulls
 * heavy columns (search_text tsvector, jsonb blobs, long text) over the wire on
 * every page visit. Keep these strings in sync with the matching interfaces in
 * `src/types/entities.ts`.
 */

/** Matches `LeadListItem` in src/types/entities.ts */
export const LEAD_LIST_SELECT =
  'id, title, description, category, budget_min, budget_max, budget_type, urgency, canton, zip, city, address, created_at, purchased_count, max_purchases, quality_score, status, proposals_count, owner_id, accepted_proposal_id, media_urls, proposal_deadline, delivered_at';

/** Matches `ProposalListItem` (without the joined lead) */
export const PROPOSAL_LIST_SELECT =
  'id, lead_id, handwerker_id, price_min, price_max, estimated_duration_days, status, submitted_at, responded_at, message, view_count, client_viewed_at, attachments';

/** Matches the `Handwerker` interface used by the admin management list */
export const HANDWERKER_ADMIN_LIST_SELECT =
  'id, user_id, first_name, last_name, email, phone_number, company_name, company_legal_form, zefix_verified, categories, service_areas, verification_status, is_verified, created_at, bio, hourly_rate_min, hourly_rate_max, logo_url, uid_number, iban, portfolio_urls, business_canton, business_city, business_address, business_zip';

/**
 * Matches `HandwerkerProfile` in src/types/entities.ts — the full own-profile
 * view used by the handwerker dashboard. Deliberately omits `search_text`
 * (tsvector) and `zefix_data` (jsonb blob), which no UI renders.
 */
export const HANDWERKER_PROFILE_SELECT =
  'id, user_id, first_name, last_name, email, phone_number, company_name, company_legal_form, bio, website, logo_url, categories, service_areas, languages, hourly_rate_min, hourly_rate_max, response_time_hours, business_address, business_zip, business_city, business_canton, personal_address, personal_zip, personal_city, personal_canton, uid_number, mwst_number, business_license, trade_license_number, tax_id, iban, bank_name, liability_insurance_provider, liability_insurance_policy_number, insurance_valid_until, is_verified, verification_status, verification_notes, verification_documents, verified_at, verified_by, portfolio_urls, zefix_verified, created_at, updated_at';

/** Minimal projection for "does this user have an (approved) handwerker profile?" checks */
export const HANDWERKER_STATUS_SELECT = 'id, verification_status, is_verified';

/** Matches `UserProfile` in src/types/entities.ts */
export const USER_PROFILE_SELECT =
  'id, email, full_name, first_name, last_name, phone, avatar_url, company_name, address, zip, city, canton, languages, date_of_birth, hourly_rate, verified_level, client_type, created_at, updated_at';

/** Matches `UserProfileBasic` — header/dropdown usage only */
export const USER_PROFILE_BASIC_SELECT =
  'id, email, full_name, first_name, last_name, avatar_url, phone';

/** Subscription fields needed for quota/status display */
export const HANDWERKER_SUBSCRIPTION_SELECT =
  'id, plan_type, status, proposals_used_this_period, proposals_limit, current_period_start, current_period_end, auto_renew, pending_plan';

