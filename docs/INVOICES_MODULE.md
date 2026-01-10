# Invoices Module Documentation

## Overview
The Invoices Module provides comprehensive GST-compliant invoice generation and management for the Shine Solar application. It supports multiple invoice types, payment tracking, and automatic overdue detection.

## Features

### 1. **GST Compliance**
- GSTIN tracking for company and customers
- Auto CGST/SGST/IGST calculation based on state
- HSN/SAC code support for line items
- Grand total in words (Indian numbering system)
- Reverse charge mechanism support
- Place of supply tracking

### 2. **Invoice Types**
- **Tax Invoice**: Final invoice for completed sales
- **Proforma Invoice**: Preliminary invoice/quotation
- **Stage Payment**: Milestone-based payments for projects

### 3. **Auto ID Generation**
Format: `SS/INV/YYYY/NNN`
- SS: Shine Solar prefix
- INV: Invoice identifier
- YYYY: Current year
- NNN: Sequential number (resets yearly)

Example: `SS/INV/2025/001`

### 4. **Invoice Status Workflow**
```
Draft → Generated → Sent → Paid
                        ↓
                   Partially Paid
                        ↓
                    Overdue
```

- **Draft**: Invoice being created/edited
- **Generated**: Invoice finalized but not sent
- **Sent**: Invoice sent to customer
- **Paid**: Full payment received
- **Partially Paid**: Partial payment received
- **Overdue**: Past due date without full payment
- **Cancelled**: Invoice cancelled/voided

### 5. **Payment Tracking**
- Track amount paid vs grand total
- Calculate balance amount automatically
- Show payment progress percentage
- Auto-detect overdue invoices based on due date
- Payment status indicators (color-coded)

### 6. **Tax Collected at Source (TCS)**
TCS applies to high-value transactions as per government regulations:
- Configurable TCS rate (0%, 0.1%, 1%)
- Auto-calculated based on taxable amount
- Included in grand total calculation

## Implementation

### Service Layer (`invoicesService.ts`)

#### Key Functions

**1. Number to Words Conversion**
```typescript
convertToWords(amount: number): string
```
Converts numerical amounts to Indian format words:
- Handles Crores (10,000,000)
- Handles Lakhs (100,000)
- Handles Thousands (1,000)
- Example: 2,50,000 → "Two Lakh Fifty Thousand Rupees Only"

**2. Invoice Number Generation**
```typescript
generateInvoiceNumber(): Promise<string>
```
- Auto-generates unique invoice numbers
- Format: SS/INV/YYYY/NNN
- Resets counter each year

**3. Line Item Calculations**
```typescript
calculateLineItemAmounts(item: Omit<InvoiceItem, 'taxableAmount' | ...>)
```
- Calculates discount (amount or percentage)
- Computes taxable amount
- Determines CGST/SGST (intrastate) or IGST (interstate)
- Calculates line total

**4. Invoice Totals**
```typescript
calculateInvoiceTotals(lineItems: InvoiceItem[], tcsRate?: number)
```
- Sums all line items
- Calculates total GST
- Applies TCS
- Computes round-off
- Converts grand total to words

**5. Overdue Detection**
```typescript
checkOverdueInvoices(): Promise<number>
```
- Runs automatically to mark overdue invoices
- Checks unpaid/partially paid invoices past due date
- Updates status to 'Overdue'
- Returns count of newly overdue invoices

**6. Statistics**
```typescript
getInvoiceStats(): Promise<InvoiceStats>
```
Returns:
- Total invoice count by status
- Total invoice value
- Amount paid
- Outstanding amount
- Collection rate percentage

### UI Components

#### 1. **InvoicesList.tsx**
Dashboard view with:
- **Stats Cards**: Total, Overdue, Total Value, Outstanding
- **Search & Filters**: By invoice number, customer, type, status
- **Table View**: Shows all invoices with payment progress
- **Quick Actions**: View, Edit (Draft only), Delete
- **Visual Indicators**: 
  - Red background for overdue
  - Payment progress bars
  - Status badges (color-coded)

#### 2. **InvoiceForm.tsx** (Placeholder)
Complex form requiring:
- Customer/Project selection
- Billing/Shipping addresses (Address type)
- Dynamic line items with auto-calculations
- Live pricing summary
- GST calculation based on state
- TCS input
- Grand total in words display

**Note**: Full form implementation pending due to complex type requirements for Address and Date handling.

#### 3. **InvoiceDetails.tsx**
Professional invoice display with:
- Company header with GSTIN
- Customer details with billing address
- Invoice info (number, date, due date, project)
- Line items table with HSN/SAC codes
- Tax breakdown (CGST/SGST or IGST)
- TCS (if applicable)
- **Grand Total** in bold with words
- Payment status with progress bar
- Terms & Conditions
- Action buttons (Edit, Send, Download, Delete)

## Data Structure

