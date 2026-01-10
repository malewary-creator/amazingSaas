# Package Management & Scripts

## Available Scripts

### Development
```bash
npm run dev
```
Starts Vite development server on http://localhost:3000 with hot module replacement.

### Production Build
```bash
npm run build
```
Creates optimized production build in `/dist` folder with:
- TypeScript compilation
- Code minification
- Asset optimization
- Tree shaking

### Preview Production
```bash
npm run preview
```
Preview production build locally before deployment.

### Type Checking
```bash
npm run type-check
```
Run TypeScript compiler without emitting files (checks for type errors).

### Linting
```bash
npm run lint
```
Run ESLint to check code quality and find issues.

## Dependencies Overview

### Core
- `react` - UI library
- `react-dom` - React DOM renderer
- `react-router-dom` - Client-side routing

### State Management
- `zustand` - Lightweight state management

### Database
- `dexie` - IndexedDB wrapper
- `dexie-react-hooks` - React hooks for Dexie

### Forms & Validation
- `react-hook-form` - Form handling
- `@hookform/resolvers` - Validation resolvers
- `zod` - Schema validation

### UI & Styling
- `tailwindcss` - Utility-first CSS
- `lucide-react` - Icon library
- `clsx` - Conditional classnames
- `tailwind-merge` - Merge Tailwind classes

### Utilities
- `date-fns` - Date manipulation
- `numeral` - Number formatting
- `qrcode` - QR code generation

### PDF Generation
- `jspdf` - PDF creation
- `jspdf-autotable` - PDF tables
- `html2canvas` - HTML to canvas

### Charts
- `recharts` - Chart library

### File Handling
- `react-dropzone` - File upload
- `image-conversion` - Image compression

## Installation Commands

### Install All Dependencies
```bash
npm install
```

### Install Specific Package
```bash
npm install <package-name>
```

### Install Dev Dependency
```bash
npm install -D <package-name>
```

### Update Dependencies
```bash
npm update
```

### Check for Outdated Packages
```bash
npm outdated
```

## Build Output

After running `npm run build`, you'll get:

```
dist/
├── index.html           # Entry point
├── assets/
│   ├── index-[hash].js  # Main JavaScript bundle
│   ├── vendor-[hash].js # Third-party libraries
│   ├── index-[hash].css # Compiled CSS
│   └── [images/fonts]   # Static assets
└── ...
```

## Environment Variables (Optional)

Create `.env.local` for environment-specific configs:

```env
VITE_APP_NAME=Shine Solar
VITE_COMPANY_NAME=Shine Solar & Electrical
```

Access in code:
```typescript
const appName = import.meta.env.VITE_APP_NAME;
```

## Troubleshooting

### "Module not found" error
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
npm run type-check
```

### Build fails
```bash
# Clear cache
rm -rf node_modules/.vite
npm run build
```

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
npm run dev
```
