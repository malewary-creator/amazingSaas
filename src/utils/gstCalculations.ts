/**
 * Utility functions for GST calculations
 */

export interface GSTCalculation {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGST: number;
  totalAmount: number;
}

/**
 * Calculate GST based on amount and rate
 */
export function calculateGST(
  amount: number,
  gstRate: number,
  isInterState: boolean = false
): GSTCalculation {
  const taxableAmount = amount;
  const totalGSTAmount = (taxableAmount * gstRate) / 100;
  
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  
  if (isInterState) {
    // Inter-state: IGST
    igst = totalGSTAmount;
  } else {
    // Intra-state: CGST + SGST
    cgst = totalGSTAmount / 2;
    sgst = totalGSTAmount / 2;
  }
  
  return {
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalGST: totalGSTAmount,
    totalAmount: taxableAmount + totalGSTAmount,
  };
}

/**
 * Calculate line item total with discount and GST
 */
export function calculateLineItemTotal(
  quantity: number,
  unitPrice: number,
  discountPercent: number = 0,
  gstRate: number = 0,
  isInterState: boolean = false
): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  gst: GSTCalculation;
  lineTotal: number;
} {
  const subtotal = quantity * unitPrice;
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  
  const gst = calculateGST(taxableAmount, gstRate, isInterState);
  
  return {
    subtotal,
    discountAmount,
    taxableAmount,
    gst,
    lineTotal: gst.totalAmount,
  };
}

/**
 * Calculate invoice totals from multiple line items
 */
export function calculateInvoiceTotals(
  items: Array<{
    quantity: number;
    unitPrice: number;
    discount?: number;
    gstRate?: number;
  }>,
  isInterState: boolean = false,
  additionalDiscount: number = 0
): {
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGST: number;
  roundOff: number;
  grandTotal: number;
} {
  let subtotal = 0;
  let totalDiscount = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  
  items.forEach(item => {
    const itemTotal = calculateLineItemTotal(
      item.quantity,
      item.unitPrice,
      item.discount || 0,
      item.gstRate || 0,
      isInterState
    );
    
    subtotal += itemTotal.subtotal;
    totalDiscount += itemTotal.discountAmount;
    cgst += itemTotal.gst.cgst;
    sgst += itemTotal.gst.sgst;
    igst += itemTotal.gst.igst;
  });
  
  // Add additional discount
  totalDiscount += additionalDiscount;
  const taxableAmount = subtotal - totalDiscount;
  
  const totalGST = cgst + sgst + igst;
  const totalBeforeRounding = taxableAmount + totalGST;
  
  // Round off to nearest rupee
  const grandTotal = Math.round(totalBeforeRounding);
  const roundOff = grandTotal - totalBeforeRounding;
  
  return {
    subtotal,
    totalDiscount,
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalGST,
    roundOff,
    grandTotal,
  };
}

/**
 * Reverse calculate: Get base amount from GST inclusive amount
 */
export function getBaseAmountFromGSTInclusive(
  inclusiveAmount: number,
  gstRate: number
): { baseAmount: number; gstAmount: number } {
  const baseAmount = inclusiveAmount / (1 + gstRate / 100);
  const gstAmount = inclusiveAmount - baseAmount;
  
  return {
    baseAmount: Number(baseAmount.toFixed(2)),
    gstAmount: Number(gstAmount.toFixed(2)),
  };
}

/**
 * Validate GSTIN format
 */
export function validateGSTIN(gstin: string): boolean {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
}

/**
 * Get state code from GSTIN
 */
export function getStateCodeFromGSTIN(gstin: string): string | null {
  if (!validateGSTIN(gstin)) return null;
  return gstin.substring(0, 2);
}

/**
 * Check if transaction is inter-state
 */
export function isInterStateTransaction(
  sellerGSTIN: string,
  buyerGSTIN: string
): boolean {
  const sellerState = getStateCodeFromGSTIN(sellerGSTIN);
  const buyerState = getStateCodeFromGSTIN(buyerGSTIN);
  
  if (!sellerState || !buyerState) return false;
  
  return sellerState !== buyerState;
}
