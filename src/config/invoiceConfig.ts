/**
 * Single Source of Truth for Invoice Configuration
 * All invoice-related labels, statuses, and helpers should reference this file.
 * Edge function mirror: supabase/functions/_shared/invoiceLabels.ts
 */

export type InvoiceStatus = 'issued' | 'paid' | 'cancelled' | 'refunded';

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, {
  label: string;
  variant: 'default' | 'success' | 'destructive' | 'warning';
  className: string;
}> = {
  issued: {
    label: 'Ausgestellt',
    variant: 'default',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  paid: {
    label: 'Bezahlt',
    variant: 'success',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  cancelled: {
    label: 'Storniert',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  refunded: {
    label: 'Erstattet',
    variant: 'warning',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
};

/**
 * Get status configuration by status string
 */
export function getInvoiceStatusConfig(status: string) {
  return INVOICE_STATUS_CONFIG[status as InvoiceStatus] ?? INVOICE_STATUS_CONFIG.issued;
}

/**
 * Format amount in Rappen to CHF display string
 */
export function formatInvoiceAmount(amountInRappen: number, currency = 'CHF'): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountInRappen / 100);
}
