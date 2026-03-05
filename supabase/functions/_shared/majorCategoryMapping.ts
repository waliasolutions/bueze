/**
 * Major category to subcategory mapping — SSOT for Edge Functions.
 * 
 * This file mirrors the subcategory arrays from src/config/majorCategories.ts.
 * It is a pure data file with no React, Node, or frontend imports — fully Deno-compatible.
 * 
 * IMPORTANT: When updating src/config/majorCategories.ts, update this file too.
 */

export const majorCategorySubcategories: Record<string, string[]> = {
  bau_renovation: [
    'mauerarbeit', 'holzbau', 'metallbau', 'betonarbeiten',
    'fundament', 'kernbohrungen', 'abbruch_durchbruch', 'renovierung_sonstige'
  ],
  bodenbelaege: [
    'parkett_laminat', 'teppich_pvc_linoleum', 'bodenfliese',
    'bodenleger', 'plattenleger', 'bodenbelag_sonstige'
  ],
  elektroinstallationen: [
    'elektro_hausinstallationen', 'elektro_unterverteilung',
    'elektro_stoerung_notfall', 'elektro_beleuchtung',
    'elektro_smart_home', 'elektro_netzwerk_multimedia',
    'elektro_wallbox', 'elektro_sicherheitsnachweis'
  ],
  heizung_klima: [
    'waermepumpen', 'fussbodenheizung', 'boiler',
    'klimaanlage_lueftung', 'cheminee_kamin_ofen',
    'photovoltaik', 'solarheizung', 'heizung_sonstige'
  ],
  sanitaer: [
    'badewanne_dusche', 'badezimmer', 'badumbau',
    'klempnerarbeiten', 'sanitaer', 'sanitaer_sonstige'
  ],
  kueche: [
    'kuechenbau', 'kuechenplanung', 'kuechengeraete',
    'arbeitsplatten', 'kueche_sonstige'
  ],
  innenausbau_schreiner: [
    'schreiner', 'moebelbau', 'fenster_tueren', 'treppen',
    'holzarbeiten_innen', 'metallarbeiten_innen', 'innenausbau_sonstige'
  ],
  raeumung_entsorgung: [
    'aufloesung_entsorgung', 'umzug', 'reinigung', 'reinigung_hauswartung'
  ],
  garten_umgebung: [
    'gartenbau', 'pflasterarbeiten', 'zaun_torbau', 'aussenarbeiten_sonstige'
  ],
  reinigung_hauswartung: [
    'reinigung', 'reinigung_hauswartung'
  ]
};

/**
 * Get the major category key for a given subcategory.
 */
export function getMajorCategoryForSubcategory(subcategory: string): string | null {
  for (const [major, subs] of Object.entries(majorCategorySubcategories)) {
    if (subs.includes(subcategory)) {
      return major;
    }
  }
  return null;
}

/**
 * Check if a handwerker's categories match a lead's category,
 * including major-to-subcategory cross-matching.
 */
export function handwerkerMatchesCategory(handwerkerCategories: string[], leadCategory: string): boolean {
  // Direct match
  if (handwerkerCategories.includes(leadCategory)) return true;

  // Lead category is a major category — check if handwerker has any of its subcategories
  const majorSubs = majorCategorySubcategories[leadCategory];
  if (majorSubs) {
    return handwerkerCategories.some(cat => majorSubs.includes(cat));
  }

  // Lead category is a subcategory — find its major, then check if handwerker has sibling subcategories
  const leadMajor = getMajorCategoryForSubcategory(leadCategory);
  if (leadMajor) {
    const siblingSubcats = majorCategorySubcategories[leadMajor];
    if (siblingSubcats) {
      return handwerkerCategories.some(cat => siblingSubcats.includes(cat));
    }
  }

  return false;
}
