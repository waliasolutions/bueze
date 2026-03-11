import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
}

const DEFAULTS: BillingSettings = {
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
};

async function fetchBillingSettings(): Promise<BillingSettings> {
  // Query the anon-readable public view
  const { data, error } = await supabase
    .from('billing_settings_public')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    console.warn('Failed to fetch billing settings, using defaults:', error?.message);
    return DEFAULTS;
  }

  const d = data as Record<string, any>;
  return {
    company_name: d.company_name ?? DEFAULTS.company_name,
    company_legal_name: d.company_legal_name ?? DEFAULTS.company_legal_name,
    company_street: d.company_street ?? DEFAULTS.company_street,
    company_zip: d.company_zip ?? DEFAULTS.company_zip,
    company_city: d.company_city ?? DEFAULTS.company_city,
    company_country: d.company_country ?? DEFAULTS.company_country,
    company_email: d.company_email ?? DEFAULTS.company_email,
    company_phone: d.company_phone ?? DEFAULTS.company_phone,
    company_website: d.company_website ?? DEFAULTS.company_website,
    mwst_number: d.mwst_number ?? null,
    mwst_rate: Number(d.mwst_rate ?? 0),
    mwst_note: d.mwst_note ?? DEFAULTS.mwst_note,
  };
}

export const useBillingSettings = () => {
  return useQuery({
    queryKey: ['billing-settings'],
    queryFn: fetchBillingSettings,
    staleTime: 30 * 60 * 1000, // 30 min cache — billing settings change rarely
    gcTime: 60 * 60 * 1000,
  });
};

export { DEFAULTS as BILLING_DEFAULTS };
