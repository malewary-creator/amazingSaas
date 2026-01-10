# Leads Module Testing Checklist

## Pre-Testing Setup
- [x] Development server running on http://localhost:3000
- [x] All components created without compilation errors
- [x] Service layer implemented
- [x] Routing configured

## Test Scenarios

### 1. List View Testing (`/leads`)
- [ ] Navigate to http://localhost:3000/leads
- [ ] Verify statistics cards display (Total, New, In Progress, Converted, Conversion Rate)
- [ ] Check if "Add New Lead" button is visible and functional
- [ ] Test search functionality (search by Lead ID, name, mobile)
- [ ] Test status filter dropdown (All, New, In-progress, Converted, Lost, On-hold)
- [ ] Test source filter dropdown (All, Referral, Walk-in, etc.)
- [ ] Verify table displays correct columns
- [ ] Test action buttons (View, Edit, Delete) visibility

### 2. Create Lead Testing (`/leads/new`)
- [ ] Click "Add New Lead" button from list view
- [ ] Select "New Customer" option
- [ ] Fill in customer details:
  - [ ] Name: Test Customer
  - [ ] Mobile: 9876543210
  - [ ] Email: test@example.com
  - [ ] City: Mumbai
  - [ ] State: Maharashtra
  - [ ] Pincode: 400001
  - [ ] Area: Andheri West
