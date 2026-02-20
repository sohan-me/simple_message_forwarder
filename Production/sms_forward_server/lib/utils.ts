/**
 * Extracts OTP (4-8 digit number) from a message using regex
 * @param message - The message text to extract OTP from
 * @returns The extracted OTP string or null if not found
 */
export function extractOTP(message: string): string | null {
  // Match 4-8 digit numbers
  // This regex looks for standalone numbers between 4-8 digits
  // It avoids matching longer numbers by using word boundaries
  const otpPattern = /\b\d{4,8}\b/;
  const match = message.match(otpPattern);
  
  if (match && match[0]) {
    return match[0];
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

