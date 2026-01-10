# 📦 Project Structure Documentation

This document provides a detailed overview of the Shine Solar Management System architecture.

## 🏗️ Architecture Overview

The application follows a **modular, offline-first architecture** with the following layers:

```
┌─────────────────────────────────────┐
│   Presentation Layer (React + TSX)   │
│   - Components                       │
│   - Modules                          │
│   - Pages                            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   State Management (Zustand)        │
│   - Auth Store                      │
│   - App Store                       │
│   - Toast Store                     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Business Logic Layer              │
│   - Services                        │
│   - Utilities                       │
│   - Validators                      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Data Layer (IndexedDB/Dexie.js)  │
│   - Database Schema                 │
│   - File Storage                    │
└─────────────────────────────────────┘
```

## 📂 Directory Structure

```
src/
│
├── assets/                 # Static assets
│   ├── images/            # Images, logos
│   ├── fonts/             # Custom fonts
│   └── icons/             # Icon files
│
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Toaster.tsx
│   │   └── ...
│   ├── forms/            # Form components
│   │   ├── FormField.tsx
│   │   ├── FormSelect.tsx
│   │   ├── FormDatePicker.tsx
│   │   ├── FormFileUpload.tsx
│   │   └── ...
│   ├── layout/           # Layout components
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── shared/           # Shared components
│       ├── DataTable.tsx
│       ├── SearchBar.tsx
│       ├── Pagination.tsx
│       ├── StatusBadge.tsx
│       └── ...
│
├── modules/              # Feature modules
│   ├── auth/            # Authentication
│   │   ├── LoginPage.tsx
│   │   ├── ChangePassword.tsx
│   │   └── services/
│   │
│   ├── dashboard/       # Dashboard
│   │   ├── Dashboard.tsx
│   │   ├── StatsCard.tsx
│   │   └── QuickActions.tsx
│   │
│   ├── leads/           # Lead management
│   │   ├── LeadsModule.tsx
│   │   ├── LeadsList.tsx
│   │   ├── LeadForm.tsx
│   │   ├── LeadDetails.tsx
│   │   └── services/
│   │       └── leadService.ts
│   │
│   ├── customers/       # Customer management
│   │   ├── CustomersModule.tsx
│   │   ├── CustomersList.tsx
│   │   ├── CustomerForm.tsx
│   │   ├── CustomerDetails.tsx
│   │   ├── DocumentUpload.tsx
│   │   └── services/
│   │       └── customerService.ts
│   │
│   ├── survey/          # Site survey
│   │   ├── SurveyModule.tsx
│   │   ├── SurveyForm.tsx
│   │   ├── SurveyPhotoUpload.tsx
│   │   ├── SurveyReport.tsx
│   │   └── services/
│   │       └── surveyService.ts
│   │
│   ├── projects/        # Project management
│   │   ├── ProjectsModule.tsx
│   │   ├── ProjectsList.tsx
│   │   ├── ProjectDetails.tsx
│   │   ├── StageTracking.tsx
│   │   ├── BOMManagement.tsx
│   │   └── services/
│   │       └── projectService.ts
│   │
│   ├── quotations/      # Quotations
│   │   ├── QuotationsModule.tsx
│   │   ├── QuotationForm.tsx
│   │   ├── QuotationPreview.tsx
│   │   ├── QuotationPDF.tsx
│   │   └── services/
│   │       └── quotationService.ts
│   │
│   ├── invoices/        # Invoicing & GST
│   │   ├── InvoicesModule.tsx
│   │   ├── InvoiceForm.tsx
│   │   ├── InvoicePreview.tsx
│   │   ├── InvoicePDF.tsx
│   │   ├── GSTCalculator.tsx
│   │   └── services/
│   │       └── invoiceService.ts
│   │
│   ├── payments/        # Payments & finance
│   │   ├── PaymentsModule.tsx
│   │   ├── PaymentForm.tsx
│   │   ├── PaymentReceipt.tsx
│   │   ├── FinanceTracking.tsx
│   │   └── services/
│   │       └── paymentService.ts
│   │
│   ├── inventory/       # Inventory management
│   │   ├── InventoryModule.tsx
│   │   ├── StockList.tsx
│   │   ├── PurchaseEntry.tsx
│   │   ├── StockTransfer.tsx
│   │   ├── ItemMaster.tsx
│   │   └── services/
│   │       └── inventoryService.ts
│   │
│   ├── service/         # Service & complaints
│   │   ├── ServiceModule.tsx
│   │   ├── TicketsList.tsx
│   │   ├── TicketForm.tsx
│   │   ├── WarrantyManagement.tsx
│   │   ├── AMCManagement.tsx
│   │   └── services/
│   │       └── serviceService.ts
│   │
│   ├── reports/         # Reports & analytics
│   │   ├── ReportsModule.tsx
│   │   ├── SalesReport.tsx
│   │   ├── GSTReport.tsx
│   │   ├── ConversionReport.tsx
│   │   ├── PaymentReport.tsx
│   │   └── services/
│   │       └── reportService.ts
│   │
│   └── settings/        # Settings
│       ├── SettingsModule.tsx
│       ├── CompanySettings.tsx
│       ├── UserManagement.tsx
│       ├── MaterialMaster.tsx
│       ├── PaymentTerms.tsx
│       ├── BranchManagement.tsx
│       └── BackupRestore.tsx
│
├── services/            # Core services
│   ├── database.ts      # IndexedDB configuration
│   ├── fileStorage.ts   # File storage service
│   ├── pdfGenerator.ts  # PDF generation
│   ├── exportService.ts # Export functionality
│   └── notificationService.ts
│
├── store/               # State management
│   ├── authStore.ts     # Authentication state
│   ├── appStore.ts      # Global app state
│   └── toastStore.ts    # Toast notifications
│
├── types/               # TypeScript types
│   ├── index.ts         # Core types
│   └── extended.ts      # Extended types
│
├── utils/               # Utility functions
│   ├── gstCalculations.ts   # GST utilities
│   ├── formatters.ts        # Formatting utilities
│   ├── dateUtils.ts         # Date utilities
│   ├── validation.ts        # Validation utilities
│   └── constants.ts         # App constants
│
├── hooks/               # Custom React hooks
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── usePermissions.ts
│   └── usePagination.ts
│
├── config/              # Configuration
│   ├── app.config.ts    # App configuration
│   └── routes.config.ts # Routes configuration
│
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── index.css            # Global styles
```

