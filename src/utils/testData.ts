// Test data utilities for QA testing
import { supabase } from "@/integrations/supabase/client";

export interface TestUser {
  email: string;
  password: string;
  role: 'homeowner' | 'handwerker';
  profile: {
    full_name: string;
    first_name: string;
    last_name: string;
    phone?: string;
    canton?: string;
    city?: string;
    zip?: string;
  };
  handwerkerProfile?: {
    categories: ('elektriker' | 'sanitaer' | 'heizung' | 'klimatechnik' | 'maler' | 'gipser' | 'bodenleger' | 'plattenleger' | 'schreiner' | 'maurer' | 'zimmermann' | 'dachdecker' | 'fassadenbauer' | 'gartenbau' | 'pflasterarbeiten' | 'zaun_torbau' | 'fenster_tueren' | 'kuechenbau' | 'badumbau' | 'umzug' | 'reinigung' | 'schlosserei' | 'spengler')[];
    hourly_rate_min: number;
    hourly_rate_max: number;
    bio: string;
    service_areas: string[];
    languages: string[];
  };
}

export interface TestLead {
  title: string;
  description: string;
  category: 'elektriker' | 'sanitaer' | 'heizung' | 'klimatechnik' | 'maler' | 'gipser' | 'bodenleger' | 'plattenleger' | 'schreiner' | 'maurer' | 'zimmermann' | 'dachdecker' | 'fassadenbauer' | 'gartenbau' | 'pflasterarbeiten' | 'zaun_torbau' | 'fenster_tueren' | 'kuechenbau' | 'badumbau' | 'umzug' | 'reinigung' | 'schlosserei' | 'spengler';
  budget_min: number;
  budget_max: number;
  urgency: 'today' | 'this_week' | 'this_month' | 'planning';
  canton: 'AG' | 'AI' | 'AR' | 'BE' | 'BL' | 'BS' | 'FR' | 'GE' | 'GL' | 'GR' | 'JU' | 'LU' | 'NE' | 'NW' | 'OW' | 'SG' | 'SH' | 'SO' | 'SZ' | 'TG' | 'TI' | 'UR' | 'VD' | 'VS' | 'ZG' | 'ZH';
  city: string;
  zip: string;
  status: 'draft' | 'active' | 'closed' | 'cancelled';
}

