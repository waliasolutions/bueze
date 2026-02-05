/**
 * Chat Message Templates - SSOT for handwerker quick responses
 * Used in: Messages.tsx
 */

export interface MessageTemplate {
  id: string;
  label: string;
  text: string;
  icon?: string;
}

export const messageTemplates: MessageTemplate[] = [
  {
    id: 'viewing',
    label: 'Besichtigung vorschlagen',
    text: 'Guten Tag\n\nGerne würde ich mir das Projekt vor Ort ansehen. Ich könnte am [Datum] um [Uhrzeit] vorbeikommen.\n\nPassen Ihnen Zeit und Datum?\n\nFreundliche Grüsse',
    icon: 'calendar'
  },
  {
    id: 'clarification',
    label: 'Rückfrage stellen',
    text: 'Guten Tag\n\nUm Ihnen eine genaue Offerte erstellen zu können, hätte ich noch folgende Fragen:\n\n1. [Frage 1]\n2. [Frage 2]\n\nVielen Dank für Ihre Rückmeldung.\n\nFreundliche Grüsse',
    icon: 'help-circle'
  },
  {
    id: 'availability',
    label: 'Verfügbarkeit mitteilen',
    text: 'Guten Tag\n\nIch könnte mit den Arbeiten ab [Datum] beginnen. Die geschätzte Dauer beträgt [X] Tage.\n\nBitte lassen Sie mich wissen, ob dieser Zeitraum für Sie passt.\n\nFreundliche Grüsse',
    icon: 'clock'
  },
  {
    id: 'thank-you',
    label: 'Zusage bestätigen',
    text: 'Guten Tag\n\nVielen Dank für Ihr Vertrauen. Ich freue mich auf die Zusammenarbeit!\n\nIch werde mich in Kürze bei Ihnen melden, um die Details zu besprechen.\n\nFreundliche Grüsse',
    icon: 'check'
  },
];

/**
 * Get template by ID
 */
export function getMessageTemplate(id: string): MessageTemplate | undefined {
  return messageTemplates.find(t => t.id === id);
}
