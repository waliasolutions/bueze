/**
 * Review content validation utilities
 * Handles profanity filtering, spam detection, and personal info detection
 */

// German profanity wordlist (common offensive terms)
const PROFANITY_LIST = [
  'arschloch', 'scheiße', 'scheisse', 'fick', 'ficken', 'hurensohn', 'wichser',
  'fotze', 'hure', 'nutte', 'schwuchtel', 'missgeburt', 'bastard', 'idiot',
  'vollidiot', 'drecksau', 'drecksack', 'arsch', 'schlampe', 'penner',
  'assi', 'assozial', 'behindert', 'spast', 'mongo', 'depp', 'trottel',
  'dumm', 'blödmann', 'blödian', 'saukerl', 'schwein', 'miststück'
];

const MAX_REVIEW_LENGTH = 1000;
export { MAX_REVIEW_LENGTH };

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates the overall review content
 */
export function validateReviewContent(text: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trimmedText = text.trim();

  // Note: No minimum length check - short comments like "Top!" are allowed

  // Check maximum length
  if (trimmedText.length > MAX_REVIEW_LENGTH) {
    errors.push(`Die Bewertung darf maximal ${MAX_REVIEW_LENGTH} Zeichen haben.`);
  }

  // Check for profanity
  const profanityCheck = detectProfanity(trimmedText);
  if (profanityCheck.hasProfanity) {
    errors.push('Ihre Bewertung enthält unangemessene Sprache. Bitte formulieren Sie sachlich.');
  }

  // Check for personal info
  const personalInfoCheck = detectPersonalInfo(trimmedText);
  if (personalInfoCheck.hasPersonalInfo) {
    warnings.push('Ihre Bewertung enthält möglicherweise persönliche Daten (Telefonnummer, E-Mail). Diese werden vor der Veröffentlichung entfernt.');
  }

  // Check for spam patterns
  const spamCheck = detectSpam(trimmedText);
  if (spamCheck.isSpam) {
    errors.push(spamCheck.reason || 'Der Text wurde als Spam erkannt.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Detects profanity in text
 */
export function detectProfanity(text: string): { hasProfanity: boolean; words: string[] } {
  const lowerText = text.toLowerCase();
  const foundWords: string[] = [];

  for (const word of PROFANITY_LIST) {
    // Check for word boundaries to avoid false positives
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(lowerText)) {
      foundWords.push(word);
    }
  }

  return {
    hasProfanity: foundWords.length > 0,
    words: foundWords
  };
}

/**
 * Detects personal information in text (phone numbers, emails)
 */
function detectPersonalInfo(text: string): { hasPersonalInfo: boolean; types: string[] } {
  const types: string[] = [];

  // Swiss phone number patterns
  const phonePatterns = [
    /\+41\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g,  // +41 XX XXX XX XX
    /0041\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g,   // 0041 XX XXX XX XX
    /0\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g,         // 0XX XXX XX XX
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{2}[-.\s]?\d{2}/g  // XXX XXX XX XX
  ];

  for (const pattern of phonePatterns) {
    if (pattern.test(text)) {
      types.push('Telefonnummer');
      break;
    }
  }

  // Email pattern
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  if (emailPattern.test(text)) {
    types.push('E-Mail-Adresse');
  }

  // Address pattern (Swiss postal code + city)
  const addressPattern = /\b\d{4}\s+[A-Za-zäöüÄÖÜ]+\b/g;
  if (addressPattern.test(text)) {
    types.push('Adresse');
  }

  return {
    hasPersonalInfo: types.length > 0,
    types
  };
}

/**
 * Detects spam patterns in text
 */
export function detectSpam(text: string): { isSpam: boolean; reason?: string } {
  const trimmedText = text.trim();

  // Check for excessive caps (more than 50% uppercase if longer than 10 chars)
  if (trimmedText.length > 10) {
    const upperCount = (trimmedText.match(/[A-ZÄÖÜ]/g) || []).length;
    const letterCount = (trimmedText.match(/[a-zA-ZäöüÄÖÜ]/g) || []).length;
    if (letterCount > 0 && upperCount / letterCount > 0.5) {
      return { isSpam: true, reason: 'Bitte verwenden Sie keine durchgängige Grossschreibung.' };
    }
  }

  // Check for excessive punctuation
  const punctuationPattern = /[!?]{3,}/g;
  if (punctuationPattern.test(trimmedText)) {
    return { isSpam: true, reason: 'Bitte vermeiden Sie übermässige Satzzeichen.' };
  }

  // Check for repetitive characters (e.g., "suuuuuper")
  const repetitivePattern = /(.)\1{4,}/g;
  if (repetitivePattern.test(trimmedText)) {
    return { isSpam: true, reason: 'Bitte vermeiden Sie wiederholte Zeichen.' };
  }

  // Check for URLs
  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
  if (urlPattern.test(trimmedText)) {
    return { isSpam: true, reason: 'Links sind in Bewertungen nicht erlaubt.' };
  }

  // Check for repetitive words (same word 5+ times)
  const words = trimmedText.toLowerCase().split(/\s+/);
  const wordCount: Record<string, number> = {};
  for (const word of words) {
    if (word.length > 2) {
      wordCount[word] = (wordCount[word] || 0) + 1;
      if (wordCount[word] >= 5) {
        return { isSpam: true, reason: 'Bitte vermeiden Sie wiederholte Wörter.' };
      }
    }
  }

  return { isSpam: false };
}

