import { 
  Construction, Layers, Zap, Flame, Droplet, 
  ChefHat, Hammer, Trash2, LucideIcon 
} from 'lucide-react';

export interface MajorCategory {
  id: string;
  slug: string;
  label: string;
  icon: LucideIcon;
  description: string;
  subcategories: string[];
  color: string;
  showOnHome: boolean;
}

export const majorCategories: Record<string, MajorCategory> = {
  bau_renovation: {
    id: 'bau_renovation',
    slug: 'bau-renovation',
    label: 'Bau & Renovation',
    icon: Construction,
    description: 'Hochbau, Umbau, Abbruch und umfassende Renovationsarbeiten',
    subcategories: [
      'metallbau', 'holzbau', 'mauerarbeit', 'betonarbeiten', 
      'fundament', 'kernbohrungen', 'abbruch_durchbruch', 
      'renovierung_sonstige', 'garage_carport', 'aussenarbeiten_sonstige',
      'maurer', 'zimmermann', 'dachdecker', 'fassadenbauer'
    ],
    color: 'from-amber-500 to-orange-600',
    showOnHome: true
  },
  bodenbelaege: {
    id: 'bodenbelaege',
    slug: 'bodenbelaege',
    label: 'Bodenbeläge',
    icon: Layers,
    description: 'Parkett, Laminat, Fliesen und alle Bodenbeläge',
    subcategories: [
      'parkett_laminat', 'teppich_pvc_linoleum', 
      'bodenfliese', 'bodenleger', 'plattenleger', 
      'bodenbelag_sonstige'
    ],
    color: 'from-brown-500 to-brown-700',
    showOnHome: true
  },
  elektroinstallationen: {
    id: 'elektroinstallationen',
    slug: 'elektroinstallationen',
    label: 'Elektroinstallationen',
    icon: Zap,
    description: 'Alle elektrischen Installationen, Reparaturen und Smart Home',
    subcategories: [
      'elektro_hausinstallationen', 'elektro_unterverteilung',
      'elektro_stoerung_notfall', 'elektro_beleuchtung',
      'elektro_geraete_anschliessen', 'elektro_netzwerk_multimedia',
      'elektro_sprechanlage', 'elektro_smart_home',
      'elektro_wallbox', 'elektro_bauprovisorium',
      'elektro_erdung_blitzschutz', 'elektro_sicherheitsnachweis',
      'elektro_zaehler_anmeldung', 'elektro_notstrom',
      'elektro_kleinauftraege', 'elektriker'
    ],
    color: 'from-yellow-500 to-yellow-600',
    showOnHome: true
  },
  heizung_klima_solar: {
    id: 'heizung_klima_solar',
    slug: 'heizung-klima-solar',
    label: 'Heizung, Klima & Solar',
    icon: Flame,
    description: 'Heizungen, Klimaanlagen, Solaranlagen und Energielösungen',
    subcategories: [
      'heizung', 'fussbodenheizung', 'boiler', 
      'klimaanlage_lueftung', 'klimatechnik', 'waermepumpen',
      'cheminee_kamin_ofen', 'solarheizung', 'photovoltaik',
      'batteriespeicher', 'heizung_sonstige'
    ],
    color: 'from-orange-500 to-red-600',
    showOnHome: true
  },
  sanitaer: {
    id: 'sanitaer',
    slug: 'sanitaer',
    label: 'Sanitär',
    icon: Droplet,
    description: 'Badezimmer, Sanitärinstallationen und Reparaturen',
    subcategories: [
      'sanitaer', 'badezimmer', 'badewanne_dusche',
      'klempnerarbeiten', 'badumbau', 'sanitaer_sonstige'
    ],
    color: 'from-blue-500 to-cyan-600',
    showOnHome: true
  },
  kueche: {
    id: 'kueche',
    slug: 'kueche',
    label: 'Küche',
    icon: ChefHat,
    description: 'Küchenplanung, -bau und -renovation',
    subcategories: [
      'kuechenbau', 'kuechenplanung', 'kuechengeraete',
      'arbeitsplatten', 'kueche_sonstige'
    ],
    color: 'from-green-500 to-emerald-600',
    showOnHome: true
  },
  innenausbau_schreiner: {
    id: 'innenausbau_schreiner',
    slug: 'innenausbau-schreiner',
    label: 'Innenausbau & Schreiner',
    icon: Hammer,
    description: 'Möbelbau, Schreinerei und Innenausbau',
    subcategories: [
      'schreiner', 'moebelbau', 'moebelrestauration',
      'holzarbeiten_innen', 'metallarbeiten_innen',
      'treppen', 'innenausbau_sonstige', 'fenster_tueren',
      'maler', 'gipser'
    ],
    color: 'from-purple-500 to-indigo-600',
    showOnHome: false
  },
  raeumung_entsorgung: {
    id: 'raeumung_entsorgung',
    slug: 'raeumung-entsorgung',
    label: 'Räumung & Entsorgung',
    icon: Trash2,
    description: 'Räumungen, Entsorgung und individuelle Anfragen',
    subcategories: [
      'umzug', 'reinigung', 'aufloesung_entsorgung',
      'individuelle_anfrage'
    ],
    color: 'from-gray-500 to-slate-600',
    showOnHome: false
  }
};

export const getMajorCategoryBySubcategory = (subcategory: string): MajorCategory | null => {
  for (const majorCat of Object.values(majorCategories)) {
    if (majorCat.subcategories.includes(subcategory)) {
      return majorCat;
    }
  }
  return null;
};
