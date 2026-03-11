// Invoice PDF generator using pdf-lib
// Generates professional Swiss-style invoice PDFs for Büeze.ch subscription payments

import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';
import { formatSwissDate } from './dateFormatter.ts';
import { getPlanName } from './planLabels.ts';
import type { BillingSettings } from './companyConfig.ts';

// Color constants
const BRAND_BLUE = rgb(0, 0.4, 0.8);     // #0066CC
const TEXT_BLACK = rgb(0.1, 0.1, 0.12);
const TEXT_GRAY = rgb(0.4, 0.4, 0.45);
const LINE_GRAY = rgb(0.85, 0.85, 0.87);
const BG_LIGHT = rgb(0.96, 0.97, 0.98);

export interface InvoicePdfData {
  invoiceNumber: string;
  issuedAt: string;
  dueDate: string;
  paidAt?: string | null;
  // Billing details (snapshot)
  billingName: string;
  billingCompany?: string | null;
  billingAddress?: string | null;
  billingZip?: string | null;
  billingCity?: string | null;
  // Line item
  planType: string;
  description: string;
  netAmount: number;    // in Rappen
  taxRate: number;      // percentage (e.g. 0 or 7.7)
  taxAmount: number;    // in Rappen
  amount: number;       // total in Rappen
  currency: string;
  // Optional: subscription period
  periodStart?: string | null;
  periodEnd?: string | null;
  // Company data (from billing_settings snapshot)
  company: BillingSettings;
}

function formatCHF(amountInRappen: number): string {
  return `CHF ${(amountInRappen / 100).toFixed(2)}`;
}

/**
 * Generate a professional invoice PDF
 * @returns Uint8Array of the PDF document
 */
