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
export async function createTestLead(lead: TestLead, ownerId: string) {
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
      });

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

// Test data population function
export async function populateTestData() {
  console.log('🚀 Starting test data population...');
  
  const results = {
    users: [] as any[],
    leads: [] as any[],
    errors: [] as string[]
  };

  // Create test users
  for (const testUser of testUsers) {
    const result = await createTestUser(testUser);
    if (result.success) {
      results.users.push({
        email: testUser.email,
        role: testUser.role,
        userId: result.user?.id
      });
    } else {
      results.errors.push(`Failed to create user ${testUser.email}: ${result.error}`);
    }
    
    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`Created ${results.users.length} users successfully`);
  
  return results;
}