export const testUsers: TestUser[] = [
  // Auftraggeber (Homeowners)
  {
    email: "maria.mueller@test.ch",
    password: "TestPass123!",
    role: "homeowner",
    profile: {
      full_name: "Maria Müller",
      first_name: "Maria",
      last_name: "Müller",
      phone: "+41 44 123 45 67",
      canton: "ZH",
      city: "Zürich",
      zip: "8001"
    }
  },
  {
    email: "peter.schmid@test.ch",
    password: "TestPass123!",
    role: "homeowner",
    profile: {
      full_name: "Peter Schmid",
      first_name: "Peter",
      last_name: "Schmid",
      phone: "+41 31 987 65 43",
      canton: "BE",
      city: "Bern",
      zip: "3000"
    }
  },
  {
    email: "anna.weber@test.ch", 
    password: "TestPass123!",
    role: "homeowner",
    profile: {
      full_name: "Anna Weber",
      first_name: "Anna",
      last_name: "Weber",
      phone: "+41 61 555 12 34",
      canton: "BS",
      city: "Basel",
      zip: "4001"
    }
  },
  {
    email: "claudia.meyer@test.ch",
    password: "TestPass123!",
    role: "homeowner",
    profile: {
      full_name: "Claudia Meyer",
      first_name: "Claudia",
      last_name: "Meyer",
      phone: "+41 22 678 90 12",
      canton: "GE",
      city: "Genève",
      zip: "1200"
    }
  },
  {
    email: "daniel.fischer@test.ch",
    password: "TestPass123!",
    role: "homeowner",
    profile: {
      full_name: "Daniel Fischer",
      first_name: "Daniel",
      last_name: "Fischer",
      phone: "+41 71 456 78 90",
      canton: "SG",
      city: "St. Gallen",
      zip: "9000"
    }
  },

  // Handwerker (Craftsmen)
  {
    email: "thomas.zimmermann@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Thomas Zimmermann",
      first_name: "Thomas", 
      last_name: "Zimmermann",
      phone: "+41 44 777 88 99",
      canton: "ZH",
      city: "Winterthur",
      zip: "8400"
    },
    handwerkerProfile: {
      categories: ["sanitaer", "heizung"],
      hourly_rate_min: 80,
      hourly_rate_max: 120,
      bio: "Erfahrener Sanitär- und Heizungsinstallateur mit 15 Jahren Berufserfahrung. Spezialisiert auf Badezimmerrenovationen und moderne Heizsysteme.",
      service_areas: ["Zürich", "Winterthur", "Uster"],
      languages: ["de", "en"]
    }
  },
  {
    email: "marco.ferrari@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Marco Ferrari",
      first_name: "Marco",
      last_name: "Ferrari",
      phone: "+41 31 666 77 88",
      canton: "BE",
      city: "Thun",
      zip: "3600"
    },
    handwerkerProfile: {
      categories: ["elektriker"],
      hourly_rate_min: 90,
      hourly_rate_max: 140,
      bio: "Zertifizierter Elektroinstallateur mit Spezialisierung auf Smart Home Systeme und Photovoltaik-Anlagen. Kundenorientiert und zuverlässig.",
      service_areas: ["Bern", "Thun", "Interlaken"],
      languages: ["de", "it", "fr"]
    }
  },
  {
    email: "stefan.meier@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Stefan Meier",
      first_name: "Stefan",
      last_name: "Meier",
      phone: "+41 61 444 55 66",
      canton: "BS",
      city: "Basel",
      zip: "4052"
    },
    handwerkerProfile: {
      categories: ["schreiner"],
      hourly_rate_min: 70,
      hourly_rate_max: 110,
      bio: "Traditioneller Schreiner mit modernen Ansätzen. Über 20 Jahre Erfahrung in Möbelbau, Innenausbau und Renovierungsarbeiten.",
      service_areas: ["Basel", "Liestal", "Allschwil"],
      languages: ["de", "fr"]
    }
  },
  {
    email: "andrea.rossi@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Andrea Rossi",
      first_name: "Andrea",
      last_name: "Rossi",
      phone: "+41 44 333 22 11",
      canton: "ZH",
      city: "Kloten",
      zip: "8302"
    },
    handwerkerProfile: {
      categories: ["maler"],
      hourly_rate_min: 60,
      hourly_rate_max: 95,
      bio: "Professioneller Maler und Renovationsspezialist. Hochwertige Ausführung von Innen- und Aussenarbeiten mit Fokus auf Nachhaltigkeit.",
      service_areas: ["Zürich", "Kloten", "Dübendorf"],
      languages: ["de", "it"]
    }
  },
  {
    email: "patrick.mueller@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Patrick Müller",
      first_name: "Patrick",
      last_name: "Müller",
      phone: "+41 44 678 90 12",
      canton: "ZH",
      city: "Rüti",
      zip: "8630"
    },
    handwerkerProfile: {
      categories: ["maurer", "zimmermann"],
      hourly_rate_min: 85,
      hourly_rate_max: 125,
      bio: "Maurermeister mit eigener Firma. 25 Jahre Erfahrung im Neubau und Renovation. Spezialisiert auf Einfamilienhäuser und Umbauten.",
      service_areas: ["Zürich", "Rapperswil", "Rüti", "Uster"],
      languages: ["de"]
    }
  },
  {
    email: "francois.dubois@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "François Dubois",
      first_name: "François",
      last_name: "Dubois",
      phone: "+41 22 345 67 89",
      canton: "GE",
      city: "Genève",
      zip: "1205"
    },
    handwerkerProfile: {
      categories: ["kuechenbau", "schreiner"],
      hourly_rate_min: 95,
      hourly_rate_max: 150,
      bio: "Ébéniste et cuisiniste haut de gamme. Créations sur mesure avec matériaux nobles. 18 ans d'expérience dans le luxe et la rénovation.",
      service_areas: ["Genève", "Lausanne", "Nyon"],
      languages: ["fr", "de", "en"]
    }
  },
  {
    email: "reto.huber@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Reto Huber",
      first_name: "Reto",
      last_name: "Huber",
      phone: "+41 71 234 56 78",
      canton: "SG",
      city: "St. Gallen",
      zip: "9016"
    },
    handwerkerProfile: {
      categories: ["dachdecker", "zimmermann"],
      hourly_rate_min: 75,
      hourly_rate_max: 115,
      bio: "Dachdeckermeister mit Fokus auf Steildach und Flachdach. Solarpanels Installation und energetische Sanierung. Zuverlässig seit 20 Jahren.",
      service_areas: ["St. Gallen", "Appenzell", "Gossau"],
      languages: ["de"]
    }
  },
  {
    email: "mario.bianchi@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Mario Bianchi",
      first_name: "Mario",
      last_name: "Bianchi",
      phone: "+41 91 567 89 01",
      canton: "TI",
      city: "Lugano",
      zip: "6900"
    },
    handwerkerProfile: {
      categories: ["gipser", "maler"],
      hourly_rate_min: 65,
      hourly_rate_max: 100,
      bio: "Specialista in intonaci decorativi e pitture di pregio. Restauro e ristrutturazione con tecniche tradizionali e moderne. Qualità garantita.",
      service_areas: ["Lugano", "Bellinzona", "Locarno"],
      languages: ["it", "de", "fr"]
    }
  },
  // Additional comprehensive handwerker profiles
  {
    email: "lisa.schneider@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Lisa Schneider",
      first_name: "Lisa",
      last_name: "Schneider",
      phone: "+41 44 789 01 23",
      canton: "ZH",
      city: "Zürich",
      zip: "8044"
    },
    handwerkerProfile: {
      categories: ["bodenleger", "plattenleger"],
      hourly_rate_min: 75,
      hourly_rate_max: 110,
      bio: "Spezialistin für hochwertigen Bodenbelag und Fliesenverlegung. Parkett, Laminat, Naturstein und Keramik. 12 Jahre Erfahrung in exklusiven Projekten mit Fokus auf Präzision und Ästhetik.",
      service_areas: ["Zürich", "Zug", "Pfäffikon"],
      languages: ["de", "en"]
    }
  },
  {
    email: "jean.martin@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Jean Martin",
      first_name: "Jean",
      last_name: "Martin",
      phone: "+41 21 456 78 90",
      canton: "VD",
      city: "Lausanne",
      zip: "1000"
    },
    handwerkerProfile: {
      categories: ["fenster_tueren", "schreiner"],
      hourly_rate_min: 85,
      hourly_rate_max: 130,
      bio: "Artisan menuisier spécialisé dans les fenêtres et portes sur mesure. Matériaux nobles, isolation optimale, design contemporain. Solutions énergétiques performantes avec 20 ans d'expertise.",
      service_areas: ["Lausanne", "Montreux", "Vevey"],
      languages: ["fr", "de", "en"]
    }
  },
  {
    email: "werner.hoffmann@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Werner Hoffmann",
      first_name: "Werner",
      last_name: "Hoffmann",
      phone: "+41 41 234 56 78",
      canton: "LU",
      city: "Luzern",
      zip: "6000"
    },
    handwerkerProfile: {
      categories: ["gartenbau", "pflasterarbeiten"],
      hourly_rate_min: 70,
      hourly_rate_max: 105,
      bio: "Landschaftsgärtner mit Passion für natürliche Gartengestaltung. Terrassen, Wege, Bepflanzung und Wasserspiele. Nachhaltiges Gärtnern mit einheimischen Pflanzen und ökologischen Methoden.",
      service_areas: ["Luzern", "Sursee", "Hochdorf"],
      languages: ["de"]
    }
  },
  {
    email: "alessandro.rossi@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Alessandro Rossi",
      first_name: "Alessandro",
      last_name: "Rossi",
      phone: "+41 91 345 67 89",
      canton: "TI",
      city: "Bellinzona",
      zip: "6500"
    },
    handwerkerProfile: {
      categories: ["fassadenbauer", "gipser"],
      hourly_rate_min: 80,
      hourly_rate_max: 120,
      bio: "Costruttore di facciate con specializzazione in isolamento termico e finiture decorative. Ristrutturazioni storiche e moderne, cappotto termico, intonaci tradizionali e contemporanei.",
      service_areas: ["Bellinzona", "Lugano", "Locarno"],
      languages: ["it", "de"]
    }
  },
  {
    email: "claudia.weber@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Claudia Weber",
      first_name: "Claudia",
      last_name: "Weber",
      phone: "+41 62 567 89 01",
      canton: "AG",
      city: "Aarau",
      zip: "5000"
    },
    handwerkerProfile: {
      categories: ["klimatechnik", "heizung"],
      hourly_rate_min: 90,
      hourly_rate_max: 140,
      bio: "Klimatechnikerin mit Fokus auf energieeffiziente Lösungen. Wärmepumpen, Lüftungsanlagen, Smart Home Integration. Beratung für nachhaltiges Raumklima und Energieoptimierung in Wohn- und Geschäftsräumen.",
      service_areas: ["Aarau", "Baden", "Wohlen"],
      languages: ["de", "en"]
    }
  },
  {
    email: "dimitri.mueller@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Dimitri Müller",
      first_name: "Dimitri",
      last_name: "Müller",
      phone: "+41 52 678 90 12",
      canton: "SH",
      city: "Schaffhausen",
      zip: "8200"
    },
    handwerkerProfile: {
      categories: ["schlosserei", "zaun_torbau"],
      hourly_rate_min: 85,
      hourly_rate_max: 125,
      bio: "Kunstschlosser mit traditionellem Handwerk und modernen Techniken. Tore, Zäune, Geländer, Sicherheitstechnik. Individuelle Metallarbeiten vom Design bis zur Montage mit höchster Qualität.",
      service_areas: ["Schaffhausen", "Winterthur", "Konstanz"],
      languages: ["de", "ru"]
    }
  },
  {
    email: "sophie.blanc@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Sophie Blanc",
      first_name: "Sophie",
      last_name: "Blanc",
      phone: "+41 32 789 01 23",
      canton: "NE",
      city: "Neuchâtel",
      zip: "2000"
    },
    handwerkerProfile: {
      categories: ["reinigung", "umzug"],
      hourly_rate_min: 45,
      hourly_rate_max: 75,
      bio: "Service de nettoyage professionnel et déménagement. Nettoyage après construction, entretien régulier, déménagements résidentiels et commerciaux. Équipe qualifiée, matériel professionnel, service personnalisé.",
      service_areas: ["Neuchâtel", "La Chaux-de-Fonds", "Yverdon"],
      languages: ["fr", "de"]
    }
  },
  {
    email: "tobias.graf@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Tobias Graf",
      first_name: "Tobias",
      last_name: "Graf",
      phone: "+41 81 890 12 34",
      canton: "GR",
      city: "Chur",
      zip: "7000"
    },
    handwerkerProfile: {
      categories: ["spengler", "dachdecker"],
      hourly_rate_min: 80,
      hourly_rate_max: 115,
      bio: "Spengler und Dachdecker in den Bündner Bergen. Traditionelle Techniken für alpine Bedingungen. Kupfer-, Zink- und Titanarbeiten, Schneefänge, Dachrinnen. Spezialist für historische Gebäude.",
      service_areas: ["Chur", "Davos", "St. Moritz"],
      languages: ["de", "rm"]
    }
  },
  {
    email: "natalie.fischer@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Natalie Fischer",
      first_name: "Natalie",
      last_name: "Fischer",
      phone: "+41 44 901 23 45",
      canton: "ZH",
      city: "Dietikon",
      zip: "8953"
    },
    handwerkerProfile: {
      categories: ["badumbau", "sanitaer"],
      hourly_rate_min: 85,
      hourly_rate_max: 130,
      bio: "Badezimmer-Spezialistin mit Fokus auf barrierefreie und luxuriöse Lösungen. Komplettbäder von der Planung bis zur Realisierung. Moderne Sanitärtechnik, edle Materialien, durchdachte Raumkonzepte.",
      service_areas: ["Dietikon", "Schlieren", "Limmattal"],
      languages: ["de", "en", "it"]
    }
  },
  {
    email: "fabrice.lecomte@handwerk.ch",
    password: "HandwerkTest123!",
    role: "handwerker",
    profile: {
      full_name: "Fabrice Lecomte",
      first_name: "Fabrice",
      last_name: "Lecomte",
      phone: "+41 26 012 34 56",
      canton: "FR",
      city: "Fribourg",
      zip: "1700"
    },
    handwerkerProfile: {
      categories: ["kuechenbau", "schreiner"],
      hourly_rate_min: 90,
      hourly_rate_max: 145,
      bio: "Cuisiniste d'exception avec 18 ans d'expérience. Cuisines sur mesure, matériaux nobles, intégration parfaite. Design contemporain et traditionnel, conseils d'aménagement, électroménager haut de gamme.",
      service_areas: ["Fribourg", "Bulle", "Romont"],
      languages: ["fr", "de"]
    }
  }
];

