# 🚀 Quick Start Guide - Shine Solar Management System

## 📥 Installation (5 minutes)

```bash
# Navigate to project directory
cd /home/vishwas/Desktop/shine-solar

# Install all dependencies
npm install

# Start development server
npm run dev
```

Application will open at: **http://localhost:3000**

---

## 🔑 Default Login

```
Email: admin@shinesolar.com
Password: admin123
```

**⚠️ IMPORTANT**: Change this password immediately in Settings!

---

## 📁 Key Files & Folders

```
shine-solar/
├── src/
│   ├── modules/          ← Build your features here
│   ├── components/       ← Reusable UI components
│   ├── services/         ← Business logic
│   ├── utils/            ← Helper functions
│   ├── types/            ← TypeScript types
│   └── store/            ← State management
├── README.md             ← Project overview
├── SETUP_GUIDE.md        ← Detailed setup
├── ARCHITECTURE.md       ← Technical docs
└── NEXT_STEPS.md         ← Development roadmap
```

---

## 🎯 Feature Modules

All modules are in `/src/modules/`:

1. **leads/** - Lead management
2. **customers/** - Customer database
3. **survey/** - Site surveys
4. **projects/** - Project tracking
5. **quotations/** - Quotations
6. **invoices/** - GST billing
7. **payments/** - Payments & finance
8. **inventory/** - Stock management
9. **service/** - Service tickets
10. **reports/** - Analytics
11. **settings/** - Configuration

---

## 💾 Database

**Type**: IndexedDB (Offline storage)  
**Library**: Dexie.js  
**Location**: Browser's IndexedDB  
**Schema**: `/src/services/database.ts`

### Key Tables
- customers, leads, projects
- quotations, invoices, payments
- items, stockLedger, suppliers
- serviceTickets, warranties, amcContracts

### Access Database
```typescript
import { db } from '@/services/database';

// Example: Get all leads
const leads = await db.leads.toArray();

// Add new lead
await db.leads.add({
  customerId: 1,
  source: 'Referral',
  status: 'New',
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

---

## 🔧 Utility Functions

### GST Calculations
```typescript
import { calculateGST, calculateInvoiceTotals } from '@/utils/gstCalculations';

const gst = calculateGST(10000, 18, false); // Amount, Rate, IsInterState
// Returns: { cgst, sgst, igst, totalGST, totalAmount }
```

### Number Formatting
```typescript
import { formatCurrency, numberToWords } from '@/utils/formatters';

formatCurrency(125000);         // ₹1,25,000.00
numberToWords(125000);          // One Lakh Twenty Five Thousand Rupees Only
```

### Date Formatting
```typescript
import { formatDate, formatDateTime } from '@/utils/dateUtils';

formatDate(new Date());         // 27/11/2025
formatDateTime(new Date());     // 27/11/2025 14:30
```

### Validation
```typescript
import { isValidGSTIN, isValidMobile, isValidPAN } from '@/utils/validation';

isValidGSTIN('27AABCT1332L1Z1');  // true
isValidMobile('9876543210');       // true
isValidPAN('ABCDE1234F');          // true
```

---

## 🎨 UI Components (To Build)

### Basic Components (`/src/components/ui/`)
```typescript
// Button.tsx
<Button variant="primary" onClick={handleClick}>
  Save
</Button>

// Input.tsx
<Input 
  label="Name"
  value={name}
  onChange={setName}
  required
/>

// Modal.tsx
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <h2>Confirm Action</h2>
  <p>Are you sure?</p>
</Modal>
```

---

## 📝 Form Example

```typescript
import { useState } from 'react';
import { db } from '@/services/database';
import { toast } from '@/store/toastStore';

function LeadForm() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create customer first
      const customerId = await db.customers.add({
        name,
        mobile,
        address: { city: '', state: '', pincode: '' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Create lead
      await db.leads.add({
        leadId: `LEAD-${Date.now()}`,
        customerId,
        source: 'Walk-in',
        status: 'New',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      toast.success('Lead created successfully!');
    } catch (error) {
      toast.error('Failed to create lead');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Customer Name"
        required
      />
      <input 
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        placeholder="Mobile Number"
        required
      />
      <button type="submit">Create Lead</button>
    </form>
  );
}
```

---

## 🎯 Common Tasks

### Create a New Module

1. Create folder: `/src/modules/mymodule/`
2. Create main file: `MyModule.tsx`
3. Create service: `services/myService.ts`
4. Add route in `App.tsx`
5. Add to sidebar in `DashboardLayout.tsx`

### Add to Database

1. Update schema in `/src/services/database.ts`
2. Add type in `/src/types/index.ts`
3. Increment version number:
```typescript
this.version(2).stores({
  myNewTable: '++id, field1, field2, createdAt',
});
```

### File Upload

```typescript
import { fileStorage } from '@/services/fileStorage';

const handleFileUpload = async (file: File) => {
  const filePath = await fileStorage.saveFile(file, 'documents');
  // Save filePath to database
};
```

### Generate PDF

```typescript
import jsPDF from 'jspdf';

const generatePDF = () => {
  const doc = new jsPDF();
  doc.text('Shine Solar', 20, 20);
  doc.save('document.pdf');
};
```

---

## 🔍 Debugging

### Check Database
```javascript
// In browser console
indexedDB.databases().then(console.log);

// Open Dexie database
const db = new Dexie('ShineSolarDB');
db.open().then(() => console.log('DB opened'));
```

### Common Issues

**Module not found errors**
```bash
npm install  # Install dependencies first
```

**TypeScript errors**
- Check imports are correct
- Ensure types are defined
- Restart TypeScript server in VS Code

**Database not working**
- Clear browser data
- Check IndexedDB in DevTools
- Verify schema in database.ts

---

## 📊 Production Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview

# Files will be in /dist folder
```

---

## 🎓 Learning Resources

### Technologies Used
- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org
- **Tailwind CSS**: https://tailwindcss.com
- **Dexie.js**: https://dexie.org
- **Zustand**: https://github.com/pmndrs/zustand
- **jsPDF**: https://github.com/parallax/jsPDF

### Tutorials
- React + TypeScript: https://react-typescript-cheatsheet.netlify.app
- Tailwind Basics: https://tailwindcss.com/docs
- IndexedDB Guide: https://dexie.org/docs/Tutorial

---

## 📞 Quick Help

**Can't start server?**
- Run `npm install` first
- Check Node.js version (18+)
- Delete `node_modules` and reinstall

**Need to add a feature?**
- Check existing modules for examples
- Use utility functions in `/src/utils/`
- Follow TypeScript types

**Database issues?**
- Check DevTools > Application > IndexedDB
- Clear database and restart
- Check schema version

---

## ✅ Pre-Launch Checklist

Before deploying to production:

- [ ] Change default admin password
- [ ] Configure company settings
- [ ] Add material master data
- [ ] Set up payment terms
- [ ] Test all modules
- [ ] Create backup procedure
- [ ] Train users
- [ ] Run `npm run build`

---

## 🎉 You're Ready!

Now start building your modules following the **NEXT_STEPS.md** roadmap!

**Happy Coding! 🚀**

---

**Need Help?**
- Read: README.md (overview)
- Read: ARCHITECTURE.md (technical details)
- Read: NEXT_STEPS.md (what to build next)
- Read: SETUP_GUIDE.md (deployment)
