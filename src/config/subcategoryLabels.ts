export interface SubcategoryInfo {
  value: string;
  label: string;
  slug: string;
  shortDescription: string;
  majorCategoryId: string;
  keywords: string[];
}

export const subcategoryLabels: Record<string, SubcategoryInfo> = {
  // Elektroinstallationen (15 subcategories)
  elektro_hausinstallationen: {
    value: 'elektro_hausinstallationen',
    label: 'Hausinstallationen (Neu-/Umbau)',
    slug: 'elektro-hausinstallationen',
    shortDescription: 'Leitungen, Steckdosen, Schalter und komplette Elektroinstallationen',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Elektroinstallation', 'Steckdosen', 'Schalter', 'Leitungen', 'Kabelzug']
  },
  elektro_unterverteilung: {
    value: 'elektro_unterverteilung',
    label: 'Sicherungskasten & Unterverteilung',
    slug: 'elektro-unterverteilung',
    shortDescription: 'Verteiler ersetzen/erweitern, FI/RCD und LS nachrüsten',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Sicherungskasten', 'Verteiler', 'FI', 'RCD', 'LS', 'Tableau']
  },
  elektro_stoerung_notfall: {
    value: 'elektro_stoerung_notfall',
    label: 'Fehlersuche & Störungsbehebung',
    slug: 'elektro-stoerung-notfall',
    shortDescription: 'Stromausfall, FI-Auslösung, Kurzschluss - 24h Notfall',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Notfall', 'Störung', 'Stromausfall', 'Kurzschluss', '24h']
  },
  elektro_beleuchtung: {
    value: 'elektro_beleuchtung',
    label: 'Beleuchtung & Leuchtenmontage',
    slug: 'elektro-beleuchtung',
    shortDescription: 'LED-Umrüstung, Spots, Decken-/Pendelleuchten, Bewegungsmelder',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Beleuchtung', 'LED', 'Spots', 'Leuchten', 'Bewegungsmelder']
  },
  elektro_geraete_anschliessen: {
    value: 'elektro_geraete_anschliessen',
    label: 'Geräte anschliessen (Küche/Haushalt)',
    slug: 'elektro-geraete-anschliessen',
    shortDescription: 'Kochfeld, Backofen, Dampfabzug, Geschirrspüler, Waschmaschine',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Kochfeld', 'Backofen', 'Geschirrspüler', 'Waschmaschine', 'Boiler']
  },
  elektro_netzwerk_multimedia: {
    value: 'elektro_netzwerk_multimedia',
    label: 'Netzwerk & Multimedia',
    slug: 'elektro-netzwerk-multimedia',
    shortDescription: 'LAN, Patchfeld, WLAN, TV/Multimedia, Telefon',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Netzwerk', 'LAN', 'WLAN', 'TV', 'Multimedia', 'Telefon']
  },
  elektro_sprechanlage: {
    value: 'elektro_sprechanlage',
    label: 'Sprechanlage & Türkommunikation',
    slug: 'elektro-sprechanlage',
    shortDescription: 'Audio/Video-Gegensprechanlage, Klingel, Zutritt',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Sprechanlage', 'Gegensprechanlage', 'Klingel', 'Videosprechanlage']
  },
  elektro_smart_home: {
    value: 'elektro_smart_home',
    label: 'Smart Home & Automation',
    slug: 'elektro-smart-home',
    shortDescription: 'KNX, Loxone, Shelly, Hue, Storensteuerung, Szenen',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Smart Home', 'KNX', 'Loxone', 'Automation', 'Hausautomation']
  },
  elektro_wallbox: {
    value: 'elektro_wallbox',
    label: 'E-Mobilität (Wallbox)',
    slug: 'elektro-wallbox',
    shortDescription: 'Ladestation privat, Lastmanagement, Anmeldung Netzbetreiber',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Wallbox', 'Ladestation', 'E-Auto', 'Elektroauto', 'Ladestation']
  },
  elektro_bauprovisorium: {
    value: 'elektro_bauprovisorium',
    label: 'Bauprovisorium (Baustrom)',
    slug: 'elektro-bauprovisorium',
    shortDescription: 'Provisorischer Anschluss für Baustellen',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Baustrom', 'Bauprovisorium', 'Bauanschluss']
  },
  elektro_erdung_blitzschutz: {
    value: 'elektro_erdung_blitzschutz',
    label: 'Blitzschutz, Erdung & Potentialausgleich',
    slug: 'elektro-erdung-blitzschutz',
    shortDescription: 'Erdung, Überspannungsschutz (SPD), Hauptpotentialausgleich',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Erdung', 'Blitzschutz', 'Überspannungsschutz', 'SPD']
  },
  elektro_sicherheitsnachweis: {
    value: 'elektro_sicherheitsnachweis',
    label: 'Sicherheitsnachweis & Kontrollen (NIV)',
    slug: 'elektro-sicherheitsnachweis',
    shortDescription: 'SiNa, Periodische Kontrolle, Abnahmemessungen',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['SiNa', 'Sicherheitsnachweis', 'NIV', 'Kontrolle', 'Abnahme']
  },
  elektro_zaehler_anmeldung: {
    value: 'elektro_zaehler_anmeldung',
    label: 'Zähler/Smart Meter & Anmeldung EW',
    slug: 'elektro-zaehler-anmeldung',
    shortDescription: 'Zählerwechsel, Netzbetreiber-Anmeldung',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Zähler', 'Smart Meter', 'Netzbetreiber', 'Anmeldung']
  },
  elektro_notstrom: {
    value: 'elektro_notstrom',
    label: 'Notstrom & Speicher (Haushalt)',
    slug: 'elektro-notstrom',
    shortDescription: 'USV, Netz-/Notstromumschaltung',
    majorCategoryId: 'elektroinstallationen',
    keywords: ['Notstrom', 'USV', 'Speicher', 'Batteriespeicher']
  },
  elektro_kleinauftraege: {
    value: 'elektro_kleinauftraege',
    label: 'Kleinaufträge (bis 2h)',
    slug: 'elektro-kleinauftraege',
    shortDescription: 'Kleine Jobs: Steckdose, Leuchte, Schalter',
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
    shortDescription: 'Metallkonstruktionen, Geländer, Treppen',
    majorCategoryId: 'bau_renovation',
    keywords: ['Metall', 'Stahl', 'Geländer', 'Konstruktion']
  },
  holzbau: {
    value: 'holzbau',
    label: 'Holzbau',
    slug: 'holzbau',
    shortDescription: 'Holzkonstruktionen, Dachstühle, Carports',
    majorCategoryId: 'bau_renovation',
    keywords: ['Holz', 'Dachstuhl', 'Carport', 'Holzkonstruktion']
  },
  mauerarbeit: {
    value: 'mauerarbeit',
    label: 'Mauerarbeit',
    slug: 'mauerarbeit',
    shortDescription: 'Mauern, Verputzen, Steinarbeiten',
    majorCategoryId: 'bau_renovation',
    keywords: ['Mauern', 'Maurer', 'Putz', 'Stein']
  },
  betonarbeiten: {
    value: 'betonarbeiten',
    label: 'Betonarbeiten',
    slug: 'betonarbeiten',
    shortDescription: 'Betonieren, Fundamente, Platten',
    majorCategoryId: 'bau_renovation',
    keywords: ['Beton', 'Fundament', 'Bodenplatte']
  },
  fundament: {
    value: 'fundament',
    label: 'Fundament',
    slug: 'fundament',
    shortDescription: 'Fundamente erstellen und sanieren',
    majorCategoryId: 'bau_renovation',
    keywords: ['Fundament', 'Grundierung', 'Basis']
  },
  kernbohrungen: {
    value: 'kernbohrungen',
    label: 'Kernbohrungen',
    slug: 'kernbohrungen',
    shortDescription: 'Kernbohrungen, Wanddurchbrüche',
    majorCategoryId: 'bau_renovation',
    keywords: ['Kernbohrung', 'Durchbruch', 'Bohren']
  },
  abbruch_durchbruch: {
    value: 'abbruch_durchbruch',
    label: 'Abbruch und Durchbruch',
    slug: 'abbruch-durchbruch',
    shortDescription: 'Abbrucharbeiten, Durchbrüche, Demontage',
    majorCategoryId: 'bau_renovation',
    keywords: ['Abbruch', 'Durchbruch', 'Demontage', 'Abriss']
  },
  renovierung_sonstige: {
    value: 'renovierung_sonstige',
    label: 'Sonstige Renovationarbeiten',
    slug: 'renovierung-sonstige',
    shortDescription: 'Diverse Renovations- und Umbauarbeiten',
    majorCategoryId: 'bau_renovation',
    keywords: ['Renovation', 'Umbau', 'Sanierung']
  },
  garage_carport: {
    value: 'garage_carport',
    label: 'Garage / Garagentor & Carport',
    slug: 'garage-carport',
    shortDescription: 'Garagen, Garagentore, Carports',
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
    shortDescription: 'Parkett und Laminat verlegen und renovieren',
    majorCategoryId: 'bodenbelaege',
    keywords: ['Parkett', 'Laminat', 'Holzboden']
  },
  teppich_pvc_linoleum: {
    value: 'teppich_pvc_linoleum',
    label: 'Teppich, PVC und Linoleum',
    slug: 'teppich-pvc-linoleum',
    shortDescription: 'Textile und elastische Bodenbeläge',
    majorCategoryId: 'bodenbelaege',
    keywords: ['Teppich', 'PVC', 'Linoleum', 'Vinyl']
  },
  bodenfliese: {
    value: 'bodenfliese',
    label: 'Bodenfliesen',
    slug: 'bodenfliesen',
    shortDescription: 'Fliesen verlegen und sanieren',
    majorCategoryId: 'bodenbelaege',
    keywords: ['Fliesen', 'Platten', 'Keramik']
  },
  bodenbelag_sonstige: {
    value: 'bodenbelag_sonstige',
    label: 'Sonstige Bodenbelagsarbeiten',
    slug: 'bodenbelag-sonstige',
    shortDescription: 'Weitere Bodenbeläge und Spezialarbeiten',
    majorCategoryId: 'bodenbelaege',
    keywords: ['Boden', 'Belag', 'Fussboden']
  },

  // Heizung, Klima & Solar
  fussbodenheizung: {
    value: 'fussbodenheizung',
    label: 'Fussbodenheizung',
    slug: 'fussbodenheizung',
    shortDescription: 'Fussbodenheizung installieren und warten',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Fussbodenheizung', 'Bodenheizung']
  },
  boiler: {
    value: 'boiler',
    label: 'Boiler',
    slug: 'boiler',
    shortDescription: 'Warmwasserboiler installieren und warten',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Boiler', 'Warmwasser', 'Wassererwärmer']
  },
  klimaanlage_lueftung: {
    value: 'klimaanlage_lueftung',
    label: 'Klimaanlage & Lüftungssysteme',
    slug: 'klimaanlage-lueftung',
    shortDescription: 'Klimaanlagen und Lüftungen',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Klima', 'Lüftung', 'Klimaanlage']
  },
  waermepumpen: {
    value: 'waermepumpen',
    label: 'Wärmepumpen',
    slug: 'waermepumpen',
    shortDescription: 'Wärmepumpen installieren und warten',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Wärmepumpe', 'Heizung']
  },
  cheminee_kamin_ofen: {
    value: 'cheminee_kamin_ofen',
    label: 'Cheminée, Kamin und Ofen',
    slug: 'cheminee-kamin-ofen',
    shortDescription: 'Cheminées, Kamine und Öfen',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Cheminée', 'Kamin', 'Ofen', 'Cheminee']
  },
  solarheizung: {
    value: 'solarheizung',
    label: 'Solarheizung',
    slug: 'solarheizung',
    shortDescription: 'Solarthermie für Warmwasser und Heizung',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Solar', 'Solarthermie', 'Sonnenenergie']
  },
  photovoltaik: {
    value: 'photovoltaik',
    label: 'Photovoltaik & Batteriespeicher',
    slug: 'photovoltaik',
    shortDescription: 'PV-Anlagen und Stromspeicher',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Photovoltaik', 'PV', 'Solar', 'Batteriespeicher']
  },
  batteriespeicher: {
    value: 'batteriespeicher',
    label: 'Batteriespeicher',
    slug: 'batteriespeicher',
    shortDescription: 'Stromspeicher für PV-Anlagen',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Batteriespeicher', 'Speicher', 'Batterie']
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
    shortDescription: 'Badewannen und Duschen installieren',
    majorCategoryId: 'sanitaer',
    keywords: ['Badewanne', 'Dusche', 'Sanitär']
  },
  klempnerarbeiten: {
    value: 'klempnerarbeiten',
    label: 'Klempnerarbeiten',
    slug: 'klempnerarbeiten',
    shortDescription: 'Sanitärreparaturen und Installationen',
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
    shortDescription: 'Professionelle Küchenplanung',
    majorCategoryId: 'kueche',
    keywords: ['Küche', 'Planung', 'Design']
  },
  kuechengeraete: {
    value: 'kuechengeraete',
    label: 'Küchengeräte',
    slug: 'kuechengeraete',
    shortDescription: 'Installation von Küchengeräten',
    majorCategoryId: 'kueche',
    keywords: ['Küchengeräte', 'Einbaugeräte']
  },
  arbeitsplatten: {
    value: 'arbeitsplatten',
    label: 'Arbeitsplatten',
    slug: 'arbeitsplatten',
    shortDescription: 'Küchenarbeitsplatten',
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
    shortDescription: 'Restauration antiker Möbel',
    majorCategoryId: 'innenausbau_schreiner',
    keywords: ['Restauration', 'Antik', 'Möbel']
  },
  holzarbeiten_innen: {
    value: 'holzarbeiten_innen',
    label: 'Holzarbeiten (Innen)',
    slug: 'holzarbeiten-innen',
    shortDescription: 'Innenausbau mit Holz',
    majorCategoryId: 'innenausbau_schreiner',
    keywords: ['Holz', 'Innenausbau', 'Holzarbeiten']
  },
  metallarbeiten_innen: {
    value: 'metallarbeiten_innen',
    label: 'Metallarbeiten (Innen)',
    slug: 'metallarbeiten-innen',
    shortDescription: 'Innenausbau mit Metall',
    majorCategoryId: 'innenausbau_schreiner',
    keywords: ['Metall', 'Innenausbau']
  },
  treppen: {
    value: 'treppen',
    label: 'Treppen',
    slug: 'treppen',
    shortDescription: 'Treppen bauen und renovieren',
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
    shortDescription: 'Wohnungsauflösungen und Entsorgung',
    majorCategoryId: 'raeumung_entsorgung',
    keywords: ['Entsorgung', 'Auflösung', 'Räumung']
  },
  individuelle_anfrage: {
    value: 'individuelle_anfrage',
    label: 'Individuelle Anfrage',
    slug: 'individuelle-anfrage',
    shortDescription: 'Spezielle Anfragen und Projekte',
    majorCategoryId: 'raeumung_entsorgung',
    keywords: ['Individuell', 'Spezial', 'Anfrage']
  },

  // Keep existing for compatibility
  sanitaer: {
    value: 'sanitaer',
    label: 'Sanitär',
    slug: 'sanitaer',
    shortDescription: 'Sanitärinstallationen',
    majorCategoryId: 'sanitaer',
    keywords: ['Sanitär']
  },
  heizung: {
    value: 'heizung',
    label: 'Heizung',
    slug: 'heizung',
    shortDescription: 'Heizungsinstallationen',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Heizung']
  },
  klimatechnik: {
    value: 'klimatechnik',
    label: 'Klimatechnik',
    slug: 'klimatechnik',
    shortDescription: 'Klimaanlagen',
    majorCategoryId: 'heizung_klima_solar',
    keywords: ['Klima']
  },
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
    shortDescription: 'Bodenbeläge verlegen',
    majorCategoryId: 'bodenbelaege',
    keywords: ['Boden']
  },
  plattenleger: {
    value: 'plattenleger',
    label: 'Plattenleger',
    slug: 'plattenleger',
    shortDescription: 'Fliesen und Platten',
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
    shortDescription: 'Zäune und Tore',
    majorCategoryId: 'bau_renovation',
    keywords: ['Zaun', 'Tor']
  },
  fenster_tueren: {
    value: 'fenster_tueren',
    label: 'Fenster & Türen',
    slug: 'fenster-tueren',
    shortDescription: 'Fenster und Türen',
    majorCategoryId: 'innenausbau_schreiner',
    keywords: ['Fenster', 'Türen']
  },
  kuechenbau: {
    value: 'kuechenbau',
    label: 'Küchenbau',
    slug: 'kuechenbau',
    shortDescription: 'Küchen bauen',
    majorCategoryId: 'kueche',
    keywords: ['Küche']
  },
  badumbau: {
    value: 'badumbau',
    label: 'Badumbau',
    slug: 'badumbau',
    shortDescription: 'Bäder umbauen',
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
    shortDescription: 'Umzugsservice',
    majorCategoryId: 'raeumung_entsorgung',
    keywords: ['Umzug']
  },
  reinigung: {
    value: 'reinigung',
    label: 'Reinigung',
    slug: 'reinigung',
    shortDescription: 'Reinigungsservice',
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
