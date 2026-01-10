# Quotations Module Documentation

## Overview

The Quotations Module provides comprehensive quotation generation and management functionality with advanced GST calculations, line-item management, and professional quotation preview. This module enables sales teams to create accurate, professional quotations with automatic tax calculations compliant with Indian GST regulations.

## Features

### ✅ Core Functionality
- **Auto-Generated Quotation Numbers**: QUO-YYYY-NNN format (e.g., QUO-2025-001)
- **Dynamic Line Items**: Add/remove line items with individual pricing and GST
- **Automatic GST Calculations**: Line-level and quotation-level GST calculations
- **CGST/SGST vs IGST**: Automatic determination based on customer state
- **Discount Management**: Line-item discounts + overall quotation discount
- **Round-Off Logic**: Automatic round-off to nearest rupee
- **Status Workflow**: Draft → Sent → Accepted/Rejected/Expired
- **Professional Preview**: Print-ready quotation with company branding
- **Expiry Tracking**: Auto-mark expired quotations based on validity date

### 📊 Statistics Dashboard
- Total quotations count
- Sent, Accepted, Rejected, Expired counts
- Total quotation value
- Accepted quotation value
- Acceptance rate percentage

## Data Structure

### Quotation Interface
```typescript
interface Quotation {
  id?: number;
  quotationNumber: string;        // Auto: QUO-2025-001
  leadId: number;                  // Required
  customerId: number;              // Required
  status: QuotationStatus;         // Draft/Sent/Accepted/Rejected/Expired
  quotationDate: Date;             // Required
  validityDate: Date;              // Defaults to 30 days
  
  // System Details
  systemSize?: number;             // kW
  systemType?: 'On-grid' | 'Off-grid' | 'Hybrid';
  panelBrand?: string;
  inverterBrand?: string;
  
  // Pricing (Auto-calculated)
  subtotal: number;                // Sum of line item totals
  discountPercent?: number;        // Overall discount %
  discountAmount?: number;         // Calculated discount
  taxableAmount: number;           // Subtotal - Discount
  cgst?: number;                   // Central GST (same state)
  sgst?: number;                   // State GST (same state)
  igst?: number;                   // Integrated GST (different state)
  totalGST: number;                // Total GST amount
  roundOff?: number;               // Round-off adjustment
  grandTotal: number;              // Final amount
  
  // Terms
  paymentTerms?: string;
  deliveryTerms?: string;
  warrantyTerms?: string;
  termsAndConditions?: string;
  
  // Tracking
  preparedBy?: number;
  approvedBy?: number;
  sentDate?: Date;
  acceptedDate?: Date;
  rejectionReason?: string;
}
```

### QuotationItem Interface
```typescript
interface QuotationItem {
  id?: number;
  quotationId: number;
  itemId: number;                  // Inventory item reference
  lineNumber: number;              // Display order
  itemName: string;                // Required
  description?: string;
  hsn?: string;                    // HSN/SAC code
  quantity: number;                // Required, min: 1
  unit: string;                    // Nos/Kg/Mtr/Set/Lot
  unitPrice: number;               // Required, min: 0
  discount?: number;               // Line discount %
  taxableAmount: number;           // (unitPrice × quantity) - discount
  gstRate: number;                 // 0/5/12/18/28%
  gstAmount: number;               // taxableAmount × (gstRate/100)
  totalAmount: number;             // taxableAmount + gstAmount
}
```

## GST Calculation Logic

### Line-Level Calculations
```javascript
// Step 1: Calculate gross amount
grossAmount = quantity × unitPrice

// Step 2: Apply line-item discount
discountAmount = (grossAmount × discount%) / 100
taxableAmount = grossAmount - discountAmount

// Step 3: Calculate GST
gstAmount = (taxableAmount × gstRate) / 100
totalAmount = taxableAmount + gstAmount
```

### Quotation-Level Calculations
```javascript
// Step 1: Sum all line item taxable amounts
subtotal = Σ(lineItem.taxableAmount)

// Step 2: Apply overall discount
discountAmount = (subtotal × discountPercent) / 100
taxableAmount = subtotal - discountAmount

// Step 3: Calculate GST (proportionally adjusted)
totalGST = Σ(lineItem.gstAmount) × (1 - discountPercent/100)

// Step 4: Determine CGST/SGST vs IGST
if (customerState === companyState) {
  cgst = totalGST / 2
  sgst = totalGST / 2
  igst = 0
} else {
  igst = totalGST
  cgst = 0
  sgst = 0
}

// Step 5: Apply round-off
exactTotal = taxableAmount + totalGST
grandTotal = Math.round(exactTotal)
roundOff = grandTotal - exactTotal
```

