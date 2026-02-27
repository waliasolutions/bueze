// Email template library for BÜEZE.CH
// Swiss-inspired, clean design with consistent branding

import { getUrgencyLabel } from './categoryLabels.ts';
import { subcategoryLabels } from './subcategoryLabels.ts';
import { FRONTEND_URL, SUPPORT_EMAIL } from './siteConfig.ts';

/**
 * Safe interpolation helper - prevents "undefined" or "null" from appearing in emails.
 * Falls back to provided default or empty string.
 */
export const safe = (value: unknown, fallback = ''): string => {
  if (value === null || value === undefined || value === 'undefined' || value === 'null') {
    return fallback;
  }
  return String(value);
};

export const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header {
      background: #0066CC;
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .content {
      padding: 30px 20px;
    }
    .button {
      display: inline-block;
      background: #0066CC;
      color: white !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .button:hover {
      background: #0052A3;
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #0066CC;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      background: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666666;
      border-top: 1px solid #e0e0e0;
    }
    .footer a {
      color: #0066CC;
      text-decoration: none;
    }
    h2 {
      color: #0066CC;
      margin-top: 0;
    }
    .divider {
      border: 0;
      border-top: 1px solid #e0e0e0;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BÜEZE.CH</h1>
    </div>
    ${content}
    <div class="footer">
      <p><strong>Büeze.ch GmbH</strong><br>
      Industriestrasse 28 | 9487 Gamprin-Bendern | Liechtenstein</p>
      <p><a href="${FRONTEND_URL}">www.bueeze.ch</a> | <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
      <p style="margin-top: 15px; color: #999;">
        Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese Nachricht.
      </p>
    </div>
  </div>
</body>
</html>
`;

interface NewLeadData {
  category: string;
  city: string;
  description: string;
  budgetMin?: number;
  budgetMax?: number;
  urgency: string;
  magicLink: string;
  handwerkerName: string;
}

export const newLeadNotificationTemplate = (data: NewLeadData) => {
  const budgetText = data.budgetMin && data.budgetMax 
    ? `CHF ${data.budgetMin.toLocaleString()} - ${data.budgetMax.toLocaleString()}`
    : 'Budget nicht angegeben';
  
  const truncatedDesc = data.description.length > 200 
    ? data.description.substring(0, 200) + '...' 
    : data.description;

  return emailWrapper(`
    <div class="content">
      <h2>Neue Anfrage in ${safe(data.category, 'Ihrem Fachgebiet')}</h2>
      <p>Hallo ${safe(data.handwerkerName, 'Handwerker')},</p>
      <p>Eine neue Anfrage in Ihrem Fachgebiet ist verfügbar:</p>
      
      <div class="info-box">
        <p><strong>Kategorie:</strong> ${safe(data.category)}</p>
        <p><strong>Standort:</strong> ${safe(data.city)}</p>
        <p><strong>Budget:</strong> ${budgetText}</p>
        <p><strong>Dringlichkeit:</strong> ${getUrgencyLabel(data.urgency)}</p>
        <hr class="divider">
        <p><strong>Projektbeschreibung:</strong></p>
        <p>${truncatedDesc}</p>
      </div>

      <p><strong>⏰ Sie haben 10 Tage Zeit</strong>, um Ihre Offerte einzureichen.</p>
      
      <p style="text-align: center;">
        <a href="${data.magicLink}" class="button">Jetzt Offerte einreichen</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        <strong>Hinweis:</strong> Die vollständigen Kontaktdaten des Kunden werden Ihnen erst nach Annahme Ihrer Offerte angezeigt.
      </p>
    </div>
  `);
};

interface NewProposalData {
  projectTitle: string;
  handwerkerFirstName: string;
  handwerkerCity: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  magicLink: string;
  clientName: string;
}

export const newProposalNotificationTemplate = (data: NewProposalData) => {
  const priceText = data.priceMin && data.priceMax
    ? `CHF ${data.priceMin.toLocaleString()} - ${data.priceMax.toLocaleString()}`
    : 'Preis auf Anfrage';
  
  const ratingStars = data.rating ? '⭐'.repeat(Math.round(data.rating)) : 'Noch keine Bewertungen';

  return emailWrapper(`
    <div class="content">
      <h2>Neue Offerte für Ihr Projekt</h2>
      <p>Hallo ${safe(data.clientName, 'Kunde')},</p>
      <p>Sie haben eine neue Offerte für Ihr Projekt <strong>"${safe(data.projectTitle, 'Ihr Projekt')}"</strong> erhalten!</p>
      
      <div class="info-box">
        <p><strong>Handwerker:</strong> ${safe(data.handwerkerFirstName)} (${safe(data.handwerkerCity)})</p>
        <p><strong>Bewertung:</strong> ${ratingStars}</p>
        <p><strong>Preisrahmen:</strong> ${priceText}</p>
      </div>

      <p style="text-align: center;">
        <a href="${data.magicLink}" class="button">Offerte jetzt ansehen</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        <strong>Tipp:</strong> Vergleichen Sie mehrere Offerten, bevor Sie sich entscheiden. 
        Sie können die Offerte direkt in Ihrem Dashboard annehmen oder ablehnen.
      </p>
    </div>
  `);
};

interface ProposalAcceptedHandwerkerData {
  projectTitle: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  conversationLink: string;
  handwerkerName: string;
}

export const proposalAcceptedHandwerkerTemplate = (data: ProposalAcceptedHandwerkerData) => {
  return emailWrapper(`
    <div class="content">
      <h2>🎉 Gratulation! Ihre Offerte wurde angenommen</h2>
      <p>Hallo ${safe(data.handwerkerName, 'Handwerker')},</p>
      <p>Gute Nachrichten! Der Kunde hat Ihre Offerte für das Projekt <strong>"${safe(data.projectTitle, 'Ihr Projekt')}"</strong> angenommen.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #0066CC;">Kontaktdaten des Kunden</h3>
        <p><strong>Name:</strong> ${safe(data.clientName)}</p>
        <p><strong>Telefon:</strong> ${safe(data.clientPhone, 'Nicht angegeben')}</p>
        <p><strong>E-Mail:</strong> ${safe(data.clientEmail, 'Nicht angegeben')}</p>
        <p><strong>Adresse:</strong> ${safe(data.clientAddress, 'Nicht angegeben')}</p>
      </div>

      <p style="text-align: center;">
        <a href="${data.conversationLink}" class="button">Zum Nachrichtenverlauf</a>
      </p>

      <hr class="divider">
      
      <h3>Nächste Schritte:</h3>
      <ol>
        <li>Nehmen Sie zeitnah Kontakt mit dem Kunden auf</li>
        <li>Besprechen Sie die Details und vereinbaren Sie einen Termin</li>
        <li>Führen Sie das Projekt professionell aus</li>
        <li>Bitten Sie den Kunden nach Abschluss um eine Bewertung</li>
      </ol>

      <p style="font-size: 14px; color: #666;">
        <strong>Tipp:</strong> Eine schnelle Kontaktaufnahme und professionelle Kommunikation 
        sind der Schlüssel zu zufriedenen Kunden und positiven Bewertungen.
      </p>
    </div>
  `);
};

interface ProposalAcceptedClientData {
  projectTitle: string;
  handwerkerCompany: string;
  handwerkerName: string;
  handwerkerPhone: string;
  handwerkerEmail: string;
  handwerkerWebsite?: string;
  proposalPrice: string;
  proposalTimeframe: string;
  conversationLink: string;
  clientName: string;
}

export const proposalAcceptedClientTemplate = (data: ProposalAcceptedClientData) => {
  return emailWrapper(`
    <div class="content">
      <h2>Sie haben einen Handwerker ausgewählt</h2>
      <p>Hallo ${safe(data.clientName, 'Kunde')},</p>
      <p>Sie haben <strong>${safe(data.handwerkerName)}</strong> für Ihr Projekt <strong>"${safe(data.projectTitle, 'Ihr Projekt')}"</strong> ausgewählt.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #0066CC;">Kontaktdaten des Handwerkers</h3>
        <p><strong>Firma:</strong> ${safe(data.handwerkerCompany)}</p>
        <p><strong>Ansprechpartner:</strong> ${safe(data.handwerkerName)}</p>
        <p><strong>Telefon:</strong> ${safe(data.handwerkerPhone, 'Nicht angegeben')}</p>
        <p><strong>E-Mail:</strong> ${safe(data.handwerkerEmail, 'Nicht angegeben')}</p>
        ${data.handwerkerWebsite ? `<p><strong>Website:</strong> <a href="${data.handwerkerWebsite}">${data.handwerkerWebsite}</a></p>` : ''}
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #0066CC;">Offertendetails</h3>
        <p><strong>Preis:</strong> ${safe(data.proposalPrice)}</p>
        <p><strong>Zeitrahmen:</strong> ${data.proposalTimeframe}</p>
      </div>

      <p style="text-align: center;">
        <a href="${data.conversationLink}" class="button">Zum Nachrichtenverlauf</a>
      </p>

      <hr class="divider">
      
      <h3>Tipps für eine erfolgreiche Zusammenarbeit:</h3>
      <ul>
        <li>Klären Sie alle Details und Erwartungen vorab</li>
        <li>Vereinbaren Sie feste Termine und Meilensteine</li>
        <li>Kommunizieren Sie offen bei Fragen oder Änderungen</li>
        <li>Hinterlassen Sie nach Projektabschluss eine faire Bewertung</li>
      </ul>

      <p style="font-size: 14px; color: #666;">
        Bei Fragen oder Problemen stehen wir Ihnen gerne zur Verfügung unter <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
      </p>
    </div>
  `);
};

interface GuestWelcomeData {
  email: string;
  password: string;
  fullName: string;
  magicLink: string;
}

export const guestWelcomeTemplate = (data: GuestWelcomeData) => {
  return emailWrapper(`
    <div class="content">
      <h2>Willkommen bei BÜEZE.CH!</h2>
      <p>Hallo ${safe(data.fullName, 'Kunde')},</p>
      <p>Vielen Dank für Ihre Anfrage! Wir haben ein Konto für Sie erstellt, 
      damit Sie den Status Ihrer Anfrage verfolgen und mit Handwerkern kommunizieren können.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #0066CC;">Ihre Zugangsdaten</h3>
        <p><strong>E-Mail:</strong> ${data.email}</p>
        <p><strong>Passwort:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 3px;">${data.password}</code></p>
      </div>

      <p style="text-align: center;">
        <a href="${data.magicLink}" class="button">Zu meinem Dashboard</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        <strong>Sicherheitshinweis:</strong> Wir empfehlen Ihnen, nach dem ersten Login 
        Ihr Passwort zu ändern. Sie können dies in Ihren Kontoeinstellungen tun.
      </p>

      <hr class="divider">
      
      <h3>Was passiert als Nächstes?</h3>
      <ol>
        <li>Sie erhalten E-Mail-Benachrichtigungen, sobald Handwerker Offerten einreichen</li>
        <li>Sie können Offerten vergleichen und den passenden Handwerker auswählen</li>
        <li>Nach Auswahl erhalten beide Seiten die vollständigen Kontaktdaten</li>
        <li>Sie können direkt über die Plattform mit dem Handwerker kommunizieren</li>
      </ol>
    </div>
  `);
};

// Proposal Deadline Client Reminder Template
interface ProposalDeadlineClientData {
  clientName: string;
  leadTitle: string;
  proposalsCount: number;
  formattedDeadline: string;
  dashboardLink: string;
}

export const proposalDeadlineClientTemplate = (data: ProposalDeadlineClientData) => {
  return emailWrapper(`
    <div class="content">
      <h2>⏰ Offerten warten auf Ihre Antwort</h2>
      <p>Hallo ${safe(data.clientName, 'Kunde')},</p>
      <p>Sie haben <strong>${data.proposalsCount} ${data.proposalsCount === 1 ? 'Offerte' : 'Offerten'}</strong> für Ihr Projekt erhalten:</p>

      <div class="info-box" style="border-left-color: #FF6B00;">
        <h3 style="margin: 0 0 10px 0; color: #0066CC;">${safe(data.leadTitle)}</h3>
        <p style="margin: 0; color: #d97706; font-weight: bold;">⏰ Frist: ${data.formattedDeadline} (noch 2 Tage!)</p>
      </div>

      <p>Bitte überprüfen Sie die Offerten zeitnah in Ihrem Dashboard.</p>

      <p style="text-align: center;">
        <a href="${data.dashboardLink}" class="button">Offerten ansehen</a>
      </p>
    </div>
  `);
};

// Proposal Deadline Handwerker Reminder Template
interface ProposalDeadlineHandwerkerData {
  handwerkerName: string;
  leadTitle: string;
  formattedDeadline: string;
  magicLink: string;
  category: string;
  city: string;
  budgetMin?: number;
  budgetMax?: number;
}

export const proposalDeadlineHandwerkerTemplate = (data: ProposalDeadlineHandwerkerData) => {
  const budgetText = data.budgetMin && data.budgetMax
    ? `CHF ${data.budgetMin.toLocaleString('de-CH')} - ${data.budgetMax.toLocaleString('de-CH')}`
    : 'Budget nicht angegeben';

  return emailWrapper(`
    <div class="content">
      <h2>⏰ Letzte Chance für eine Offerte!</h2>
      <p>Hallo ${safe(data.handwerkerName, 'Handwerker')},</p>
      <p>Die Frist für diese Anfrage läuft bald ab:</p>

      <div class="info-box">
        <h3 style="margin: 0 0 15px 0; color: #0066CC;">${safe(data.leadTitle)}</h3>
        <p style="margin: 5px 0;"><strong>Kategorie:</strong> ${safe(data.category)}</p>
        <p style="margin: 5px 0;"><strong>Ort:</strong> ${safe(data.city)}</p>
        <p style="margin: 5px 0;"><strong>Budget:</strong> ${budgetText}</p>
      </div>

      <div class="info-box" style="border-left-color: #FF6B00;">
        <p style="margin: 0; color: #d97706; font-weight: bold;">⏰ Frist: ${data.formattedDeadline} (noch 2 Tage!)</p>
      </div>

      <p>Sie haben sich diese Anfrage angesehen, aber noch keine Offerte eingereicht.</p>

      <p style="text-align: center;">
        <a href="${data.magicLink}" class="button" style="background: #f59e0b;">Jetzt Offerte einreichen</a>
      </p>
    </div>
  `);
};

// Subscription Confirmation Template
interface SubscriptionConfirmationData {
  handwerkerName: string;
  planName: string;
  amount: string;
  periodEnd: string;
}

export const subscriptionConfirmationTemplate = (data: SubscriptionConfirmationData) => {
  return emailWrapper(`
    <div class="content">
      <h2>🎉 Willkommen als Premium-Handwerker!</h2>
      <p>Hallo ${safe(data.handwerkerName, 'Handwerker')},</p>
      <p>Vielen Dank für Ihr Upgrade! Ihr Abonnement wurde erfolgreich aktiviert.</p>

      <div class="info-box" style="background: #d1fae5; border-left-color: #10b981;">
        <h3 style="margin-top: 0; color: #065f46;">Abonnement aktiviert</h3>
        <p><strong>Plan:</strong> ${safe(data.planName)}</p>
        <p><strong>Betrag:</strong> ${safe(data.amount)}</p>
        <p><strong>Gültig bis:</strong> ${safe(data.periodEnd)}</p>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #0066CC;">Ihre Vorteile</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Unbegrenzte Offerten pro Monat</li>
          <li>Bevorzugte Platzierung in Suchergebnissen</li>
          <li>Erweiterte Profilstatistiken</li>
          <li>Prioritäts-Support</li>
        </ul>
      </div>

      <p style="text-align: center;">
        <a href="${FRONTEND_URL}/handwerker-dashboard" class="button">Zum Dashboard</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        Sie können Ihr Abonnement jederzeit in Ihrem Dashboard verwalten. Bei Fragen stehen wir Ihnen gerne zur Verfügung.
      </p>
    </div>
  `);
};

// Pending Payment First Reminder Template
interface PendingPaymentFirstReminderData {
  name: string;
  planName: string;
  checkoutUrl: string;
}

export const pendingPaymentFirstReminderTemplate = (data: PendingPaymentFirstReminderData) => {
  return emailWrapper(`
    <div class="content">
      <h2>💳 Ihr Abo wartet auf Sie</h2>
      <p>Hallo ${safe(data.name, 'Handwerker')},</p>
      <p>Vor 2 Tagen wurde Ihr Handwerker-Profil freigeschaltet – herzlichen Glückwunsch! 🎉</p>
      <p>Sie haben sich für das <strong>${safe(data.planName)}</strong> entschieden, aber die Zahlung steht noch aus.</p>

      <div class="info-box">
        <p style="margin: 0 0 10px 0;"><strong>Mit Ihrem gewählten Abo erhalten Sie:</strong></p>
        <p style="margin: 5px 0;">✅ Unbegrenzte Offerten pro Monat</p>
        <p style="margin: 5px 0;">✅ Sofortigen Zugang zu allen Aufträgen</p>
        <p style="margin: 5px 0;">✅ Mehr Chancen auf neue Kunden</p>
      </div>

      <p style="text-align: center;">
        <a href="${data.checkoutUrl}" class="button">Jetzt bezahlen und starten</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        Oder starten Sie kostenlos mit 5 Offerten pro Monat.
      </p>

      <p style="font-size: 14px; color: #666;">
        Bei Fragen: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
      </p>
    </div>
  `);
};

// Pending Payment Final Reminder Template
interface PendingPaymentFinalReminderData {
  name: string;
  planName: string;
  checkoutUrl: string;
  cancelUrl: string;
}

export const pendingPaymentFinalReminderTemplate = (data: PendingPaymentFinalReminderData) => {
  return emailWrapper(`
    <div class="content">
      <h2>⏰ Letzte Erinnerung: Abo aktivieren</h2>
      <p>Hallo ${safe(data.name, 'Handwerker')},</p>
      <p>Ihr Handwerker-Profil ist seit einer Woche aktiv, aber Ihr gewähltes <strong>${safe(data.planName)}</strong> wartet noch auf die Aktivierung.</p>

      <div class="info-box" style="border-left-color: #FF6B00;">
        <p style="margin: 0;">
          ⏰ <strong>Letzte Erinnerung:</strong> Während Sie warten, gewinnen andere Handwerker bereits neue Aufträge. Sichern Sie sich Ihren Wettbewerbsvorteil!
        </p>
      </div>

      <p style="text-align: center;">
        <a href="${data.checkoutUrl}" class="button">Jetzt Abo aktivieren</a>
      </p>

      <p style="font-size: 14px; color: #666; text-align: center;">
        Nicht interessiert? <a href="${data.cancelUrl}">Ausstehenden Plan stornieren</a> und kostenlos weitermachen.
      </p>

      <p style="font-size: 14px; color: #666;">
        Bei Fragen: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
      </p>
    </div>
  `);
};

// Admin Notification for New Lead (Auftrag)
export interface NewLeadAdminNotificationData {
  clientName: string;
  clientEmail: string;
  category: string;
  city: string;
  canton: string;
  description: string;
  budgetMin?: number;
  budgetMax?: number;
  urgency: string;
  leadId: string;
  submittedAt: string;
}

export const newLeadAdminNotificationTemplate = (data: NewLeadAdminNotificationData) => {
  const budgetText = data.budgetMin && data.budgetMax 
    ? `CHF ${data.budgetMin.toLocaleString()} - ${data.budgetMax.toLocaleString()}`
    : 'Budget nicht angegeben';
  
  const truncatedDesc = data.description.length > 300 
    ? data.description.substring(0, 300) + '...' 
    : data.description;

  return emailWrapper(`
    <div class="content">
      <h2>📋 Neuer Auftrag eingegangen</h2>
      <p>Ein neuer Auftrag wurde auf der Plattform eingereicht:</p>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #0066CC;">Auftragsdetails</h3>
        <p><strong>Kategorie:</strong> ${data.category}</p>
        <p><strong>Standort:</strong> ${data.city}, ${data.canton}</p>
        <p><strong>Budget:</strong> ${budgetText}</p>
        <p><strong>Dringlichkeit:</strong> ${getUrgencyLabel(data.urgency)}</p>
        <p><strong>Eingereicht am:</strong> ${data.submittedAt}</p>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #0066CC;">Kundendaten</h3>
        <p><strong>Name:</strong> ${data.clientName}</p>
        <p><strong>E-Mail:</strong> ${data.clientEmail}</p>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #0066CC;">Projektbeschreibung</h3>
        <p>${truncatedDesc}</p>
      </div>

      <p style="text-align: center;">
        <a href="${FRONTEND_URL}/admin/leads" class="button">Im Admin-Dashboard ansehen</a>
      </p>
    </div>
  `);
};

// Admin Registration Notification Email Template
export interface AdminRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  categories: string[];
  serviceAreas: string[];
  logoUrl: string;
  businessAddress: string;
  profileId: string;
  submittedAt: string;
}

// Major category mapping for grouping subcategories in admin emails
const majorCategoryMap: Record<string, { label: string; subcats: string[] }> = {
  'elektroinstallationen': {
    label: 'Elektroinstallationen',
    subcats: ['electrician_installation', 'electrician_repair', 'electrician_panel',
              'electrician_lighting', 'electrician_charging', 'electrician_smart_home',
              'electrician_solar']
  },
  'metallbau': {
    label: 'Metallbau',
    subcats: ['metalworker_construction', 'metalworker_stairs', 'metalworker_gates',
              'metalworker_balconies']
  },
  'bau_renovation': {
    label: 'Bau & Renovation',
    subcats: ['builder_new_construction', 'builder_renovation', 'builder_masonry',
              'builder_plastering', 'builder_insulation']
  },
  'bodenbelaege': {
    label: 'Bodenbeläge',
    subcats: ['flooring_parquet', 'flooring_tiles', 'flooring_carpet',
              'flooring_vinyl', 'flooring_natural_stone', 'flooring_screeding']
  },
  'heizung': {
    label: 'Heizung & Lüftung',
    subcats: ['heating_installation', 'heating_service', 'heating_floor',
              'heating_solar_thermal', 'heating_heat_pump', 'heating_ventilation']
  },
  'sanitaer': {
    label: 'Sanitär',
    subcats: ['plumber_installation', 'plumber_repair', 'plumber_bathroom',
              'plumber_kitchen', 'plumber_heating', 'plumber_drainage']
  },
  'kuechen': {
    label: 'Küchen',
    subcats: ['kitchen_planning', 'kitchen_installation', 'kitchen_appliances',
              'kitchen_countertops']
  },
  'schreinerei': {
    label: 'Schreinerei',
    subcats: ['carpenter_furniture', 'carpenter_doors', 'carpenter_windows',
              'carpenter_stairs', 'carpenter_builtin', 'carpenter_flooring']
  },
  'raeumungen': {
    label: 'Räumungen & Umzüge',
    subcats: ['cleaning_clearance', 'cleaning_moving', 'cleaning_construction',
              'cleaning_garden']
  },
  'maler': {
    label: 'Maler & Gipser',
    subcats: ['painter_interior', 'painter_exterior', 'painter_wallpaper',
              'painter_plastering']
  },
  'dach': {
    label: 'Dach & Fassade',
    subcats: ['roofer_repair', 'roofer_new', 'roofer_insulation', 'roofer_facade']
  },
  'gartenbau': {
    label: 'Gartenbau',
    subcats: ['landscaper_garden', 'landscaper_terrace', 'landscaper_lawn',
              'landscaper_fencing']
  },
  'fenster': {
    label: 'Fenster & Türen',
    subcats: ['window_new', 'window_repair', 'window_doors', 'window_shutters']
  }
};

export const adminRegistrationNotificationTemplate = (data: AdminRegistrationData) => {

  // Group subcategories by their major categories
  const categoryGroups = new Map<string, { label: string; subcats: string[] }>();
  
  for (const subcat of data.categories) {
    // Find which major category this subcategory belongs to
    let foundMajorCat: { id: string; label: string } | null = null;
    for (const [majorId, majorData] of Object.entries(majorCategoryMap)) {
      if (majorData.subcats.includes(subcat)) {
        foundMajorCat = { id: majorId, label: majorData.label };
        break;
      }
    }
    
    if (foundMajorCat) {
      if (!categoryGroups.has(foundMajorCat.id)) {
        categoryGroups.set(foundMajorCat.id, {
          label: foundMajorCat.label,
          subcats: []
        });
      }
      const readable = subcategoryLabels[subcat] || subcat;
      categoryGroups.get(foundMajorCat.id)!.subcats.push(readable);
    }
  }

  // Format as "Hauptkategorie (subcat1, subcat2)"
  let categoriesText = '';
  if (categoryGroups.size > 0) {
    const formatted = Array.from(categoryGroups.values()).map(group => {
      if (group.subcats.length > 0) {
        return `<strong>${group.label}</strong> (${group.subcats.join(', ')})`;
      }
      return `<strong>${group.label}</strong>`;
    });
    categoriesText = formatted.join('<br>');
  } else {
    categoriesText = 'Keine Kategorien angegeben';
  }
  
  return emailWrapper(`
    <h2 style="color: #0066CC; margin-top: 0;">Neue Handwerker-Registrierung</h2>
    
    <p>Hallo Admin-Team,</p>
    
    <p>Eine neue Handwerker-Registrierung wartet auf Freigabe.</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #333;">Handwerker-Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666;">Name:</td>
          <td style="padding: 8px 0;">${data.firstName} ${data.lastName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666;">E-Mail:</td>
          <td style="padding: 8px 0;">${data.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666;">Telefon:</td>
          <td style="padding: 8px 0;">${data.phone}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666;">Firma:</td>
          <td style="padding: 8px 0;">${data.companyName || 'Nicht angegeben'}</td>
        </tr>
        ${data.businessAddress ? `
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666;">Geschäftsadresse:</td>
          <td style="padding: 8px 0;">${data.businessAddress}</td>
        </tr>
        ` : ''}
        ${data.serviceAreas && data.serviceAreas.length > 0 ? `
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666;">Servicegebiet (PLZ):</td>
          <td style="padding: 8px 0;">${data.serviceAreas.join(', ')}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666;">Kategorien:</td>
          <td style="padding: 8px 0;">${categoriesText}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666;">Eingereicht am:</td>
          <td style="padding: 8px 0;">${data.submittedAt}</td>
        </tr>
      </table>
      ${data.logoUrl ? `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0 0 10px 0; font-weight: 600; color: #666;">Logo:</p>
          <img src="${data.logoUrl}" alt="Firmenlogo" style="max-width: 200px; max-height: 100px; border-radius: 4px;" />
        </div>
      ` : ''}
    </div>
    
    <div style="margin-top: 30px; text-align: center;">
      <a href="${FRONTEND_URL}/admin/approvals" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        🔍 Zur Freigabe-Seite
      </a>
      <p style="margin-top: 10px; font-size: 12px; color: #6b7280;">
        Oder direkt einloggen: <a href="${FRONTEND_URL}/auth" style="color: #667eea;">bueeze.ch/auth</a>
      </p>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Diese E-Mail wurde automatisch vom Büeze.ch System generiert.
    </p>
  `);
};

// Rejection email template
interface RejectionData {
  firstName: string;
  lastName: string;
  companyName?: string;
  reason?: string;
  email: string;
}

export const rejectionNotificationTemplate = (data: RejectionData) => {
  return emailWrapper(`
    <div class="content">
      <h2 style="color: #d32f2f;">Registrierung nicht genehmigt</h2>
      
      <p>Sehr geehrte/r ${safe(data.firstName)} ${safe(data.lastName)},</p>
      
      <p>
        Vielen Dank für Ihr Interesse an einer Zusammenarbeit mit Büeze.ch.
      </p>
      
      <p>
        Nach sorgfältiger Prüfung Ihrer Unterlagen müssen wir Ihnen leider mitteilen, 
        dass wir Ihre Registrierung ${data.companyName ? `für ${data.companyName}` : ''} 
        zum jetzigen Zeitpunkt nicht genehmigen können.
      </p>
      
      ${data.reason ? `
        <div class="info-box" style="background: #fff3e0; border-left-color: #f57c00;">
          <h3 style="margin-top: 0; color: #e65100;">Grund der Ablehnung:</h3>
          <p style="margin-bottom: 0; white-space: pre-wrap;">${data.reason}</p>
        </div>
      ` : ''}
      
      <h3 style="color: #0066CC; margin-top: 30px;">Was Sie tun können:</h3>
      
      <ul style="line-height: 1.8;">
        <li><strong>Fehlende Dokumente:</strong> Falls Dokumente fehlen oder unvollständig sind, können Sie diese nachreichen</li>
        <li><strong>Ungültige Informationen:</strong> Überprüfen Sie Ihre angegebenen Daten und korrigieren Sie diese</li>
        <li><strong>Lizenz oder Versicherung:</strong> Stellen Sie sicher, dass alle erforderlichen Lizenzen und Versicherungen aktuell sind</li>
        <li><strong>Rückfragen:</strong> Kontaktieren Sie uns für weitere Informationen</li>
      </ul>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #0066CC;">Kontakt aufnehmen</h3>
        <p style="margin-bottom: 0;">
          <strong>E-Mail:</strong> <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a><br>
          <strong>Website:</strong> <a href="${FRONTEND_URL}">www.bueeze.ch</a>
        </p>
      </div>
      
      <p style="margin-top: 30px;">
        Wir bedauern, Ihnen keine positivere Nachricht übermitteln zu können, 
        und stehen bei Fragen gerne zur Verfügung.
      </p>
      
      <p>
        Mit freundlichen Grüssen<br>
        <strong>Das Büeze.ch Team</strong>
      </p>
    </div>
  `);
};

// New Message Notification Template
interface NewMessageData {
  recipientName: string;
  senderName: string;
  projectTitle: string;
  messagePreview: string;
  conversationLink: string;
}

export const newMessageNotificationTemplate = (data: NewMessageData) => {
  const truncatedMessage = data.messagePreview.length > 150 
    ? data.messagePreview.substring(0, 150) + '...' 
    : data.messagePreview;

  return emailWrapper(`
    <div class="content">
      <h2>💬 Neue Nachricht erhalten</h2>
      <p>Hallo ${safe(data.recipientName, 'Kunde')},</p>
      <p>Sie haben eine neue Nachricht von <strong>${safe(data.senderName)}</strong> zum Projekt <strong>"${safe(data.projectTitle, 'Ihr Projekt')}"</strong> erhalten.</p>
      
      <div class="info-box">
        <p style="font-style: italic; color: #555; margin: 0;">"${truncatedMessage}"</p>
      </div>

      <p style="text-align: center;">
        <a href="${data.conversationLink}" class="button">Nachricht beantworten</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        Antworten Sie zeitnah, um eine gute Kommunikation sicherzustellen.
      </p>
    </div>
  `);
};

// Rating Received Template (for Handwerker)
interface RatingReceivedData {
  handwerkerName: string;
  clientFirstName: string;
  projectTitle: string;
  rating: number;
  comment?: string;
  profileLink: string;
}

export const ratingReceivedHandwerkerTemplate = (data: RatingReceivedData) => {
  const stars = '⭐'.repeat(data.rating);
  
  return emailWrapper(`
    <div class="content">
      <h2>⭐ Neue Bewertung erhalten</h2>
      <p>Hallo ${safe(data.handwerkerName, 'Handwerker')},</p>
      <p>Sie haben eine neue Bewertung für das Projekt <strong>"${safe(data.projectTitle, 'Ihr Projekt')}"</strong> erhalten!</p>
      
      <div class="info-box">
        <p><strong>Bewertung:</strong> ${stars} (${data.rating}/5)</p>
        <p><strong>Von:</strong> ${data.clientFirstName}</p>
        ${data.comment ? `<p style="font-style: italic; color: #555; margin-top: 15px;">"${data.comment}"</p>` : ''}
      </div>

      <p style="text-align: center;">
        <a href="${data.profileLink}" class="button">Bewertung ansehen & antworten</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        <strong>Tipp:</strong> Antworten Sie auf Bewertungen, um Wertschätzung zu zeigen und 
        Vertrauen bei zukünftigen Kunden aufzubauen.
      </p>
    </div>
  `);
};

// Rating Response Template (for Client)
interface RatingResponseData {
  clientName: string;
  handwerkerName: string;
  projectTitle: string;
  responseText: string;
  reviewLink: string;
}

export const ratingResponseClientTemplate = (data: RatingResponseData) => {
  const truncatedResponse = data.responseText.length > 200 
    ? data.responseText.substring(0, 200) + '...' 
    : data.responseText;

  return emailWrapper(`
    <div class="content">
      <h2>💬 Antwort auf Ihre Bewertung</h2>
      <p>Hallo ${safe(data.clientName, 'Kunde')},</p>
      <p><strong>${safe(data.handwerkerName)}</strong> hat auf Ihre Bewertung zum Projekt <strong>"${safe(data.projectTitle, 'Ihr Projekt')}"</strong> geantwortet.</p>
      
      <div class="info-box">
        <p style="font-style: italic; color: #555; margin: 0;">"${truncatedResponse}"</p>
      </div>

      <p style="text-align: center;">
        <a href="${data.reviewLink}" class="button">Antwort ansehen</a>
      </p>
    </div>
  `);
};

// Rating Reminder Template (moved from inline in proposal-deadline-reminder)
interface RatingReminderData {
  clientName: string;
  handwerkerName: string;
  projectTitle: string;
  ratingLink: string;
}

export const ratingReminderTemplate = (data: RatingReminderData) => {
  return emailWrapper(`
    <div class="content">
      <h2>⭐ Wie war Ihre Erfahrung?</h2>
      <p>Hallo ${safe(data.clientName, 'Kunde')},</p>
      <p>Ihr Projekt <strong>"${safe(data.projectTitle, 'Ihr Projekt')}"</strong> mit <strong>${safe(data.handwerkerName)}</strong> wurde vor einer Woche abgeschlossen.</p>
      
      <div class="info-box">
        <p><strong>Ihre Bewertung hilft anderen Kunden</strong>, den richtigen Handwerker zu finden, 
        und belohnt gute Arbeit.</p>
      </div>

      <p style="text-align: center;">
        <a href="${data.ratingLink}" class="button">Jetzt bewerten</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        Die Bewertung dauert nur 1 Minute. Vielen Dank für Ihre Unterstützung!
      </p>
    </div>
  `);
};

// Delivery Confirmation Template (for Handwerker)
interface DeliveryConfirmationHandwerkerData {
  handwerkerName: string;
  projectTitle: string;
  clientName: string;
  dashboardLink: string;
}

export const deliveryConfirmationHandwerkerTemplate = (data: DeliveryConfirmationHandwerkerData) => {
  return emailWrapper(`
    <div class="content">
      <h2>Auftrag als erledigt gemeldet</h2>
      <p>Hallo ${safe(data.handwerkerName, 'Handwerker')},</p>
      <p>Sie haben das Projekt <strong>"${safe(data.projectTitle, 'Ihr Projekt')}"</strong> erfolgreich als erledigt gemeldet.</p>

      <div class="info-box" style="background: #d1fae5; border-left-color: #10b981;">
        <p style="margin: 0;"><strong>Kunde:</strong> ${safe(data.clientName, 'Kunde')}</p>
        <p style="margin: 5px 0 0 0;">Der Kunde wird benachrichtigt und kann nun eine Bewertung abgeben.</p>
      </div>

      <p style="text-align: center;">
        <a href="${data.dashboardLink}" class="button">Zum Dashboard</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        <strong>Tipp:</strong> Positive Bewertungen stärken Ihr Profil und helfen Ihnen,
        neue Kunden zu gewinnen. Bedanken Sie sich bei zufriedenen Kunden für eine Bewertung.
      </p>
    </div>
  `);
};

// Delivery Review Invitation Template (for Client)
interface DeliveryReviewInvitationData {
  clientName: string;
  handwerkerName: string;
  projectTitle: string;
  ratingLink: string;
}

export const deliveryReviewInvitationTemplate = (data: DeliveryReviewInvitationData) => {
  return emailWrapper(`
    <div class="content">
      <h2>Ihr Projekt wurde abgeschlossen</h2>
      <p>Hallo ${safe(data.clientName, 'Kunde')},</p>
      <p><strong>${safe(data.handwerkerName)}</strong> hat Ihr Projekt <strong>"${safe(data.projectTitle, 'Ihr Projekt')}"</strong> als abgeschlossen gemeldet.</p>

      <div class="info-box" style="background: #dbeafe; border-left-color: #3b82f6;">
        <p style="margin: 0;"><strong>Sind Sie zufrieden?</strong> Ihre Bewertung hilft anderen Kunden,
        den richtigen Handwerker zu finden, und belohnt gute Arbeit.</p>
      </div>

      <p style="text-align: center;">
        <a href="${data.ratingLink}" class="button">Jetzt bewerten</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        Die Bewertung dauert nur 1 Minute und ist freiwillig.
        Vielen Dank für Ihre Unterstützung!
      </p>

      <p style="font-size: 14px; color: #666;">
        Bei Problemen oder Reklamationen kontaktieren Sie uns unter
        <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
      </p>
    </div>
  `);
};

// Proposal Rejection Template (for Handwerker)
interface ProposalRejectionData {
  handwerkerName: string;
  projectTitle: string;
  clientFirstName: string;
}

export const proposalRejectionTemplate = (data: ProposalRejectionData) => {
  return emailWrapper(`
    <div class="content">
      <h2>Offerte nicht ausgewählt</h2>
      <p>Hallo ${safe(data.handwerkerName, 'Handwerker')},</p>
      <p>Leider wurde Ihre Offerte für das Projekt <strong>"${safe(data.projectTitle, 'Ihr Projekt')}"</strong> von ${safe(data.clientFirstName, 'dem Kunden')} nicht ausgewählt.</p>
      
      <div class="info-box">
        <p>Der Kunde hat sich für einen anderen Handwerker entschieden. 
        Das bedeutet nicht, dass Ihre Offerte schlecht war – manchmal passen andere Angebote besser zu den spezifischen Anforderungen.</p>
      </div>

      <p style="text-align: center;">
        <a href="${FRONTEND_URL}/handwerker-dashboard" class="button">Neue Anfragen ansehen</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        <strong>Tipp:</strong> Bleiben Sie aktiv und reichen Sie weiterhin Offerten ein. 
        Jede Anfrage ist eine neue Chance!
      </p>
    </div>
  `);
};

// Handwerker Welcome Template (for account creation after approval)
interface HandwerkerWelcomeData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const handwerkerWelcomeTemplate = (data: HandwerkerWelcomeData) => {
  return emailWrapper(`
    <div class="content">
      <h2>🎉 Willkommen bei BÜEZE.CH!</h2>
      <p>Hallo ${data.firstName} ${data.lastName},</p>
      <p>Gute Nachrichten - Ihr Handwerker-Profil wurde erfolgreich geprüft und freigeschaltet!</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #0066CC;">Ihre Zugangsdaten</h3>
        <p><strong>E-Mail:</strong> ${data.email}</p>
        <p><strong>Passwort:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 3px;">${data.password}</code></p>
      </div>

      <p style="text-align: center;">
        <a href="${FRONTEND_URL}/auth" class="button">🚀 Jetzt einloggen und loslegen</a>
      </p>

      <div class="info-box" style="border-left-color: #FF6B00;">
        <p><strong>⚠️ WICHTIG:</strong> Aus Sicherheitsgründen empfehlen wir, das Passwort nach der ersten Anmeldung zu ändern.</p>
      </div>

      <hr class="divider">
      
      <h3>Sie können jetzt:</h3>
      <ul>
        <li>✅ Alle aktiven Aufträge durchsuchen</li>
        <li>✅ Angebote an interessierte Kunden senden</li>
        <li>✅ Ihr Profil bearbeiten und optimieren</li>
        <li>✅ Direkt mit Auftraggebern kommunizieren</li>
      </ul>

      <div class="info-box">
        <p><strong>📱 Nach dem ersten Login:</strong></p>
        <p>Sie gelangen direkt zu Ihrem Dashboard, wo Sie Ihr Profil bearbeiten, aktive Aufträge durchsuchen und Angebote senden können.</p>
      </div>

      <p style="font-size: 14px; color: #666;">
        Bei Fragen stehen wir Ihnen gerne zur Verfügung unter <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
      </p>
    </div>
  `);
};
