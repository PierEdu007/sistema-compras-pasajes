/**
 * Security & Input Sanitization Utilities
 * Protects against XSS, SQL Injection, Script Injection, and Malicious Payloads
 */

// Regex patterns for validation
export const PATTERNS = {
  // Letters (including accented and ñ), spaces, hyphens, and apostrophes (no numbers, no special symbols)
  NAMES: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/,
  // Peruvian DNI: Exactly 8 digits
  DNI: /^[0-9]{8}$/,
  // Peruvian RUC: Exactly 11 digits starting with 10 or 20
  RUC: /^(10|20)[0-9]{9}$/,
  // CE (Carnet de Extranjería) / Passport: 6 to 15 alphanumeric chars
  PASAPORTE_CE: /^[a-zA-Z0-9]{6,15}$/,
  // Phone: 9 to 15 digits (optional leading +)
  PHONE: /^\+?[0-9]{9,15}$/,
  // Email: Standard email format, max 100 chars
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  // Yape Operation code: 6 to 10 digits
  YAPE_OP: /^[0-9]{6,10}$/,
  // Date format: YYYY-MM-DD
  DATE: /^\d{4}-\d{2}-\d{2}$/,
};

/**
 * Detects dangerous code injection patterns (XSS, SQL Injection, Script vectors)
 */
export function containsDangerousCode(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  const dangerousPatterns = [
    /<script[\s\S]*?>/i,
    /<\/script>/i,
    /javascript:/i,
    /vbscript:/i,
    /data:text\/html/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /onclick\s*=/i,
    /onmouseover\s*=/i,
    /<iframe[\s\S]*?>/i,
    /<object[\s\S]*?>/i,
    /<embed[\s\S]*?>/i,
    /<svg[\s\S]*?>/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /\b(SELECT|UNION|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b/i,
    /--[\s\S]*$/,
    /\/\*[\s\S]*?\*\//,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Basic HTML / special characters stripper
 */
export function stripHtmlAndDangerousChars(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/[<>{}()\[\]\\`~$^%*+;:=?|]/g, '') // Remove dangerous code symbols
    .trim();
}

/**
 * Sanitizes passenger names and surnames (letters, spaces, accents, hyphens only)
 */
export function sanitizeName(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '') // Only allow letters, spaces, hyphens, apostrophes
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .slice(0, 60)
    .trim()
    .toUpperCase();
}

/**
 * Live filter for typing in name fields (preserves trailing space while typing)
 */
export function filterLiveNameInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '')
    .slice(0, 60)
    .toUpperCase();
}

/**
 * Sanitizes Document Number according to document type
 */
export function sanitizeDocNumber(doc: string, tipo: string): string {
  if (!doc || typeof doc !== 'string') return '';
  const clean = doc.trim();
  if (tipo === 'DNI') {
    return clean.replace(/\D/g, '').slice(0, 8);
  }
  if (tipo === 'RUC') {
    return clean.replace(/\D/g, '').slice(0, 11);
  }
  // CE or PASAPORTE
  return clean.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15).toUpperCase();
}

/**
 * Live filter for document number input
 */
export function filterLiveDocInput(input: string, tipo: string): string {
  if (!input || typeof input !== 'string') return '';
  if (tipo === 'DNI' || tipo === 'RUC') {
    const max = tipo === 'DNI' ? 8 : 11;
    return input.replace(/\D/g, '').slice(0, max);
  }
  return input.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15).toUpperCase();
}

/**
 * Sanitizes phone number (strictly digits, optional leading +)
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  const hasPlus = phone.trim().startsWith('+');
  const digits = phone.replace(/\D/g, '').slice(0, 15);
  return (hasPlus ? '+' : '') + digits;
}

/**
 * Live filter for phone number input
 */
export function filterLivePhoneInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const startsWithPlus = input.startsWith('+');
  const digits = input.replace(/\D/g, '').slice(0, 15);
  return (startsWithPlus ? '+' : '') + digits;
}

/**
 * Sanitizes email address
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  return email
    .replace(/[<>'"`{}()\[\]\\/;\s]/g, '')
    .slice(0, 100)
    .toLowerCase()
    .trim();
}

/**
 * Sanitizes company name (Razón Social)
 */
export function sanitizeCompanyName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,\-&':_/()#]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 120)
    .trim()
    .toUpperCase();
}

/**
 * Live filter for company name input
 */
export function filterLiveCompanyInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,\-&':_/()#]/g, '')
    .slice(0, 120)
    .toUpperCase();
}

/**
 * Sanitizes fiscal address
 */
export function sanitizeAddress(address: string): string {
  if (!address || typeof address !== 'string') return '';
  return address
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,\-#/º°':_]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 150)
    .trim()
    .toUpperCase();
}

/**
 * Live filter for address input
 */
export function filterLiveAddressInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,\-#/º°':_]/g, '')
    .slice(0, 150)
    .toUpperCase();
}

/**
 * Sanitizes optional description / notes for invoice
 */
export function sanitizeNotes(notes: string): string {
  if (!notes || typeof notes !== 'string') return '';
  return notes
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,\-:_/()#º°'&]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 200)
    .trim()
    .toUpperCase();
}

/**
 * Live filter for optional notes input
 */
export function filterLiveNotesInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,\-:_/()#º°'&]/g, '')
    .slice(0, 200)
    .toUpperCase();
}

/**
 * Sanitizes Yape operation code (digits only, max 10)
 */
export function sanitizeOperationCode(op: string): string {
  if (!op || typeof op !== 'string') return '';
  return op.replace(/\D/g, '').slice(0, 10).trim();
}

/**
 * Sanitizes general search queries (admin or public search)
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';
  return query
    .replace(/<[^>]*>?/gm, '')
    .replace(/[;`$\\]/g, '')
    .slice(0, 60)
    .trim();
}
