/**
 * Centralized content defaults - Single Source of Truth (SSOT)
 * These values MUST match what's stored in the database.
 * Used as fallbacks when CMS content is unavailable.
 */

/**
 * Hero content defaults - synced with database page_content.homepage_hero
 * Last synced: 2026-01-29
 */
export const heroDefaults = {
  title: 'Handwerker in der Schweiz finden und Offerten vergleichen',
  subtitle: 'Ihr lokaler Handwerker-Marktplatz für die ganze Schweiz',
  subIntro: 'Unser Portal bringt Sie mit erfahrenen Handwerkern aus der ganzen Schweiz zusammen – für Reparaturen, Renovierungen und Projekte jeder Grösse.',
  ctaText: 'Jetzt starten',
  badge: 'Geprüfte Handwerker',
  titleHighlight: 'Für jedes Projekt.',
  trustSignals: [
    'Geprüfte Fachbetriebe schweizweit',
    'Kostenlos & unverbindlich für Auftraggeber',
    'Datenschutz - Kontaktdaten erst nach Zusage'
  ]
} as const;

export const homepageSeoDefaults = {
  title: 'Handwerker finden in der Schweiz | Kostenlose Offerten | Büeze.ch',
  description: 'Ihr Schweizer Marktplatz für geprüfte Handwerker. Beschreiben Sie Ihr Projekt und erhalten Sie kostenlos bis zu 3 Offerten von Fachbetrieben aus Ihrer Region. Jetzt starten!',
  canonical: 'https://bueeze.ch/'
} as const;
