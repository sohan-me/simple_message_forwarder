// Word-to-digit mapping for IVAC-style OTP (e.g. "Three-Five-Eight-One-One-Four" -> 358114)
const DIGIT_WORDS: Record<string, string> = {
  zero: '0', one: '1', two: '2', three: '3', four: '4',
  five: '5', six: '6', seven: '7', eight: '8', nine: '9',
};

/**
 * Converts a message with word-digits (e.g. "Three-Five-Eight-One-One-Four") into
 * the same message with digits (e.g. "358114"). Merges digit words separated by hyphens/spaces.
 */
function normalizeWordDigits(message: string): string {
  let out = message.replace(
    /\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/gi,
    (word) => DIGIT_WORDS[word.toLowerCase()] ?? word
  );
  // Merge digits separated by hyphens/spaces: "3-5-8-1-1-4" -> "358114"
  out = out.replace(/(\d)[\s\-]+/g, '$1');
  return out;
}

/**
 * Extracts OTP (4-8 digit number) from a message.
 * Handles numeric "123456" and IVAC-style "Three-Five-Eight-One-One-Four" -> "358114".
 * @param message - The message text to extract OTP from
 * @returns The extracted OTP as a string of digits (e.g. "358114"), or null if not found
 */
export function extractOTP(message: string): string | null {
  if (!message || typeof message !== 'string') return null;

  const trimmed = message.trim();
  // Convert word-digits to numbers so "Three-Five-One-One-Four" becomes "35114" in context
  const normalized = normalizeWordDigits(trimmed);

  const patterns = [
    /\b(?:code|otp|pin|verification)\s*[:\-]?\s*(\d{4,8})\b/i,
    /\b(\d{4,8})\s*(?:is your|as your|for your)?\s*(?:code|otp|pin)/i,
    /\b(\d{4,8})\b/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const otp = match[1] ?? match[0];
      if (otp && /^\d{4,8}$/.test(otp)) return otp;
    }
  }

  return null;
}

/**
 * Validates phone number format
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  
  // Check if it's a valid phone number (digits only, reasonable length)
  // Allow 7-15 digits (international standard)
  return /^\d{7,15}$/.test(cleaned);
}

