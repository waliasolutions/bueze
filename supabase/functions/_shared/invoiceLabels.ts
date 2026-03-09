// Shared invoice labels for edge functions
// NOTE: Labels must match the SSOT in src/config/invoiceConfig.ts (frontend).
// Edge functions cannot import frontend modules, so this duplication is intentional.

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  issued: 'Ausgestellt',
  paid: 'Bezahlt',
  cancelled: 'Storniert',
  refunded: 'Erstattet',
};

export function getInvoiceStatusLabel(status: string): string {
  return INVOICE_STATUS_LABELS[status] || status;
}
