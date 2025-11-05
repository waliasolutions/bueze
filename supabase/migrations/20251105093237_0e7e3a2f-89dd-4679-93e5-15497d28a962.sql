-- Add new enum values for all subcategories across 8 major categories

-- Bau & Renovation subcategories
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'metallbau';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'holzbau';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'mauerarbeit';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'betonarbeiten';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'fundament';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'kernbohrungen';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'abbruch_durchbruch';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'renovierung_sonstige';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'garage_carport';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'aussenarbeiten_sonstige';

-- Bodenbeläge subcategories
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'parkett_laminat';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'teppich_pvc_linoleum';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'bodenfliese';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'bodenbelag_sonstige';

-- Elektroinstallationen subcategories (15 detailed categories)
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'elektro_hausinstallationen';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'elektro_unterverteilung';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'elektro_stoerung_notfall';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'elektro_beleuchtung';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'elektro_geraete_anschliessen';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'elektro_netzwerk_multimedia';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'elektro_sprechanlage';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'elektro_smart_home';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'elektro_wallbox';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'elektro_bauprovisorium';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'elektro_erdung_blitzschutz';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'elektro_sicherheitsnachweis';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'elektro_zaehler_anmeldung';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'elektro_notstrom';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'elektro_kleinauftraege';

-- Heizung, Klima & Solar subcategories
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'fussbodenheizung';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'boiler';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'klimaanlage_lueftung';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'waermepumpen';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'cheminee_kamin_ofen';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'solarheizung';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'photovoltaik';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'batteriespeicher';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'heizung_sonstige';

-- Sanitär subcategories
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'badezimmer';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'badewanne_dusche';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'klempnerarbeiten';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'sanitaer_sonstige';

-- Küche subcategories
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'kuechenplanung';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'kuechengeraete';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'arbeitsplatten';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'kueche_sonstige';

-- Innenausbau & Schreiner subcategories
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'moebelbau';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'moebelrestauration';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'holzarbeiten_innen';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'metallarbeiten_innen';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'treppen';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'innenausbau_sonstige';

-- Räumung & Entsorgung subcategories
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'aufloesung_entsorgung';
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'individuelle_anfrage';