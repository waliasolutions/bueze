export interface ProfileCompletenessInput {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  company_name: string | null;
  bio: string | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  service_areas: string[] | null;
  portfolio_urls: string[] | null;
  logo_url: string | null;
  uid_number: string | null;
  iban: string | null;
}

export interface ProfileCompletenessResult {
  percentage: number;
  requiredComplete: number;
  requiredTotal: number;
  optionalComplete: number;
  optionalTotal: number;
  isComplete: boolean;
  missingRequired: string[];
}

export const calculateProfileCompleteness = (profile: ProfileCompletenessInput): ProfileCompletenessResult => {
  const requirements = [
    { label: 'Vor- und Nachname', completed: !!(profile.first_name && profile.last_name), required: true },
    { label: 'E-Mail-Adresse', completed: !!profile.email, required: true },
    { label: 'Telefonnummer', completed: !!profile.phone_number, required: true },
    { label: 'Profilbeschreibung', completed: !!(profile.bio && profile.bio.length >= 50), required: true },
    { label: 'Servicegebiete', completed: (profile.service_areas?.length ?? 0) > 0, required: true },
    { label: 'Stundensätze', completed: !!(profile.hourly_rate_min && profile.hourly_rate_max), required: false },
    { label: 'Firmenname', completed: !!profile.company_name, required: false },
    { label: 'Logo', completed: !!profile.logo_url, required: false },
    { label: 'Portfolio', completed: (profile.portfolio_urls?.length ?? 0) > 0, required: false },
    { label: 'UID-Nummer', completed: !!profile.uid_number, required: false },
    { label: 'IBAN', completed: !!profile.iban, required: false },
  ];

  const requiredItems = requirements.filter(r => r.required);
  const optionalItems = requirements.filter(r => !r.required);

  const requiredComplete = requiredItems.filter(r => r.completed).length;
  const optionalComplete = optionalItems.filter(r => r.completed).length;

  const totalComplete = requiredComplete + optionalComplete;
  const totalItems = requirements.length;
  const percentage = Math.round((totalComplete / totalItems) * 100);

  const missingRequired = requiredItems
    .filter(r => !r.completed)
    .map(r => r.label);

  return {
    percentage,
    requiredComplete,
    requiredTotal: requiredItems.length,
    optionalComplete,
    optionalTotal: optionalItems.length,
    isComplete: requiredComplete === requiredItems.length,
    missingRequired,
  };
};
