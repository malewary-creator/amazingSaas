# 📖 Backup & Restore User Guide

## How to Protect Your Shine Solar Data

**Complete guide for backing up and restoring your data using local files and Google Drive.**

---

## 🎯 Why Backup is Important

Your data is stored in browser storage (IndexedDB). **Without backups, you risk losing everything** if:
- ❌ You clear browser data
- ❌ Browser is uninstalled
- ❌ Computer crashes
- ❌ Hard disk fails

**✅ Solution:** Regular backups keep your data safe!

---

## 📥 Local Backup (Recommended for Everyone)

### Export Backup to Your Computer

**Steps:**
1. Login to Shine Solar application
2. Go to: **Settings** → **Backup & Restore**
3. Click "**Export Backup**" button
4. JSON file downloads to your Downloads folder
5. **File name:** `ShineSolar_Backup_2025-11-27_143025.json`

**Where to store:**
- ✅ Copy to `~/Documents/ShineSolar_Backups/`
- ✅ Copy to external USB drive
- ✅ Upload to your Google Drive manually
- ✅ Keep multiple copies in different locations

**How often:**
- 📅 **Daily:** If actively using the app
- 📅 **Weekly:** For occasional use
- 📅 **Before major operations:** Before bulk delete, before browser maintenance

---

### Import Backup (Restore)

**Steps:**
1. Go to: **Settings** → **Backup & Restore**
2. Click "**Import Backup**" button
3. Select your backup JSON file
4. Wait for import to complete
5. Success! Data restored ✅

**Import Options:**
- **Merge:** Adds backup data to existing data (keeps both, skips duplicates)
- **Replace:** Clears all existing data first, then restores from backup

---

## ☁️ Google Drive Backup (Maximum Protection)

### Why Use Google Drive?

✅ **Automatic backups** - Set and forget
✅ **Access anywhere** - From any computer
✅ **Survives computer crash** - Data in cloud
✅ **Easy restore** - One-click restoration
✅ **Version history** - Keep last 30 backups

---

### One-Time Setup

**⚠️ Important:** First complete Google Drive setup (see `GOOGLE_DRIVE_SETUP.md`)

**Quick Setup Steps:**
1. Get Google Client ID (from Google Cloud Console)
2. Add to `.env` file
3. Restart dev server
4. Done!

**Detailed instructions:** See `GOOGLE_DRIVE_SETUP.md`

---

### Connect to Google Drive

**Steps:**
1. Go to: **Settings** → **Backup & Restore**
2. Scroll to "**Cloud Backup (Google Drive)**" section
3. Click "**Connect Google Drive**" button
4. Google login popup appears
5. Choose your Google account
6. Click "**Allow**" to grant permissions
7. Connected! ✅

**Status:**
- 🟢 Green badge = Connected
- ⚪ Gray badge = Not connected

---

### Upload Backup to Google Drive

**Manual Upload:**
1. Make sure you're connected (green badge)
2. Click "**Backup to Cloud Now**"
3. Wait ~5 seconds
4. Success! Backup uploaded ✅

