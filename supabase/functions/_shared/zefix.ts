/**
 * Zefix Public REST API client — SSOT for every Swiss Commercial Registry call.
 * Docs: https://www.zefix.admin.ch/ZefixPublicREST/
 *
 * Credentials are HTTP Basic and live in the ZEFIX_USERNAME / ZEFIX_PASSWORD
 * function secrets. They must never reach the browser, which is why all Zefix
 * traffic goes through the `zefix-lookup` edge function.
 */

import { uidDigits } from './validation.ts';

const ZEFIX_BASE_URL = 'https://www.zefix.admin.ch/ZefixPublicREST/api/v1';
const ZEFIX_TIMEOUT_MS = 12_000;

/** Normalized company shape returned to the client (also stored in zefix_data). */
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

type Json = Record<string, unknown>;

function authHeader(): string {
  const username = Deno.env.get('ZEFIX_USERNAME');
  const password = Deno.env.get('ZEFIX_PASSWORD');
  if (!username || !password) {
    throw new Error('ZEFIX_USERNAME / ZEFIX_PASSWORD are not configured');
  }
  return `Basic ${btoa(`${username}:${password}`)}`;
}

async function zefixFetch(path: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ZEFIX_TIMEOUT_MS);

  try {
    const response = await fetch(`${ZEFIX_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: authHeader(),
        Accept: 'application/json',
      },
    });

    // Zefix answers 404 for "no such company" — that is an empty result, not a failure.
    if (response.status === 404) return null;

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Zefix ${response.status}: ${body.slice(0, 200)}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/** Zefix returns bare arrays, `{ list: [...] }` or a single object depending on endpoint. */
function toArray(payload: unknown): Json[] {
  if (Array.isArray(payload)) return payload as Json[];
  if (payload && typeof payload === 'object') {
    const list = (payload as Json).list;
    if (Array.isArray(list)) return list as Json[];
    return [payload as Json];
  }
  return [];
}

/** Zefix localizes names as `{ de, fr, it, en }`, but some endpoints send a plain string. */
function localized(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'object') {
    const map = value as Record<string, unknown>;
    for (const key of ['de', 'fr', 'it', 'en']) {
      const candidate = map[key];
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    }
  }
  return null;
}

function text(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number') return String(value);
  return null;
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function formatUid(value: unknown): string | null {
  const digits = uidDigits(text(value));
  return digits ? `CHE-${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}` : null;
}

function mapAddress(raw: Json) {
  const candidate = raw.address ?? (Array.isArray(raw.addresses) ? raw.addresses[0] : null);
  const address = (candidate && typeof candidate === 'object' ? candidate : {}) as Json;

  const street = [text(address.street), text(address.houseNumber)].filter(Boolean).join(' ') || null;

  return {
    street,
    zip: text(address.swissZipCode) ?? text(address.zipCode) ?? text(address.foreignZipCode),
    city: text(address.town) ?? text(address.city),
  };
}

function isDeleted(raw: Json, status: string | null): boolean {
  if (raw.deletionDate || raw.deleteDate) return true;
  return /cancel|delet|gel(oe|ö)sch|radi/i.test(status ?? '');
}

/** Map any Zefix company payload (short search hit or full record) onto ZefixCompany. */
export function mapZefixCompany(raw: Json): ZefixCompany | null {
  const name = localized(raw.name);
  if (!name) return null;

  const legalForm = (raw.legalForm && typeof raw.legalForm === 'object' ? raw.legalForm : {}) as Json;
  const status = text(raw.status);
  const { street, zip, city } = mapAddress(raw);

  return {
    uid: formatUid(raw.uid),
    name,
    legalFormId: num(raw.legalFormId) ?? num(legalForm.id),
    legalFormName: localized(legalForm.name) ?? localized(legalForm.shortName),
    status,
    isActive: !isDeleted(raw, status),
    legalSeat: localized(raw.legalSeat),
    street,
    zip,
    city: city ?? localized(raw.legalSeat),
    chid: text(raw.chid),
    ehraid: num(raw.ehraid),
    registryUrl: text(raw.cantonalExcerptWeb),
    fetchedAt: new Date().toISOString(),
  };
}

/** Look up a single company by Swiss UID. Returns null when the UID is unknown. */
export async function fetchCompanyByUid(uid: string): Promise<ZefixCompany | null> {
  const digits = uidDigits(uid);
  if (!digits) return null;

  const payload = await zefixFetch(`/company/uid/CHE${digits}`);
  const [first] = toArray(payload);
  return first ? mapZefixCompany(first) : null;
}

/**
 * Search companies. A UID-shaped query is resolved directly, anything else is
 * treated as a company name.
 */
export async function searchCompanies(query: string, limit: number): Promise<ZefixCompany[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  if (uidDigits(trimmed)) {
    const company = await fetchCompanyByUid(trimmed);
    return company ? [company] : [];
  }

  const payload = await zefixFetch('/company/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: trimmed,
      languageKey: 'de',
      maxEntries: limit,
      offset: 0,
      activeOnly: true,
    }),
  });

  return toArray(payload)
    .map(mapZefixCompany)
    .filter((company): company is ZefixCompany => company !== null)
    .slice(0, limit);
}