### Invoice Table
```typescript
interface Invoice {
  id: number;
  invoiceNumber: string;  // SS/INV/YYYY/NNN
  invoiceType: InvoiceType;
  projectId?: number;
  customerId: number;
  status: InvoiceStatus;
  
  invoiceDate: Date;
  dueDate?: Date;
  
  // Address
  billingAddress: Address;
  shippingAddress?: Address;
  placeOfSupply: string;
  
  // GST
  gstType: 'Intra-state' | 'Inter-state';
  companyGSTIN: string;
  customerGSTIN?: string;
  reverseCharge: boolean;
  
  // Pricing
  subtotal: number;
  discountAmount?: number;
  taxableAmount: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalGST: number;
  tcs?: number;
  roundOff?: number;
  grandTotal: number;
  grandTotalInWords?: string;
  
  // Payment
  amountPaid?: number;
  balanceAmount?: number;
  
  // Metadata
  paymentTerms?: string;
  termsAndConditions?: string;
  notes?: string;
}
```

### InvoiceItem Table
```typescript
interface InvoiceItem {
  id: number;
  invoiceId: number;
  lineNumber: number;
  itemName: string;
  description?: string;
  hsnCode?: string;
  sacCode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  discountPercent?: number;
  taxableAmount: number;
  gstRate: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalAmount: number;
}
```

## GST Calculation Logic

### Intrastate (Same State)
```
Taxable Amount = Quantity × Unit Price - Discount
CGST = Taxable Amount × (GST Rate / 200)
SGST = Taxable Amount × (GST Rate / 200)
Line Total = Taxable Amount + CGST + SGST
```

### Interstate (Different State)
```
Taxable Amount = Quantity × Unit Price - Discount
IGST = Taxable Amount × (GST Rate / 100)
Line Total = Taxable Amount + IGST
```

### Invoice Total
```
Subtotal = Sum of all (Quantity × Unit Price)
Total Discount = Sum of all discounts
Taxable Amount = Sum of all line taxable amounts
Total GST = Sum of all (CGST + SGST + IGST)
TCS Amount = Taxable Amount × (TCS Rate / 100)
Total Before Round = Taxable Amount + Total GST + TCS
Grand Total = Round(Total Before Round)
Round Off = Grand Total - Total Before Round
```

## Best Practices

### 1. **GSTIN Validation**
- Always validate GSTIN format (15 characters)
- First 2 digits = state code
- Verify state code matches place of supply

### 2. **HSN/SAC Codes**
- HSN for goods (6-8 digits)
- SAC for services (6 digits)
- Mandatory for invoices > ₹500 (B2B)

### 3. **Invoice Numbering**
- Never reuse invoice numbers
- Maintain sequential order
- Keep year-wise series

### 4. **Tax Calculation**
- Always verify intrastate vs interstate
- Apply CGST+SGST for same state
- Apply IGST for different states
- NEVER apply both together

### 5. **Grand Total in Words**
- Required for GST compliance
- Use Indian numbering system
- Format: "Rupees [Amount] Only"

### 6. **Payment Tracking**
- Update amountPaid when payment received
- Recalculate balanceAmount automatically
- Update status based on payment:
  - Full payment → Paid
  - Partial payment → Partially Paid
  - No payment + past due → Overdue

### 7. **TCS Applicability**
- Check transaction value
- Apply correct TCS rate
- Include in grand total
- Mention in invoice

## E-Invoice Integration (Future)

Fields prepared for e-invoice:
- `eInvoiceIRN`: Invoice Reference Number from GSTN
- `eInvoiceAckNo`: Acknowledgement Number
- `eInvoiceAckDate`: Acknowledgement Date

E-invoice mandatory for businesses with turnover > ₹10 crores.

## Testing Checklist

- [ ] Invoice number auto-generation works
- [ ] CGST/SGST applied for same state transactions
- [ ] IGST applied for different state transactions
- [ ] Discount calculation (amount & percentage) works
- [ ] TCS calculated correctly
- [ ] Grand total in words shows Indian format
- [ ] Round-off calculation is accurate
- [ ] Payment tracking updates balance correctly
- [ ] Overdue detection runs automatically
- [ ] Invoice status workflow is correct
- [ ] Line items table displays all GST components
- [ ] Stats dashboard shows correct figures
- [ ] Search and filters work properly
- [ ] PDF/Print layout is GST-compliant

## Known Limitations

1. **InvoiceForm**: Placeholder implementation due to complex type handling for Address and Date fields. Full implementation requires:
   - Address type handling (street, city, state, pincode)
   - Date string to Date object conversion
   - Dynamic form state management
   - Real-time GST calculations

2. **E-Invoice**: Fields prepared but integration not implemented
3. **Bank Details**: Not included in invoice display (add in future)
4. **Digital Signature**: Not implemented
5. **QR Code**: Not generated for e-invoices

## Future Enhancements

1. Complete InvoiceForm with proper type handling
2. E-invoice API integration with GSTN
3. Email invoice sending
4. PDF generation with GST format
5. Payment gateway integration
6. Recurring invoices
7. Credit/Debit notes
8. Invoice templates customization
9. Multi-currency support
10. Invoice approval workflow

---

**Module Status**: ✅ Service Layer Complete | ⚠️ Form Placeholder | ✅ List & Details Complete

**Total Lines of Code**: ~1,400 LOC (Service: 550, List: 570, Details: 450, Form Placeholder: 30)

**Dependencies**: 
- Dexie.js (Database)
- React Router (Routing)
- Lucide React (Icons)
- Tailwind CSS (Styling)

**Last Updated**: November 27, 2025
