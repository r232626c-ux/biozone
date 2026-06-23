# Quick Start: Fix CORS & HTTPS Issues

## What Was Fixed

### 1. ✅ CORS Configuration (Backend)
- Fixed typo in CORS origins list
- Added support for both HTTP and HTTPS
- Updated regex to allow all localhost/network IPs

**Backend file**: `biozone/backend/app/main.py` (lines 66-81)

### 2. ✅ API URL Configuration (Frontend)
- Created centralized API config: `frontend/src/utils/api.js`
- Updated all 15+ components to use centralized URLs
- Auto-detects hostname in development mode

**Frontend files**: All components now import from `utils/api.js`

### 3. ✅ HTTPS Setup (Removes Security Warning)
- Updated Vite config to use HTTPS
- Created certificate generation scripts
- Added startup scripts for easy development

**Vite config**: `biozone/frontend/vite.config.js`

---

## How to Run (Choose One Method)

### Method 1: Simple Startup Script (Recommended)
```bash
cd biozone/frontend/
./start-dev.ps1              # PowerShell (Windows)
# or
./start-dev.bat              # Command Prompt (Windows)
```

### Method 2: Manual Steps
```bash
cd biozone/frontend/

# Step 1: Generate certificates (one-time)
node generate-certs.js

# Step 2: Install dependencies (if needed)
npm install

# Step 3: Start dev server
npm run dev
```

### Method 3: Docker/Production
Backend will also need HTTPS. Update backend if running with HTTPS:
```python
# In biozone/backend/app/main.py
origins = [
    "https://localhost:5173",    # Add these for HTTPS
    "https://127.0.0.1:5173",
]
```

---

## Access Your Application

1. **Frontend**: https://localhost:5173
   - ⚠️ You'll see a certificate warning (self-signed, expected)
   - Click "Advanced" → "Proceed to localhost" (varies by browser)

2. **Backend API**: http://localhost:8000
   - Docs available at: http://localhost:8000/docs

3. **Backend Admin**: http://localhost:8000/redoc

---

## Expected Behavior After Fix

✅ **Frontend loads over HTTPS** → No insecure page warning
✅ **Login form accessible** → No password field security warning
✅ **API calls work** → No CORS errors in console
✅ **Database connects** → No connection refused errors

---

## Troubleshooting

### Issue: "Certificate files not found"
**Solution**: Run `node generate-certs.js` from `frontend/` directory

### Issue: "OpenSSL not found"
**Solution**: Node.js doesn't need OpenSSL to run. The script will try to find it.
- If you want to generate certs manually:
  - Windows: Download OpenSSL from https://slproweb.com/products/Win32OpenSSL.html
  - Mac: `brew install openssl`
  - Linux: `sudo apt-get install openssl`

### Issue: "Port 5173 already in use"
**Solution**: Kill the process or use a different port:
```bash
npm run dev -- --port 5174
```

### Issue: "CORS still failing"
**Solution**: 
1. Restart both frontend AND backend
2. Clear browser cache (Ctrl+Shift+Delete)
3. Check backend is actually running: http://localhost:8000/docs
4. Verify CORS origins in `biozone/backend/app/main.py`

---

## File Changes Summary

### Backend
- [main.py](../backend/app/main.py) - CORS configuration (HTTP + HTTPS support)

### Frontend
- [vite.config.js](./vite.config.js) - HTTPS & proxy configuration
- [src/utils/api.js](./src/utils/api.js) - Centralized API endpoint
- [src/**/*.jsx](./src/) - Updated to use centralized API config
- [generate-certs.js](./generate-certs.js) - Certificate generation tool
- [start-dev.ps1](./start-dev.ps1) - PowerShell startup script
- [start-dev.bat](./start-dev.bat) - Batch startup script
- [HTTPS_SETUP.md](./HTTPS_SETUP.md) - Detailed HTTPS guide

---

## Security Notes

- Self-signed certificates are fine for local development
- Browser warnings about certificates are expected and harmless
- For production, use proper SSL certificates (Let's Encrypt, DigiCert, etc.)
- Never commit `localhost.pem` or `localhost-key.pem` to version control (added to .gitignore)

---

## Next Steps

1. Run startup script
2. Wait for "compiled successfully" message
3. Open browser to https://localhost:5173
4. Accept certificate warning
5. Test login functionality

Questions? Check the detailed guide in `HTTPS_SETUP.md`
