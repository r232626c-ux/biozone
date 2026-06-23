# Payment System - Quick Reference

## How Verification Works

### The Flow
1. **System checks payment** → GET `/system-settings/`
2. **More than 60 days?** → System LOCKS (RED card)
3. **User enters code** → POST `/system-settings/verify-payment/`
4. **Code valid?** → System UNLOCKS (GREEN card) for 60 days

### Valid Codes
```
BIOZONE2024       (default)
DEMO2024          (demo/trial)
ENTERPRISE2024    (enterprise)
STANDARD2024      (standard)
YOUR_CUSTOM_CODE  (if configured)
```

## Backend Files

### Model (Database)
**File:** `backend/app/models.py`
```python
class SystemSettings:
    lastPaymentDate  # When code was last verified
    paymentStatus    # 'active' or 'inactive'
```

### Endpoints
**File:** `backend/app/main.py`
```
GET    /system-settings/                 → Get config + payment status
PUT    /system-settings/                 → Update config
POST   /system-settings/verify-payment/  → Verify code + unlock
```

### Configuration
**File:** `backend/app/config.py`
```python
VALID_PAYMENT_CODE = "BIOZONE2024"  # ← Change this!
```

### Schemas
**File:** `backend/app/schemas.py`
```python
SystemSettingsOut           # Response from GET
PaymentVerificationRequest  # {code: "..."}
PaymentVerificationResponse # {success: true/false}
```

## Frontend Files

**File:** `frontend/src/components/settings/SystemSettings.jsx`
- Already implements complete UI
- RED card = Locked
- GREEN card = Active
- Calls backend endpoints
- Shows payment countdown

## Quick Setup

1. **Initialize Database**
   ```bash
   python init_db.py
   ```

2. **Change Payment Code**
   ```python
   # backend/app/config.py
   VALID_PAYMENT_CODE = "YOUR_CODE"
   ```

3. **Test Endpoint**
   ```bash
   curl -X POST http://127.0.0.1:8000/system-settings/verify-payment/ \
     -H "Authorization: Bearer TOKEN" \
     -d '{"code":"BIOZONE2024"}'
   ```

4. **Check Status**
   - Go to Settings in web app
   - Should show payment status with countdown

## Common Codes

| Scenario | Code to Use |
|----------|------------|
| Testing | BIOZONE2024 |
| Demo Customer | DEMO2024 |
| Real Customer | CREATE_YOUR_OWN |
| Enterprise | ENTERPRISE2024 |

## Payment Math

```
Last Payment: Jan 29, 2024
Days Elapsed: 60+
Days Remaining: 0 or less
Status: LOCKED ❌

User Enters Code → System Unlocked ✅
New Payment Date: Jan 29, 2024
New Due Date: Mar 29, 2024 (60 days later)
```

## What Each Part Does

| Component | Purpose | Location |
|-----------|---------|----------|
| SystemSettings Model | Store payment data | models.py |
| GET Endpoint | Check status | main.py |
| POST Endpoint | Verify code | main.py |
| PUT Endpoint | Update settings | main.py |
| Config | Manage codes | config.py |
| Frontend UI | Show status | SystemSettings.jsx |

## Response Examples

### GET Success
```json
{
  "lastPaymentDate": "2024-01-29T10:30:00",
  "paymentStatus": "active",
  "labName": "BIOZONE Lab"
}
```

### POST Success (Code Valid)
```json
{
  "success": true,
  "message": "Payment verified! System unlocked for 60 days."
}
```

### POST Failure (Code Invalid)
```json
{
  "success": false,
  "message": "Invalid payment verification code."
}
```

## Lock/Unlock Logic

```
Days Since Payment:
  0-58   → UNLOCKED ✅ (green)
  59-60  → WARNING ⚠️  (still green, shows countdown)
  61+    → LOCKED ❌   (red, dialogs shows)
```

## To Change Code

### Quick (app/config.py)
```python
VALID_PAYMENT_CODE = "NEW_CODE_2024"
```

### Flexible (Environment)
```bash
export PAYMENT_CODE="NEW_CODE_2024"
python -m uvicorn app.main:app
```

### Multiple Codes
```python
ADDITIONAL_PAYMENT_CODES = {
    "COMPANY_A": "CODEA",
    "COMPANY_B": "CODEB",
}
```

## Testing Commands

**Test if Payment Works**
```bash
curl -X POST http://127.0.0.1:8000/system-settings/verify-payment/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"BIOZONE2024"}'
```

**Check Current Status**
```bash
curl -X GET http://127.0.0.1:8000/system-settings/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Lock System (Testing)
```sql
-- Set old date to trigger lock
UPDATE system_settings 
SET lastPaymentDate = '2023-11-01'
WHERE id = 1;
```

## Unlock System (Testing)
```sql
-- Set to current date
UPDATE system_settings 
SET lastPaymentDate = CURRENT_TIMESTAMP
WHERE id = 1;
```

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| System always locked | Check lastPaymentDate in DB |
| Code rejected | Verify it matches config.py exactly |
| Endpoint not found | Restart backend server |
| No payment dialog | Check Authorization header |
| Can't edit settings | System is locked - enter code |

## Key Files to Know

1. **Payment Config:** `backend/app/config.py`
2. **Database Model:** `backend/app/models.py` 
3. **Endpoints:** `backend/app/main.py` (search "verify-payment")
4. **Frontend:** `frontend/src/components/settings/SystemSettings.jsx`
5. **Docs:** `backend/PAYMENT_SYSTEM_DOCS.md`

## Support Contacts

- **Code not working?** Check config.py
- **Endpoint errors?** Check backend logs
- **Frontend not showing?** Refresh browser cache
- **Database issues?** Run init_db.py again

---

**Last Updated:** January 29, 2024
**Status:** Ready to Deploy ✅
