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
