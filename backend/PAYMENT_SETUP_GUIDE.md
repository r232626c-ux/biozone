# Payment System - Quick Setup Guide

## What Was Set Up

Your payment verification system now includes:

### 1. Database Model
- **Table:** `system_settings`
- **Fields:** Lab config + payment tracking (lastPaymentDate, paymentStatus)
- **Location:** `app/models.py` - `SystemSettings` class

### 2. Backend Endpoints
- **GET /system-settings/** - Retrieve current settings & payment status
- **PUT /system-settings/** - Update settings when NOT locked
- **POST /system-settings/verify-payment/** - Verify code and unlock system
- **Location:** `app/main.py` - Lines starting with `@app.get("/system-settings/`

### 3. Configuration Management
- **File:** `app/config.py`
- **Contains:**
  - `VALID_PAYMENT_CODE = "BIOZONE2024"` ← Change this!
  - `SUBSCRIPTION_PERIOD_DAYS = 60`
  - `ADDITIONAL_PAYMENT_CODES` - Dict for multiple codes
  - Helper functions: `is_valid_payment_code()`, `get_code_license_type()`

### 4. Frontend Component
- **File:** `frontend/src/components/settings/SystemSettings.jsx`
- **Features:**
  - RED card when locked, GREEN when active
  - Auto-open dialog for payment entry
  - Disable all fields when locked
  - Display countdown to payment due

## Setup Steps

### Step 1: Initialize Database
Run this to create the system_settings table:

```bash
cd backend
python init_db.py
```

Or manually:
```sql
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY,
    labName VARCHAR DEFAULT 'BIOZONE Lab',
    turnaroundTime VARCHAR DEFAULT '24',
    enableNotifications BOOLEAN DEFAULT 1,
    maintenanceMode BOOLEAN DEFAULT 0,
    defaultReportFormat VARCHAR DEFAULT 'PDF',
    dataRetentionDays INTEGER DEFAULT 365,
    lastPaymentDate DATETIME,
    paymentStatus VARCHAR DEFAULT 'inactive',
    verificationCode VARCHAR,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Step 2: Configure Payment Code

**Option A: Change Default Code**
```python
# backend/app/config.py
VALID_PAYMENT_CODE = "YOUR_CUSTOM_CODE_2024"
```

**Option B: Use Environment Variable**
```bash
# Windows PowerShell
$env:PAYMENT_CODE="YOUR_CUSTOM_CODE_2024"

# Linux/Mac
export PAYMENT_CODE="YOUR_CUSTOM_CODE_2024"
```

**Option C: Add Multiple Codes**
```python
# backend/app/config.py
ADDITIONAL_PAYMENT_CODES = {
    "CUSTOMER_ABC": "CUSTCODE_ABC_2024",
    "CUSTOMER_XYZ": "CUSTCODE_XYZ_2024",
}
```

### Step 3: Test Payment System

**Test 1: Get Settings**
```bash
curl -X GET "http://127.0.0.1:8000/system-settings/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Test 2: Verify Code**
```bash
curl -X POST "http://127.0.0.1:8000/system-settings/verify-payment/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "BIOZONE2024"}'
```

**Test 3: Check Lock Status**
- Navigate to Settings in the web app
- If system locked: Card is RED, dialog appears
- If active: Card is GREEN, can edit settings

### Step 4: Distribute Payment Codes

**For each customer, provide:**
1. Payment code (default or custom)
2. Instructions: "Enter this code in Settings > System Status & Payment"
3. Support contact for code issues

## How It Works in Operation

### Day 1-58: Active
- System works normally
- GREEN card displayed
- Can edit all settings
- No prompts

### Day 59-60: Warning
- System still works
- Card shows "⚠️ Payment due in 1-7 days"
- Can still edit settings
- Warns to renew payment

### Day 61+: Locked
- RED card displayed
- Status: "🔒 LOCKED"
- Dialog appears automatically
- All fields disabled
- User must enter valid code to unlock

### After Code Entry:
- System unlocks for another 60 days
- Card turns GREEN
- All fields re-enabled
- `lastPaymentDate` updated to today

## Payment Codes Summary

| Code | License Type | Duration |
|------|-------------|----------|
| BIOZONE2024 | Standard | 60 days |
| DEMO2024 | Demo/Trial | 60 days |
| ENTERPRISE2024 | Enterprise | 60 days |
| STANDARD2024 | Standard Alt | 60 days |
| YOUR_CODE | Custom | 60 days |

## Files Modified/Created

```
backend/
├── app/
│   ├── main.py (UPDATED - Added 3 endpoints)
│   ├── models.py (UPDATED - Added SystemSettings model)
│   ├── schemas.py (UPDATED - Added SystemSettings schemas)
│   └── config.py (NEW - Payment configuration)
├── PAYMENT_SYSTEM_DOCS.md (NEW - Full documentation)
└── PAYMENT_SETUP_GUIDE.md (NEW - This file)

frontend/
└── src/components/settings/
    └── SystemSettings.jsx (ALREADY IMPLEMENTED)
```

## Verification Checklist

- [ ] Database table `system_settings` created
- [ ] Backend endpoints responding (test with curl)
- [ ] Payment code configured in `config.py`
- [ ] Frontend Settings page shows payment status
- [ ] Payment dialog appears when system locked
- [ ] Valid code unlocks system successfully
- [ ] Locked system disables all form fields
- [ ] Card colors change (RED/GREEN) appropriately

## Next Steps

1. ✅ Run `init_db.py` to create tables
2. ✅ Change payment code to your custom code
3. ✅ Test endpoints with Postman or curl
4. ✅ Verify frontend UI displays correctly
5. ✅ Generate payment codes for customers
6. ✅ Deploy to production

## Common Tasks

### Generate New Payment Code for Customer
```python
# In Python shell or backend script
from app.config import generate_payment_code

code = generate_payment_code("CUSTOMER_NAME")
print(code)  # Output: BIOZONE_CUSTOMER_NAME_20240129
```

### Manually Unlock System (Emergency)
```sql
-- Database query
UPDATE system_settings SET 
    lastPaymentDate = CURRENT_TIMESTAMP,
    paymentStatus = 'active'
WHERE id = 1;
```

### Check Payment Expiration Date
```python
from datetime import datetime, timedelta

last_payment = datetime.fromisoformat("2024-01-29")
subscription_end = last_payment + timedelta(days=60)
print(f"Payment expires: {subscription_end}")
```

## Support & Questions

- **Payment not working?** Check `app/config.py` code matches entered code
- **Frontend locked?** Verify backend is running and accessible
- **Database error?** Ensure `system_settings` table exists
- **Reset needed?** Delete record from `system_settings` table and let system auto-create default

---

**Setup Date:** January 29, 2024
**System Ready:** ✅ Yes
**Next Action:** Change payment code & distribute to customers