## Service Layer Functions

### quotationsService

#### generateQuotationNumber()
```typescript
generateQuotationNumber(): Promise<string>
```
Generates unique quotation number in QUO-YYYY-NNN format.

**Example Output**: `QUO-2025-001`, `QUO-2025-002`, etc.

#### calculateLineItemAmounts()
```typescript
calculateLineItemAmounts(
  quantity: number,
  unitPrice: number,
  discount: number = 0,
  gstRate: number = 18
): {
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
}
```
Calculates all amounts for a single line item.

**Example**:
```javascript
const result = quotationsService.calculateLineItemAmounts(
  10,      // quantity
  5000,    // unitPrice
  5,       // discount (5%)
  18       // gstRate (18%)
);
// Returns:
// {
//   taxableAmount: 47500,    // (10 × 5000) - 5% = 47,500
//   gstAmount: 8550,         // 47,500 × 18% = 8,550
//   totalAmount: 56050       // 47,500 + 8,550 = 56,050
// }
```

#### calculateQuotationTotals()
```typescript
calculateQuotationTotals(
  items: QuotationItem[],
  discountPercent: number = 0,
  isIGST: boolean = false
): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGST: number;
  roundOff: number;
  grandTotal: number;
}
```
Calculates quotation-level totals from line items.

#### createQuotation()
```typescript
createQuotation(
  data: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>,
  items: Omit<QuotationItem, 'id' | 'quotationId'>[]
): Promise<number>
```
Creates new quotation with line items. Returns quotation ID.

#### updateQuotation()
```typescript
updateQuotation(
  id: number,
  data: Partial<Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'>>,
  items?: Omit<QuotationItem, 'id' | 'quotationId'>[]
): Promise<void>
```
Updates quotation and optionally replaces all line items.

#### getQuotationWithDetails()
```typescript
getQuotationWithDetails(id: number): Promise<any>
```
Returns quotation with enriched data (customer details, lead info, line items, user names).

#### sendQuotation()
```typescript
sendQuotation(id: number): Promise<void>
```
Marks quotation as 'Sent' and records sent date.

#### acceptQuotation()
```typescript
acceptQuotation(id: number): Promise<void>
```
Marks quotation as 'Accepted' and records accepted date.

#### rejectQuotation()
```typescript
rejectQuotation(id: number, reason: string): Promise<void>
```
Marks quotation as 'Rejected' with reason.

#### checkExpiredQuotations()
```typescript
checkExpiredQuotations(): Promise<number>
```
Auto-marks quotations as 'Expired' if validity date has passed. Returns count.

#### getQuotationStats()
```typescript
getQuotationStats(): Promise<{
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  rejected: number;
  expired: number;
  totalValue: number;
  acceptedValue: number;
  acceptanceRate: number;
}>
```
Returns comprehensive statistics for dashboard.

## Components

### QuotationsList
**Location**: `src/modules/quotations/QuotationsList.tsx`

Main quotations dashboard with:
- 4 statistics cards
- Search by quotation number/customer/lead ID
- Status filter dropdown
- Table with all quotations
- Visual indicators for expiring/expired quotations
- Quick actions: View, Edit (Draft only), Send (Draft only), Delete

**Features**:
- Auto-checks for expired quotations on load
- Highlights expiring quotations (< 7 days)
- Highlights expired quotations (red background)
- Enriches data with customer names and lead IDs

### QuotationForm
**Location**: `src/modules/quotations/QuotationForm.tsx`

Complex form for creating/editing quotations:

**Sections**:
1. **Basic Information**: Lead, Customer, Dates
2. **System Details**: Size, Type, Brands
3. **Line Items Table**: Dynamic table with auto-calculations
4. **Pricing Summary**: Live totals display
5. **Terms & Conditions**: Payment, Delivery, Warranty, General terms

