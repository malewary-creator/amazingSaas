# Professional Quotation Generator - Testing Checklist

## 🧪 Complete Testing Guide

### Pre-Test Setup
- [ ] Ensure dev server is running: `npm run dev`
- [ ] Navigate to: `http://localhost:3000/quotations`
- [ ] Ensure you have at least one Lead and Customer in the system
  - If not, create via Leads and Customers modules first

---

## Test Case 1: Create New Quotation (Happy Path)

### Step 1: Lead & Customer Selection
- [ ] Click "New Quotation" button
- [ ] Select a lead from dropdown
- [ ] Verify customer is auto-selected
- [ ] Verify client name, system size, and site location are auto-populated

### Step 2: SECTION 1 (Header/Client Block)
- [ ] Verify company name shows "Shine Solar & Electrical"
- [ ] Verify client name is populated from customer
- [ ] Select project purpose: Residential/Commercial/Industrial
- [ ] Enter system size (e.g., 5)
- [ ] Select phase: 1ph or 3ph
- [ ] Verify site location is populated

### Step 3: SECTION 2 (Site Specification)
- [ ] Enter location (e.g., "Mumbai, Maharashtra")
- [ ] Enter state (e.g., "Maharashtra")
- [ ] Select roof type (e.g., "RCC")
- [ ] Enter latitude (e.g., 19.0760)
- [ ] Enter longitude (e.g., 72.8777)
- [ ] Enter solar radiation (e.g., 5.5)

### Step 4: SECTION 3 (Solar System Specification)
- [ ] Enter DC capacity (e.g., 5.4)
- [ ] Enter module technology (e.g., "Mono PERC")
- [ ] Enter inverter type (e.g., "String Inverter")
- [ ] Enter mounting structure (e.g., "Elevated GI")
- [ ] Verify safety devices default: "DC SPD, AC SPD, Earthing Kit"
- [ ] Verify power evacuation default: "Net Metering"
- [ ] Verify project scheme default: "Non-subsidy"
- [ ] Enter panel brand (e.g., "Longi")
- [ ] Enter inverter brand (e.g., "Solis")

### Step 5: SECTION 4 (Developer Details)
- [ ] Verify developer name shows "Shine Solar & Electrical"
- [ ] Verify offer date is today's date
- [ ] Verify offer validity is 30 days

### Step 6: SECTION 5 (Monthly Solar Data)
- [ ] Verify all 12 months show pre-filled values (4.5-6.2 range)
- [ ] Edit any month's value (e.g., change June to 6.0)
- [ ] Verify change is reflected

### Step 7: SECTION 6 (Technical Details Table)
- [ ] Click "Add Component" button
- [ ] Verify new row appears with line number 1
- [ ] Fill in first component:
  - Component: "Solar Panel"
  - Specification: "540W Mono PERC"
  - Quantity: 10
  - Make: "Longi"
  - Unit: Nos (default)
  - Price: 8000
  - GST%: 18 (default)
- [ ] Verify total auto-calculates (10 × 8000 × 1.18 = ₹94,400)
- [ ] Add more components:
  - Inverter 5kW String Type | 1 Nos | Solis | ₹40,000
  - Mounting Structure Elevated GI | 1 Lot | Custom | ₹25,000
  - DC Cable 4mm² | 100 Mtr | Polycab | ₹150/mtr
  - AC Cable 6mm² | 20 Mtr | Polycab | ₹200/mtr
- [ ] Verify each row auto-calculates taxable/GST/total
- [ ] Click "Remove" button on any row
- [ ] Verify row is deleted and line numbers re-sequence

### Step 8: SECTION 7 (Offer & Pricing)
- [ ] Enter plant capacity (e.g., 5)
- [ ] Select price basis: "Per KW" or "Lump Sum"
- [ ] Enter base price (e.g., 50000)
- [ ] Verify GST percent shows 18%
- [ ] Verify pricing summary shows:
  - Subtotal = Sum of all line items
  - Taxable Amount
  - GST Amount (18%)
  - Round Off
  - Grand Total (highlighted)
- [ ] Enter discount percent (e.g., 5)
- [ ] Verify discount amount shows in green
- [ ] Verify taxable and grand total recalculate

### Step 9: SECTION 8 (Payment Schedule)
- [ ] Verify default schedule:
  - 40% - On Booking
  - 50% - On Material Delivery
  - 10% - On Commissioning
