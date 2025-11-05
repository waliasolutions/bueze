import { TreePine, Layers, Zap, Paintbrush, Truck, Grid3x3, Package, Sprout, Lightbulb, Palette, Box, Home, ChefHat, Wrench, Cable, Shield, Wifi, Smartphone, Car, Hammer, Droplet, Bath, Flame, Sun, Wind, Snowflake, DoorOpen, Package2, Trash2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface ServiceType {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface CategoryContent {
  formCategory: string;
  title: string;
  description: string;
  services: ServiceType[];
  faq: FAQItem[];
  metaTitle: string;
  metaDescription: string;
}

export const categoryContent: Record<string, CategoryContent> = {
  flooring: {
    formCategory: 'bodenleger',
    title: 'Parkett & Boden – Ihr Fussboden in Expertenhand',
    description: 'Von der Verlegung über die Reparatur bis zur Pflege: Finden Sie qualifizierte Bodenleger aus Ihrer Region. Erhalten Sie kostenlos mehrere Offerten und vergleichen Sie in Ruhe.',
    services: [
      {
        icon: Layers,
        title: 'Parkett & Laminat verlegen',
        description: 'Ob klassisches Eichenparkett oder pflegeleichtes Laminat – ein professionell verlegter Holzboden wertet jeden Raum auf. Unsere Bodenleger beraten Sie zu Material, Verlegemuster und Pflege, damit Ihr Fussboden lange schön bleibt.',
      },
      {
        icon: Grid3x3,
        title: 'Bodenfliesen & Platten',
        description: 'Fliesen in Steinoptik, Betonoptik oder klassischem Design – moderne Bodenfliesen sind vielseitig und langlebig. Lassen Sie sich von erfahrenen Fliesenlegern beraten und profitieren Sie von sauberer, fachgerechter Verlegung.',
      },
      {
        icon: Package,
        title: 'Flexible Bodenbeläge',
        description: 'Teppich sorgt für Wärme und Behaglichkeit, PVC und Linoleum überzeugen durch Pflegeleichtigkeit. Egal welcher Belag zu Ihrem Zuhause passt – finden Sie den richtigen Fachmann für eine reibungslose Umsetzung.',
      },
    ],
    faq: [
      {
        question: 'Wie lange dauert die Verlegung eines neuen Bodens?',
        answer: 'Das hängt von der Raumgrösse und dem Material ab. Parkett oder Laminat sind oft in 1-2 Tagen verlegt, während Fliesen mehr Zeit benötigen. Die Handwerker geben Ihnen in der Offerte eine genaue Zeitplanung.',
      },
      {
        question: 'Kann ich meinen alten Boden selbst entfernen?',
        answer: 'Grundsätzlich ja, aber viele Bodenleger bieten die Entfernung des alten Belags als Teil ihrer Leistung an. Das spart Zeit und sorgt für einen sauberen Untergrund.',
      },
      {
        question: 'Wie teuer ist ein neuer Fussboden?',
        answer: 'Die Kosten variieren je nach Material und Fläche. Laminat ist günstiger als Echtholzparkett, Fliesen liegen preislich dazwischen. Mit Büeze.ch erhalten Sie mehrere Offerten zum Vergleich – völlig kostenlos.',
      },
    ],
    metaTitle: 'Parkett & Boden verlegen',
    metaDescription: 'Finden Sie qualifizierte Bodenleger für Parkett, Laminat, Fliesen und mehr. Kostenlose Offerten aus Ihrer Region.',
  },
  
  garden: {
    formCategory: 'gartenbau',
    title: 'Gartenbau – Ihr Aussenbereich in besten Händen',
    description: 'Ob Neuanlage, Pflege oder Umgestaltung: Professionelle Gartenbauer verwandeln Ihren Aussenbereich in eine grüne Oase. Holen Sie kostenlos Offerten ein und finden Sie den passenden Fachmann.',
    services: [
      {
        icon: Sprout,
        title: 'Gartengestaltung & Bepflanzung',
        description: 'Von der Planung bis zur Umsetzung: Lassen Sie sich Ihren Traumgarten anlegen. Professionelle Gartenbauer beraten Sie bei der Pflanzenauswahl und setzen kreative Konzepte für Ihr Grün um.',
      },
      {
        icon: TreePine,
        title: 'Gartenpflege & Unterhalt',
        description: 'Regelmässiger Schnitt, Rasenpflege und Unkrautbekämpfung – für einen gepflegten Garten das ganze Jahr. Unsere Fachleute kümmern sich um alles, damit Sie Ihren Garten einfach geniessen können.',
      },
      {
        icon: Home,
        title: 'Terrassenbau & Wege',
        description: 'Schaffen Sie neue Lebensräume im Freien mit professionell angelegten Terrassen und Gartenwegen. Holz, Stein oder Beton – die Wahl liegt bei Ihnen.',
      },
    ],
    faq: [
      {
        question: 'Wann ist der beste Zeitpunkt für Gartenarbeiten?',
        answer: 'Das kommt auf die Art der Arbeit an. Pflanzungen erfolgen idealerweise im Frühjahr oder Herbst, während Rasenarbeiten und Schnitte über die ganze Vegetationsperiode möglich sind. Terrassenbau geht auch im Sommer.',
      },
      {
        question: 'Muss ich Pflanzen selbst besorgen?',
        answer: 'Die meisten Gartenbauer können Pflanzen direkt über ihre Partner beziehen und liefern. Das ist oft günstiger und spart Ihnen den Transport grosser Mengen.',
      },
      {
        question: 'Was kostet eine Gartenumgestaltung?',
        answer: 'Die Kosten variieren stark je nach Grösse und gewünschten Arbeiten. Eine einfache Bepflanzung ist günstiger als ein kompletter Terrassenbau. Mit Büeze.ch erhalten Sie mehrere Offerten zur freien Auswahl.',
      },
    ],
    metaTitle: 'Gartenbau & Gartengestaltung',
    metaDescription: 'Professionelle Gartenbauer für Gartengestaltung, Pflege und Terrassenbau. Kostenlose Offerten aus Ihrer Region.',
  },
  
  electrical: {
    formCategory: 'elektriker',
    title: 'Elektroarbeiten – Sicher und fachgerecht',
    description: 'Von der Steckdose bis zur Hausinstallation: Elektriker sorgen für Sicherheit und Komfort. Finden Sie qualifizierte Elektrofachkräfte aus Ihrer Region und erhalten Sie unverbindliche Offerten.',
    services: [
      {
        icon: Zap,
        title: 'Installation & Erweiterung',
        description: 'Neue Steckdosen, Lichtschalter oder komplette Elektroinstallationen – fachgerecht und nach Norm. Unsere Elektriker planen mit Ihnen die optimale Lösung für Ihr Zuhause.',
      },
      {
        icon: Lightbulb,
        title: 'Beleuchtungskonzepte',
        description: 'Indirektes Licht, LED-Strips oder moderne Lichtsysteme – setzen Sie Ihr Zuhause ins rechte Licht. Professionelle Elektrofachkräfte realisieren Ihre Beleuchtungswünsche.',
      },
      {
        icon: Zap,
        title: 'Reparatur & Wartung',
        description: 'Wenn\'s nicht mehr funktioniert: Schnelle Fehlersuche und zuverlässige Reparaturen. Von der Sicherung bis zum Verteilerkasten – unsere Elektriker lösen Ihr Problem.',
      },
    ],
    faq: [
      {
        question: 'Brauche ich für Elektroarbeiten eine Bewilligung?',
        answer: 'Für grössere Installationen kann eine Bewilligung nötig sein. Professionelle Elektriker wissen, welche Vorschriften gelten, und kümmern sich bei Bedarf um die Formalitäten.',
      },
      {
        question: 'Wie schnell kann ein Elektriker kommen?',
        answer: 'Bei Notfällen reagieren viele Elektriker innerhalb weniger Stunden. Für geplante Arbeiten vereinbaren Sie einfach einen passenden Termin über Büeze.ch.',
      },
      {
        question: 'Was kostet eine Elektroinstallation?',
        answer: 'Die Kosten hängen vom Umfang ab. Eine neue Steckdose ist günstiger als eine komplette Hausinstallation. Mit Büeze.ch vergleichen Sie Offerten und finden den besten Preis.',
      },
    ],
    metaTitle: 'Elektroarbeiten & Elektroinstallationen',
    metaDescription: 'Qualifizierte Elektriker für Installationen, Beleuchtung und Reparaturen. Kostenlose Offerten aus Ihrer Region.',
  },
  
  painting: {
    formCategory: 'maler',
    title: 'Malerarbeiten – Frische Farbe für Ihr Zuhause',
    description: 'Ein neuer Anstrich verleiht jedem Raum neues Leben. Finden Sie erfahrene Maler, die sauber arbeiten und Ihre Wünsche umsetzen. Holen Sie jetzt kostenlose Offerten ein.',
    services: [
      {
        icon: Paintbrush,
        title: 'Innenräume streichen',
        description: 'Ob Wohnzimmer, Schlafzimmer oder Flur – frische Farbe schafft Wohlfühlatmosphäre. Professionelle Maler beraten Sie bei der Farbwahl und sorgen für ein perfektes Ergebnis.',
      },
      {
        icon: Home,
        title: 'Fassadenanstrich',
        description: 'Schützen und verschönern Sie Ihre Hausfassade mit einem professionellen Aussenanstrich. Wetterbeständige Farben und saubere Ausführung garantieren lange Haltbarkeit.',
      },
      {
        icon: Palette,
        title: 'Spezialarbeiten',
        description: 'Spachteln, Tapezieren oder Effektlackierungen – für individuelle Gestaltungswünsche. Unsere Maler setzen auch ausgefallene Ideen professionell um.',
      },
    ],
    faq: [
      {
        question: 'Wie lange dauert ein Malerauftrag?',
        answer: 'Ein einzelnes Zimmer ist meist in 1-2 Tagen fertig. Bei grösseren Projekten oder Fassadenanstrichen kann es länger dauern. Ihr Maler informiert Sie vorab über die geplante Dauer.',
      },
      {
        question: 'Muss ich vorher ausräumen?',
        answer: 'Leichte Möbel können oft von den Malern verschoben werden. Wertvolle Gegenstände und Dekoration sollten Sie aber sicherheitshalber selbst aus dem Raum nehmen.',
      },
      {
        question: 'Was kostet ein Malerauftrag?',
        answer: 'Die Kosten hängen von der Fläche und der Art der Arbeit ab. Einfache Anstriche sind günstiger als Spezialarbeiten. Mit Büeze.ch vergleichen Sie mehrere Offerten kostenlos.',
      },
    ],
    metaTitle: 'Malerarbeiten & Anstrich',
    metaDescription: 'Erfahrene Maler für Innenräume, Fassaden und Spezialarbeiten. Kostenlose Offerten aus Ihrer Region.',
  },
  
  moving: {
    formCategory: 'transport',
    title: 'Transport & Umzug – Stressfrei von A nach B',
    description: 'Ob Privatumzug, Möbeltransport oder Räumung: Professionelle Helfer sparen Zeit und Nerven. Vergleichen Sie Offerten und finden Sie das passende Umzugsunternehmen.',
    services: [
      {
        icon: Truck,
        title: 'Privatumzug',
        description: 'Vom Packen bis zum Aufbau: Ein kompletter Umzugsservice für Ihr neues Zuhause. Professionelle Umzugshelfer kümmern sich um alles, damit Sie entspannt bleiben.',
      },
      {
        icon: Box,
        title: 'Möbeltransport',
        description: 'Einzelne Möbelstücke sicher und schnell transportiert – auch für schwere oder sperrige Teile. Unsere Partner haben das richtige Equipment und die Erfahrung.',
      },
      {
        icon: Package,
        title: 'Entsorgung & Räumung',
        description: 'Entrümpelung, Entsorgung oder Räumung von Wohnungen, Kellern und Dachböden. Die Profis übernehmen den gesamten Prozess – von der Demontage bis zur fachgerechten Entsorgung.',
      },
    ],
    faq: [
      {
        question: 'Wie lange vorher sollte ich einen Umzug planen?',
        answer: 'Je früher, desto besser. Mindestens 2-4 Wochen Vorlauf sind ideal, besonders in der Hochsaison (Frühling und Sommer). So haben Sie mehr Auswahl bei den Anbietern.',
      },
      {
        question: 'Sind meine Möbel versichert?',
        answer: 'Seriöse Umzugsunternehmen verfügen über eine Haftpflichtversicherung. Klären Sie die Details aber vorab in der Offerte und dokumentieren Sie wertvolle Gegenstände.',
      },
      {
        question: 'Was kostet ein Umzug?',
        answer: 'Die Kosten hängen von der Distanz, der Menge und den gewünschten Leistungen ab. Ein lokaler Umzug ist günstiger als ein Fernumzug. Mit Büeze.ch vergleichen Sie mehrere Angebote.',
      },
    ],
    metaTitle: 'Transport & Umzug',
    metaDescription: 'Professionelle Umzugsunternehmen für Privatumzüge, Möbeltransport und Räumungen. Kostenlose Offerten aus Ihrer Region.',
  },
  
  kitchen: {
    formCategory: 'kuechenbau',
    title: 'Küchenbau – Ihre Traumküche professionell umgesetzt',
    description: 'Von der Planung bis zur Montage: Erfahrene Küchenbauer realisieren Ihre Wunschküche. Ob moderne Einbauküche oder individuelle Massanfertigung – holen Sie kostenlos mehrere Offerten ein.',
    services: [
      {
        icon: ChefHat,
        title: 'Küchenplanung & -montage',
        description: 'Professionelle Planung und fachgerechte Montage Ihrer neuen Küche. Von der ersten Skizze bis zur Installation aller Geräte – unsere Küchenbauer begleiten Sie durch den gesamten Prozess.',
      },
      {
        icon: Box,
        title: 'Massküchen & Einbauküchen',
        description: 'Ob standardisierte Einbauküche oder massgeschneiderte Lösung – finden Sie den passenden Experten für Ihr Projekt. Hochwertige Materialien und präzise Verarbeitung garantiert.',
      },
      {
        icon: Wrench,
        title: 'Küchenrenovation',
        description: 'Ihre Küche braucht eine Auffrischung? Von der Erneuerung der Fronten bis zur kompletten Umgestaltung – erfahrene Handwerker verleihen Ihrer Küche neues Leben.',
      },
    ],
    faq: [
      {
        question: 'Wie lange dauert eine Küchenmontage?',
        answer: 'Eine durchschnittliche Küche ist in 2-4 Tagen komplett montiert und einsatzbereit. Der genaue Zeitrahmen hängt von der Grösse und Komplexität ab. Die Handwerker informieren Sie vorab über den Ablauf.',
      },
      {
        question: 'Muss ich meine alte Küche selbst ausbauen?',
        answer: 'Die meisten Küchenbauer bieten den Ausbau der alten Küche als Teil ihrer Leistung an. Das ist praktisch und stellt sicher, dass der Raum optimal für die neue Küche vorbereitet wird.',
      },
      {
        question: 'Was kostet eine neue Küche?',
        answer: 'Die Kosten variieren stark je nach Grösse, Ausstattung und Material. Eine Standardküche ist günstiger als eine Massanfertigung. Mit Büeze.ch erhalten Sie mehrere Offerten und können Preise transparent vergleichen.',
      },
      {
        question: 'Sind die Geräte in der Offerte enthalten?',
        answer: 'Das kommt auf den Anbieter an. Manche Küchenbauer liefern Komplettlösungen inklusive Geräte, andere nur die Möbel. Klären Sie dies direkt in der Offerte.',
      },
    ],
    metaTitle: 'Küchenbau & Küchenmontage',
    metaDescription: 'Professionelle Küchenbauer für Planung, Montage und Renovation. Kostenlose Offerten aus Ihrer Region.',
  },

  // Elektroinstallationen subcategories
  'elektro-hausinstallationen': {
    formCategory: 'elektro_hausinstallationen',
    title: 'Hausinstallationen – Professionelle Elektroinstallation',
    description: 'Vom Neubau bis zur Sanierung: Fachgerechte Elektroinstallationen nach Schweizer Normen (NIV)',
    services: [
      {
        icon: Cable,
        title: 'Neuinstallationen',
        description: 'Komplette Elektroinstallation für Neubauten und Umbauten mit Planung, Ausführung und Abnahme'
      },
      {
        icon: Zap,
        title: 'Leitungen & Kabelzüge',
        description: 'Verlegung von Steigleitungen, Installationsleitungen und Kabelkanälen'
      },
      {
        icon: Lightbulb,
        title: 'Steckdosen & Schalter',
        description: 'Installation von Steckdosen, Lichtschaltern, Dimmern und USB-Steckdosen'
      }
    ],
    faq: [
      {
        question: 'Benötige ich eine Bewilligung für Elektroinstallationen?',
        answer: 'Für grössere Installationen ist eine Meldung beim lokalen Elektrizitätswerk erforderlich. Ihr Elektriker kümmert sich um alle Formalitäten und erstellt den Sicherheitsnachweis (SiNa).'
      },
      {
        question: 'Wie lange dauert eine Hausinstallation?',
        answer: 'Das hängt von der Grösse des Projekts ab. Für eine durchschnittliche Wohnung (3.5 Zimmer) rechnet man mit 3-5 Arbeitstagen für die Rohinstallation.'
      }
    ],
    metaTitle: 'Elektroinstallation Schweiz - Hausinstallationen | Büeze.ch',
    metaDescription: 'Professionelle Hausinstallationen: Steckdosen, Leitungen, Schalter. Geprüfte Elektriker aus Ihrer Region.'
  },

  'elektro-beleuchtung': {
    formCategory: 'elektro_beleuchtung',
    title: 'Beleuchtung & Leuchtenmontage',
    description: 'LED-Umrüstung, Spots, Decken-/Pendelleuchten und moderne Lichtkonzepte vom Fachmann',
    services: [
      {
        icon: Lightbulb,
        title: 'LED-Umrüstung',
        description: 'Energiesparende LED-Beleuchtung für alle Räume'
      },
      {
        icon: Zap,
        title: 'Spots & Einbauleuchten',
        description: 'Moderne Spotbeleuchtung für optimale Raumausleuchtung'
      },
      {
        icon: Shield,
        title: 'Bewegungsmelder',
        description: 'Automatische Beleuchtung für Komfort und Sicherheit'
      }
    ],
    faq: [
      {
        question: 'Lohnt sich die Umrüstung auf LED?',
        answer: 'Ja! LED-Leuchten sparen bis zu 80% Energie und halten 10-mal länger als herkömmliche Glühbirnen.'
      }
    ],
    metaTitle: 'Beleuchtung & LED-Umrüstung | Büeze.ch',
    metaDescription: 'LED-Beleuchtung und Leuchtenmontage vom Elektriker. Energieeffizient und modern.'
  },

  'elektro-smart-home': {
    formCategory: 'elektro_smart_home',
    title: 'Smart Home & Automation',
    description: 'KNX, Loxone, Shelly, Hue – Ihr Zuhause intelligent steuern',
    services: [
      {
        icon: Smartphone,
        title: 'Smart Home Systeme',
        description: 'KNX, Loxone oder Shelly für intelligente Haussteuerung'
      },
      {
        icon: Wifi,
        title: 'Vernetzung',
        description: 'Beleuchtung, Heizung, Jalousien zentral steuern'
      },
      {
        icon: Shield,
        title: 'Sicherheit',
        description: 'Alarmanlagen und Überwachung integrieren'
      }
    ],
    faq: [
      {
        question: 'Welches Smart Home System ist das beste?',
        answer: 'Das hängt von Ihren Bedürfnissen ab. KNX ist der Standard für Neubauten, Shelly ideal für Nachrüstungen.'
      }
    ],
    metaTitle: 'Smart Home Installation | Büeze.ch',
    metaDescription: 'Smart Home Systeme installieren: KNX, Loxone, Shelly. Experten aus Ihrer Region.'
  },

  'elektro-wallbox': {
    formCategory: 'elektro_wallbox',
    title: 'E-Mobilität – Wallbox Installation',
    description: 'Ladestation für Ihr Elektroauto professionell installiert',
    services: [
      {
        icon: Car,
        title: 'Wallbox Installation',
        description: 'Ladestation für Ihr Zuhause fachgerecht installiert'
      },
      {
        icon: Zap,
        title: 'Lastmanagement',
        description: 'Intelligente Steuerung für optimale Stromnutzung'
      },
      {
        icon: Shield,
        title: 'Anmeldung Netzbetreiber',
        description: 'Wir übernehmen alle Formalitäten'
      }
    ],
    faq: [
      {
        question: 'Benötige ich eine Bewilligung für eine Wallbox?',
        answer: 'Ja, Wallboxen ab 3.7 kW müssen beim Netzbetreiber angemeldet werden. Ihr Elektriker erledigt das für Sie.'
      }
    ],
    metaTitle: 'Wallbox Installation Schweiz | Büeze.ch',
    metaDescription: 'Wallbox für Elektroauto installieren. Professionell vom Elektriker.'
  },

  // Bodenbeläge subcategories
  'parkett-laminat': {
    formCategory: 'parkett_laminat',
    title: 'Parkett und Laminat',
    description: 'Hochwertige Holzböden professionell verlegt',
    services: [
      {
        icon: Layers,
        title: 'Parkettverlegung',
        description: 'Echtholzparkett in allen Varianten'
      },
      {
        icon: Grid3x3,
        title: 'Laminat',
        description: 'Pflegeleicht und robust'
      },
      {
        icon: Wrench,
        title: 'Renovation',
        description: 'Abschleifen und neu versiegeln'
      }
    ],
    faq: [
      {
        question: 'Was ist besser: Parkett oder Laminat?',
        answer: 'Parkett ist hochwertiger und kann mehrfach abgeschliffen werden. Laminat ist günstiger und pflegeleichter.'
      }
    ],
    metaTitle: 'Parkett & Laminat verlegen | Büeze.ch',
    metaDescription: 'Parkett und Laminat vom Bodenleger. Professionelle Verlegung.'
  },

  'bodenfliesen': {
    formCategory: 'bodenfliese',
    title: 'Bodenfliesen',
    description: 'Fliesen verlegen für Bad, Küche und alle Wohnräume',
    services: [
      {
        icon: Grid3x3,
        title: 'Fliesenverlegung',
        description: 'Keramik, Naturstein, Feinsteinzeug'
      },
      {
        icon: Bath,
        title: 'Nassbereiche',
        description: 'Fachgerechte Abdichtung für Bad und Dusche'
      },
      {
        icon: Wrench,
        title: 'Fugenarbeiten',
        description: 'Saubere Verfugung für perfektes Finish'
      }
    ],
    faq: [
      {
        question: 'Wie lange muss ich warten bis ich die Fliesen belasten kann?',
        answer: 'Nach 24-48 Stunden ist die Fläche begehbar, vollständig belastbar nach 7 Tagen.'
      }
    ],
    metaTitle: 'Bodenfliesen verlegen | Büeze.ch',
    metaDescription: 'Bodenfliesen vom Plattenleger. Professionell verlegt.'
  },

  // Sanitär subcategories
  'badewanne-dusche': {
    formCategory: 'badewanne_dusche',
    title: 'Badewanne und Dusche',
    description: 'Badewannen und Duschen fachgerecht installiert',
    services: [
      {
        icon: Bath,
        title: 'Badewannen',
        description: 'Installation aller Wannentypen'
      },
      {
        icon: Droplet,
        title: 'Duschanlagen',
        description: 'Bodengleiche Duschen und Duschkabinen'
      },
      {
        icon: Wrench,
        title: 'Armaturen',
        description: 'Mischer, Thermostate, Regenduschen'
      }
    ],
    faq: [
      {
        question: 'Was kostet eine neue Dusche?',
        answer: 'Das hängt von der Ausstattung ab. Eine einfache Duschkabine ab CHF 2000, bodengleiche Duschen ab CHF 4000.'
      }
    ],
    metaTitle: 'Badewanne & Dusche installieren | Büeze.ch',
    metaDescription: 'Badewanne und Dusche vom Sanitär. Professionelle Installation.'
  },

  // Heizung subcategories
  'fussbodenheizung': {
    formCategory: 'fussbodenheizung',
    title: 'Fussbodenheizung',
    description: 'Behagliche Wärme vom Boden – Installation und Service',
    services: [
      {
        icon: Flame,
        title: 'Neuinstallation',
        description: 'Fussbodenheizung für Neubau und Renovation'
      },
      {
        icon: Wind,
        title: 'Wartung',
        description: 'Regelmässige Kontrolle und Spülung'
      },
      {
        icon: Wrench,
        title: 'Reparatur',
        description: 'Schnelle Hilfe bei Problemen'
      }
    ],
    faq: [
      {
        question: 'Eignet sich Fussbodenheizung für Parkett?',
        answer: 'Ja, mit geeignetem Parkett und korrekter Installation ist das problemlos möglich.'
      }
    ],
    metaTitle: 'Fussbodenheizung installieren | Büeze.ch',
    metaDescription: 'Fussbodenheizung vom Heizungsinstallateur. Professionell installiert.'
  },

  'photovoltaik': {
    formCategory: 'photovoltaik',
    title: 'Photovoltaik & Batteriespeicher',
    description: 'Solarstrom vom eigenen Dach – nachhaltig und rentabel',
    services: [
      {
        icon: Sun,
        title: 'PV-Anlagen',
        description: 'Planung und Installation von Solaranlagen'
      },
      {
        icon: Package2,
        title: 'Batteriespeicher',
        description: 'Stromspeicher für maximale Eigennutzung'
      },
      {
        icon: Zap,
        title: 'Anmeldung',
        description: 'Alle Formalitäten inklusive'
      }
    ],
    faq: [
      {
        question: 'Lohnt sich eine PV-Anlage in der Schweiz?',
        answer: 'Ja! Mit Förderungen, steigenden Strompreisen und Eigenverbrauch amortisiert sich eine Anlage in 10-15 Jahren.'
      }
    ],
    metaTitle: 'Photovoltaik & Solar | Büeze.ch',
    metaDescription: 'PV-Anlage installieren. Solarstrom vom eigenen Dach.'
  },

  // Küche subcategories
  'kuechenplanung': {
    formCategory: 'kuechenplanung',
    title: 'Küchenplanung',
    description: 'Professionelle Küchenplanung für Ihre Traumküche',
    services: [
      {
        icon: ChefHat,
        title: '3D-Planung',
        description: 'Visualisierung Ihrer neuen Küche'
      },
      {
        icon: Home,
        title: 'Beratung',
        description: 'Auswahl von Material und Geräten'
      },
      {
        icon: Wrench,
        title: 'Umsetzung',
        description: 'Von der Planung bis zur Montage'
      }
    ],
    faq: [
      {
        question: 'Was kostet eine Küchenplanung?',
        answer: 'Viele Küchenbauer bieten die Planung kostenlos an, wenn Sie die Küche auch bei ihnen kaufen.'
      }
    ],
    metaTitle: 'Küchenplanung Schweiz | Büeze.ch',
    metaDescription: 'Küche planen vom Profi. 3D-Visualisierung und Beratung.'
  },

  // Bau & Renovation
  'metallbau': {
    formCategory: 'metallbau',
    title: 'Metallbau',
    description: 'Metallkonstruktionen, Geländer, Treppen und mehr',
    services: [
      {
        icon: Hammer,
        title: 'Geländer',
        description: 'Innen- und Aussengeländer aus Metall'
      },
      {
        icon: DoorOpen,
        title: 'Metalltreppen',
        description: 'Massgeschneiderte Treppenkonstruktionen'
      },
      {
        icon: Wrench,
        title: 'Konstruktionen',
        description: 'Stahl- und Aluminium-Arbeiten'
      }
    ],
    faq: [
      {
        question: 'Welches Material ist besser: Stahl oder Aluminium?',
        answer: 'Stahl ist stabiler, Aluminium korrosionsbeständig und leichter. Die Wahl hängt vom Einsatzbereich ab.'
      }
    ],
    metaTitle: 'Metallbau Schweiz | Büeze.ch',
    metaDescription: 'Metallbau: Geländer, Treppen, Konstruktionen. Vom Fachmann.'
  },

  // Räumung & Entsorgung
  'aufloesung-entsorgung': {
    formCategory: 'aufloesung_entsorgung',
    title: 'Auflösung und Entsorgung',
    description: 'Wohnungsauflösungen und professionelle Entsorgung',
    services: [
      {
        icon: Trash2,
        title: 'Wohnungsauflösung',
        description: 'Komplette Räumung von Wohnungen und Häusern'
      },
      {
        icon: Truck,
        title: 'Entsorgung',
        description: 'Fachgerechte Entsorgung aller Materialien'
      },
      {
        icon: Package,
        title: 'Entrümpelung',
        description: 'Keller, Dachboden, Garage'
      }
    ],
    faq: [
      {
        question: 'Was kostet eine Wohnungsauflösung?',
        answer: 'Das hängt von Grösse und Menge ab. Durchschnittlich CHF 1500-3000 für eine 3-Zimmer-Wohnung.'
      }
    ],
    metaTitle: 'Wohnungsauflösung & Entsorgung | Büeze.ch',
    metaDescription: 'Wohnungsauflösung und Entrümpelung. Professionell und zuverlässig.'
  },

  // Additional Bau & Renovation
  'holzbau': {
    formCategory: 'holzbau',
    title: 'Holzbau & Zimmerei',
    description: 'Dachstühle, Carports und Holzkonstruktionen vom Zimmermann',
    services: [
      {
        icon: Home,
        title: 'Dachstühle',
        description: 'Dachkonstruktionen fachgerecht erstellt'
      },
      {
        icon: Car,
        title: 'Carports',
        description: 'Holz-Carports nach Mass'
      },
      {
        icon: TreePine,
        title: 'Holzkonstruktionen',
        description: 'Balkone, Pergolen, Überdachungen'
      }
    ],
    faq: [
      {
        question: 'Welches Holz für Aussenarbeiten?',
        answer: 'Lärche und Douglasie sind ideal für Aussenbereich. Alternativ druckimprägniertes Nadelholz.'
      }
    ],
    metaTitle: 'Holzbau & Zimmerei Schweiz | Büeze.ch',
    metaDescription: 'Holzbau: Dachstühle, Carports, Konstruktionen. Zimmerer aus Ihrer Region.'
  },

  'mauerarbeit': {
    formCategory: 'mauerarbeit',
    title: 'Mauerarbeiten & Verputzen',
    description: 'Mauern, Verputzen und Steinarbeiten vom Maurer',
    services: [
      {
        icon: Hammer,
        title: 'Mauerwerk',
        description: 'Neue Mauern und Trennwände'
      },
      {
        icon: Home,
        title: 'Verputzarbeiten',
        description: 'Innen- und Aussenputz'
      }
    ],
    faq: [
      {
        question: 'Was kostet Mauerwerk pro m²?',
        answer: 'Ca. CHF 150-250 pro m² inklusive Material, abhängig von Steinart.'
      }
    ],
    metaTitle: 'Mauerarbeiten & Verputzen | Büeze.ch',
    metaDescription: 'Maurer für Mauerwerk und Verputzarbeiten. Kostenlose Offerten.'
  },

  'betonarbeiten': {
    formCategory: 'betonarbeiten',
    title: 'Betonarbeiten',
    description: 'Fundamente, Bodenplatten und Betonkonstruktionen',
    services: [
      {
        icon: Hammer,
        title: 'Fundamente',
        description: 'Betonfundamente für Gebäude'
      },
      {
        icon: Layers,
        title: 'Bodenplatten',
        description: 'Betonböden und Platten'
      }
    ],
    faq: [
      {
        question: 'Wie lange muss Beton trocknen?',
        answer: 'Nach 28 Tagen erreicht Beton seine volle Festigkeit.'
      }
    ],
    metaTitle: 'Betonarbeiten Schweiz | Büeze.ch',
    metaDescription: 'Betonarbeiten: Fundamente, Platten. Kostenlose Offerten.'
  },

  'fundament': {
    formCategory: 'fundament',
    title: 'Fundamente',
    description: 'Fundamente für Gebäude, Garagen und Anbauten',
    services: [
      {
        icon: Layers,
        title: 'Streifenfundamente',
        description: 'Klassische Fundamente für Wände'
      },
      {
        icon: Package,
        title: 'Punktfundamente',
        description: 'Für Stützen und Pfosten'
      }
    ],
    faq: [
      {
        question: 'Wie tief muss ein Fundament sein?',
        answer: 'Mindestens 80cm frostfrei, je nach Bodenqualität auch tiefer.'
      }
    ],
    metaTitle: 'Fundamente erstellen | Büeze.ch',
    metaDescription: 'Fundamente professionell erstellt. Kostenlose Offerten.'
  },

  'kernbohrungen': {
    formCategory: 'kernbohrungen',
    title: 'Kernbohrungen & Durchbrüche',
    description: 'Präzise Bohrungen durch Beton, Mauerwerk und Stein',
    services: [
      {
        icon: Hammer,
        title: 'Kernbohrungen',
        description: 'Saubere Durchbrüche für Leitungen'
      },
      {
        icon: Wrench,
        title: 'Wanddurchbrüche',
        description: 'Türen und Fensteröffnungen'
      }
    ],
    faq: [
      {
        question: 'Was kostet eine Kernbohrung?',
        answer: 'Ab ca. CHF 150 je nach Durchmesser und Wandstärke.'
      }
    ],
    metaTitle: 'Kernbohrungen Schweiz | Büeze.ch',
    metaDescription: 'Kernbohrungen und Durchbrüche. Sauber und präzise.'
  },

  'abbruch-durchbruch': {
    formCategory: 'abbruch_durchbruch',
    title: 'Abbruch & Durchbruch',
    description: 'Abbrucharbeiten und Wanddurchbrüche',
    services: [
      {
        icon: Hammer,
        title: 'Abbrucharbeiten',
        description: 'Teilabbrüche und Rückbau'
      },
      {
        icon: DoorOpen,
        title: 'Wanddurchbrüche',
        description: 'Öffnungen für Türen und Fenster'
      }
    ],
    faq: [
      {
        question: 'Brauche ich eine Bewilligung?',
        answer: 'Für tragende Wände meist ja. Ihr Handwerker berät Sie.'
      }
    ],
    metaTitle: 'Abbruch & Durchbruch | Büeze.ch',
    metaDescription: 'Abbrucharbeiten und Durchbrüche. Kostenlose Offerten.'
  },

  'renovierung-sonstige': {
    formCategory: 'renovierung_sonstige',
    title: 'Sonstige Renovationsarbeiten',
    description: 'Diverse Umbau- und Renovationsarbeiten',
    services: [
      {
        icon: Wrench,
        title: 'Renovationen',
        description: 'Umfassende Renovationsprojekte'
      },
      {
        icon: Home,
        title: 'Umbauarbeiten',
        description: 'Umbauten und Anpassungen'
      }
    ],
    faq: [
      {
        question: 'Was gehört zur Renovation?',
        answer: 'Von einfachen Reparaturen bis zur Totalsanierung ist alles möglich.'
      }
    ],
    metaTitle: 'Renovationsarbeiten | Büeze.ch',
    metaDescription: 'Renovationen und Umbauarbeiten. Kostenlose Offerten.'
  },

  'garage-carport': {
    formCategory: 'garage_carport',
    title: 'Garage & Carport',
    description: 'Garagen, Garagentore und Carports',
    services: [
      {
        icon: Car,
        title: 'Garagenbau',
        description: 'Fertig- und Massgaragen'
      },
      {
        icon: DoorOpen,
        title: 'Garagentore',
        description: 'Sektional- und Schwing tore'
      },
      {
        icon: Home,
        title: 'Carports',
        description: 'Offene Überdachungen für Fahrzeuge'
      }
    ],
    faq: [
      {
        question: 'Was ist günstiger - Garage oder Carport?',
        answer: 'Carports sind deutlich günstiger und schneller erstellt.'
      }
    ],
    metaTitle: 'Garage & Carport bauen | Büeze.ch',
    metaDescription: 'Garagen und Carports vom Fachmann. Kostenlose Offerten.'
  },

  'aussenarbeiten-sonstige': {
    formCategory: 'aussenarbeiten_sonstige',
    title: 'Sonstige Aussenarbeiten',
    description: 'Diverse Arbeiten rund ums Haus',
    services: [
      {
        icon: Home,
        title: 'Fassadenarbeiten',
        description: 'Fassadenreinigung und -sanierung'
      },
      {
        icon: Hammer,
        title: 'Aussenanlagen',
        description: 'Wege, Mauern, Treppen'
      }
    ],
    faq: [
      {
        question: 'Was zählt zu Aussenarbeiten?',
        answer: 'Alle Arbeiten ausserhalb des Gebäudes: Fassade, Garten, Zufahrt, etc.'
      }
    ],
    metaTitle: 'Aussenarbeiten | Büeze.ch',
    metaDescription: 'Aussenarbeiten rund ums Haus. Kostenlose Offerten.'
  },
};