**Line Items Features**:
- Add/Remove rows dynamically
- Auto-calculate on quantity/price/discount/GST rate change
- Support for HSN codes
- Multiple units (Nos, Kg, Mtr, Set, Lot)
- Standard GST rates (0%, 5%, 12%, 18%, 28%)
- Per-line discount percentage

**Actions**:
- Save as Draft
- Save & Send (changes status to 'Sent')

**Validation**:
- Lead required
- Customer required
- At least one line item required
- All line items must have name, quantity > 0, price > 0

### QuotationDetails
**Location**: `src/modules/quotations/QuotationDetails.tsx`

Professional quotation preview:

**Layout**:
- Company header with branding
- Quotation number, date, validity
- Customer details (Bill To)
- System details (if applicable)
- Line items table with all columns
- Pricing summary with GST breakdown
- Terms & conditions
- Signature section
- Footer with prepared by, sent/accepted dates

**Actions**:
- Edit (Draft only)
- Send to Customer (Draft only)
- Accept (Sent only)
- Reject with reason (Sent only)
- Print/Download PDF (uses browser print)
- Delete

**Print-Ready**:
- Uses `@media print` CSS for clean printing
- Hides action buttons when printing
- Maintains colors and formatting

## Usage Examples

### Creating a Quotation

```typescript
// 1. Prepare line items with calculations
const lineItems = [
  {
    itemId: 1,
    lineNumber: 1,
    itemName: "Solar Panel 540W",
    description: "Monocrystalline, Tier-1",
    hsn: "85414011",
    quantity: 20,
    unit: "Nos",
    unitPrice: 8000,
    discount: 5,  // 5% discount
    gstRate: 18,
    ...quotationsService.calculateLineItemAmounts(20, 8000, 5, 18)
  },
  {
    itemId: 2,
    lineNumber: 2,
    itemName: "Solar Inverter 10kW",
    hsn: "85044030",
    quantity: 1,
    unit: "Nos",
    unitPrice: 75000,
    discount: 0,
    gstRate: 18,
    ...quotationsService.calculateLineItemAmounts(1, 75000, 0, 18)
  }
];

// 2. Create quotation
const quotationId = await quotationsService.createQuotation(
  {
    leadId: 5,
    customerId: 3,
    status: 'Draft',
    quotationDate: new Date(),
    validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    systemSize: 10,
    systemType: 'On-grid',
    panelBrand: 'Adani Solar',
    inverterBrand: 'Growatt',
    ...totals,  // From calculateQuotationTotals
    paymentTerms: "50% advance, 50% on completion",
    preparedBy: currentUser.id
  },
  lineItems
);
```

### Updating Quotation Status Workflow

```typescript
// Draft → Sent
await quotationsService.sendQuotation(quotationId);

// Sent → Accepted
await quotationsService.acceptQuotation(quotationId);

// Sent → Rejected
await quotationsService.rejectQuotation(
  quotationId, 
  "Customer found better pricing elsewhere"
);

// Auto-expire old quotations
const expiredCount = await quotationsService.checkExpiredQuotations();
console.log(`${expiredCount} quotations marked as expired`);
```

### Real-Time Calculations in Form

```typescript
// When user changes line item quantity/price/discount/GST
const updateLineItem = (tempId, field, value) => {
  const updated = lineItems.map(item => {
    if (item.tempId === tempId) {
      const updatedItem = { ...item, [field]: value };
      
      // Recalculate if pricing fields changed
      if (['quantity', 'unitPrice', 'discount', 'gstRate'].includes(field)) {
        const calculations = quotationsService.calculateLineItemAmounts(
          parseFloat(updatedItem.quantity),
          parseFloat(updatedItem.unitPrice),
          parseFloat(updatedItem.discount || '0'),
          parseFloat(updatedItem.gstRate)
        );
        
        return { ...updatedItem, ...calculations };
      }
      
      return updatedItem;
    }
    return item;
  });
  
  setLineItems(updated);
};
```

## Best Practices

### ✅ Quotation Management
1. **Always link to customer**: Quotations require both lead and customer
2. **Set realistic validity dates**: Default 30 days, adjust based on project
3. **Include detailed descriptions**: Help customers understand line items
4. **Use correct HSN codes**: Important for GST compliance
5. **Apply discounts strategically**: Line-item vs overall discount
6. **Review before sending**: Draft allows corrections
7. **Track expiry dates**: Auto-check prevents outdated quotations