- [ ] Verify total shows 100%
- [ ] Edit first row: Change 40% to 30%
- [ ] Verify total shows 90% with red warning
- [ ] Click "Add Row" button
- [ ] Add new row: 10% - On Final Inspection
- [ ] Verify total shows 100% (warning gone)
- [ ] Click remove button on any row
- [ ] Verify row is deleted and total updates

### Step 10: Terms & Conditions
- [ ] Verify pre-filled template is present
- [ ] Edit or add custom terms

### Step 11: Save Draft
- [ ] Click "Save Draft" button
- [ ] Verify success toast appears
- [ ] Verify redirect to quotations list
- [ ] Verify new quotation shows with status "Draft"

---

## Test Case 2: Edit Existing Quotation

### Steps:
- [ ] From quotations list, click on the draft quotation created above
- [ ] Click "Edit" button
- [ ] Verify ALL sections are pre-filled with saved data:
  - Section 1: Company, client, purpose, size, phase, location
  - Section 2: Site specs with lat/long/radiation
  - Section 3: Solar system details
  - Section 4: Developer details and dates
  - Section 5: Monthly solar data (12 months)
  - Section 6: All line items with component/spec/qty/make/price
  - Section 7: Pricing with discount
  - Section 8: Payment schedule rows
  - Terms & conditions
- [ ] Make a change to any section (e.g., change system size from 5 to 5.5)
- [ ] Click "Save Draft"
- [ ] Verify change is saved

---

## Test Case 3: Send to Customer

### Steps:
- [ ] Edit the quotation again
- [ ] Make any final adjustments
- [ ] Click "Save & Send" button (instead of "Save Draft")
- [ ] Verify success toast: "Quotation created and sent"
- [ ] Verify quotation status changes to "Sent"
- [ ] Verify sent date is populated

---

## Test Case 4: Validation Testing

### Missing Required Fields:
- [ ] Create new quotation
- [ ] Leave lead field empty
- [ ] Click "Save Draft"
- [ ] Verify error toast: "Please select lead and customer"
- [ ] Select lead but leave all line items empty
- [ ] Click "Save Draft"
- [ ] Verify error toast: "Please add at least one technical component"

### Invalid Line Items:
- [ ] Add a component
- [ ] Leave component name empty
- [ ] Click "Save Draft"
- [ ] Verify error toast: "Please fill in all technical details"
- [ ] Enter component name but set quantity to 0
- [ ] Click "Save Draft"
- [ ] Verify error toast appears

### Payment Schedule Validation:
- [ ] Create quotation with valid data
- [ ] Edit payment schedule so total = 80%
- [ ] Verify warning text: "Total: 80% (Should be 100%)" in red
- [ ] This is a warning only, not blocking save
- [ ] Adjust to 100% and warning disappears

---

## Test Case 5: Auto-Calculation Testing

### Line Item Calculations:
- [ ] Add component with:
  - Quantity: 10
  - Unit Price: 1000
  - Discount: 0
  - GST: 18%
- [ ] Verify total = 10 × 1000 × 1.18 = ₹11,800
- [ ] Change quantity to 5
- [ ] Verify total recalculates to ₹5,900
- [ ] Change GST to 12%
- [ ] Verify total recalculates to ₹5,600

### Quotation Totals:
- [ ] Add multiple line items with different GST rates
- [ ] Verify subtotal = sum of all taxable amounts
- [ ] Enter discount % (e.g., 10%)
- [ ] Verify discount amount = subtotal × 10%
- [ ] Verify taxable = subtotal - discount
- [ ] Verify GST = taxable × GST% / 100
- [ ] Verify grand total includes round off

---

## Test Case 6: Lead Integration

### Auto-Populate from Lead:
- [ ] Create new quotation
- [ ] Select a lead that has:
  - Associated customer with name "John Doe"
  - Required system size: 10 kW
  - System type: "On-grid"
  - Customer address: "Delhi, India"
- [ ] Verify SECTION 1 auto-populates:
  - Client name: "John Doe"
  - System size: 10
  - Site location: "Delhi, India"
- [ ] Verify SECTION 2 auto-populates:
  - Location: "Delhi, India"
  - State: from customer address
- [ ] Verify SECTION 3 auto-populates:
  - System type: "On-grid"

---

## Test Case 7: Browser Compatibility

### Test in Chrome:
- [ ] All sections render correctly
- [ ] Auto-calculations work
- [ ] Save/send functionality works
- [ ] No console errors