export async function generateInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = height - margin;

  const company = data.company;

  // Helper functions
  const drawText = (text: string, x: number, yPos: number, opts: { font?: typeof fontRegular; size?: number; color?: typeof TEXT_BLACK } = {}) => {
    page.drawText(text, {
      x, y: yPos,
      font: opts.font ?? fontRegular,
      size: opts.size ?? 10,
      color: opts.color ?? TEXT_BLACK,
    });
  };

  const drawLine = (x1: number, yPos: number, x2: number) => {
    page.drawLine({
      start: { x: x1, y: yPos },
      end: { x: x2, y: yPos },
      thickness: 0.5,
      color: LINE_GRAY,
    });
  };

  // ==========================================
  // HEADER: Company branding
  // ==========================================
  drawText('BÜEZE.CH', margin, y, { font: fontBold, size: 24, color: BRAND_BLUE });
  y -= 18;
  drawText('Ihre Plattform für Handwerker in der Schweiz', margin, y, { size: 9, color: TEXT_GRAY });

  // Company address (right-aligned)
  const rightX = width - margin;
  let companyY = height - margin;
  const companyLines = [
    company.company_legal_name,
    company.company_street,
    `${company.company_zip} ${company.company_city}`,
    company.company_country,
    company.company_email,
  ];
  if (company.mwst_number) {
    companyLines.push(company.mwst_number);
  }
  for (const line of companyLines) {
    const textWidth = fontRegular.widthOfTextAtSize(line, 9);
    drawText(line, rightX - textWidth, companyY, { size: 9, color: TEXT_GRAY });
    companyY -= 13;
  }

  y -= 40;
  drawLine(margin, y, width - margin);
  y -= 25;

  // ==========================================
  // INVOICE TITLE
  // ==========================================
  drawText('RECHNUNG', margin, y, { font: fontBold, size: 18, color: TEXT_BLACK });
  y -= 30;

  // Invoice meta (left column)
  const metaLabels = [
    ['Rechnungsnr.:', data.invoiceNumber],
    ['Rechnungsdatum:', formatSwissDate(data.issuedAt)],
    ['Fällig am:', formatSwissDate(data.dueDate)],
  ];
  if (data.paidAt) {
    metaLabels.push(['Bezahlt am:', formatSwissDate(data.paidAt)]);
  }

  for (const [label, value] of metaLabels) {
    drawText(label, margin, y, { size: 9, color: TEXT_GRAY });
    drawText(value, margin + 100, y, { font: fontBold, size: 9 });
    y -= 16;
  }

  // ==========================================
  // BILLING ADDRESS (right column)
  // ==========================================
  let billingY = y + (metaLabels.length * 16);
  const billingX = width / 2 + 20;

  drawText('Rechnungsempfänger:', billingX, billingY, { size: 9, color: TEXT_GRAY });
  billingY -= 16;

  if (data.billingCompany) {
    drawText(data.billingCompany, billingX, billingY, { font: fontBold, size: 10 });
    billingY -= 14;
  }
  drawText(data.billingName, billingX, billingY, { size: 10 });
  billingY -= 14;
  if (data.billingAddress) {
    drawText(data.billingAddress, billingX, billingY, { size: 10 });
    billingY -= 14;
  }
  if (data.billingZip || data.billingCity) {
    drawText(`${data.billingZip || ''} ${data.billingCity || ''}`.trim(), billingX, billingY, { size: 10 });
    billingY -= 14;
  }

  y -= 20;
  drawLine(margin, y, width - margin);
  y -= 25;

  // ==========================================
  // LINE ITEMS TABLE
  // ==========================================
  // Table header background
  page.drawRectangle({
    x: margin,
    y: y - 5,
    width: width - 2 * margin,
    height: 22,
    color: BG_LIGHT,
  });

  const col1 = margin + 8;
  const col2 = width - margin - 120;
  const col3 = width - margin - 8;

  drawText('Beschreibung', col1, y, { font: fontBold, size: 9, color: TEXT_GRAY });
  const qtyHeader = 'Menge';
  const qtyWidth = fontBold.widthOfTextAtSize(qtyHeader, 9);
  drawText(qtyHeader, col2 - qtyWidth, y, { font: fontBold, size: 9, color: TEXT_GRAY });
  const amtHeader = 'Betrag';
  const amtWidth = fontBold.widthOfTextAtSize(amtHeader, 9);
  drawText(amtHeader, col3 - amtWidth, y, { font: fontBold, size: 9, color: TEXT_GRAY });

  y -= 25;

  // Line item
  const planName = getPlanName(data.planType);
  const lineDesc = `${planName} Abonnement`;
  drawText(lineDesc, col1, y, { size: 10 });
  // Sub-description
  y -= 14;
  let subDesc = data.description;
  if (data.periodStart && data.periodEnd) {
    subDesc = `Laufzeit: ${formatSwissDate(data.periodStart)} – ${formatSwissDate(data.periodEnd)}`;
  }
  drawText(subDesc, col1, y, { size: 8, color: TEXT_GRAY });

  // Quantity & amount (on the first line)
  const qty = '1';
  const qtyTextWidth = fontRegular.widthOfTextAtSize(qty, 10);
  drawText(qty, col2 - qtyTextWidth, y + 14, { size: 10 });
  const netStr = formatCHF(data.netAmount);
  const netTextWidth = fontRegular.widthOfTextAtSize(netStr, 10);
  drawText(netStr, col3 - netTextWidth, y + 14, { size: 10 });

  y -= 15;
  drawLine(margin, y, width - margin);
  y -= 20;

  // ==========================================
  // TOTALS SECTION
  // ==========================================
  const totalsX = col2 - 60;

  // Subtotal
  drawText('Zwischensumme:', totalsX, y, { size: 10, color: TEXT_GRAY });
  const subStr = formatCHF(data.netAmount);
  const subW = fontRegular.widthOfTextAtSize(subStr, 10);
  drawText(subStr, col3 - subW, y, { size: 10 });
  y -= 18;

  // Tax
  const taxLabel = data.taxRate > 0
    ? `MWST (${data.taxRate}%):`
    : `MWST (${company.mwst_note || 'befreit'}):`;
  drawText(taxLabel, totalsX, y, { size: 10, color: TEXT_GRAY });
  const taxStr = formatCHF(data.taxAmount);
  const taxW = fontRegular.widthOfTextAtSize(taxStr, 10);
  drawText(taxStr, col3 - taxW, y, { size: 10 });
  y -= 5;
  drawLine(totalsX, y, width - margin);
  y -= 18;

  // Total (bold, larger)
  drawText('Total:', totalsX, y, { font: fontBold, size: 12 });
  const totalStr = formatCHF(data.amount);
  const totalW = fontBold.widthOfTextAtSize(totalStr, 12);
  drawText(totalStr, col3 - totalW, y, { font: fontBold, size: 12, color: BRAND_BLUE });

  y -= 40;
  drawLine(margin, y, width - margin);
  y -= 25;

  // ==========================================
  // PAYMENT STATUS
  // ==========================================
  if (data.paidAt) {
    page.drawRectangle({
      x: margin,
      y: y - 5,
      width: width - 2 * margin,
      height: 28,
      color: rgb(0.82, 0.95, 0.87), // light green
    });
    drawText('BEZAHLT', margin + 12, y, { font: fontBold, size: 11, color: rgb(0.02, 0.37, 0.15) });
    const paidStr = `Zahlung erhalten am ${formatSwissDate(data.paidAt)}`;
    drawText(paidStr, margin + 80, y, { size: 10, color: rgb(0.02, 0.37, 0.15) });
    y -= 40;
  }

  // ==========================================
  // FOOTER
  // ==========================================
  const footerY = margin + 30;
  drawLine(margin, footerY + 15, width - margin);
  drawText('Vielen Dank für Ihr Vertrauen.', margin, footerY, { size: 9, color: TEXT_GRAY });
  drawText(`${company.company_legal_name} · ${company.company_street} · ${company.company_zip} ${company.company_city} · ${company.company_country}`, margin, footerY - 14, { size: 8, color: TEXT_GRAY });
  drawText(`${company.company_email} · ${company.company_website}`, margin, footerY - 26, { size: 8, color: TEXT_GRAY });

  return doc.save();
}
