/**
 * Number formatting utilities
 */

import numeral from 'numeral';

/**
 * Format number as Indian currency (₹)
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '₹0.00';
  return `₹${numeral(amount).format('0,0.00')}`;
}

/**
 * Format number as Indian currency without decimals
 */
export function formatCurrencyWhole(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '₹0';
  return `₹${numeral(amount).format('0,0')}`;
}

/**
 * Format number with Indian number system (lakhs, crores)
 */
export function formatIndianNumber(num: number): string {
  const x = num.toString();
  let lastThree = x.substring(x.length - 3);
  const otherNumbers = x.substring(0, x.length - 3);
  
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  
  return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
}

/**
 * Convert number to words (Indian style)
 */
export function numberToWords(num: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];
  
  if (num === 0) return 'Zero';
  
  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    
    if (n < 20) {
      return ones[n];
    } else if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    } else {
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    }
  }
  
  // Handle decimal part
  const parts = num.toString().split('.');
  let integerPart = parseInt(parts[0]);
  const decimalPart = parts[1] ? parseInt(parts[1].substring(0, 2)) : 0;
  
  let result = '';
  
  // Crores
  if (integerPart >= 10000000) {
    result += convertLessThanThousand(Math.floor(integerPart / 10000000)) + ' Crore ';
    integerPart %= 10000000;
  }
  
  // Lakhs
  if (integerPart >= 100000) {
    result += convertLessThanThousand(Math.floor(integerPart / 100000)) + ' Lakh ';
    integerPart %= 100000;
  }
  
  // Thousands
  if (integerPart >= 1000) {
    result += convertLessThanThousand(Math.floor(integerPart / 1000)) + ' Thousand ';
    integerPart %= 1000;
  }
  
  // Remaining
  if (integerPart > 0) {
    result += convertLessThanThousand(integerPart);
  }
  
  result = result.trim() + ' Rupees';
  
  // Add paise if decimal exists
  if (decimalPart > 0) {
    result += ' and ' + convertLessThanThousand(decimalPart) + ' Paise';
  }
  
  return result + ' Only';
}

/**
 * Parse Indian formatted number string to number
 */
export function parseIndianNumber(str: string): number {
  // Remove currency symbols and commas
  const cleaned = str.replace(/[₹,]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format phone number (Indian)
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{5})(\d{5})/, '$1-$2');
  }
  
  return phone;
}

/**
 * Generate auto-incremented number with prefix
 */
export function generateAutoNumber(prefix: string, lastNumber: number, digits: number = 3): string {
  const nextNumber = lastNumber + 1;
  const paddedNumber = nextNumber.toString().padStart(digits, '0');
  return `${prefix}${paddedNumber}`;
}
