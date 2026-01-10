# Customers Module Documentation

## Overview
The Customers Module is a comprehensive customer relationship management (CRM) system for Shine Solar, enabling efficient management of customer profiles, contact information, and tracking of all related business activities.

## Features

### 1. Customer List View (`/customers`)
- **Statistics Dashboard**: Real-time metrics showing total customers, customers with leads, and customers with active projects
- **Advanced Filtering**: Filter by city and state
- **Search Functionality**: Search by customer ID, name, mobile number, or email
- **Data Table**: Comprehensive view with contact details, location, and quick actions
- **Batch Operations**: View, edit, and delete customers directly from the list

### 2. Customer Form (`/customers/new` and `/customers/:id/edit`)
- **Basic Information**:
  - Full name (required)
  - Primary mobile number (required, 10 digits)
  - Secondary mobile number (optional, 10 digits)
  - Email address (optional)
  - Duplicate mobile number detection
  
- **Address Information**:
  - House/Plot number
  - Area/Locality
  - City (required)
  - District
  - State (required)
  - Pincode (required, 6 digits)
  - Landmark
  
- **Validation**:
  - Mobile number uniqueness check
  - 10-digit mobile validation
  - 6-digit pincode validation
  - Required field enforcement

### 3. Customer Details View (`/customers/:id`)
- **Contact Information**: Complete customer profile with all contact details
- **Address Details**: Full address with landmarks
- **Related Records Overview**:
  - Associated leads with status
  - Connected surveys
  - Generated quotations
  - Active/completed projects
  - Customer documents
  
- **Quick Stats**: Count of all related records
- **Timeline**: Creation and update history
- **Quick Actions**:
  - Create new lead for customer
  - Schedule survey
  - Generate quotation
  - Edit customer
  - Delete customer (with safety checks)

### 4. Safety Features
- **Prevent Accidental Deletions**: Cannot delete customer if they have:
  - Associated leads
  - Connected surveys
  - Generated quotations
  - Active or completed projects
- **Confirmation Modals**: All destructive actions require confirmation
- **Related Record Display**: View all customer interactions in one place

## Navigation Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/customers` | CustomersList | Main list view with all customers |
| `/customers/new` | CustomerForm | Create new customer form |
| `/customers/:id` | CustomerDetails | View detailed customer information |
| `/customers/:id/edit` | CustomerForm | Edit existing customer |

## Data Model

### Customer Type
```typescript
interface Customer {
  id?: number;
  customerId?: string; // Auto-generated: CUST-YYYY-NNN
  name: string;
  mobile: string;
  secondaryMobile?: string;
  email?: string;
  address: Address;
  profilePhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Address {
  houseNo?: string;
  area?: string;
  city: string;
  district?: string;
  state: string;
  pincode: string;
  landmark?: string;
  locationMapLink?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
}
```

## Service Layer (`customersService.ts`)

### Core Functions

1. **generateCustomerId()**: Creates unique customer IDs in format `CUST-YYYY-NNN`
2. **createCustomer(data)**: Creates new customer with auto-generated ID
3. **getCustomers(filters)**: Retrieves customers with optional filtering
4. **getCustomerById(id)**: Gets single customer by database ID
5. **getCustomerByCustomerId(customerId)**: Gets customer by CUST-YYYY-NNN ID
6. **updateCustomer(id, data)**: Updates customer information
7. **deleteCustomer(id)**: Deletes customer (with safety checks)
8. **getCustomerStats()**: Calculates customer statistics and analytics
9. **getCustomerWithRelatedData(id)**: Joins customer with all related records
10. **isMobileRegistered(mobile, excludeId)**: Checks for duplicate mobile numbers
11. **searchCustomers(term, limit)**: Quick search by name, mobile, or ID

### Filter Options
```typescript
{
  searchTerm?: string; // Searches ID, name, mobile, email
  city?: string;
  state?: string;
}
```

### Statistics Calculated
- Total customers count
- Customers with active leads
- Customers with projects
- Customer distribution by city (top 10)
- Customer distribution by state
- Recent customers (last 10)

## Components

### CustomersList.tsx
- Main list component with data table
- Statistics cards showing key metrics
- City and state filters
- Search across multiple fields
- Inline actions (view, edit, delete)
- Confirmation modals for deletions

### CustomerForm.tsx
- Two-section form (Basic Info + Address)
- Mobile number validation and uniqueness check
- Create and edit modes
- Field-level validation
- Auto-formatting (mobile, pincode)
- Required field indicators

### CustomerDetails.tsx
- Comprehensive customer information display
- Contact and address sections
- Related records display:
  - Leads table with status badges
  - Projects list with quick links
  - Quotations overview
- Quick stats sidebar
- Timeline tracking
- Quick action buttons
- Confirmation modals for deletions

## User Experience Features