### ✅ GST Calculations
1. **Verify customer state**: Determines CGST/SGST vs IGST
2. **Use standard GST rates**: 0%, 5%, 12%, 18%, 28%
3. **Apply discounts correctly**: Line-item first, then overall
4. **Check round-off**: Should be minimal (< ₹1)
5. **Include HSN codes**: Required for GST filing

### ✅ Professional Quotations
1. **Complete system details**: Size, type, brands
2. **Clear payment terms**: Advance %, milestones
3. **Specify delivery timeline**: 7-10 days typical
4. **Include warranty terms**: Panel (25 yrs), Inverter (5 yrs)
5. **Add general T&C**: Installation, commissioning, etc.

### ✅ Status Workflow
```
Draft → Sent → Accepted ✅
             ↘ Rejected ❌
             ↘ Expired ⏰
```
- **Draft**: Editable, internal review
- **Sent**: Customer has received, waiting response
- **Accepted**: Customer confirmed, create project
- **Rejected**: Customer declined, record reason
- **Expired**: Validity date passed, requires revision

## Testing Checklist

### Service Layer
- [ ] Auto-ID generation increments correctly
- [ ] Line-item calculations accurate with various inputs
- [ ] Quotation totals match manual calculations
- [ ] CGST/SGST split correctly (same state)
- [ ] IGST applied correctly (different state)
- [ ] Round-off logic works (< ₹1 difference)
- [ ] Overall discount applies proportionally
- [ ] Status workflow transitions correctly
- [ ] Expiry check marks old quotations

### UI Components
- [ ] QuotationsList loads and displays data
- [ ] Stats cards show correct counts
- [ ] Search filters work
- [ ] Status filter works
- [ ] Expiring quotations highlighted
- [ ] QuotationForm validates required fields
- [ ] Line items table allows add/remove
- [ ] Real-time calculations update
- [ ] Form saves as Draft
- [ ] Form sends to customer
- [ ] QuotationDetails displays all data
- [ ] Print/PDF formatting correct
- [ ] Accept/Reject actions work
- [ ] Delete confirmation works

### Edge Cases
- [ ] Empty line items prevented
- [ ] Zero quantity/price prevented
- [ ] Negative discount prevented
- [ ] Discount > 100% prevented
- [ ] Very large numbers handled
- [ ] Missing customer handled gracefully
- [ ] Expired quotations can't be accepted
- [ ] Accepted quotations can't be edited

## Integration Points

### Leads Module
- Quotation creation starts from lead
- Lead data pre-fills quotation form

### Customers Module
- Customer details appear in quotation
- Customer state determines GST type

### Projects Module
- Accepted quotations → Create project
- Quotation linked to project

### Inventory Module (Future)
- Line items linked to inventory items
- Stock availability check

## Performance Considerations

1. **Batch Calculations**: Calculate all line items together
2. **Debounce Input**: Wait for user to finish typing before calculating
3. **Memoize Totals**: Cache calculation results until items change
4. **Lazy Load Items**: Paginate line items for very large quotations
5. **Index Queries**: Use indexes on status, customerId, leadId

## Common Issues & Solutions

### Issue: GST calculations don't match manual calculation
**Solution**: Ensure discount applied before GST, round at each step

### Issue: Grand total has large round-off
**Solution**: Check for precision errors, use Math.round() correctly

### Issue: Can't edit sent quotation
**Solution**: By design - duplicate quotation or reject and create new

### Issue: Quotation not appearing in list
**Solution**: Check filters (status, search term)

### Issue: Print layout broken
**Solution**: Verify `@media print` CSS rules

## Future Enhancements

1. **Email Integration**: Send quotations via email directly
2. **PDF Generation**: Server-side PDF generation with logo
3. **Templates**: Quotation templates for common configurations
4. **Approval Workflow**: Multi-level approval before sending
5. **Comparison**: Compare multiple quotations side-by-side
6. **Revisions**: Version control for quotation changes
7. **Analytics**: Quotation performance analytics
8. **Auto-pricing**: Suggest pricing based on historical data

---

**Module Status**: ✅ Production Ready  
**Last Updated**: November 27, 2025  
**Version**: 1.0.0