export const testLeads: TestLead[] = [
  {
    title: "Badezimmer komplett renovieren",
    description: "Wir möchten unser 15m² grosses Badezimmer komplett renovieren. Neue Fliesen, moderne Sanitäranlagen, bodengleiche Dusche und LED-Beleuchtung. Das Badezimmer ist im 1. Stock eines Einfamilienhauses.",
    category: "badumbau",
    budget_min: 15000,
    budget_max: 25000,
    urgency: "planning",
    canton: "ZH",
    city: "Zürich",
    zip: "8001",
    status: "active"
  },
  {
    title: "Elektroinstallation für Neubau",
    description: "Elektroinstallation für ein neues Einfamilienhaus (150m²) mit Smart Home System, PV-Anlage und Wallbox für E-Auto. Moderne LED-Beleuchtung und KNX-System gewünscht.",
    category: "elektriker",
    budget_min: 25000,
    budget_max: 40000,
    urgency: "this_month",
    canton: "BE",
    city: "Bern",
    zip: "3000",
    status: "active"
  },
  {
    title: "Küche nach Mass anfertigen",
    description: "Massgeschreinerte Küche für offenen Wohnbereich. L-Form mit Kochinsel, hochwertige Materialien (Eiche massiv). Inklusive Planung und Montage aller Geräte.",
    category: "kuechenbau",
    budget_min: 30000,
    budget_max: 50000,
    urgency: "planning",
    canton: "BS",
    city: "Basel",
    zip: "4001",
    status: "active"
  },
  {
    title: "Heizung modernisieren",
    description: "Alte Ölheizung durch moderne Wärmepumpe ersetzen. Einfamilienhaus 180m², bestehende Radiatoren sollen wenn möglich weiter verwendet werden. Fördergelder bereits beantragt.",
    category: "heizung",
    budget_min: 20000,
    budget_max: 35000,
    urgency: "this_week",
    canton: "ZH",
    city: "Winterthur",
    zip: "8400",
    status: "active"
  },
  {
    title: "Wohnzimmer und Flur streichen",
    description: "Wohnzimmer (35m²) und Flur (15m²) neu streichen. Wände vorbereiten, grundieren und 2x streichen. Hochwertige Farbe gewünscht. Möbel können selbst weggeräumt werden.",
    category: "maler",
    budget_min: 2500,
    budget_max: 4500,
    urgency: "this_month",
    canton: "ZH",
    city: "Kloten",
    zip: "8302",
    status: "active"
  },
  {
    title: "Dachausbau mit Velux Fenstern",
    description: "Dachboden zu Wohnraum ausbauen (60m²). 4 Velux Fenster, Isolation, Trockenbau, Elektro- und Sanitärinstallation. Soll als Büro und Gästezimmer genutzt werden.",
    category: "zimmermann",
    budget_min: 45000,
    budget_max: 70000,
    urgency: "planning",
    canton: "BE",
    city: "Thun",
    zip: "3600",
    status: "active"
  },
  {
    title: "Gartenschuppen bauen",
    description: "Holzschuppen im Garten erstellen (3x4m). Fundament vorhanden, benötigt Holzkonstruktion, Dach mit Ziegeln und eine Tür. Soll als Geräte- und Werkzeugschuppen dienen.",
    category: "schreiner",
    budget_min: 4000,
    budget_max: 8000,
    urgency: "this_month",
    canton: "BS",
    city: "Allschwil",
    zip: "4123",
    status: "active"
  },
  {
    title: "Waschküche renovieren",
    description: "Kleine Waschküche (8m²) im Keller renovieren. Neue Fliesen, Waschbecken, Beleuchtung und Anschlüsse für Waschmaschine/Tumbler optimieren. Kellerfeuchtigkeit behandeln.",
    category: "sanitaer",
    budget_min: 5000,
    budget_max: 9000,
    urgency: "planning",
    canton: "ZH",
    city: "Uster",
    zip: "8610",
    status: "active"
  },
  {
    title: "Terrassenbau mit Steinplatten",
    description: "Neue Terrasse (8x6m) mit Natursteinplatten erstellen. Unterbau, Drainage und Verlegung. Anschluss an bestehende Hauswand und integrierte LED-Beleuchtung.",
    category: "pflasterarbeiten",
    budget_min: 12000,
    budget_max: 18000,
    urgency: "planning",
    canton: "GE",
    city: "Genève",
    zip: "1200",
    status: "active"
  },
  {
    title: "Neues Dach für Einfamilienhaus",
    description: "Komplette Dachsanierung eines 1960er Einfamilienhauses. Neue Ziegel, Isolation, Dachrinnen und Integration von 15 Solarpanels. Fläche ca. 180m².",
    category: "dachdecker",
    budget_min: 35000,
    budget_max: 55000,
    urgency: "this_month",
    canton: "SG",
    city: "St. Gallen",
    zip: "9000",
    status: "active"
  },
  {
    title: "Alte Treppe renovieren",
    description: "Holztreppe im Einfamilienhaus abschleifen, reparieren und neu lackieren. 14 Stufen mit Geländer. Soll wieder im ursprünglichen Eichenholz erstrahlen.",
    category: "schreiner",
    budget_min: 3500,
    budget_max: 6000,
    urgency: "planning",
    canton: "TI",
    city: "Lugano",
    zip: "6900",
    status: "active"
  },
  {
    title: "Elektrische Rollläden installieren",
    description: "Installation von 8 elektrischen Rollläden in Neubau-Einfamilienhaus. Steuerung via Smart Home System und manuelle Bedienung. Inklusive Verkabelung.",
    category: "elektriker",
    budget_min: 8000,
    budget_max: 12000,
    urgency: "this_week",
    canton: "ZH",
    city: "Rüti",
    zip: "8630",
    status: "active"
  },
  {
    title: "Parkett im Wohnbereich verlegen",
    description: "Eiche Parkett in Wohnzimmer, Esszimmer und Flur verlegen (ca. 65m²). Unterboden vorbereiten, verleimen und versiegeln. Hochwertige Qualität gewünscht.",
    category: "bodenleger",
    budget_min: 6500,
    budget_max: 11000,
    urgency: "planning",
    canton: "BE",
    city: "Bern",
    zip: "3000",
    status: "active"
  },
  {
    title: "Garten neu gestalten",
    description: "Komplette Neugestaltung eines 400m² Gartens. Rasen, Bepflanzung, Gehwege, kleiner Teich und automatische Bewässerung. Familiengarten mit Spielbereich.",
    category: "gartenbau",
    budget_min: 15000,
    budget_max: 25000,
    urgency: "planning",
    canton: "BS",
    city: "Basel",
    zip: "4001",
    status: "active"
  },
  {
    title: "Fassade isolieren und verputzen",
    description: "Aussenwärmedämmung für 1970er Einfamilienhaus. 220m² Fassadenfläche isolieren, verputzen und streichen. Minergie-Standard angestrebt.",
    category: "gipser",
    budget_min: 22000,
    budget_max: 35000,
    urgency: "planning",
    canton: "GE",
    city: "Nyon",
    zip: "1260",
    status: "active"
  },
  {
    title: "Kleine Reparaturen Sanitär",
    description: "Diverse kleinere Sanitärarbeiten: tropfender Wasserhahn, Spülkasten reparieren, Duschkopf austauschen. Schnelle Erledigung erwünscht.",
    category: "sanitaer",
    budget_min: 300,
    budget_max: 800,
    urgency: "today",
    canton: "ZH",
    city: "Zürich",
    zip: "8003",
    status: "active"
  },
  {
    title: "Carport aus Holz bauen",
    description: "Holzcarport für 2 Autos erstellen (7x6m). Flachdach mit leichter Neigung, offene Konstruktion. Fundament vorhanden, nur Holzkonstruktion benötigt.",
    category: "zimmermann",
    budget_min: 8000,
    budget_max: 14000,
    urgency: "this_month",
    canton: "SG",
    city: "Gossau",
    zip: "9200",
    status: "active"
  },
  {
    title: "Kellerboden sanieren",
    description: "Betonboden im Keller schleifen, grundieren und versiegeln. 45m² Fläche. Hohe Feuchtigkeit vorhanden, entsprechende Behandlung nötig.",
    category: "gipser",
    budget_min: 2200,
    budget_max: 4000,
    urgency: "planning",
    canton: "TI",
    city: "Bellinzona",
    zip: "6500",
    status: "active"
  }
];

