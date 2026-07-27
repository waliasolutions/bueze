/**
 * Zefix (Swiss Commercial Registry) client helpers — SSOT for the browser side.
 * Every call goes through the `zefix-lookup` edge function; the API credentials
 * stay server-side.
 */

import { supabase } from '@/integrations/supabase/client';
import { getCantonFromPostalCode } from '@/lib/cantonPostalCodes';
import { normalizeUid } from '@/lib/validationHelpers';
import { legalFormFromZefix } from '@/config/legalForms';

/** Mirrors the normalized shape returned by supabase/functions/_shared/zefix.ts. */
export interface ZefixCompany {
  uid: string | null;
  name: string;
  legalFormId: number | null;
  legalFormName: string | null;
  status: string | null;
  isActive: boolean;
  legalSeat: string | null;
  street: string | null;
  zip: string | null;
  city: string | null;
  chid: string | null;
  ehraid: number | null;
  registryUrl: string | null;
  fetchedAt: string;
}

/** Profile columns Zefix can fill in — shared by every edit surface. */
export interface ZefixProfileFields {
  company_name: string;
  company_legal_form: string | null;
  uid_number: string | null;
  business_address: string | null;
  business_zip: string | null;
  business_city: string | null;
  business_canton: string | null;
}

/** supabase-js hides the function's own message behind FunctionsHttpError.context. */
async function readFunctionError(error: unknown): Promise<string> {
  const context = (error as { context?: Response })?.context;

  if (context && typeof context.json === 'function') {
    try {
      const body = await context.json();
      if (body?.error) return String(body.error);
    } catch {
      // Body was not JSON - fall through to the generic message.
    }
  }

  return (error instanceof Error && error.message) || 'Zefix-Abfrage fehlgeschlagen';
}

async function invokeZefix<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('zefix-lookup', { body });

  if (error) throw new Error(await readFunctionError(error));
  if (data?.error) throw new Error(data.error);

  return data as T;
}

/**
 * In-memory cache — same query/UID inside the same tab loads instantly and
 * without a spinner flicker. TTL is short enough that Zefix edits still get
 * picked up on the next session. SSOT for browser-side Zefix caching.
 */
const CACHE_TTL_MS = 10 * 60 * 1000;
const searchCache = new Map<string, { at: number; value: ZefixCompany[] }>();
const detailCache = new Map<string, { at: number; value: ZefixCompany | null }>();

const searchKey = (query: string, limit?: number) =>
  `${query.trim().toLowerCase()}::${limit ?? ''}`;

const uidDigitsOnly = (uid: string) => uid.replace(/\D/g, '');

function readCache<T>(map: Map<string, { at: number; value: T }>, key: string): T | undefined {
  const hit = map.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    map.delete(key);
    return undefined;
  }
  return hit.value;
}

function writeCache<T>(map: Map<string, { at: number; value: T }>, key: string, value: T) {
  map.set(key, { at: Date.now(), value });
}

/** Preseed the detail cache with any full record we already hold (e.g. from a search hit). */
function primeDetailFromRecord(company: ZefixCompany | null | undefined) {
  if (!company?.uid) return;
  const key = uidDigitsOnly(company.uid);
  if (!key) return;
  // Only prime when we have enough to answer a detail request — otherwise let
  // the detail call happen so the address gets filled in.
  if (company.street || company.zip || company.city) {
    writeCache(detailCache, key, company);
  }
}

/** Search by company name or UID. Queries shorter than 3 characters are ignored. */
export async function searchZefixCompanies(query: string, limit?: number): Promise<ZefixCompany[]> {
  if (query.trim().length < 3) return [];
  const key = searchKey(query, limit);
  const cached = readCache(searchCache, key);
  if (cached) return cached;

  const data = await invokeZefix<{ companies: ZefixCompany[] }>({ action: 'search', query, limit });
  const companies = data.companies ?? [];
  writeCache(searchCache, key, companies);
  companies.forEach(primeDetailFromRecord);
  return companies;
}

/** Full record for one UID, or null when Zefix does not know it. */
export async function getZefixCompany(uid: string): Promise<ZefixCompany | null> {
  const key = uidDigitsOnly(uid);
  if (key) {
    const cached = readCache(detailCache, key);
    if (cached !== undefined) return cached;
  }

  const data = await invokeZefix<{ company: ZefixCompany | null }>({ action: 'detail', uid });
  const company = data.company ?? null;
  if (key) writeCache(detailCache, key, company);
  return company;
}

/**
 * Re-check the profile's stored UID against Zefix and persist the outcome.
 * The edge function owns `zefix_verified` / `zefix_data`, so this is the only
 * way verification state changes — call it after every save that touches the UID.
 */
export async function syncZefixVerification(
  profileId: string,
): Promise<{ verified: boolean; company: ZefixCompany | null }> {
  return invokeZefix<{ verified: boolean; company: ZefixCompany | null }>({
    action: 'verify',
    profileId,
  });
}

/**
 * Map a Zefix record onto profile columns. The canton is derived from the
 * postal code with the existing SSOT helper, since Zefix does not return one.
 */
export function mapZefixCompanyToProfile(company: ZefixCompany): ZefixProfileFields {
  return {
    company_name: company.name,
    company_legal_form: legalFormFromZefix(company.legalFormName, company.name),
    uid_number: normalizeUid(company.uid),
    business_address: company.street,
    business_zip: company.zip,
    business_city: company.city,
    business_canton: company.zip ? getCantonFromPostalCode(company.zip) : null,
  };
}