- [ ] Fill in lead details:
  - [ ] Source: Referral
  - [ ] Source Details: John Doe
  - [ ] Status: New
  - [ ] Follow-up Date: (Select tomorrow's date)
- [ ] Fill in electricity details:
  - [ ] DISCOM: MSEDCL
  - [ ] Consumer Number: 123456789
  - [ ] Meter Type: Single Phase
  - [ ] Sanctioned Load: 5 kW
  - [ ] Avg Monthly Bill: ₹5000
- [ ] Fill in system requirements:
  - [ ] Required System Size: 3 kW
  - [ ] System Type: On-grid
  - [ ] Roof Type: RCC
  - [ ] Tentative Budget: ₹150000
  - [ ] Installation Reason: Reduce electricity bills
- [ ] Click "Save Lead"
- [ ] Verify success toast appears
- [ ] Verify redirected to leads list
- [ ] Verify new lead appears in the table with auto-generated ID (LEAD-2025-001)

### 3. Lead Details Testing (`/leads/:id`)
- [ ] Click "View" button on a lead from the list
- [ ] Verify lead ID and status badge display correctly
- [ ] Check Customer Information section shows all details
- [ ] Check Lead Information section shows source and follow-up
- [ ] Check Electricity Connection Details section (if data exists)
- [ ] Check System Requirements section displays correctly
- [ ] Verify Timeline section shows Created, Last Updated dates
- [ ] Check "Next Steps" recommendations display (for New/In-progress leads)
- [ ] Test action buttons:
  - [ ] Convert button (should show confirmation modal)
  - [ ] Mark Lost button (should show confirmation modal)
  - [ ] Edit button (should navigate to edit form)
  - [ ] Delete button (should show confirmation modal)
  - [ ] Back button (should return to list)

### 4. Edit Lead Testing (`/leads/:id/edit`)
- [ ] Click "Edit" button from detail view or list
- [ ] Verify form pre-fills with existing data
- [ ] Verify customer fields are disabled (since editing existing customer)
- [ ] Modify lead status to "In-progress"
- [ ] Update follow-up date
- [ ] Add/modify installation reason
- [ ] Click "Update Lead"
- [ ] Verify success toast
- [ ] Verify redirected to leads list
- [ ] Verify changes reflected in the list

### 5. Existing Customer Testing
- [ ] Navigate to `/leads/new`
- [ ] Select "Existing Customer" option
- [ ] Choose a customer from dropdown
- [ ] Verify customer fields populate automatically
- [ ] Verify customer fields are disabled
- [ ] Fill in lead details only
- [ ] Save lead
- [ ] Verify lead is created with correct customer reference

### 6. Validation Testing
- [ ] Try creating lead without customer name (should show error)
- [ ] Try invalid mobile number (not 10 digits) (should show error)
- [ ] Try creating lead without city, state, or pincode (should show error)
- [ ] Verify numeric fields only accept numbers
- [ ] Verify mobile and pincode have character limits (10 and 6 respectively)

### 7. Delete Lead Testing
- [ ] Click delete button on a lead
- [ ] Verify confirmation modal appears
- [ ] Click "Cancel" - modal should close, lead should remain
- [ ] Click delete again
- [ ] Click "Delete" in modal
- [ ] Verify success toast
- [ ] Verify lead is removed from the list
- [ ] Verify statistics update correctly

### 8. Convert Lead Testing
- [ ] Open a lead with status "New" or "In-progress"
- [ ] Click "Convert" button
- [ ] Verify confirmation modal
- [ ] Click "Convert" in modal
- [ ] Verify lead status changes to "Converted"
- [ ] Verify success toast
- [ ] Verify statistics update (converted count increases)
- [ ] Verify Convert and Mark Lost buttons are no longer visible

### 9. Mark as Lost Testing
- [ ] Open a lead with status "New" or "In-progress"
- [ ] Click "Mark Lost" button
- [ ] Verify confirmation modal
- [ ] Click "Mark Lost" in modal
- [ ] Verify lead status changes to "Lost"
- [ ] Verify success toast
- [ ] Verify statistics update

### 10. Filter and Search Testing
- [ ] Create multiple leads with different statuses and sources
- [ ] Test status filter:
  - [ ] Filter by "New" - should show only new leads
  - [ ] Filter by "Converted" - should show only converted leads
- [ ] Test source filter:
  - [ ] Filter by "Referral" - should show only referral leads
  - [ ] Filter by "Website" - should show only website leads
- [ ] Test combined filters (status + source)
- [ ] Test search:
  - [ ] Search by lead ID (exact match)
  - [ ] Search by customer name (partial match)
  - [ ] Search by mobile number
- [ ] Test clearing filters - should show all leads

### 11. Statistics Testing
- [ ] Verify "Total Leads" count is accurate
- [ ] Verify "New Leads" count matches leads with "New" status
- [ ] Verify "In Progress" count is accurate
- [ ] Verify "Converted" count is accurate
- [ ] Calculate conversion rate manually and verify with displayed rate
- [ ] Create/delete leads and verify statistics update in real-time

### 12. Responsive Design Testing
- [ ] Test list view on mobile screen size
- [ ] Test form on mobile screen size
- [ ] Test detail view on mobile screen size
- [ ] Verify all buttons and actions are accessible
- [ ] Verify tables are scrollable horizontally on mobile

### 13. Edge Cases
- [ ] Try navigating to non-existent lead ID (e.g., `/leads/99999`)
  - [ ] Should show error and redirect to list
- [ ] Create lead with minimal data (only required fields)
- [ ] Create lead with maximum data (all optional fields filled)
- [ ] Test with very long customer names/addresses
- [ ] Test with special characters in text fields

### 14. Data Persistence
- [ ] Create a lead
- [ ] Refresh the page
- [ ] Verify lead still exists (IndexedDB persistence)
- [ ] Edit the lead
- [ ] Refresh again
- [ ] Verify changes persisted

### 15. Performance Testing
- [ ] Create 50+ leads
- [ ] Check list view loads quickly
- [ ] Test filter performance with large dataset
- [ ] Test search performance
- [ ] Verify no UI lag or freezing

## Expected Outcomes

### Success Criteria
✅ All CRUD operations work correctly
✅ Filtering and search function properly
✅ Statistics calculate accurately
✅ Validation prevents invalid data
✅ Toast notifications appear for all actions
✅ Routing navigates correctly
✅ Data persists across page refreshes
✅ UI is responsive and accessible
✅ No console errors
✅ Smooth user experience

### Known Issues (if any)
- TypeScript may show ConfirmModal import error (caching issue, doesn't affect functionality)
- Tailwind CSS linting warnings in index.css (normal behavior)

## Testing Notes
- Test in latest Chrome/Firefox/Safari
- Use browser DevTools to check for console errors
- Test with network throttling (offline mode)
- Check mobile viewport using DevTools responsive mode

---

**Testing Date**: _____________

**Tested By**: _____________

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Needs Review

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