// Helper function to create test user accounts
export async function createTestUser(testUser: TestUser) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: testUser.profile.full_name,
          first_name: testUser.profile.first_name,
          last_name: testUser.profile.last_name,
          role: testUser.role,
          phone: testUser.profile.phone,
          canton: testUser.profile.canton,
          city: testUser.profile.city,
          zip: testUser.profile.zip
        }
      }
    });

    if (error) {
      console.error(`Error creating user ${testUser.email}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Created user: ${testUser.email} (${testUser.role})`);
    return { success: true, user: data.user };
  } catch (error) {
    console.error(`Exception creating user ${testUser.email}:`, error);
    return { success: false, error: 'Unknown error' };
  }
}

// Helper function to create handwerker profile
export async function createHandwerkerProfile(userId: string, handwerkerData: TestUser['handwerkerProfile']) {
  if (!handwerkerData) return { success: false, error: 'No handwerker data provided' };
  
  try {
    const { data, error } = await supabase
      .from('handwerker_profiles')
      .insert({
        user_id: userId,
        categories: handwerkerData.categories,
        hourly_rate_min: handwerkerData.hourly_rate_min,
        hourly_rate_max: handwerkerData.hourly_rate_max,
        bio: handwerkerData.bio,
        service_areas: handwerkerData.service_areas,
        languages: handwerkerData.languages,
        is_verified: true // For testing purposes
      });

    if (error) {
      console.error('Error creating handwerker profile:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Created handwerker profile');
    return { success: true, data };
  } catch (error) {
    console.error('Exception creating handwerker profile:', error);
    return { success: false, error: 'Unknown error' };
  }
}

// Helper function to create test leads
export async function createTestLead(lead: TestLead, ownerId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .insert({
        owner_id: ownerId,
        title: lead.title,
        description: lead.description,
        category: lead.category,
        budget_min: lead.budget_min,
        budget_max: lead.budget_max,
        urgency: lead.urgency,
        canton: lead.canton,
        city: lead.city,
        zip: lead.zip,
        status: lead.status,
        quality_score: Math.floor(Math.random() * 40) + 60, // Random score 60-100
        max_purchases: 4,
        purchased_count: 0
      })
      .select();

    if (error) {
      console.error('Error creating test lead:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Created lead: ${lead.title}`);
    return { success: true, data };
  } catch (error) {
    console.error('Exception creating test lead:', error);
    return { success: false, error: 'Unknown error' };
  }
}

// Helper function to create lead purchases 
export async function createLeadPurchase(leadId: string, buyerId: string, price: number) {
  try {
    const { data, error } = await supabase
      .from('lead_purchases')
      .insert({
        lead_id: leadId,
        buyer_id: buyerId,
        price: price
      });

    if (error) {
      console.error('Error creating lead purchase:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Created lead purchase');
    return { success: true, data };
  } catch (error) {
    console.error('Exception creating lead purchase:', error);
    return { success: false, error: 'Unknown error' };
  }
}

// Helper function to create conversations
export async function createConversation(leadId: string, homeownerId: string, handwerkerId: string) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        lead_id: leadId,
        homeowner_id: homeownerId,
        handwerker_id: handwerkerId
      });

    if (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Created conversation');
    return { success: true, data };
  } catch (error) {
    console.error('Exception creating conversation:', error);
    return { success: false, error: 'Unknown error' };
  }
}

