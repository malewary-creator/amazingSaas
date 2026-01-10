# 🚀 Setup & Deployment Guide

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React & React DOM
- TypeScript
- Vite
- Dexie.js (IndexedDB)
- Zustand (State management)
- Tailwind CSS
- jsPDF (PDF generation)
- and more...

### 2. Start Development Server

```bash
npm run dev
```

Application will be available at `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
```

Production files will be created in `dist/` folder.

---

## Production Deployment Options

### Option 1: Local Hosting (Recommended for Offline Use)

1. Build the application:
```bash
npm run build
```

2. The `dist` folder contains all files. Copy this to any location.

3. Run a simple HTTP server:

**Using Python:**
```bash
cd dist
python -m http.server 8080
```

**Using Node.js (http-server):**
```bash
npm install -g http-server
cd dist
http-server -p 8080
```

4. Access at `http://localhost:8080`

### Option 2: Desktop App (Using Electron)

For a true desktop application experience:

1. Install Electron packager:
```bash
npm install -g electron
npm install -g electron-packager
```

2. Create `electron-main.js`:
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadFile(path.join(__dirname, 'dist/index.html'));
}

app.whenReady().then(createWindow);
```

3. Package the app:
```bash
electron-packager . ShineSolar --platform=win32 --arch=x64
```

### Option 3: Web Server (Internal Network)

Host on a local web server for multi-user access:

1. Build the application
2. Upload `dist` folder to web server (Apache/Nginx)
3. Configure web server to serve static files
4. Access from any device on the network

---

## Database Initialization

### First Run

On first run, the app will:
1. Create IndexedDB database named `ShineSolarDB`
2. Create all required tables
3. Seed default roles (Admin, Sales, Survey, PM, Installation, Accounts)
4. Create default admin user

### Default Admin Login

```
Email: admin@shinesolar.com
Password: admin123
```

**⚠️ IMPORTANT: Change this password immediately after first login!**

---

## Configuration Steps

### 1. Company Settings

Navigate to **Settings > Company Info**

Configure:
- Company Name
- Logo (upload)
- GSTIN
- PAN
- Address
- Contact details

### 2. Branch Setup (Optional)

If you have multiple branches:

**Settings > Branches**
- Add branch code, name, address
- Assign GSTIN per branch

### 3. Material Master

**Settings > Material Master**

Add:
- Solar Panels (brands, wattage, prices)
- Inverters (brands, capacity, prices)
- Structures (types, materials)
- Cables, accessories

### 4. Payment Terms

**Settings > Payment Terms**

Configure default payment structure:
- Advance: 30%
- Second Payment: 65%
- Final: 5%

Or create custom structures.

### 5. User Management

**Settings > Users**

Create users with appropriate roles:
- Sales Executive
- Survey Engineer
- Project Manager
- Installation Team
- Accounts

---

## Data Backup

### Manual Backup

**Settings > Backup & Restore**

1. Click "Export Database"
2. Save the JSON file to safe location
3. Schedule regular backups (daily/weekly)

### Restore from Backup

1. **Settings > Backup & Restore**
2. Click "Import Database"
3. Select previously exported JSON file
4. Confirm restore

⚠️ **Warning**: Restore will overwrite all existing data!

---

## Browser Storage Limits

IndexedDB storage limits vary by browser:

- **Chrome**: 60% of available disk space
- **Firefox**: 50% of available disk space
- **Edge**: 60% of available disk space

For a typical installation:
- 1000 customers: ~5-10 MB
- 500 projects: ~10-20 MB
- Documents & Photos: Depends on compression

**Recommendation**: 
- Keep storage under 500 MB
- Archive old data regularly
- Compress images (handled automatically)

---

## Troubleshooting

### Database Not Loading

1. Check browser console for errors
2. Clear browser cache and reload
3. Check if IndexedDB is enabled in browser
4. Try incognito/private mode

### Files Not Uploading

1. Check file size (max 5MB recommended)
2. Check file type (JPEG, PNG, PDF only)
3. Clear browser storage if full

### Slow Performance

1. Archive old leads/projects
2. Clear browser cache
3. Reduce number of photos per project
4. Check available disk space

### Export Not Working

1. Check browser console
2. Ensure enough memory available
3. Close other tabs
4. Try smaller date range

---

## Security Best Practices

### 1. Access Control

- Use strong passwords (min 8 characters)
- Change default admin password
- Assign appropriate roles to users
- Disable unused user accounts

### 2. Data Protection

- Regular backups (daily recommended)
- Store backups on external drive
- Encrypt backup files
- Limit physical access to computer

### 3. Browser Security

- Use latest browser version
- Enable browser security features
- Clear cache regularly
- Use HTTPS if deployed on server

---

## Performance Optimization

### 1. Image Optimization

Images are automatically compressed to:
- Max resolution: 1920px
- Max size: 1MB
- Format: JPEG/WebP

### 2. Database Optimization

- Archive data older than 2 years
- Delete unnecessary photos
- Clean up draft quotations
- Remove cancelled projects

### 3. Browser Optimization

- Close unnecessary tabs
- Clear cache monthly
- Use Chrome for best performance
- Allocate sufficient RAM

---

## Maintenance Schedule

### Daily
- Data backup (automated recommended)
- Check disk space

### Weekly
- Review error logs
- Clean up draft records
- Update stock quantities

### Monthly
- Full database backup
- Archive old data
- Update material prices
- Review user access

### Quarterly
- System performance review
- Update documentation
- Train new users
- Review security settings

---

## Support & Updates

### Getting Help

1. Check README.md
2. Review this setup guide
3. Check browser console for errors
4. Contact support

### Feature Requests

Submit feature requests with:
- Clear description
- Use case
- Expected behavior
- Screenshots (if applicable)

---

## Development Notes

### Adding New Features

1. Create feature branch
2. Update types in `/src/types`
3. Add database fields if needed
4. Create module in `/src/modules`
5. Update routes in `App.tsx`
6. Test thoroughly

### Modifying Database Schema

```typescript
// In src/services/database.ts

this.version(2).stores({
  // Add new table
  newTable: '++id, field1, field2',
  
  // Modify existing (add index)
  existingTable: '++id, field1, field2, newField',
});
```

---

## License & Distribution

This software is proprietary to Shine Solar & Electrical.

**Distribution**: 
- Not for redistribution
- For internal use only
- Contact owner for licensing

---

**Last Updated**: November 2025
**Version**: 1.0.0
