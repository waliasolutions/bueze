import { 
  Construction, Layers, Zap, Flame, Droplet, 
  ChefHat, Hammer, Trash2, LucideIcon, TreePine, Paintbrush, Truck, Box
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export interface MajorCategory {
  id: string;
  slug: string;
  label: string;
  icon: LucideIcon;
  description: string;
  subcategories: string[];
  color: string;
  showOnHome: boolean;
  faq: FAQItem[];
  benefits: string[];
}

export const majorCategories: Record<string, MajorCategory> = {
  bau_renovation: {
    id: 'bau_renovation',
    slug: 'bau-renovation',
    label: 'Bau & Renovation',
    icon: Construction,
    description: 'Hochbau, Umbau, Abbruch und umfassende Renovationsarbeiten',
    subcategories: [
      'mauerarbeit',
      'holzbau',
      'metallbau',
      'betonarbeiten',
      'fundament',
      'kernbohrungen',
      'abbruch_durchbruch',
      'renovierung_sonstige'
    ],
    color: 'from-amber-500 to-orange-600',
    showOnHome: true,
    faq: [
      { question: 'Wie lange dauert eine Renovation?', answer: 'Das hängt vom Umfang ab. Eine Badsanierung dauert 2-3 Wochen, ein kompletter Umbau mehrere Monate. Ihr Handwerker erstellt einen detaillierten Zeitplan.' },
      { question: 'Brauche ich eine Baubewilligung?', answer: 'Für bauliche Veränderungen an der Fassade, Statik oder Grundriss ist meist eine Baubewilligung erforderlich. Erfahrene Handwerker beraten Sie und kümmern sich um die Formalitäten.' },
      { question: 'Was kostet eine Renovation?', answer: 'Die Kosten variieren stark je nach Umfang. Eine einfache Renovation ist günstiger als ein kompletter Umbau. Mit Büeze.ch erhalten Sie mehrere detaillierte Offerten zum Vergleich.' },
      { question: 'Kann ich während der Renovation im Haus bleiben?', answer: 'Bei kleineren Arbeiten ist das meist möglich. Bei grösseren Umbauten sollten Sie temporär ausziehen. Besprechen Sie dies mit Ihrem Handwerker.' }
    ],
    benefits: [
      'Erfahrene Bauunternehmen und Handwerker',
      'Unterstützung bei Baubewilligungen',
      'Detaillierte Zeitplanung und Kostenkontrolle',
      'Garantie auf alle Bauarbeiten',
      'Schweizweite Abdeckung',
      'Mehrere Offerten kostenlos vergleichen'
    ]
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
    color: 'from-amber-600 to-amber-800',
    showOnHome: true,
    faq: [
      { question: 'Wie lange dauert die Verlegung eines neuen Bodens?', answer: 'Das hängt von der Raumgrösse und dem Material ab. Parkett oder Laminat sind oft in 1-2 Tagen verlegt, während Fliesen mehr Zeit benötigen. Die Bodenleger geben Ihnen in der Offerte eine genaue Zeitplanung.' },
      { question: 'Kann ich meinen alten Boden selbst entfernen?', answer: 'Grundsätzlich ja, aber viele Bodenleger bieten die Entfernung des alten Belags als Teil ihrer Leistung an. Das spart Zeit und sorgt für einen sauberen Untergrund.' },
      { question: 'Welcher Bodenbelag eignet sich für welchen Raum?', answer: 'Fliesen sind ideal für Badezimmer und Küchen, Parkett für Wohn- und Schlafzimmer, Vinyl für stark beanspruchte Bereiche. Ihr Bodenleger berät Sie gerne bei der Auswahl.' },
      { question: 'Was kostet ein neuer Fussboden?', answer: 'Die Kosten variieren je nach Material und Fläche. Laminat ist günstiger als Echtholzparkett, Fliesen liegen preislich dazwischen. Mit Büeze.ch erhalten Sie mehrere Offerten zum Vergleich.' }
    ],
    benefits: [
      'Professionelle Bodenleger für alle Beläge',
      'Kostenlose Beratung zur Materialauswahl',
      'Inklusive Entfernung alter Bodenbeläge',
      'Saubere und fachgerechte Verlegung',
      'Garantie auf Material und Arbeit',
      'Mehrere Offerten kostenlos vergleichen'
    ]
  },
  elektroinstallationen: {
    id: 'elektroinstallationen',
    slug: 'elektroinstallationen',
    label: 'Elektroinstallationen',
    icon: Zap,
    description: 'Alle elektrischen Installationen, Reparaturen und Smart Home',
    subcategories: [
      'elektro_hausinstallationen',
      'elektro_unterverteilung',
      'elektro_stoerung_notfall',
      'elektro_beleuchtung',
      'elektro_smart_home',
      'elektro_netzwerk_multimedia',
      'elektro_wallbox',
      'elektro_sicherheitsnachweis'
    ],
    color: 'from-yellow-500 to-yellow-600',
    showOnHome: true,
    faq: [
      { question: 'Benötige ich für Elektroarbeiten eine Bewilligung?', answer: 'Für grössere Installationen ist eine Meldung beim lokalen Elektrizitätswerk erforderlich. Professionelle Elektriker kümmern sich um alle Formalitäten und erstellen den erforderlichen Sicherheitsnachweis (SiNa).' },
      { question: 'Wie schnell kann ein Elektriker bei einem Notfall kommen?', answer: 'Bei Notfällen wie Stromausfall oder gefährlichen Defekten reagieren viele Elektriker innerhalb weniger Stunden. Für geplante Arbeiten vereinbaren Sie einfach einen passenden Termin.' },
      { question: 'Was kostet eine Elektroinstallation?', answer: 'Die Kosten variieren je nach Umfang der Arbeiten. Eine neue Steckdose kostet weniger als eine komplette Hausinstallation. Mit Büeze.ch vergleichen Sie mehrere Offerten kostenlos.' },
      { question: 'Sind Elektriker in der Schweiz geprüft?', answer: 'Ja, Elektroinstallationen dürfen nur von konzessionierten Elektrikern durchgeführt werden. Diese verfügen über die NIV-Bewilligung und sind beim lokalen Elektrizitätswerk registriert.' }
    ],
    benefits: [
      'Konzessionierte Elektriker mit NIV-Bewilligung',
      'Fachgerechte Installation nach Schweizer Normen',
      'Sicherheitsnachweis (SiNa) inklusive',
      'Schnelle Reaktionszeit bei Notfällen',
      'Mehrere Offerten kostenlos vergleichen',
      'Garantie auf alle Arbeiten'
    ]
  },
  heizung_klima: {
    id: 'heizung_klima',
    slug: 'heizung-klima',
    label: 'Heizung, Klima & Solar',
    icon: Flame,
    description: 'Heizungen, Klimaanlagen, Solaranlagen und Energielösungen',
    subcategories: [
      'waermepumpen', 'fussbodenheizung', 'boiler', 
      'klimaanlage_lueftung', 'cheminee_kamin_ofen', 
      'photovoltaik', 'solarthermie', 'heizung_sonstige'
    ],
    color: 'from-orange-500 to-red-600',
    showOnHome: true,
    faq: [
      { question: 'Welche Heizung ist am umweltfreundlichsten?', answer: 'Wärmepumpen in Kombination mit Solarenergie sind derzeit die nachhaltigste Lösung. Sie nutzen erneuerbare Energien und sind langfristig kostengünstig.' },
      { question: 'Gibt es Förderungen für neue Heizsysteme?', answer: 'Ja, Bund und Kantone fördern den Umstieg auf erneuerbare Energien. Ihr Heizungsinstallateur informiert Sie über aktuelle Förderprogramme und unterstützt bei der Antragstellung.' },
      { question: 'Wie lange dauert der Austausch einer Heizung?', answer: 'Ein Heizungswechsel dauert in der Regel 2-5 Tage, abhängig vom System. Eine gute Planung gewährleistet, dass Sie nie ohne Heizung sind.' },
      { question: 'Was kostet eine neue Heizung?', answer: 'Die Kosten variieren je nach System: Wärmepumpen sind in der Anschaffung teurer, sparen aber langfristig Energiekosten. Mit Büeze.ch vergleichen Sie Offerten und finden die beste Lösung.' }
    ],
    benefits: [
      'Fachberatung zu umweltfreundlichen Heizsystemen',
      'Unterstützung bei Förderanträgen',
      'Installation durch geprüfte Heizungsspezialisten',
      'Wartung und Notdienst verfügbar',
      'Energieeffiziente Lösungen',
      'Mehrere Offerten kostenlos vergleichen'
    ]
  },
  sanitaer: {
    id: 'sanitaer',
    slug: 'sanitaer',
    label: 'Sanitär',
    icon: Droplet,
    description: 'Badezimmer, Sanitärinstallationen und Reparaturen',
    subcategories: [
      'badewanne_dusche', 'badezimmer', 'badumbau',
      'klempnerarbeiten', 'sanitaer', 
      'boiler', 'sanitaer_sonstige'
    ],
    color: 'from-blue-500 to-cyan-600',
    showOnHome: true,
    faq: [
      { question: 'Wie lange dauert eine Badsanierung?', answer: 'Eine komplette Badsanierung dauert in der Regel 2-3 Wochen. Kleinere Arbeiten wie der Austausch eines WCs oder Waschbeckens sind oft in 1-2 Tagen erledigt.' },
      { question: 'Kann ich mein Bad während der Sanierung nutzen?', answer: 'Bei einer kompletten Sanierung ist das Bad nicht nutzbar. Planen Sie eine Alternative ein. Ihr Sanitärinstallateur informiert Sie über den genauen Ablauf.' },
      { question: 'Was kostet eine Badsanierung?', answer: 'Die Kosten hängen von Grösse und Ausstattung ab. Eine einfache Renovation ist günstiger als eine Luxussanierung. Mit Büeze.ch vergleichen Sie mehrere detaillierte Offerten.' },
      { question: 'Benötige ich eine Bewilligung für Sanitärarbeiten?', answer: 'Für normale Sanitärarbeiten ist keine Bewilligung erforderlich. Bei baulichen Veränderungen kann eine Baubewilligung nötig sein. Ihr Sanitär berät Sie dazu.' }
    ],
    benefits: [
      'Professionelle Sanitärinstallateure',
      'Komplettlösungen für Badsanierungen',
      'Notdienst bei Wasserschäden',
      'Beratung zu modernen Sanitärlösungen',
      'Garantie auf alle Arbeiten',
      'Mehrere Offerten kostenlos vergleichen'
    ]
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
    showOnHome: true,
    faq: [
      { question: 'Wie lange dauert eine Küchenmontage?', answer: 'Eine durchschnittliche Küche ist in 2-4 Tagen komplett montiert und einsatzbereit. Der genaue Zeitrahmen hängt von Grösse und Komplexität ab.' },
      { question: 'Muss ich meine alte Küche selbst ausbauen?', answer: 'Die meisten Küchenbauer bieten den Ausbau der alten Küche als Teil ihrer Leistung an. Das ist praktisch und stellt sicher, dass der Raum optimal vorbereitet wird.' },
      { question: 'Sind die Geräte in der Offerte enthalten?', answer: 'Das kommt auf den Anbieter an. Manche Küchenbauer liefern Komplettlösungen inklusive Geräte, andere nur die Möbel. Klären Sie dies direkt in der Offerte.' },
      { question: 'Was kostet eine neue Küche?', answer: 'Die Kosten variieren stark je nach Grösse, Ausstattung und Material. Eine Standardküche ist günstiger als eine Massanfertigung. Mit Büeze.ch vergleichen Sie Preise transparent.' }
    ],
    benefits: [
      'Professionelle Küchenplanung inklusive',
      'Massgeschneiderte oder Standardlösungen',
      'Fachgerechte Montage aller Komponenten',
      'Optional: Komplettservice mit Geräten',
      'Garantie auf Möbel und Montage',
      'Mehrere Offerten kostenlos vergleichen'
    ]
  },
  innenausbau_schreiner: {
    id: 'innenausbau_schreiner',
    slug: 'innenausbau-schreiner',
    label: 'Innenausbau & Schreiner',
    icon: Hammer,
    description: 'Möbelbau, Schreinerei und Innenausbau',
    subcategories: [
      'schreiner',
      'moebelbau',
      'fenster_tueren',
      'treppen',
      'holzarbeiten_innen',
      'metallarbeiten_innen',
      'innenausbau_sonstige'
    ],
    color: 'from-purple-500 to-indigo-600',
    showOnHome: false,
    faq: [
      { question: 'Wie lange dauert eine Massanfertigung?', answer: 'Massgeschreinerte Möbel benötigen 4-8 Wochen von der Planung bis zur Montage. Einfachere Arbeiten wie Türen oder Regale gehen schneller.' },
      { question: 'Kann ich eigene Designideen einbringen?', answer: 'Auf jeden Fall! Schreiner setzen Ihre individuellen Wünsche um und beraten Sie bei der praktischen Umsetzung.' },
      { question: 'Welches Holz ist am besten?', answer: 'Das hängt vom Einsatzbereich ab. Eiche und Nussbaum sind robust und edel, Fichte ist günstiger. Ihr Schreiner berät Sie zur optimalen Materialwahl.' },
      { question: 'Was kostet eine Massanfertigung?', answer: 'Massgeschreinerte Möbel sind teurer als Standardprodukte, aber perfekt auf Ihre Bedürfnisse zugeschnitten. Mit Büeze.ch vergleichen Sie mehrere Offerten.' }
    ],
    benefits: [
      'Massgeschneiderte Lösungen für Ihr Zuhause',
      'Hochwertige Handwerksarbeit',
      'Beratung zur Materialauswahl',
      'Präzise Massnehmen und Montage',
      'Garantie auf alle Schreinerarbeiten',
      'Mehrere Offerten kostenlos vergleichen'
    ]
  },
  raeumung_entsorgung: {
    id: 'raeumung_entsorgung',
    slug: 'raeumung-entsorgung',
    label: 'Räumung & Entsorgung',
    icon: Trash2,
    description: 'Räumungen, Entsorgung und individuelle Anfragen',
    subcategories: [
      'aufloesung_entsorgung',
      'umzug',
      'reinigung',
      'reinigung_hauswartung'
    ],
    color: 'from-gray-500 to-slate-600',
    showOnHome: false,
    faq: [
      { question: 'Wie lange dauert eine Wohnungsräumung?', answer: 'Das hängt von der Grösse und dem Füllgrad ab. Eine 3-Zimmer-Wohnung kann in 1-2 Tagen geräumt werden. Ihr Räumungsunternehmen erstellt einen Zeitplan.' },
      { question: 'Wird alles fachgerecht entsorgt?', answer: 'Ja, professionelle Räumungsfirmen trennen und entsorgen alle Materialien umweltgerecht. Wertvolle Gegenstände können auf Wunsch verwertet werden.' },
      { question: 'Was kostet eine Entrümpelung?', answer: 'Die Kosten richten sich nach Volumen und Aufwand. Mit Büeze.ch erhalten Sie transparente Offerten von mehreren Anbietern zum Vergleich.' },
      { question: 'Muss ich bei der Räumung dabei sein?', answer: 'Das ist nicht zwingend notwendig, aber empfohlen für die Absprache. Viele Räumungsfirmen bieten auch Komplettservice ohne Ihre Anwesenheit an.' }
    ],
    benefits: [
      'Schnelle und zuverlässige Räumung',
      'Fachgerechte Entsorgung aller Materialien',
      'Umweltfreundliche Verwertung',
      'Optional: Reinigung nach Räumung',
      'Faire Preise durch Wettbewerb',
      'Mehrere Offerten kostenlos vergleichen'
    ]
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
