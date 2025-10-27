// ===================================
// MOCK DATA - For Demo/Testing
// ===================================

const mockData = {
  // Categories
  categories: [
    { slug: 'elektriker', name: 'Elektriker', icon: 'zap' },
    { slug: 'sanitaer', name: 'Sanitär', icon: 'droplet' },
    { slug: 'maler', name: 'Maler', icon: 'paintbrush' },
    { slug: 'schreiner', name: 'Schreiner', icon: 'hammer' },
    { slug: 'gartenbau', name: 'Gartenbau', icon: 'leaf' },
    { slug: 'reinigung', name: 'Reinigung', icon: 'sparkles' }
  ],

  // Swiss Cantons
  cantons: [
    { code: 'ZH', name: 'Zürich' },
    { code: 'BE', name: 'Bern' },
    { code: 'LU', name: 'Luzern' },
    { code: 'UR', name: 'Uri' },
    { code: 'SZ', name: 'Schwyz' },
    { code: 'OW', name: 'Obwalden' },
    { code: 'NW', name: 'Nidwalden' },
    { code: 'GL', name: 'Glarus' },
    { code: 'ZG', name: 'Zug' },
    { code: 'FR', name: 'Fribourg' },
    { code: 'SO', name: 'Solothurn' },
    { code: 'BS', name: 'Basel-Stadt' },
    { code: 'BL', name: 'Basel-Landschaft' },
    { code: 'SH', name: 'Schaffhausen' },
    { code: 'AR', name: 'Appenzell Ausserrhoden' },
    { code: 'AI', name: 'Appenzell Innerrhoden' },
    { code: 'SG', name: 'St. Gallen' },
    { code: 'GR', name: 'Graubünden' },
    { code: 'AG', name: 'Aargau' },
    { code: 'TG', name: 'Thurgau' },
    { code: 'TI', name: 'Ticino' },
    { code: 'VD', name: 'Vaud' },
    { code: 'VS', name: 'Valais' },
    { code: 'NE', name: 'Neuchâtel' },
    { code: 'GE', name: 'Genève' },
    { code: 'JU', name: 'Jura' }
  ],

  // Sample Leads
  leads: [
    {
      id: 1,
      title: 'Badezimmer Renovation',
      category: 'Sanitär',
      description: 'Komplette Badezimmerrenovation in Zürich. Neues Waschbecken, Dusche und Fliesen.',
      location: 'Zürich, 8001',
      canton: 'ZH',
      budget_min: 5000,
      budget_max: 10000,
      status: 'active',
      created_at: '2025-10-20T10:00:00Z',
      deadline: '2025-11-15',
      homeowner: {
        name: 'Hans Müller',
        phone: '+41 79 123 45 67'
      }
    },
    {
      id: 2,
      title: 'Elektroinstallation Neubau',
      category: 'Elektriker',
      description: 'Komplette Elektroinstallation für Einfamilienhaus-Neubau in Bern.',
      location: 'Bern, 3000',
      canton: 'BE',
      budget_min: 15000,
      budget_max: 25000,
      status: 'active',
      created_at: '2025-10-22T14:30:00Z',
      deadline: '2025-12-01',
      homeowner: {
        name: 'Maria Schmidt',
        phone: '+41 79 234 56 78'
      }
    },
    {
      id: 3,
      title: 'Wohnzimmer streichen',
      category: 'Maler',
      description: 'Wohnzimmer und Flur streichen, ca. 40m². Alte Tapeten entfernen.',
      location: 'Basel, 4000',
      canton: 'BS',
      budget_min: 2000,
      budget_max: 4000,
      status: 'active',
      created_at: '2025-10-25T09:15:00Z',
      deadline: '2025-11-10',
      homeowner: {
        name: 'Peter Weber',
        phone: '+41 79 345 67 89'
      }
    }
  ],

  // Sample User Profiles
  users: {
    homeowner: {
      id: 1,
      full_name: 'Hans Müller',
      email: 'hans.mueller@example.ch',
      phone: '+41 79 123 45 67',
      role: 'homeowner',
      created_at: '2025-09-15T10:00:00Z'
    },
    handwerker: {
      id: 2,
      full_name: 'Thomas Handwerker',
      email: 'thomas@handwerk.ch',
      phone: '+41 79 987 65 43',
      role: 'handwerker',
      company: 'Handwerk GmbH',
      categories: ['Elektriker', 'Sanitär'],
      bio: 'Erfahrener Elektriker mit 15 Jahren Berufserfahrung.',
      verified: true,
      created_at: '2025-08-01T10:00:00Z'
    }
  },

  // Sample Messages
  conversations: [
    {
      id: 1,
      lead_id: 1,
      lead_title: 'Badezimmer Renovation',
      other_user: {
        name: 'Thomas Handwerker',
        avatar: null
      },
      last_message: {
        content: 'Ich würde gerne einen Besichtigungstermin vereinbaren.',
        created_at: '2025-10-26T15:30:00Z'
      },
      unread_count: 2,
      status: 'active'
    }
  ],

  messages: [
    {
      id: 1,
      conversation_id: 1,
      sender_id: 2,
      sender_name: 'Thomas Handwerker',
      content: 'Guten Tag, ich interessiere mich für Ihr Projekt.',
      created_at: '2025-10-26T14:00:00Z'
    },
    {
      id: 2,
      conversation_id: 1,
      sender_id: 1,
      sender_name: 'Hans Müller',
      content: 'Hallo, das freut mich! Wann könnten Sie vorbeikommen?',
      created_at: '2025-10-26T14:15:00Z'
    },
    {
      id: 3,
      conversation_id: 1,
      sender_id: 2,
      sender_name: 'Thomas Handwerker',
      content: 'Ich würde gerne einen Besichtigungstermin vereinbaren. Wäre nächste Woche Dienstag möglich?',
      created_at: '2025-10-26T15:30:00Z'
    }
  ],

  // Lead Statuses
  leadStatuses: [
    { value: 'active', label: 'Aktiv', color: 'green' },
    { value: 'pending', label: 'Ausstehend', color: 'yellow' },
    { value: 'in_progress', label: 'In Bearbeitung', color: 'blue' },
    { value: 'completed', label: 'Abgeschlossen', color: 'gray' },
    { value: 'cancelled', label: 'Abgebrochen', color: 'red' }
  ],

  // Subscription Plans
  subscriptionPlans: [
    {
      name: 'Starter',
      price: 49,
      leads_per_month: 5,
      features: [
        '5 Leads pro Monat',
        'Direkter Kontakt',
        'Email Support'
      ]
    },
    {
      name: 'Professional',
      price: 99,
      leads_per_month: 15,
      features: [
        '15 Leads pro Monat',
        'Direkter Kontakt',
        'Priority Support',
        'Erweiterte Filter'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 199,
      leads_per_month: null, // Unlimited
      features: [
        'Unbegrenzte Leads',
        'Direkter Kontakt',
        '24/7 Support',
        'Erweiterte Filter',
        'Dedicated Account Manager'
      ]
    }
  ],

  // FAQ Items
  faqItems: [
    {
      question: 'Wie funktioniert HandwerkerLeads.ch?',
      answer: 'Sie erstellen einen Auftrag mit Ihren Anforderungen. Verifizierte Handwerker können Ihr Projekt sehen und Sie direkt kontaktieren. Sie wählen den besten Handwerker für Ihr Projekt aus.'
    },
    {
      question: 'Ist die Nutzung für Auftraggeber kostenlos?',
      answer: 'Ja, für Auftraggeber ist HandwerkerLeads.ch komplett kostenlos. Sie zahlen nur die vereinbarte Summe an den Handwerker für die ausgeführte Arbeit.'
    },
    {
      question: 'Wie werden Handwerker verifiziert?',
      answer: 'Jeder Handwerker muss seine Geschäftslizenz, Versicherung und Referenzen vorlegen. Unser Team prüft alle Dokumente vor der Freischaltung des Profils.'
    },
    {
      question: 'Wie schnell erhalte ich Angebote?',
      answer: 'In der Regel erhalten Sie innerhalb von 24 Stunden die ersten Kontaktanfragen von interessierten Handwerkern.'
    },
    {
      question: 'Was kostet es für Handwerker?',
      answer: 'Handwerker zahlen eine monatliche Abonnementgebühr ab CHF 49 pro Monat für Zugang zu qualifizierten Leads in ihrer Region.'
    }
  ]
};

// Make mock data available globally
window.mockData = mockData;
