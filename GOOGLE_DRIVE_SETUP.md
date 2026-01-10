# 🔧 Google Drive Setup Guide

## Complete Setup Instructions for Google Drive Integration

Follow these steps to enable Google Drive backup functionality in your Shine Solar application.

---

## 📋 Prerequisites

- Google Account (Gmail)
- Admin access to Google Cloud Console
- Development environment running (npm run dev)

---

## 🚀 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. **Project Name:** `ShineSolar Backup`
4. Click "**Create**"
5. Wait for project creation (takes ~30 seconds)

---

### Step 2: Enable Google Drive API

1. In Google Cloud Console, select your project
2. Go to "**APIs & Services**" → "**Library**"
3. Search for "**Google Drive API**"
4. Click on "**Google Drive API**"
5. Click "**Enable**"
6. Wait for activation

---

### Step 3: Create OAuth Consent Screen

1. Go to "**APIs & Services**" → "**OAuth consent screen**"
2. Choose "**External**" user type → Click "**Create**"

3. **Fill App Information:**
   - **App name:** `Shine Solar Management`
   - **User support email:** Your Gmail address
   - **Developer contact:** Your Gmail address
   - Leave other fields empty

4. **Scopes:**
   - Click "**Add or Remove Scopes**"
   - Search and select:
     ✅ `https://www.googleapis.com/auth/drive.file`
   - Click "**Update**" → "**Save and Continue**"

5. **Test Users:**
   - Click "**Add Users**"
   - Add your Gmail address
   - Click "**Save and Continue**"

6. **Summary:**
   - Review and click "**Back to Dashboard**"

---

### Step 4: Create OAuth 2.0 Credentials

1. Go to "**APIs & Services**" → "**Credentials**"
2. Click "**Create Credentials**" → "**OAuth client ID**"
3. **Application type:** `Web application`
4. **Name:** `ShineSolar Web Client`

5. **Authorized JavaScript origins:**
   - Click "**Add URI**"
   - Add: `http://localhost:3000`
   - (For production, add your production domain)

6. **Authorized redirect URIs:**
   - Click "**Add URI**"
   - Add: `http://localhost:3000`
   - Add: `http://localhost:3000/settings/backup`

7. Click "**Create**"

8. **IMPORTANT:** Copy your **Client ID**
   - It looks like: `123456789-abc123def456.apps.googleusercontent.com`
   - Keep this safe!

---

### Step 5: Configure Your Application

1. Open your project folder: `/home/vishwas/Desktop/shine-solar/`

2. Open `.env` file (create if doesn't exist)

3. Add your Google Client ID:
   ```env
   VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
   ```

4. Replace `YOUR_CLIENT_ID_HERE` with the actual Client ID you copied

5. Save the file

6. **Restart your dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

---

## ✅ Testing Google Drive Integration

### Test 1: Connect to Google Drive

1. Open application: `http://localhost:3000`
2. Login with: `admin@shinesolar.com` / `admin123`
3. Navigate to: **Settings** → **Backup & Restore**
4. Click "**Connect Google Drive**"
5. Google OAuth popup should appear
6. Select your Google account
7. Click "**Allow**" to grant permissions
8. Should see "**Connected to Google Drive**" ✅

### Test 2: Upload Backup

1. Click "**Backup to Cloud Now**"
2. Wait for upload (few seconds)
3. Should see success message ✅
4. Check your Google Drive:
   - Go to [Google Drive](https://drive.google.com/)
   - Look for folder: `ShineSolar_Backups`
   - Should contain backup file

### Test 3: View Cloud Backups

1. Click "**View Cloud Backups**"
2. Should see list of backups
3. Click "**Restore**" on any backup
4. Choose "**Merge with Existing**" or "**Replace All Data**"
5. Data should be restored ✅

---

## 🔒 Security Best Practices

### For Development:
✅ Use test Google account
✅ Add only localhost in authorized origins
✅ Keep Client ID in `.env` file (not committed to Git)

### For Production:
✅ Use dedicated Google Cloud project
✅ Add only production domain
✅ Enable billing (for higher quotas)
✅ Publish OAuth consent screen (for all users)
✅ Use environment variables on server

---

## 🐛 Troubleshooting

### Issue 1: "Google Client ID not configured"
**Solution:**
- Check `.env` file exists
- Verify `VITE_GOOGLE_CLIENT_ID` is set
- Restart dev server (`npm run dev`)

### Issue 2: OAuth popup blocked
**Solution:**
- Allow popups for localhost:3000
- Try clicking "Connect" again
- Use Chrome/Firefox (best support)

### Issue 3: "Failed to connect to Google Drive"
**Solution:**
- Check Client ID is correct
- Verify authorized origins include `http://localhost:3000`
- Clear browser cache
- Check browser console for errors

### Issue 4: "Upload failed"
**Solution:**
- Verify you're connected (green "Connected" badge)
- Check internet connection
- Check Google Drive API is enabled
- Try disconnecting and reconnecting

### Issue 5: "Not authorized" error
**Solution:**
- Add your email in "Test users" (OAuth consent screen)
- Make sure you're using the correct Google account
- Re-authorize the app

---

## 📊 API Quotas (Free Tier)

Google Drive API free limits:
- **Daily requests:** 1 billion (plenty!)
- **Per user per second:** 10 requests
- **File size:** 5TB per file
- **Storage:** 15GB free (shared with Gmail/Photos)

**For this app:** You'll never hit these limits! 😊

---

## 🌍 Publishing for All Users (Optional)

If you want anyone to use Google Drive backup (not just test users):

1. Go to OAuth consent screen
2. Click "**Publish App**"
3. Submit for Google verification (takes ~1 week)
4. Once approved, any Google user can connect

**Note:** For personal/company use, "Test users" mode is fine!

---

## 📁 Where Backups are Stored

```
Google Drive
└── ShineSolar_Backups/  (Auto-created folder)
    ├── ShineSolar_Backup_2025-11-27_143025.json
    ├── ShineSolar_Backup_2025-11-26_143025.json
    ├── ShineSolar_Backup_2025-11-25_143025.json
    └── ... (up to 30 backups, auto-delete old ones)
```

---

## 🎯 Next Steps After Setup

1. ✅ Connect to Google Drive
2. ✅ Test backup upload
3. ✅ Test backup restore
4. ✅ Enable auto-backup (coming soon)
5. ✅ Use the app confidently!

---

## 💡 Quick Reference

**Google Cloud Console:** https://console.cloud.google.com/
**Google Drive:** https://drive.google.com/
**OAuth Consent Screen:** APIs & Services → OAuth consent screen
**Credentials:** APIs & Services → Credentials
**API Library:** APIs & Services → Library

---

## 🆘 Need Help?

If you face any issues:
1. Check browser console (F12) for errors
2. Verify all setup steps completed
3. Check `.env` file configuration
4. Try with different Google account
5. Clear browser cache and cookies

---

## ✅ Setup Complete Checklist

- [ ] Google Cloud project created
- [ ] Google Drive API enabled
- [ ] OAuth consent screen configured
- [ ] Test users added
- [ ] OAuth client credentials created
- [ ] Client ID copied
- [ ] `.env` file updated with Client ID
- [ ] Dev server restarted
- [ ] Google Drive connected successfully
- [ ] Test backup uploaded
- [ ] Test backup restored

**All checked? You're ready to go!** 🎉