**Check your backup:**
1. Go to [Google Drive](https://drive.google.com/)
2. Look for folder: `ShineSolar_Backups`
3. Your backup files are there!

---

### View Cloud Backups

**Steps:**
1. Click "**View Cloud Backups**"
2. Modal opens with list of all backups
3. Shows:
   - File name
   - Upload date & time
   - File size

**Backup Management:**
- ✅ Keeps last **30 backups**
- ✅ Auto-deletes older backups
- ✅ Sorted by date (newest first)

---

### Restore from Google Drive

**Steps:**
1. Click "**View Cloud Backups**"
2. Find the backup you want to restore
3. Click "**Restore**" button
4. Choose restore option:
   - **Merge with Existing:** Adds to current data
   - **Replace All Data:** Deletes everything, then restores
5. Confirm your choice
6. Wait for restore
7. Done! Data restored ✅

**⚠️ Warning:** "Replace All Data" permanently deletes existing data!

---

### Disconnect from Google Drive

**Steps:**
1. Go to: **Settings** → **Backup & Restore**
2. Click "**Disconnect**" button (top right of green badge)
3. Disconnected!

**Note:** Your backups stay in Google Drive, you just can't access them from app until you reconnect.

---

## 🗑️ Clear All Data (Danger Zone)

**⚠️ WARNING:** This permanently deletes ALL data!

**When to use:**
- Starting fresh
- Testing
- Before importing backup with "Replace" option

**Steps:**
1. **Make a backup first!** (Export or upload to cloud)
2. Go to: **Settings** → **Backup & Restore**
3. Scroll to "**Danger Zone**"
4. Click "**Clear All Data**"
5. Confirm (requires confirmation)
6. All data deleted!

**Cannot be undone!** Always backup first!

---

## 📊 Understanding Database Statistics

**What you see:**
- **Total Records:** All data entries across all tables
- **Customers:** Number of customer records
- **Leads:** Number of leads
- **Invoices:** Number of invoices
- **Payments:** Number of payments
- **And more...**

**Why it matters:**
- Check data growth
- Estimate backup file size
- Verify restore success

---

## 💾 Backup File Details

### File Format: JSON
```json
{
  "metadata": {
    "version": "1.0",
    "exportDate": "2025-11-27T10:30:00Z",
    "recordCount": 1234,
    "appVersion": "1.0.0"
  },
  "tables": {
    "customers": [...],
    "invoices": [...],
    "payments": [...]
  }
}
```

### File Naming
- **Format:** `ShineSolar_Backup_YYYY-MM-DD_HHMMSS.json`
- **Example:** `ShineSolar_Backup_2025-11-27_143025.json`

### File Size
- **Empty database:** ~5 KB
- **100 customers:** ~100 KB
- **1000 invoices:** ~2 MB
- **With photos:** Can be larger (photos as base64)

---

## 🔄 Backup Strategies

### Strategy 1: Daily Local Backup (Minimum)
```
Every day:
1. Export backup to Downloads
2. Copy to Documents/ShineSolar_Backups/
3. Keep last 7 days
```

### Strategy 2: Weekly Cloud Backup (Recommended)
```
Every week:
1. Connect to Google Drive
2. Upload backup to cloud
3. Keeps last 30 automatically
```

### Strategy 3: Multiple Locations (Best)
```
Daily: Export to computer
Weekly: Upload to Google Drive
Monthly: Copy to external USB drive
Quarterly: Copy to another cloud service
```

---

## 🐛 Troubleshooting

### Problem: "Failed to export backup"
**Solution:**
- Check browser console for errors
- Try clearing browser cache
- Try different browser

### Problem: "Failed to import backup"
**Solution:**
- Verify file is valid JSON
- Check file is from Shine Solar (correct format)
- Try smaller backup file first

### Problem: "Google Drive connection failed"
**Solution:**
- Check `.env` file has correct Client ID
- Restart dev server
- Try different Google account
- See `GOOGLE_DRIVE_SETUP.md`

### Problem: "Upload to cloud failed"
**Solution:**
- Check internet connection
- Verify you're connected (green badge)
- Try disconnecting and reconnecting
- Check Google Drive storage (need space)

### Problem: "Backup file too large"
**Solution:**
- Your database has many photos
- Export selective data (date range)
- Clean up old/unused data
- Upload to Google Drive (handles large files better)

---

## ✅ Backup Best Practices

### DO:
- ✅ Backup before major operations
- ✅ Keep multiple backup copies
- ✅ Store backups in different locations
- ✅ Test restore occasionally
- ✅ Use descriptive file names
- ✅ Check backup file opens correctly

### DON'T:
- ❌ Rely on browser storage only
- ❌ Delete all backups
- ❌ Share backup files (contain sensitive data)
- ❌ Edit backup files manually
- ❌ Store only in one location

---

## 📅 Recommended Backup Schedule

### Daily Operations:
```
Morning: Check last backup date
Evening: Export backup if data changed
```

### Weekly:
```
Monday: Upload to Google Drive
Friday: Verify backup exists
```

### Monthly:
```
1st: Copy to external drive
15th: Test restore on test system
```

---

## 🆘 Emergency Data Recovery

### Scenario 1: Accidentally Cleared Browser Data

1. **Don't panic!** 
2. Find your last backup file
3. Go to Settings → Backup & Restore
4. Import backup
5. Data restored ✅

### Scenario 2: Computer Crashed

1. Install Chrome/Firefox on new computer
2. Install Shine Solar app
3. Login
4. Go to Settings → Backup & Restore
5. Connect to Google Drive
6. Click "View Cloud Backups"
7. Restore latest backup
8. Data recovered ✅

### Scenario 3: No Backup Available

1. Check Google Drive manually (folder: `ShineSolar_Backups`)
2. Check Downloads folder for old backups
3. Check Documents/ShineSolar_Backups/
4. Check external drives
5. Check email (if you sent backups to yourself)

**Prevention:** Regular backups prevent this scenario!

---

## 📱 Advanced Features (Coming Soon)

- ⏰ Scheduled auto-backups
- 🔔 Backup reminders
- 🔐 Encrypted backups
- 📧 Email backups
- 💾 Incremental backups (only changes)
- ☁️ Multi-cloud support (Dropbox, OneDrive)

---

## 🎓 Quick Reference

| Task | Location | Button |
|------|----------|--------|
| Export backup | Settings → Backup & Restore | "Export Backup" |
| Import backup | Settings → Backup & Restore | "Import Backup" |
| Connect Google Drive | Settings → Backup & Restore | "Connect Google Drive" |
| Upload to cloud | Settings → Backup & Restore | "Backup to Cloud Now" |
| View cloud backups | Settings → Backup & Restore | "View Cloud Backups" |
| Clear data | Settings → Backup & Restore | "Clear All Data" |

---

## ✅ Backup Checklist

**Before Important Operations:**
- [ ] Export current backup
- [ ] Verify backup file saved correctly
- [ ] Keep backup in safe location

**Regular Maintenance:**
- [ ] Backup at least weekly
- [ ] Test restore occasionally  
- [ ] Clean up old backups (keep last 30)
- [ ] Verify Google Drive connection active
- [ ] Check backup file sizes

**Best Protection:**
- [ ] Local backup to computer
- [ ] Cloud backup to Google Drive
- [ ] External drive backup monthly
- [ ] Multiple backup locations

---

## 💡 Remember

> **Your data is as safe as your backups!**

Make backing up a habit. It takes just 10 seconds to export a backup, but could save hours of lost work.

**Backup today. Sleep peacefully tonight.** 😊

---

## 📚 Related Documentation

- `GOOGLE_DRIVE_SETUP.md` - Google Drive setup guide
- `DATA_STORAGE_GUIDE.md` - Where data is stored
- `DATA_SAFETY_ANSWERS.md` - Common questions answered
- `CLOUD_BACKUP_OPTIONS.md` - Cloud backup options

---

**Need help?** Check the troubleshooting section or contact support!