1. **Auto-ID Generation**: Customer IDs automatically generated in sequence (CUST-2025-001)
2. **Duplicate Prevention**: Mobile number uniqueness validation
3. **Mobile Validation**: Automatic 10-digit mobile number validation
4. **Pincode Validation**: 6-digit pincode with numeric-only input
5. **Smart Deletion**: Prevents deletion if customer has related records
6. **Related Records View**: See all customer interactions in one place
7. **Responsive Design**: Works seamlessly on desktop and mobile devices
8. **Toast Notifications**: Success/error feedback for all actions
9. **Loading States**: Clear loading indicators during data operations
10. **Confirmation Dialogs**: Prevent accidental deletions

## Integration with Other Modules

The Customers module integrates seamlessly with:

### Leads Module
- Create leads for existing customers
- View all leads associated with a customer
- Link leads to customer profiles

### Surveys Module
- Schedule surveys for customers
- Track survey history per customer

### Quotations Module
- Generate quotations for customers
- View all quotations sent to customer

### Projects Module
- Link projects to customers
- Track installation progress
- View project history

## Statistics & Analytics

Track customer metrics:
- **Total Customers**: Overall customer database size
- **Engagement**: Customers with active leads
- **Conversion**: Customers with completed projects
- **Geographic Distribution**: Customers by city and state
- **Growth Tracking**: Recent customer additions

## Validation Rules

### Mobile Number
- Must be exactly 10 digits
- Numeric characters only
- Must be unique across all customers
- Secondary mobile also validated if provided

### Email
- Standard email format validation
- Optional field

### Address
- **Required**: City, State, Pincode
- **Optional**: House number, area, district, landmark
- Pincode must be exactly 6 digits

## Best Practices

1. **Complete all contact information** for better communication
2. **Add secondary mobile** for better reachability
3. **Include detailed address** with landmarks for site visits
4. **Update customer information** when changes occur
5. **Check existing customers** before creating duplicates
6. **Review related records** before attempting deletion

## Future Enhancements (Potential)

- [ ] Customer profile photos
- [ ] GPS coordinates for addresses
- [ ] Google Maps integration for location
- [ ] Customer activity timeline
- [ ] Document management for customer files
- [ ] Customer tags/categories
- [ ] Advanced search with filters
- [ ] Export customers to Excel/CSV
- [ ] Import customers from external sources
- [ ] Customer communication history
- [ ] WhatsApp/SMS integration
- [ ] Customer loyalty program
- [ ] Referral tracking
- [ ] Customer satisfaction ratings

## Technical Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: Zustand (for toasts) + React hooks
- **Database**: Dexie.js (IndexedDB)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Form Handling**: Controlled components with React state

## Performance Considerations

- Efficient filtering with client-side operations
- Indexed database queries for fast retrieval
- Lazy loading of related records only when needed
- Optimistic UI updates with toast notifications
- Debounced search to reduce unnecessary renders

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- ARIA labels where appropriate
- Focus management in modals
- Clear error messages
- High contrast color scheme
- Required field indicators (*)

## Error Handling

### Deletion Safety
The system prevents customer deletion when:
- Customer has associated leads
- Customer has survey records
- Customer has quotations
- Customer has active or completed projects

Error messages clearly explain why deletion is blocked and suggest next steps.

### Validation Errors
All validation errors are:
- Displayed via toast notifications
- Clear and actionable
- User-friendly language
- Specific to the field/issue

## Database Relationships

```
Customer (1) ←→ (Many) Leads
Customer (1) ←→ (Many) Surveys
Customer (1) ←→ (Many) Quotations
Customer (1) ←→ (Many) Projects
Customer (1) ←→ (Many) CustomerDocuments
```

## Security Considerations

- Mobile number privacy
- Email validation to prevent spam
- Data integrity checks before deletion
- Audit trail via createdAt/updatedAt timestamps

---

**Module Status**: ✅ Complete and Production Ready

**Last Updated**: November 2025

**Maintained By**: Shine Solar Development Team

---

## Quick Start Guide

### Adding a New Customer
1. Navigate to `/customers`
2. Click "Add New Customer"
3. Fill in required fields (name, mobile, city, state, pincode)
4. Add optional information (email, secondary mobile, address details)
5. Click "Save Customer"

### Editing a Customer
1. Find customer in list
2. Click edit icon or view details and click "Edit"
3. Update information
4. Click "Update Customer"

### Viewing Customer Details
1. Click on customer name or view icon
2. Review contact information
3. Check related records (leads, projects, etc.)
4. Use quick actions for common tasks

### Deleting a Customer
1. View customer details
2. Click "Delete" button
3. Confirm deletion (only works if no related records exist)
4. If deletion blocked, remove related records first

---

## Support

For issues or questions about the Customers Module, refer to:
- Main documentation
- Type definitions in `/src/types/index.ts`
- Service layer in `/src/services/customersService.ts`
- Component implementations in `/src/modules/customers/`