## 🗄️ Database Schema

### Tables

1. **users** - User accounts and authentication
2. **roles** - User roles (Admin, Sales, etc.)
3. **permissions** - Role-based permissions
4. **customers** - Customer master data
5. **leads** - Lead/prospect management
6. **customerDocuments** - Customer document storage
7. **surveys** - Site survey data
8. **surveyPhotos** - Survey photos
9. **projects** - Project master
10. **projectStages** - Project stage tracking
11. **items** - Material/item master
12. **bom** - Bill of materials
13. **quotations** - Quotation master
14. **quotationItems** - Quotation line items
15. **invoices** - Invoice master
16. **invoiceItems** - Invoice line items
17. **payments** - Payment transactions
18. **financeApplications** - Finance/loan tracking
19. **stockLedger** - Inventory transactions
20. **suppliers** - Supplier master
21. **warranties** - Warranty tracking
22. **amcContracts** - AMC contracts
23. **serviceTickets** - Service tickets
24. **notifications** - Notification queue
25. **branches** - Branch/location master
26. **auditLogs** - Audit trail

## 🔐 Authentication Flow

```
Login Page
    ↓
Validate Credentials (IndexedDB)
    ↓
Create Session (Zustand Store)
    ↓
Redirect to Dashboard
    ↓
Protected Routes (Check Auth State)
    ↓
Role-Based Access (Check Permissions)
```

## 📊 Data Flow

```
User Action
    ↓
React Component
    ↓
Service Layer (Business Logic)
    ↓
Validation (Utils)
    ↓
Database Layer (Dexie.js)
    ↓
IndexedDB
    ↓
Update UI (React State/Store)
```

## 🎨 Styling Strategy

- **Tailwind CSS** - Utility-first CSS framework
- **Custom CSS Variables** - Theme colors
- **Responsive Design** - Mobile-first approach
- **Dark Mode Ready** - Theme switching support

## 🔄 State Management Strategy

### Zustand Stores

1. **authStore** - User authentication, session
2. **appStore** - Global UI state, settings
3. **toastStore** - Toast notifications

### Local Component State

- Form data (React Hook Form)
- UI toggles
- Modal visibility

## 📦 Build & Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Output
- Optimized JavaScript bundles
- Code splitting by module
- Compressed assets
- Service worker (future PWA)

## 🧪 Testing Strategy (Future)

- Unit tests - Vitest
- Component tests - React Testing Library
- E2E tests - Playwright
- Database tests - Dexie.js testing utilities

## 🔒 Security Considerations

1. **Local Storage** - All data stored locally
2. **Password Hashing** - bcrypt for passwords
3. **Input Sanitization** - Prevent XSS
4. **Role-Based Access** - Permission checks
5. **Audit Trail** - Track all changes

## 📝 Coding Standards

### TypeScript
- Strict mode enabled
- Explicit types for function parameters
- Interface over type for objects
- Descriptive variable names

### React
- Functional components
- Custom hooks for logic reuse
- Props destructuring
- Proper key props in lists

### File Naming
- Components: PascalCase (UserForm.tsx)
- Utilities: camelCase (dateUtils.ts)
- Types: PascalCase (User, Lead)
- Constants: UPPER_SNAKE_CASE

## 🚀 Performance Optimization

1. **Code Splitting** - Lazy loading modules
2. **Image Optimization** - Auto-compression
3. **Debouncing** - Search inputs
4. **Pagination** - Large datasets
5. **Virtual Scrolling** - Long lists (future)
6. **Memoization** - Expensive calculations

## 📱 Progressive Web App (Future)

- Service Worker for offline support
- App manifest for installability
- Push notifications
- Background sync

---

**Maintained by**: Shine Solar & Electrical Development Team
**Last Updated**: November 2025
