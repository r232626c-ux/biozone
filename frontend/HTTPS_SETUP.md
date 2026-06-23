# HTTPS Setup Guide for Biozone Frontend

## Problem
- **Insecure Page Warning**: Password fields on HTTP pages are flagged as security risks
- **CORS Issues**: Mixed content warnings when HTTPS backend tries to communicate with HTTP frontend
- **Browser Warnings**: Modern browsers restrict password submission on insecure pages

## Solution: Enable HTTPS for Development

### Step 1: Generate SSL Certificates
Run ONE of these commands from the `biozone/frontend/` directory:

#### Option A: Using Node.js (Recommended - cross-platform)
```bash
node generate-certs.js
```

#### Option B: Using PowerShell
```powershell
.\generate-certs.ps1
```

#### Option C: Manual OpenSSL (if you have it installed)
```bash
openssl req -x509 -newkey rsa:2048 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "/C=ZA/ST=State/L=City/O=Biozone/CN=localhost"
```

### Step 2: Update package.json (Optional)
Add a script to auto-generate certs before dev:
```json
{
  "scripts": {
    "dev": "node generate-certs.js && vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Step 3: Restart Vite Dev Server
```bash
npm run dev
# or
yarn dev
```

### Step 4: Access via HTTPS
Navigate to: **https://localhost:5173** (note the `https://`)

**⚠️ Browser Warning**: You'll see "Your connection is not private" or similar.
- Click "Advanced" → "Proceed to localhost" (Chrome)
- Click "Accept the Risk and Continue" (Firefox)
- This is expected for self-signed certificates in development

### Verification Checklist
✅ Frontend accessible at `https://localhost:5173`
✅ Browser shows secure connection (lock icon)
✅ No "Insecure content" warnings
✅ Login form no longer shows password security warning
✅ API calls succeed (CORS working)

## Backend CORS Configuration (Already Updated)

The backend CORS has been configured to accept:
- `http://localhost:5173` (development)
- `http://127.0.0.1:5173` (testing)
- `http://192.168.1.114:5173` (network access)
- All `http://localhost:*` and `http://127.0.0.1:*` origins

**Important**: If using HTTPS frontend (`https://localhost:5173`), you may need to update backend CORS to include HTTPS origins.

Edit `biozone/backend/app/main.py` line ~66-73 to add HTTPS support:
```python
origins = [
    "https://localhost:5173",
    "https://127.0.0.1:5173",
    "https://192.168.1.114:5173",
    # ... existing http origins
]
```

## Troubleshooting

### Error: "ENOENT: no such file or directory"
The certificate files don't exist. Run `generate-certs.js` or `generate-certs.ps1`.

### Error: "OpenSSL not found"
- **Windows**: Download from https://slproweb.com/products/Win32OpenSSL.html
- **Mac**: `brew install openssl`
- **Linux**: `sudo apt-get install openssl`

### CORS Still Failing
1. Check backend is running: `http://localhost:8000/docs`
2. Verify CORS origins in backend `main.py`
3. Restart both frontend and backend services
4. Clear browser cache (Ctrl+Shift+Delete)

### Certificate Warning Persists
This is normal for self-signed certificates. Development browsers will show this warning.

For production, use a proper SSL certificate from a CA (Let's Encrypt, etc.).
