# Payment Verification System Documentation

## Overview
The BIOZONE Lab System includes a comprehensive payment verification system that:
- Locks the system every 60 days (2 months)
- Requires valid payment codes to unlock
- Displays payment status and countdown timers
- Prevents access to settings modifications when locked

## How It Works

### Frontend Flow (SystemSettings.jsx)
1. User navigates to Settings
2. System checks `lastPaymentDate` from backend
3. If no payment date OR more than 60 days elapsed:
   - Card background turns RED (#ffebee)
   - Status shows "🔒 LOCKED"
   - All form fields become disabled
   - Payment dialog appears automatically
4. User enters payment code
5. Frontend sends POST to `/system-settings/verify-payment/`
6. On success, system unlocks for another 60 days

### Backend Flow (main.py)
1. **GET `/system-settings/`** - Retrieves current settings including lastPaymentDate
2. **POST `/system-settings/verify-payment/`** - Validates code and updates payment status
3. **PUT `/system-settings/`** - Updates settings (only works when not locked)

## Valid Payment Codes

Default codes configured in `app/config.py`:

```
BIOZONE2024      - Standard license
DEMO2024         - Demo/Trial license
ENTERPRISE2024   - Enterprise license
STANDARD2024     - Standard license variant
```

## Changing Payment Codes

### Method 1: Update app/config.py
Edit the `VALID_PAYMENT_CODE` variable:

```python
# Default code - change this to your actual code
VALID_PAYMENT_CODE = "YOUR_NEW_CODE_HERE"
```

### Method 2: Add Additional Codes
Add codes to `ADDITIONAL_PAYMENT_CODES` dictionary:

```python
ADDITIONAL_PAYMENT_CODES = {
    "CUSTOMER_NAME": "CUSTOM_CODE_2024",
    "ANOTHER_CLIENT": "ANOTHER_CODE_2024",
}
```

### Method 3: Use Environment Variables
Set the code via environment variable (highest priority):

```bash
# Windows PowerShell
$env:PAYMENT_CODE="YOUR_NEW_CODE"

# Linux/Mac
export PAYMENT_CODE="YOUR_NEW_CODE"

# Docker
docker run -e PAYMENT_CODE="YOUR_NEW_CODE" ...
```

## API Endpoints

### 1. GET /system-settings/
**Purpose:** Fetch current system settings and payment status

**Request:**
```bash
GET http://127.0.0.1:8000/system-settings/
Header: Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": 1,
  "labName": "BIOZONE Lab",
  "turnaroundTime": "24",
  "enableNotifications": true,
  "maintenanceMode": false,
  "defaultReportFormat": "PDF",
  "dataRetentionDays": 365,
  "lastPaymentDate": "2024-01-29T10:30:00",
  "paymentStatus": "active",
  "created_at": "2024-01-29T10:00:00",
  "updated_at": "2024-01-29T10:30:00"
}
```

### 2. PUT /system-settings/
**Purpose:** Update system configuration

**Request:**
```bash
PUT http://127.0.0.1:8000/system-settings/
Header: Authorization: Bearer {token}
Content-Type: application/json

{
  "labName": "My Lab Name",
  "turnaroundTime": "48",
  "enableNotifications": false
}
```

**Response:** Updated settings object (same as GET)

### 3. POST /system-settings/verify-payment/
**Purpose:** Verify payment code and unlock system

**Request:**
```bash
POST http://127.0.0.1:8000/system-settings/verify-payment/
Header: Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "BIOZONE2024"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment verified successfully! System unlocked for 60 days. (STANDARD)",
  "lastPaymentDate": "2024-01-29T10:30:00"
}
```

**Failure Response (200 - still 200, check success field):**
```json
{
  "success": false,
  "message": "Invalid payment verification code. Please contact your administrator.",
  "lastPaymentDate": null
}
```

## Payment Cycle Logic

### Calculation:
- Last payment date: 2024-01-29
- Subscription period: 60 days
- Payment expires: 2024-03-29
- Days remaining: 60 - (today - lastPaymentDate)

### Status Triggers:
- **Unlocked & Active:** Days remaining > 7
- **Warning:** Days remaining between 1-7
- **Locked:** Days remaining ≤ 0

## Database Schema

### SystemSettings Table:
```sql
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY,
    labName VARCHAR DEFAULT 'BIOZONE Lab',
    turnaroundTime VARCHAR DEFAULT '24',
    enableNotifications BOOLEAN DEFAULT true,
    maintenanceMode BOOLEAN DEFAULT false,
    defaultReportFormat VARCHAR DEFAULT 'PDF',
    dataRetentionDays INTEGER DEFAULT 365,
    lastPaymentDate DATETIME,
    paymentStatus VARCHAR DEFAULT 'inactive',
    verificationCode VARCHAR,
    created_at DATETIME,
    updated_at DATETIME
);
```

## Testing the System

### Test 1: Verify Payment Code
```bash
curl -X POST http://127.0.0.1:8000/system-settings/verify-payment/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "BIOZONE2024"}'
```

### Test 2: Check Status
```bash
curl -X GET http://127.0.0.1:8000/system-settings/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Lock System (Set past date)
```python
# In database directly or via API
UPDATE system_settings SET lastPaymentDate = '2023-11-01';
```

## Frontend Integration

### How SystemSettings.jsx Communicates:
1. On mount, calls `GET /system-settings/`
2. Calculates `daysUntilPayment = 60 - daysElapsed`
3. Locks if `daysUntilPayment <= 0`
4. Shows warning if `daysUntilPayment <= 7`
5. Disables all fields when locked
6. Shows dialog for code entry
7. Sends code to `POST /system-settings/verify-payment/`
8. On success, updates `lastPaymentDate` to now

### Color Indicators:
- 🔓 **GREEN (#e8f5e9):** Active & Payment Current
- 🔒 **RED (#ffebee):** Locked & Payment Overdue

## Security Considerations

⚠️ **IMPORTANT:**
- Change default codes in production
- Use environment variables for sensitive codes
- Add rate limiting to payment verification endpoint
- Log all payment verification attempts
- Consider HMAC or JWT signing for codes
- Use HTTPS in production

### Recommended Production Setup:
```python
# In app/config.py
import hashlib
import hmac

PAYMENT_SECRET = os.getenv("PAYMENT_SECRET")

def verify_code_with_hmac(code: str, secret: str) -> bool:
    """Verify payment code using HMAC"""
    expected = hmac.new(
        secret.encode(),
        code.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(code, expected)
```

## Troubleshooting

### System Always Locked:
- Check `lastPaymentDate` in database (should be recent)
- Verify code is correct
- Check logs for validation errors
- Ensure system time is correct

### "Invalid Payment Code" Error:
- Verify code matches exactly (case-sensitive)
- Check VALID_PAYMENT_CODE in config.py
- Check environment variables override
- Test code with test endpoint

### Database Issues:
- Ensure SystemSettings table exists (run migrations)
- Check database connection permissions
- Verify timezone handling for datetime fields

## Support

For payment code generation or verification issues:
1. Check `app/config.py` for current codes
2. Review backend logs for validation errors
3. Test endpoint directly with curl/Postman
4. Verify database has SystemSettings record

---

**Generated:** January 29, 2024
**System Version:** 1.0.0
**Last Updated:** January 29, 2024
