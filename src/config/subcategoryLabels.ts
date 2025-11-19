export interface SubcategoryInfo {
  value: string;
  label: string;
  slug: string;
  shortDescription: string;
  majorCategoryId: string;
  keywords: string[];
}

export const subcategoryLabels: Record<string, SubcategoryInfo> = {
  // ============================================
  // NEW MERGED SUBCATEGORIES (max 8 per category)
  // ============================================
  
  // Bau & Renovation (merged entries)
  bau_hochbau_rohbau: {
    value: 'bau_hochbau_rohbau',
    label: 'Hochbau & Rohbau',
    slug: 'hochbau-rohbau',
    shortDescription: 'Fundamente, Mauern, Beton',
    majorCategoryId: 'bau_renovation',
    keywords: ['Hochbau', 'Rohbau', 'Fundament', 'Mauerarbeit', 'Betonarbeiten', 'Fundament']
  },
  bau_holzbau_zimmerei: {
    value: 'bau_holzbau_zimmerei',
    label: 'Holzbau & Zimmerei',
    slug: 'holzbau-zimmerei',
    shortDescription: 'Dachstühle, Holzkonstruktionen',
    majorCategoryId: 'bau_renovation',
    keywords: ['Holzbau', 'Zimmermann', 'Dachstuhl', 'Holzkonstruktion', 'Zimmerei']
  },
  bau_dacharbeiten: {
    value: 'bau_dacharbeiten',
    label: 'Dacharbeiten',
    slug: 'dacharbeiten',
    shortDescription: 'Dach neu, Reparatur, Isolation',
    majorCategoryId: 'bau_renovation',
    keywords: ['Dachdecker', 'Dach', 'Dachziegel', 'Dachreparatur', 'Dachisolation']
  },
  bau_fassadenarbeiten: {
    value: 'bau_fassadenarbeiten',
    label: 'Fassadenarbeiten',
    slug: 'fassadenarbeiten',
    shortDescription: 'Fassade, Verkleidung, Sanierung',
    majorCategoryId: 'bau_renovation',
    keywords: ['Fassade', 'Fassadenbauer', 'Fassadensanierung', 'Verputz', 'WDVS']
  },
  bau_abbruch_durchbrueche: {
    value: 'bau_abbruch_durchbrueche',
    label: 'Abbruch & Durchbrüche',
    slug: 'abbruch-durchbrueche',
    shortDescription: 'Abbruch, Kernbohrungen',
    majorCategoryId: 'bau_renovation',
    keywords: ['Abbruch', 'Durchbruch', 'Kernbohrung', 'Demontage', 'Mauerwerk']
  },
  bau_renovierung_umbau: {
    value: 'bau_renovierung_umbau',
    label: 'Renovierung & Umbau',
    slug: 'renovierung-umbau',
    shortDescription: 'Umbau, Sanierung, Garage',
    majorCategoryId: 'bau_renovation',
    keywords: ['Renovation', 'Umbau', 'Sanierung', 'Betonsanierung', 'Garage', 'Carport']
  },
  bau_sonstige: {
    value: 'bau_sonstige',
    label: 'Sonstige Bauarbeiten',
    slug: 'sonstige-bauarbeiten',
    shortDescription: 'Weitere Bauarbeiten',
    majorCategoryId: 'bau_renovation',
    keywords: ['Bau', 'Bauarbeiten', 'Sonstige']
  },

  // Elektroinstallationen (merged entries)
  elektro_beleuchtung_geraete: {
    value: 'elektro_beleuchtung_geraete',
    label: 'Beleuchtung & Geräte',
    slug: 'beleuchtung-geraete',
    shortDescription: 'LED, Leuchten, Küchengeräte',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Beleuchtung', 'LED', 'Spots', 'Kochfeld', 'Backofen', 'Geschirrspüler', 'Geräte anschliessen']
  },
  elektro_smart_home_netzwerk: {
    value: 'elektro_smart_home_netzwerk',
    label: 'Smart Home & Netzwerk',
    slug: 'smart-home-netzwerk',
    shortDescription: 'KNX, WLAN, Sprechanlage',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Smart Home', 'KNX', 'Loxone', 'Netzwerk', 'WLAN', 'LAN', 'Sprechanlage', 'Automation']
  },
  elektro_pruefung_sicherheit: {
    value: 'elektro_pruefung_sicherheit',
    label: 'Prüfung & Sicherheit',
    slug: 'pruefung-sicherheit',
    shortDescription: 'Kontrollen, Erdung, Blitzschutz',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Kontrolle', 'Prüfung', 'Sicherheit', 'NIV', 'SiNa', 'Erdung', 'Blitzschutz', 'Überspannungsschutz']
  },
  elektro_sonstige: {
    value: 'elektro_sonstige',
    label: 'Sonstige Elektroarbeiten',
    slug: 'sonstige-elektroarbeiten',
    shortDescription: 'Weitere Elektroarbeiten',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Elektriker', 'Elektro', 'Sonstige']
  },

  // Innenausbau & Schreiner (merged entries)
  innenausbau_moebelbau: {
    value: 'innenausbau_moebelbau',
    label: 'Möbelbau',
    slug: 'moebelbau',
    shortDescription: 'Massanfertigung, Restauration',
    majorCategoryId: 'innenausbau',
    keywords: ['Möbel', 'Massanfertigung', 'Restauration', 'Schreiner']
  },
  innenausbau_holz_metall: {
    value: 'innenausbau_holz_metall',
    label: 'Innenausbau (Holz/Metall)',
    slug: 'innenausbau-holz-metall',
    shortDescription: 'Holz- und Metallarbeiten',
    majorCategoryId: 'innenausbau',
    keywords: ['Holzarbeiten', 'Metallarbeiten', 'Innenausbau']
  },

  // Räumung & Entsorgung (add sonstige)
  raeumung_sonstige: {
    value: 'raeumung_sonstige',
    label: 'Sonstige Dienstleistungen',
    slug: 'sonstige-dienstleistungen',
    shortDescription: 'Weitere Dienstleistungen',
    majorCategoryId: 'raeumung_entsorgung',
    keywords: ['Räumung', 'Entsorgung', 'Sonstige']
  },

  // ============================================
  // EXISTING SUBCATEGORIES (kept for backward compatibility)
  // ============================================
  
  // Elektroinstallationen (15 subcategories)
  elektro_hausinstallationen: {
    value: 'elektro_hausinstallationen',
    label: 'Hausinstallationen (Neu-/Umbau)',
    slug: 'elektro-hausinstallationen',
    shortDescription: 'Steckdosen, Schalter, Leitungen',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Elektroinstallation', 'Steckdosen', 'Schalter', 'Leitungen', 'Kabelzug', 'Baustrom', 'Bauprovisorium']
  },
  elektro_unterverteilung: {
    value: 'elektro_unterverteilung',
    label: 'Sicherungskasten & Unterverteilung',
    slug: 'elektro-unterverteilung',
    shortDescription: 'Sicherungskasten erweitern',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Sicherungskasten', 'Verteiler', 'FI', 'RCD', 'LS', 'Tableau']
  },
  elektro_stoerung_notfall: {
    value: 'elektro_stoerung_notfall',
    label: 'Fehlersuche & Störungsbehebung',
    slug: 'elektro-stoerung-notfall',
    shortDescription: 'Störung beheben, 24h Notfall',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Notfall', 'Störung', 'Stromausfall', 'Kurzschluss', '24h']
  },
  elektro_beleuchtung: {
    value: 'elektro_beleuchtung',
    label: 'Beleuchtung & Leuchtenmontage',
    slug: 'elektro-beleuchtung',
    shortDescription: 'LED, Spots, Leuchten',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Beleuchtung', 'LED', 'Spots', 'Leuchten', 'Bewegungsmelder']
  },
  elektro_geraete_anschliessen: {
    value: 'elektro_geraete_anschliessen',
    label: 'Geräte anschliessen (Küche/Haushalt)',
    slug: 'elektro-geraete-anschliessen',
    shortDescription: 'Küchengeräte anschliessen',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Kochfeld', 'Backofen', 'Geschirrspüler', 'Waschmaschine', 'Boiler']
  },
  elektro_netzwerk_multimedia: {
    value: 'elektro_netzwerk_multimedia',
    label: 'Netzwerk & Multimedia',
    slug: 'elektro-netzwerk-multimedia',
    shortDescription: 'LAN, WLAN, TV',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Netzwerk', 'LAN', 'WLAN', 'TV', 'Multimedia', 'Telefon']
  },
  elektro_sprechanlage: {
    value: 'elektro_sprechanlage',
    label: 'Sprechanlage & Türkommunikation',
    slug: 'elektro-sprechanlage',
    shortDescription: 'Gegensprechanlage, Klingel',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Sprechanlage', 'Gegensprechanlage', 'Klingel', 'Videosprechanlage']
  },
  elektro_smart_home: {
    value: 'elektro_smart_home',
    label: 'Smart Home & Automation',
    slug: 'elektro-smart-home',
    shortDescription: 'KNX, Loxone, Automation',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Smart Home', 'KNX', 'Loxone', 'Automation', 'Hausautomation']
  },
  elektro_wallbox: {
    value: 'elektro_wallbox',
    label: 'E-Mobilität (Wallbox)',
    slug: 'elektro-wallbox',
    shortDescription: 'Ladestation installieren',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Wallbox', 'Ladestation', 'E-Auto', 'Elektroauto', 'Ladestation']
  },
  elektro_erdung_blitzschutz: {
    value: 'elektro_erdung_blitzschutz',
    label: 'Blitzschutz, Erdung & Potentialausgleich',
    slug: 'elektro-erdung-blitzschutz',
    shortDescription: 'Erdung, Überspannungsschutz',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Erdung', 'Blitzschutz', 'Überspannungsschutz', 'SPD']
  },
  elektro_sicherheitsnachweis: {
    value: 'elektro_sicherheitsnachweis',
    label: 'Sicherheitsnachweis & Kontrollen (NIV)',
    slug: 'elektro-sicherheitsnachweis',
    shortDescription: 'NIV, Sicherheitsprüfung',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['SiNa', 'Sicherheitsnachweis', 'NIV', 'Kontrolle', 'Abnahme']
  },
  elektro_zaehler_anmeldung: {
    value: 'elektro_zaehler_anmeldung',
    label: 'Zähler/Smart Meter & Anmeldung EW',
    slug: 'elektro-zaehler-anmeldung',
    shortDescription: 'Zählerwechsel, Anmeldung',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Zähler', 'Smart Meter', 'Netzbetreiber', 'Anmeldung']
  },
  elektro_notstrom: {
    value: 'elektro_notstrom',
    label: 'Notstrom & Speicher (Haushalt)',
    slug: 'elektro-notstrom',
    shortDescription: 'USV, Notstromumschaltung',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Notstrom', 'USV', 'Speicher', 'Batteriespeicher']
  },
  elektro_kleinauftraege: {
    value: 'elektro_kleinauftraege',
    label: 'Kleinaufträge (bis 2h)',
    slug: 'elektro-kleinauftraege',
    shortDescription: 'Steckdose, Leuchte, Schalter',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Kleinauftrag', 'kleine Reparatur', 'schnell']
  },
  
  // Keep existing categories for compatibility
  elektriker: {
    value: 'elektriker',
    label: 'Elektriker (Allgemein)',
    slug: 'elektriker',
    shortDescription: 'Alle elektrischen Arbeiten',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Elektriker', 'Elektroinstallateur']
  },

  // Bau & Renovation
  metallbau: {
    value: 'metallbau',
    label: 'Metallbau',
    slug: 'metallbau',
    shortDescription: 'Geländer, Treppen, Konstruktion',
    majorCategoryId: 'bau_renovation',
    keywords: ['Metall', 'Stahl', 'Geländer', 'Konstruktion']
  },
  holzbau: {
    value: 'holzbau',
    label: 'Holzbau',
    slug: 'holzbau',
    shortDescription: 'Dachstühle, Carports',
    majorCategoryId: 'bau_renovation',
    keywords: ['Holz', 'Dachstuhl', 'Carport', 'Holzkonstruktion']
  },
  mauerarbeit: {
    value: 'mauerarbeit',
    label: 'Mauerarbeit',
    slug: 'mauerarbeit',
    shortDescription: 'Mauern, Verputzen',
    majorCategoryId: 'bau_renovation',
    keywords: ['Mauern', 'Maurer', 'Putz', 'Stein']
  },
  betonarbeiten: {
    value: 'betonarbeiten',
    label: 'Betonarbeiten',
    slug: 'betonarbeiten',
    shortDescription: 'Fundamente, Platten',
    majorCategoryId: 'bau_renovation',
    keywords: ['Beton', 'Fundament', 'Bodenplatte']
  },
  fundament: {
    value: 'fundament',
    label: 'Fundament',
    slug: 'fundament',
    shortDescription: 'Fundamente erstellen',
    majorCategoryId: 'bau_renovation',
    keywords: ['Fundament', 'Grundierung', 'Basis']
  },
  kernbohrungen: {
    value: 'kernbohrungen',
    label: 'Kernbohrungen',
    slug: 'kernbohrungen',
    shortDescription: 'Wanddurchbrüche',
    majorCategoryId: 'bau_renovation',
    keywords: ['Kernbohrung', 'Durchbruch', 'Bohren']
  },
  abbruch_durchbruch: {
    value: 'abbruch_durchbruch',
    label: 'Abbruch und Durchbruch',
    slug: 'abbruch-durchbruch',
    shortDescription: 'Abbruch, Demontage',
    majorCategoryId: 'bau_renovation',
    keywords: ['Abbruch', 'Durchbruch', 'Demontage', 'Abriss']
  },
  renovierung_sonstige: {
    value: 'renovierung_sonstige',
    label: 'Sonstige Renovationarbeiten',
    slug: 'renovierung-sonstige',
    shortDescription: 'Renovations- und Umbauarbeiten',
    majorCategoryId: 'bau_renovation',
    keywords: ['Renovation', 'Umbau', 'Sanierung']
  },
  garage_carport: {
    value: 'garage_carport',
    label: 'Garage / Garagentor & Carport',
    slug: 'garage-carport',
    shortDescription: 'Garagen, Garagentore',
    majorCategoryId: 'bau_renovation',
    keywords: ['Garage', 'Garagentor', 'Carport']
  },
  aussenarbeiten_sonstige: {
    value: 'aussenarbeiten_sonstige',
    label: 'Sonstige Aussenarbeiten',
    slug: 'aussenarbeiten-sonstige',
    shortDescription: 'Diverse Aussenarbeiten',
    majorCategoryId: 'bau_renovation',
    keywords: ['Aussen', 'Garten', 'Terrasse']
  },

  // Bodenbeläge
  parkett_laminat: {
    value: 'parkett_laminat',
    label: 'Parkett und Laminat',
    slug: 'parkett-laminat',
    shortDescription: 'Parkett, Laminat verlegen',
    majorCategoryId: 'bodenbelaege',
    keywords: ['Parkett', 'Laminat', 'Holzboden']
  },
  teppich_pvc_linoleum: {
    value: 'teppich_pvc_linoleum',
    label: 'Teppich, PVC und Linoleum',
    slug: 'teppich-pvc-linoleum',
    shortDescription: 'Teppich, PVC, Linoleum',
    majorCategoryId: 'bodenbelaege',
    keywords: ['Teppich', 'PVC', 'Linoleum', 'Vinyl']
  },
  bodenfliese: {
    value: 'bodenfliese',
    label: 'Bodenfliesen',
    slug: 'bodenfliesen',
    shortDescription: 'Fliesen verlegen',
    majorCategoryId: 'bodenbelaege',
    keywords: ['Fliesen', 'Platten', 'Keramik']
  },
  bodenbelag_sonstige: {
    value: 'bodenbelag_sonstige',
    label: 'Sonstige Bodenbelagsarbeiten',
    slug: 'bodenbelag-sonstige',
    shortDescription: 'Weitere Bodenbeläge',
    majorCategoryId: 'bodenbelaege',
    keywords: ['Boden', 'Belag', 'Fussboden']
  },

  // Heizung, Klima & Solar
  fussbodenheizung: {
    value: 'fussbodenheizung',
    label: 'Fussbodenheizung',
    slug: 'fussbodenheizung',
    shortDescription: 'Fussbodenheizung installieren',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Fussbodenheizung', 'Bodenheizung']
  },
  boiler: {
    value: 'boiler',
    label: 'Boiler',
    slug: 'boiler',
    shortDescription: 'Warmwasserboiler',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Boiler', 'Warmwasser', 'Wassererwärmer']
  },
  klimaanlage_lueftung: {
    value: 'klimaanlage_lueftung',
    label: 'Klimaanlage & Lüftungssysteme',
    slug: 'klimaanlage-lueftung',
    shortDescription: 'Klima, Lüftung',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Klima', 'Lüftung', 'Klimaanlage']
  },
  waermepumpen: {
    value: 'waermepumpen',
    label: 'Wärmepumpen',
    slug: 'waermepumpen',
    shortDescription: 'Wärmepumpen',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Wärmepumpe', 'Heizung']
  },
  cheminee_kamin_ofen: {
    value: 'cheminee_kamin_ofen',
    label: 'Cheminée, Kamin und Ofen',
    slug: 'cheminee-kamin-ofen',
    shortDescription: 'Cheminée, Kamin, Ofen',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Cheminée', 'Kamin', 'Ofen', 'Cheminee']
  },
  solarthermie: {
    value: 'solarthermie',
    label: 'Solarthermie (Warmwasser)',
    slug: 'solarthermie',
    shortDescription: 'Solarthermie für Warmwasser',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Solarthermie', 'Solarkollektor', 'Warmwasser', 'Sonnenenergie']
  },
  photovoltaik: {
    value: 'photovoltaik',
    label: 'Solar, Photovoltaik & Batteriespeicher',
    slug: 'photovoltaik',
    shortDescription: 'PV-Anlagen, Stromspeicher',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Photovoltaik', 'PV', 'Solar', 'Batteriespeicher', 'Solaranlage', 'Stromspeicher']
  },
  heizung_sonstige: {
    value: 'heizung_sonstige',
    label: 'Sonstige Heizungsarbeiten',
    slug: 'heizung-sonstige',
    shortDescription: 'Weitere Heizungsarbeiten',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Heizung', 'Heizungsinstallation']
  },

  // Sanitär
  badewanne_dusche: {
    value: 'badewanne_dusche',
    label: 'Badewanne und Dusche',
    slug: 'badewanne-dusche',
    shortDescription: 'Badewannen, Duschen',
    majorCategoryId: 'sanitaer',
    keywords: ['Badewanne', 'Dusche', 'Sanitär']
  },
  klempnerarbeiten: {
    value: 'klempnerarbeiten',
    label: 'Klempnerarbeiten',
    slug: 'klempnerarbeiten',
    shortDescription: 'Sanitärreparaturen',
    majorCategoryId: 'sanitaer',
    keywords: ['Klempner', 'Sanitär', 'Reparatur']
  },
  sanitaer_sonstige: {
    value: 'sanitaer_sonstige',
    label: 'Sonstige Sanitärarbeiten',
    slug: 'sanitaer-sonstige',
    shortDescription: 'Weitere Sanitärarbeiten',
    majorCategoryId: 'sanitaer',
    keywords: ['Sanitär', 'Wasser', 'Abwasser']
  },

  // Küche
  kuechenplanung: {
    value: 'kuechenplanung',
    label: 'Küchenplanung',
    slug: 'kuechenplanung',
    shortDescription: 'Küchenplanung',
    majorCategoryId: 'kueche',
    keywords: ['Küche', 'Planung', 'Design']
  },
  kuechengeraete: {
    value: 'kuechengeraete',
    label: 'Küchengeräte',
    slug: 'kuechengeraete',
    shortDescription: 'Küchengeräte',
    majorCategoryId: 'kueche',
    keywords: ['Küchengeräte', 'Einbaugeräte']
  },
  arbeitsplatten: {
    value: 'arbeitsplatten',
    label: 'Arbeitsplatten',
    slug: 'arbeitsplatten',
    shortDescription: 'Arbeitsplatten',
    majorCategoryId: 'kueche',
    keywords: ['Arbeitsplatte', 'Küche']
  },
  kueche_sonstige: {
    value: 'kueche_sonstige',
    label: 'Sonstige Küchenarbeiten',
    slug: 'kueche-sonstige',
    shortDescription: 'Weitere Küchenarbeiten',
    majorCategoryId: 'kueche',
    keywords: ['Küche', 'Küchenbau']
  },

  // Innenausbau & Schreiner
  moebelbau: {
    value: 'moebelbau',
    label: 'Möbelbau',
    slug: 'moebelbau',
    shortDescription: 'Massgeschneiderte Möbel',
    majorCategoryId: 'innenausbau_schreiner',
    keywords: ['Möbel', 'Schreiner', 'Massarbeit']
  },
  moebelrestauration: {
    value: 'moebelrestauration',
    label: 'Möbelrestauration',
    slug: 'moebelrestauration',
    shortDescription: 'Möbelrestaurierung',
    majorCategoryId: 'innenausbau_schreiner',
    keywords: ['Restauration', 'Antik', 'Möbel']
  },
  holzarbeiten_innen: {
    value: 'holzarbeiten_innen',
    label: 'Holzarbeiten (Innen)',
    slug: 'holzarbeiten-innen',
    shortDescription: 'Innenausbau Holz',
    majorCategoryId: 'innenausbau_schreiner',
    keywords: ['Holz', 'Innenausbau', 'Holzarbeiten']
  },
  metallarbeiten_innen: {
    value: 'metallarbeiten_innen',
    label: 'Metallarbeiten (Innen)',
    slug: 'metallarbeiten-innen',
    shortDescription: 'Innenausbau Metall',
    majorCategoryId: 'innenausbau_schreiner',
    keywords: ['Metall', 'Innenausbau']
  },
  treppen: {
    value: 'treppen',
    label: 'Treppen',
    slug: 'treppen',
    shortDescription: 'Treppen',
    majorCategoryId: 'innenausbau_schreiner',
    keywords: ['Treppe', 'Stiege', 'Holztreppe']
  },
  innenausbau_sonstige: {
    value: 'innenausbau_sonstige',
    label: 'Sonstige Innenarbeiten',
    slug: 'innenausbau-sonstige',
    shortDescription: 'Weitere Innenausbauarbeiten',
    majorCategoryId: 'innenausbau_schreiner',
    keywords: ['Innenausbau', 'Ausbau']
  },

  // Räumung & Entsorgung
  aufloesung_entsorgung: {
    value: 'aufloesung_entsorgung',
    label: 'Auflösung und Entsorgung',
    slug: 'aufloesung-entsorgung',
    shortDescription: 'Auflösungen, Entsorgung',
    majorCategoryId: 'raeumung_entsorgung',
    keywords: ['Entsorgung', 'Auflösung', 'Räumung']
  },
  individuelle_anfrage: {
    value: 'individuelle_anfrage',
    label: 'Individuelle Anfrage',
    slug: 'individuelle-anfrage',
    shortDescription: 'Spezielle Projekte',
    majorCategoryId: 'raeumung_entsorgung',
    keywords: ['Individuell', 'Spezial', 'Anfrage']
  },

  // Keep existing for compatibility
  maler: {
    value: 'maler',
    label: 'Maler',
    slug: 'maler',
    shortDescription: 'Malerarbeiten',
    majorCategoryId: 'innenausbau_schreiner',
    keywords: ['Maler']
  },
  gipser: {
    value: 'gipser',
    label: 'Gipser',
    slug: 'gipser',
    shortDescription: 'Gipserarbeiten',
    majorCategoryId: 'innenausbau_schreiner',
    keywords: ['Gipser']
  },
  bodenleger: {
    value: 'bodenleger',
    label: 'Bodenleger',
    slug: 'bodenleger',
    shortDescription: 'Bodenbeläge',
    majorCategoryId: 'bodenbelaege',
    keywords: ['Boden']
  },
  plattenleger: {
    value: 'plattenleger',
    label: 'Plattenleger',
    slug: 'plattenleger',
    shortDescription: 'Fliesen, Platten',
    majorCategoryId: 'bodenbelaege',
    keywords: ['Platten']
  },
  schreiner: {
    value: 'schreiner',
    label: 'Schreiner',
    slug: 'schreiner',
    shortDescription: 'Schreinerarbeiten',
    majorCategoryId: 'innenausbau_schreiner',
    keywords: ['Schreiner']
  },
  maurer: {
    value: 'maurer',
    label: 'Maurer',
    slug: 'maurer',
    shortDescription: 'Maurerarbeiten',
    majorCategoryId: 'bau_renovation',
    keywords: ['Maurer']
  },
  zimmermann: {
    value: 'zimmermann',
    label: 'Zimmermann',
    slug: 'zimmermann',
    shortDescription: 'Zimmermannsarbeiten',
    majorCategoryId: 'bau_renovation',
    keywords: ['Zimmermann']
  },
  dachdecker: {
    value: 'dachdecker',
    label: 'Dachdecker',
    slug: 'dachdecker',
    shortDescription: 'Dacharbeiten',
    majorCategoryId: 'bau_renovation',
    keywords: ['Dach']
  },
  fassadenbauer: {
    value: 'fassadenbauer',
    label: 'Fassadenbauer',
    slug: 'fassadenbauer',
    shortDescription: 'Fassadenarbeiten',
    majorCategoryId: 'bau_renovation',
    keywords: ['Fassade']
  },
  gartenbau: {
    value: 'gartenbau',
    label: 'Gartenbau',
    slug: 'gartenbau',
    shortDescription: 'Gartengestaltung',
    majorCategoryId: 'bau_renovation',
    keywords: ['Garten']
  },
  pflasterarbeiten: {
    value: 'pflasterarbeiten',
    label: 'Pflasterarbeiten',
    slug: 'pflasterarbeiten',
    shortDescription: 'Pflasterungen',
    majorCategoryId: 'bau_renovation',
    keywords: ['Pflaster']
  },
  zaun_torbau: {
    value: 'zaun_torbau',
    label: 'Zaun- und Torbau',
    slug: 'zaun-torbau',
    shortDescription: 'Zäune, Tore',
    majorCategoryId: 'bau_renovation',
    keywords: ['Zaun', 'Tor']
  },
  fenster_tueren: {
    value: 'fenster_tueren',
    label: 'Fenster & Türen',
    slug: 'fenster-tueren',
    shortDescription: 'Fenster, Türen',
    majorCategoryId: 'innenausbau_schreiner',
    keywords: ['Fenster', 'Türen']
  },
  kuechenbau: {
    value: 'kuechenbau',
    label: 'Küchenbau',
    slug: 'kuechenbau',
    shortDescription: 'Küchen',
    majorCategoryId: 'kueche',
    keywords: ['Küche']
  },
  badumbau: {
    value: 'badumbau',
    label: 'Badumbau',
    slug: 'badumbau',
    shortDescription: 'Bäder',
    majorCategoryId: 'sanitaer',
    keywords: ['Bad']
  },
  badezimmer: {
    value: 'badezimmer',
    label: 'Badezimmer',
    slug: 'badezimmer',
    shortDescription: 'Badezimmer',
    majorCategoryId: 'sanitaer',
    keywords: ['Badezimmer']
  },
  umzug: {
    value: 'umzug',
    label: 'Umzug',
    slug: 'umzug',
    shortDescription: 'Umzug',
    majorCategoryId: 'raeumung_entsorgung',
    keywords: ['Umzug']
  },
  reinigung: {
    value: 'reinigung',
    label: 'Reinigung',
    slug: 'reinigung',
    shortDescription: 'Reinigung',
    majorCategoryId: 'raeumung_entsorgung',
    keywords: ['Reinigung']
  },
  schlosserei: {
    value: 'schlosserei',
    label: 'Schlosserei',
    slug: 'schlosserei',
    shortDescription: 'Metallarbeiten',
    majorCategoryId: 'bau_renovation',
    keywords: ['Schlosser']
  },
  spengler: {
    value: 'spengler',
    label: 'Spengler',
    slug: 'spengler',
    shortDescription: 'Spenglerarbeiten',
    majorCategoryId: 'bau_renovation',
    keywords: ['Spengler']
  }
};
