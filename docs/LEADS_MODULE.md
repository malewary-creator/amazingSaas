# Leads Module Documentation

## Overview
The Leads Module is a comprehensive lead management system for Shine Solar, enabling sales teams to capture, track, and convert solar installation leads efficiently.

## Features

### 1. Lead List View (`/leads`)
- **Statistics Dashboard**: Real-time metrics showing total leads, new leads, in-progress, converted, and conversion rate
- **Advanced Filtering**: Filter by status (New, In-progress, Converted, Lost, On-hold) and source
- **Search Functionality**: Search by lead ID, customer name, or mobile number
- **Data Table**: Comprehensive view with customer details, follow-up dates, and quick actions
- **Batch Operations**: View, edit, and delete leads directly from the list

### 2. Lead Form (`/leads/new` and `/leads/:id/edit`)
- **Customer Management**:
  - Create new customer or select existing customer
  - Full contact details (name, mobile, email, address)
  - Address validation (city, state, pincode required)
  
- **Lead Information**:
  - Source tracking (Referral, Walk-in, Social Media, Website, Advertisement, Other)
  - Source details for additional context
  - Status management
  - Follow-up date scheduling
  
- **Electricity Connection Details**:
  - DISCOM name
  - Consumer number
  - Meter type (Single Phase/Three Phase)
  - Sanctioned load (kW)
  - Average monthly electricity bill
  
- **System Requirements**:
  - Required system size (kW)
  - System type (On-grid, Off-grid, Hybrid)
  - Roof type (RCC, Sheet, Tile, Ground Mounted)
  - Tentative budget
  - Installation reason and specific requirements

### 3. Lead Details View (`/leads/:id`)
- **Customer Information**: Complete customer profile with contact details and address
- **Lead Information**: Source, status, and follow-up schedule
- **Electricity Details**: DISCOM information, consumer details, and billing data
- **System Requirements**: Detailed requirements and budget information
- **Timeline**: Creation date, last updated, and next follow-up
- **Action Recommendations**: Context-specific next steps based on lead status
- **Quick Actions**:
  - Convert to quotation
  - Mark as lost
  - Edit lead
  - Delete lead

## Navigation Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/leads` | LeadsList | Main list view with all leads |
| `/leads/new` | LeadForm | Create new lead form |
| `/leads/:id` | LeadDetails | View detailed lead information |
| `/leads/:id/edit` | LeadForm | Edit existing lead |

## Data Model

### Lead Type
```typescript
interface Lead {
  id?: number;
  leadId: string; // Auto-generated: LEAD-YYYY-NNN
  customerId: number;
  source: LeadSource;
  sourceDetails?: string;
  status: LeadStatus;
  assignedTo?: number;
  
  // Electricity details
  discomName?: string;
  consumerNumber?: string;
  meterType?: 'Single Phase' | 'Three Phase';
  sanctionedLoad?: number;
  avgMonthlyBill?: number;
  
  // Requirements
  requiredSystemSize?: number;
  systemType?: 'On-grid' | 'Off-grid' | 'Hybrid';
  roofType?: 'RCC' | 'Sheet' | 'Tile' | 'Ground';
  tentativeBudget?: number;
  installationReason?: string;
  
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Lead Source
- Referral
- Walk-in
- Social Media
- Website
- Advertisement
- Other

### Lead Status
- New
- In-progress
- Converted
- Lost
- On-hold

## Service Layer (`leadsService.ts`)

### Core Functions

1. **generateLeadId()**: Creates unique lead IDs in format `LEAD-YYYY-NNN`
2. **createLead(data)**: Creates new lead with auto-generated ID
3. **getLeads(filters)**: Retrieves leads with comprehensive filtering
4. **getLeadWithCustomer(id)**: Joins lead with customer data
5. **updateLead(id, data)**: Updates lead information
6. **convertLead(id)**: Marks lead as converted
7. **getLeadStats()**: Calculates conversion statistics
8. **getUpcomingFollowUps(days)**: Gets leads due for follow-up
9. **getOverdueFollowUps()**: Gets overdue follow-ups
10. **getLeadSourceDistribution()**: Analytics for lead sources

### Filter Options
```typescript
{
  status?: LeadStatus;
  source?: LeadSource;
  assignedTo?: number;
  branchId?: number;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string; // Searches leadId, customer name, mobile
}
```

## Components

### LeadsList.tsx
- Main list component with data table
- Statistics cards showing key metrics
- Advanced filtering and search
- Inline actions (view, edit, delete)
- Confirmation modals for destructive actions

### LeadForm.tsx
- Multi-section form with validation
- Customer creation/selection
- Comprehensive field coverage
- Form state management
- Create and edit modes
- Field-level validation

### LeadDetails.tsx
- Detailed lead information display
- Customer profile section
- Electricity and system requirement details
- Timeline and activity tracking
- Quick action buttons
- Status-based recommendations
- Confirmation modals for actions

### ConfirmModal.tsx
- Reusable confirmation dialog
- Customizable messages
- Primary/Danger variants
- Keyboard and click-outside handling

## User Experience Features

1. **Auto-ID Generation**: Lead IDs are automatically generated in sequence
2. **Customer Reusability**: Select existing customers or create new ones
3. **Mobile Validation**: Automatic 10-digit mobile number validation
4. **Pincode Validation**: 6-digit pincode with numeric-only input
5. **Date Validation**: Follow-up dates cannot be in the past
6. **Status Badges**: Color-coded status indicators for quick identification
7. **Responsive Design**: Works seamlessly on desktop and mobile devices
8. **Toast Notifications**: Success/error feedback for all actions
9. **Loading States**: Clear loading indicators during data operations
10. **Confirmation Dialogs**: Prevent accidental deletions or status changes

## Conversion Tracking

The module tracks lead conversion metrics:
- **Total Leads**: All leads in the system
- **New Leads**: Leads with "New" status
- **In Progress**: Active leads being worked on
- **Converted**: Successfully converted to quotations
- **Conversion Rate**: Percentage of converted leads
- **Lead Source Analytics**: Distribution by source for marketing ROI

## Follow-up Management

- Set follow-up dates when creating/editing leads
- View upcoming follow-ups (next 7 days)
- Track overdue follow-ups
- Follow-up dates displayed prominently in list and detail views

## Best Practices

1. **Always capture source details** for referrals and campaigns
2. **Set follow-up dates** to ensure timely customer engagement
3. **Update lead status** as conversations progress
4. **Document installation reasons** to understand customer motivations
5. **Verify electricity details** for accurate system sizing
6. **Keep customer information updated** for better communication

## Future Enhancements (Potential)

- [ ] Lead activity timeline with notes
- [ ] Document attachment for electricity bills
- [ ] Email/SMS integration for follow-ups
- [ ] Lead scoring and prioritization
- [ ] Automated follow-up reminders
- [ ] Lead assignment workflows
- [ ] Export leads to Excel/PDF
- [ ] Advanced analytics dashboard
- [ ] Lead import from external sources
- [ ] WhatsApp integration for customer communication

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
- Debounced search to reduce unnecessary renders
- Lazy loading of customer data only when needed
- Indexed database queries for fast retrieval
- Optimistic UI updates with toast notifications

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- ARIA labels where appropriate
- Focus management in modals
- Clear error messages
- High contrast color scheme

---

**Module Status**: ✅ Complete and Production Ready

**Last Updated**: January 2025

**Maintained By**: Shine Solar Development Team