### Test in Edge:
- [ ] Same checks as Chrome

### Test on Mobile (if applicable):
- [ ] Responsive layout works
- [ ] All inputs are accessible
- [ ] Tables scroll horizontally
- [ ] Save buttons are visible

---

## Test Case 8: Performance Testing

### Large Quotations:
- [ ] Add 20+ line items (use "Add Component" repeatedly)
- [ ] Verify auto-calculations still work smoothly
- [ ] Verify save completes without delay
- [ ] Verify edit loads all 20+ items correctly

### Multiple Quotations:
- [ ] Create 10+ quotations
- [ ] Verify list loads without lag
- [ ] Verify editing any quotation loads data correctly

---

## Test Case 9: Offline Functionality

### IndexedDB Storage:
- [ ] Create quotation with all sections filled
- [ ] Save draft
- [ ] Open browser DevTools → Application → IndexedDB
- [ ] Verify `quotations` table has new entry with all fields
- [ ] Verify `quotationItems` table has all line items
- [ ] Verify `monthlySolarData` is stored as JSON object
- [ ] Verify `paymentSchedule` is stored as JSON array

### Offline Create:
- [ ] Disconnect from internet (or use DevTools → Network → Offline)
- [ ] Create new quotation with all data
- [ ] Save draft
- [ ] Verify success (IndexedDB is offline-first)
- [ ] Reconnect internet
- [ ] Verify quotation persists

---

## Test Case 10: Edge Cases

### Empty Optional Fields:
- [ ] Create quotation
- [ ] Leave SECTION 2 fields blank (latitude, longitude, solar radiation)
- [ ] Leave SECTION 5 monthly data as pre-filled
- [ ] Save quotation
- [ ] Verify save succeeds
- [ ] Edit quotation
- [ ] Verify empty fields remain empty (not showing 0 or NaN)

### Special Characters:
- [ ] Enter component with special chars: "Solar Panel (Tier-1) 540W"
- [ ] Enter specification with quotes: "Mono PERC - 'High Efficiency'"
- [ ] Save quotation
- [ ] Edit quotation
- [ ] Verify special chars are preserved

### Decimal Values:
- [ ] Enter system size: 5.5
- [ ] Enter DC capacity: 5.94
- [ ] Enter solar radiation: 5.5432
- [ ] Enter latitude: 19.076078
- [ ] Save quotation
- [ ] Verify decimal precision is maintained

### Large Numbers:
- [ ] Enter unit price: 1000000 (10 lakh)
- [ ] Enter quantity: 1000
- [ ] Verify grand total displays correctly with Indian number format
- [ ] Verify no overflow or display issues

---

## 🎯 Expected Results Summary

### All Tests Should Show:
✅ No console errors
✅ All auto-calculations accurate
✅ All fields save and load correctly
✅ Validation messages appear appropriately
✅ Responsive layout on all screen sizes
✅ Offline functionality works (IndexedDB storage)
✅ Indian number formatting (₹1,00,000)
✅ Color-coded sections for easy identification
✅ Payment schedule totals validate
✅ Line items dynamically add/remove
✅ Monthly solar data editable
✅ Lead integration auto-populates data

---

## 📊 Test Results Tracking

| Test Case | Status | Notes | Date Tested |
|-----------|--------|-------|-------------|
| TC1: Create New Quotation | ⬜ | | |
| TC2: Edit Existing | ⬜ | | |
| TC3: Send to Customer | ⬜ | | |
| TC4: Validation | ⬜ | | |
| TC5: Auto-Calculation | ⬜ | | |
| TC6: Lead Integration | ⬜ | | |
| TC7: Browser Compatibility | ⬜ | | |
| TC8: Performance | ⬜ | | |
| TC9: Offline Functionality | ⬜ | | |
| TC10: Edge Cases | ⬜ | | |

Legend: ⬜ Not Tested | ✅ Pass | ❌ Fail | ⚠️ Issue Found

---

## 🐛 Bug Reporting Template

If you encounter any issues:

```
**Test Case**: TC#_Name
**Expected**: What should happen
**Actual**: What actually happened
**Steps to Reproduce**: 
1. 
2. 
3. 
**Environment**: Chrome/Edge/Mobile
**Severity**: Critical/High/Medium/Low
**Console Errors**: (Paste any errors from DevTools console)
```

---

## ✅ Ready to Test!

Start testing at: `http://localhost:3000/quotations/new`

**Happy Testing! 🚀**
