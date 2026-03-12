// Shared company configuration defaults for Edge Functions
// These are fallbacks when billing_settings DB query fails.
// SSOT: billing_settings table is the primary source.

export interface BillingSettings {
  company_name: string;
  company_legal_name: string;
  company_street: string;
  company_zip: string;
  company_city: string;
  company_country: string;
  company_email: string;
  company_phone: string;
  company_website: string;
  mwst_number: string | null;
  mwst_rate: number;
  mwst_note: string;
  mwst_mode: 'none' | 'exclusive';
}

export const DEFAULT_BILLING_SETTINGS: BillingSettings = {
  company_name: 'Büeze.ch',
  company_legal_name: 'Büeze.ch GmbH',
  company_street: 'Industriestrasse 28',
  company_zip: '9487',
  company_city: 'Gamprin-Bendern',
  company_country: 'Liechtenstein',
  company_email: 'info@bueeze.ch',
  company_phone: '+41 41 558 22 33',
  company_website: 'www.bueeze.ch',
  mwst_number: null,
  mwst_rate: 0,
  mwst_note: 'MWST befreit (Liechtenstein)',
  mwst_mode: 'none',
};

/**
 * Fetch billing settings from DB, fallback to defaults on error.
 * DB values take priority; defaults only apply on network/query failure.
 */
export async function fetchBillingSettings(
  supabase: { from: (table: string) => any }
): Promise<BillingSettings> {
  try {
    const { data, error } = await supabase
      .from('billing_settings')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('Failed to fetch billing_settings, using defaults:', error?.message);
      return DEFAULT_BILLING_SETTINGS;
    }

    return {
      company_name: data.company_name ?? DEFAULT_BILLING_SETTINGS.company_name,
      company_legal_name: data.company_legal_name ?? DEFAULT_BILLING_SETTINGS.company_legal_name,
      company_street: data.company_street ?? DEFAULT_BILLING_SETTINGS.company_street,
      company_zip: data.company_zip ?? DEFAULT_BILLING_SETTINGS.company_zip,
      company_city: data.company_city ?? DEFAULT_BILLING_SETTINGS.company_city,
      company_country: data.company_country ?? DEFAULT_BILLING_SETTINGS.company_country,
      company_email: data.company_email ?? DEFAULT_BILLING_SETTINGS.company_email,
      company_phone: data.company_phone ?? DEFAULT_BILLING_SETTINGS.company_phone,
      company_website: data.company_website ?? DEFAULT_BILLING_SETTINGS.company_website,
      mwst_number: data.mwst_number ?? null,
      mwst_rate: Number(data.mwst_rate ?? 0),
      mwst_note: data.mwst_note ?? DEFAULT_BILLING_SETTINGS.mwst_note,
      mwst_mode: (data.mwst_mode === 'exclusive' ? 'exclusive' : 'none') as 'none' | 'exclusive',
    };
  } catch (err) {
    console.error('Error fetching billing_settings:', err);
    return DEFAULT_BILLING_SETTINGS;
  }
}
