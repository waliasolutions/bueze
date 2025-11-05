// Email template library for BÜEZE.CH
// Swiss-inspired, clean design with consistent branding

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
      <p><strong>Büeze GmbH</strong><br>
      Gotthardstrasse 37 | 6410 Goldau | Schweiz</p>
      <p><a href="https://bueze.ch">www.bueze.ch</a> | <a href="mailto:info@bueze.ch">info@bueze.ch</a></p>
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
      <h2>Neue Anfrage in ${data.category}</h2>
      <p>Hallo ${data.handwerkerName},</p>
      <p>Eine neue Anfrage in Ihrem Fachgebiet ist verfügbar:</p>
      
      <div class="info-box">
        <p><strong>Kategorie:</strong> ${data.category}</p>
        <p><strong>Standort:</strong> ${data.city}</p>
        <p><strong>Budget:</strong> ${budgetText}</p>
        <p><strong>Dringlichkeit:</strong> ${data.urgency}</p>
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
      <p>Hallo ${data.clientName},</p>
      <p>Sie haben eine neue Offerte für Ihr Projekt <strong>"${data.projectTitle}"</strong> erhalten!</p>
      
      <div class="info-box">
        <p><strong>Handwerker:</strong> ${data.handwerkerFirstName} (${data.handwerkerCity})</p>
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
      <p>Hallo ${data.handwerkerName},</p>
      <p>Gute Nachrichten! Der Kunde hat Ihre Offerte für das Projekt <strong>"${data.projectTitle}"</strong> angenommen.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #0066CC;">Kontaktdaten des Kunden</h3>
        <p><strong>Name:</strong> ${data.clientName}</p>
        <p><strong>Telefon:</strong> ${data.clientPhone}</p>
        <p><strong>E-Mail:</strong> ${data.clientEmail}</p>
        <p><strong>Adresse:</strong> ${data.clientAddress}</p>
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
      <p>Hallo ${data.clientName},</p>
      <p>Sie haben <strong>${data.handwerkerName}</strong> für Ihr Projekt <strong>"${data.projectTitle}"</strong> ausgewählt.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #0066CC;">Kontaktdaten des Handwerkers</h3>
        <p><strong>Firma:</strong> ${data.handwerkerCompany}</p>
        <p><strong>Ansprechpartner:</strong> ${data.handwerkerName}</p>
        <p><strong>Telefon:</strong> ${data.handwerkerPhone}</p>
        <p><strong>E-Mail:</strong> ${data.handwerkerEmail}</p>
        ${data.handwerkerWebsite ? `<p><strong>Website:</strong> <a href="${data.handwerkerWebsite}">${data.handwerkerWebsite}</a></p>` : ''}
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #0066CC;">Offertendetails</h3>
        <p><strong>Preis:</strong> ${data.proposalPrice}</p>
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
        Bei Fragen oder Problemen stehen wir Ihnen gerne zur Verfügung unter <a href="mailto:info@bueze.ch">info@bueze.ch</a>
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
      <p>Hallo ${data.fullName},</p>
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

interface DeadlineReminderData {
  projectTitle: string;
  category: string;
  daysRemaining: number;
  magicLink: string;
  recipientName: string;
}

export const deadlineReminderTemplate = (data: DeadlineReminderData) => {
  return emailWrapper(`
    <div class="content">
      <h2>⏰ Erinnerung: Noch ${data.daysRemaining} Tage für Offerten</h2>
      <p>Hallo ${data.recipientName},</p>
      <p>Die Frist für Offerten zum Projekt <strong>"${data.projectTitle}"</strong> (${data.category}) läuft bald ab.</p>
      
      <div class="info-box" style="border-left-color: #FF6B00;">
        <p><strong>⏰ Noch ${data.daysRemaining} Tage Zeit</strong></p>
        <p>Reichen Sie jetzt Ihre Offerte ein, bevor die Frist abläuft!</p>
      </div>

      <p style="text-align: center;">
        <a href="${data.magicLink}" class="button">Jetzt Offerte einreichen</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        Nach Ablauf der Frist können keine neuen Offerten mehr eingereicht werden.
      </p>
    </div>
  `);
};