// Helper function to create reviews
export async function createReview(leadId: string, reviewerId: string, reviewedId: string, rating: number, title: string, comment: string) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        lead_id: leadId,
        reviewer_id: reviewerId,
        reviewed_id: reviewedId,
        rating: rating,
        title: title,
        comment: comment
      });

    if (error) {
      console.error('Error creating review:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Created review');
    return { success: true, data };
  } catch (error) {
    console.error('Exception creating review:', error);
    return { success: false, error: 'Unknown error' };
  }
}

// Enhanced test data population function
export async function populateTestData() {
  console.log('🚀 Starting comprehensive test data population...');
  
  const results = {
    users: [] as any[],
    handwerkerProfiles: [] as any[],
    leads: [] as any[],
    purchases: [] as any[],
    conversations: [] as any[],
    reviews: [] as any[],
    errors: [] as string[]
  };

  // Step 1: Create test users
  console.log('📝 Creating test users...');
  for (const testUser of testUsers) {
    const result = await createTestUser(testUser);
    if (result.success) {
      const userId = result.user?.id;
      results.users.push({
        email: testUser.email,
        role: testUser.role,
        userId: userId
      });

      // Create handwerker profile if applicable
      if (testUser.role === 'handwerker' && testUser.handwerkerProfile && userId) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const profileResult = await createHandwerkerProfile(userId, testUser.handwerkerProfile);
        if (profileResult.success) {
          results.handwerkerProfiles.push({
            userId: userId,
            email: testUser.email
          });
        } else {
          results.errors.push(`Failed to create handwerker profile for ${testUser.email}: ${profileResult.error}`);
        }
      }
    } else {
      results.errors.push(`Failed to create user ${testUser.email}: ${result.error}`);
    }
    
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  console.log(`✅ Created ${results.users.length} users, ${results.handwerkerProfiles.length} handwerker profiles`);

  // Step 2: Create test leads
  console.log('📋 Creating test leads...');
  const homeowners = results.users.filter(u => testUsers.find(tu => tu.email === u.email)?.role === 'homeowner');
  
  for (let i = 0; i < testLeads.length; i++) {
    const lead = testLeads[i];
    const randomOwner = homeowners[i % homeowners.length];
    
    if (randomOwner?.userId) {
      const leadResult = await createTestLead(lead, randomOwner.userId);
      if (leadResult.success && leadResult.data) {
        results.leads.push({
          title: lead.title,
          category: lead.category,
          leadId: leadResult.data[0]?.id,
          ownerId: randomOwner.userId
        });
      } else {
        results.errors.push(`Failed to create lead ${lead.title}: ${leadResult.error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log(`✅ Created ${results.leads.length} leads`);

  // Step 3: Create realistic marketplace activity (purchases, conversations, reviews)
  console.log('🛒 Creating marketplace activity...');
  const handwerkers = results.users.filter(u => testUsers.find(tu => tu.email === u.email)?.role === 'handwerker');
  
  // Create purchases for some leads
  for (let i = 0; i < Math.min(results.leads.length, 12); i++) {
    const lead = results.leads[i];
    const numPurchases = Math.floor(Math.random() * 3) + 1; // 1-3 purchases per lead
    
    for (let j = 0; j < numPurchases && j < handwerkers.length; j++) {
      const handwerker = handwerkers[(i + j) % handwerkers.length];
      const price = Math.floor(Math.random() * 30) + 20; // 20-50 CHF
      
      const purchaseResult = await createLeadPurchase(lead.leadId, handwerker.userId, price);
      if (purchaseResult.success) {
        results.purchases.push({
          leadId: lead.leadId,
          buyerId: handwerker.userId,
          price: price
        });

        // Create conversation for this purchase
        const conversationResult = await createConversation(lead.leadId, lead.ownerId, handwerker.userId);
        if (conversationResult.success) {
          results.conversations.push({
            leadId: lead.leadId,
            homeownerId: lead.ownerId,
            handwerkerId: handwerker.userId
          });
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }

  // Create some reviews for completed work
  console.log('⭐ Creating reviews...');
  const sampleReviews = [
    { rating: 5, title: "Ausgezeichnete Arbeit!", comment: "Sehr professionell und pünktlich. Die Qualität der Arbeit übertrifft meine Erwartungen. Gerne wieder!" },
    { rating: 4, title: "Gute Leistung", comment: "Solide Arbeit, freundlicher Handwerker. Kleine Verzögerung beim Termin, aber Ergebnis stimmt." },
    { rating: 5, title: "Perfekt ausgeführt", comment: "Sau präzis und schnell gearbeitet. Baustelle wurde sauber hinterlassen. Sehr zu empfehlen." },
    { rating: 4, title: "Zuverlässig", comment: "Faire Preise und gute Qualität. Kommunikation war immer transparent und ehrlich." },
    { rating: 5, title: "Top Handwerker!", comment: "Fachlich kompetent und lösungsorientiert. Hat sogar Verbesserungsvorschläge gemacht." }
  ];

  for (let i = 0; i < Math.min(results.purchases.length, 8); i++) {
    const purchase = results.purchases[i];
    const review = sampleReviews[i % sampleReviews.length];
    const lead = results.leads.find(l => l.leadId === purchase.leadId);
    
    if (lead) {
      await createReview(purchase.leadId, lead.ownerId, purchase.buyerId, review.rating, review.title, review.comment);
      results.reviews.push({
        leadId: purchase.leadId,
        rating: review.rating
      });
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log('🎉 Test data population completed!');
  console.log(`📊 Summary:
    Users: ${results.users.length}
    Handwerker Profiles: ${results.handwerkerProfiles.length}
    Leads: ${results.leads.length}
    Purchases: ${results.purchases.length}
    Conversations: ${results.conversations.length}
    Reviews: ${results.reviews.length}
    Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log('❌ Errors:', results.errors);
  }
  
  return results;
}