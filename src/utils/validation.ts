/**
 * Validation utilities for forms and data
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Indian mobile number
 */
export function isValidMobile(mobile: string): boolean {
  const mobileRegex = /^[6-9]\d{9}$/;
  const cleaned = mobile.replace(/\D/g, '');
  return mobileRegex.test(cleaned);
}

/**
 * Validate PAN number
 */
export function isValidPAN(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
}

/**
 * Validate Aadhaar number
 */
export function isValidAadhaar(aadhaar: string): boolean {
  const cleaned = aadhaar.replace(/\s/g, '');
  const aadhaarRegex = /^\d{12}$/;
  return aadhaarRegex.test(cleaned);
}

/**
 * Validate IFSC code
 */
export function isValidIFSC(ifsc: string): boolean {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc.toUpperCase());
}

/**
 * Validate pincode
 */
export function isValidPincode(pincode: string): boolean {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
}

/**
 * Validate number (positive)
 */
export function isValidPositiveNumber(value: any): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
}

/**
 * Validate number (non-negative)
 */
export function isValidNonNegativeNumber(value: any): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
}

/**
 * Validate required field
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Validate min length
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return value.length >= minLength;
}

/**
 * Validate max length
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength;
}

/**
 * Validate range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate file type
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size (in MB)
 */
export function isValidFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Validate image file
 */
export function isValidImage(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return isValidFileType(file, allowedTypes);
}

/**
 * Validate PDF file
 */
export function isValidPDF(file: File): boolean {
  return file.type === 'application/pdf';
}

/**
 * Validate document file (PDF or Image)
 */
export function isValidDocument(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  return isValidFileType(file, allowedTypes);
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Form validation helper
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

export function validateField(value: any, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    if (rule.required && !isRequired(value)) {
      return rule.message;
    }
    
    if (rule.minLength && typeof value === 'string' && !hasMinLength(value, rule.minLength)) {
      return rule.message;
    }
    
    if (rule.maxLength && typeof value === 'string' && !hasMaxLength(value, rule.maxLength)) {
      return rule.message;
    }
    
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return rule.message;
    }
    
    if (rule.custom && !rule.custom(value)) {
      return rule.message;
    }
  }
  
  return null;
}

export function validateForm(
  data: Record<string, any>,
  validationRules: Record<string, ValidationRule[]>
): ValidationErrors {
  const errors: ValidationErrors = {};
  
  for (const [field, rules] of Object.entries(validationRules)) {
    const error = validateField(data[field], rules);
    if (error) {
      errors[field] = error;
    }
  }
  
  return errors;
}
