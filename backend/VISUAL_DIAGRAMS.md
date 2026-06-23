# Payment System - Visual Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      SystemSettings.jsx                              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                      │  │
│  │  RED CARD ❌ LOCKED                                 │  │
│  │  ├─ Status: 🔒 LOCKED                              │  │
│  │  ├─ Days Until: 0                                   │  │
│  │  ├─ Payment Dialog: AUTO-OPEN                       │  │
│  │  └─ Form Fields: DISABLED                           │  │
│  │                                                      │  │
│  │  GREEN CARD ✅ ACTIVE                               │  │
│  │  ├─ Status: 🔓 ACTIVE                              │  │
│  │  ├─ Days Until: 45                                  │  │
│  │  ├─ Payment Dialog: CLOSED                          │  │
│  │  └─ Form Fields: ENABLED                            │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ▲                                          │
         │                                          ▼
         │                             ┌─────────────────────┐
         │                             │  HTTP Requests      │
         │                             ├─────────────────────┤
         │                             │ GET /system-settings│
         │                             │ POST /verify-payment│
         │                             │ PUT /system-settings│
         │                             └─────────────────────┘
         │                                          │
         └──────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               app/main.py                            │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                      │  │
│  │  GET /system-settings/                              │  │
│  │  ├─ Read SystemSettings from DB                     │  │
│  │  └─ Return: lastPaymentDate, paymentStatus, etc.   │  │
│  │                                                      │  │
│  │  POST /system-settings/verify-payment/              │  │
│  │  ├─ Receive: {code: "..."}                         │  │
│  │  ├─ Validate: is_valid_payment_code(code)          │  │
│  │  ├─ If valid:                                       │  │
│  │  │  ├─ Update lastPaymentDate = NOW               │  │
│  │  │  ├─ Update paymentStatus = "active"            │  │
│  │  │  └─ Return: {success: true}                    │  │
│  │  └─ If invalid:                                     │  │
│  │     └─ Return: {success: false}                    │  │
│  │                                                      │  │
│  │  PUT /system-settings/                              │  │
│  │  ├─ Check: Is system locked?                        │  │
│  │  ├─ Update fields                                   │  │
│  │  └─ Save to DB                                      │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                │
│                            ▼                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           app/config.py                              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                      │  │
│  │  VALID_PAYMENT_CODE = "BIOZONE2024"                │  │
│  │  ADDITIONAL_PAYMENT_CODES = {                       │  │
│  │    "DEMO": "DEMO2024",                             │  │
│  │    "ENTERPRISE": "ENTERPRISE2024"                  │  │
│  │  }                                                   │  │
│  │                                                      │  │
│  │  is_valid_payment_code(code)                        │  │
│  │  get_code_license_type(code)                        │  │
│  │  generate_payment_code(type)                        │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                │
│                            ▼                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         app/models.py (SQLAlchemy)                   │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                      │  │
│  │  class SystemSettings:                              │  │
│  │    ├─ id: Integer                                   │  │
│  │    ├─ labName: String                               │  │
│  │    ├─ turnaroundTime: String                        │  │
│  │    ├─ enableNotifications: Boolean                  │  │
│  │    ├─ maintenanceMode: Boolean                      │  │
│  │    ├─ defaultReportFormat: String                   │  │
│  │    ├─ dataRetentionDays: Integer                    │  │
│  │    ├─ lastPaymentDate: DateTime ◄── PAYMENT        │  │
│  │    ├─ paymentStatus: String ◄────── PAYMENT        │  │
│  │    └─ created_at, updated_at: DateTime              │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                │
│                            ▼                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         PostgreSQL/SQLite Database                   │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  ┌────────────────────────────────────────────┐     │  │
│  │  │ system_settings table                      │     │  │
│  │  ├────────────────────────────────────────────┤     │  │
│  │  │ id | labName | turnaroundTime | ... | last│     │  │
│  │  │    |         |                |     |PaymentD│   │  │
│  │  │ 1  | BIOZONE | 24             | ... | 2024│     │  │
│  │  │    | Lab     |                |     | -01-│     │  │
│  │  │    |         |                |     | -29 │     │  │
│  │  └────────────────────────────────────────────┘     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Payment Verification Flow

```
START: User Opens Settings
  │
  ├─► GET /system-settings/
  │    │
  │    └─► lastPaymentDate = "2024-01-29"
  │        today = "2024-03-30"
  │        daysElapsed = 60 days
  │        daysRemaining = 60 - 60 = 0
  │
  ├─► daysRemaining <= 0?
  │    │
  │    ├─► YES:
  │    │    ├─ Set systemLocked = true
  │    │    ├─ Card turns RED
  │    │    ├─ Status: "🔒 LOCKED"
  │    │    ├─ Disable all fields
  │    │    └─ Auto-open Dialog
  │    │         │
  │    │         ├─► User enters code
  │    │         └─► User clicks "Verify"
  │    │              │
  │    │              ├─► POST /system-settings/verify-payment/
  │    │              │    with {code: "BIOZONE2024"}
  │    │              │
  │    │              ├─► Backend validates code
  │    │              │    ├─ is_valid_payment_code("BIOZONE2024")
  │    │              │    └─ returns true
  │    │              │
  │    │              ├─ Update DB:
  │    │              │  ├─ lastPaymentDate = NOW
  │    │              │  └─ paymentStatus = "active"
  │    │              │
  │    │              ├─► Return {success: true}
  │    │              │
  │    │              ├─► Frontend:
  │    │              │   ├─ Set systemLocked = false
  │    │              │   ├─ Card turns GREEN
  │    │              │   ├─ Enable fields
  │    │              │   └─ Close dialog
  │    │              │
  │    │              └─ User can now edit settings
  │    │
  │    └─► NO (daysRemaining > 0):
  │         ├─ Set systemLocked = false
  │         ├─ Card turns GREEN
  │         ├─ Enable all fields
  │         ├─ Check if daysRemaining <= 7
  │         │  └─ If yes: show warning
  │         └─ User can edit settings
  │
  └─ END: Settings Page Ready

```

## Lock/Unlock Timeline

```
┌────────────────────────────────────────────────────────────┐
│                    60-DAY CYCLE                             │
└────────────────────────────────────────────────────────────┘

Day 0: Payment Verified
  │
  └─► lastPaymentDate = "2024-01-29"
      daysRemaining = 60
      Status: 🔓 ACTIVE (GREEN)
      
      User can:
      ✅ Edit settings
      ✅ Use system normally
      ✅ No prompts or warnings


Days 1-58: System Active
  │
  └─► daysRemaining = 60, 59, 58, ... 2
      Status: 🔓 ACTIVE (GREEN)
      
      User can:
      ✅ Edit settings
      ✅ Use system normally
      ✅ No prompts (optional: show countdown)


Days 59-60: Final Warnings
  │
  └─► daysRemaining = 1, 0
      Status: ⚠️ WARNING (YELLOW/ORANGE)
      
      User can:
      ✅ Still edit settings
      ✅ Still use system
      ⚠️ Shows warning: "Payment due in X days"


Day 61+: System Locked
  │
  └─► daysRemaining = -1, -2, -3, ...
      Status: 🔒 LOCKED (RED)
      
      User cannot:
      ❌ Edit settings
      ❌ Change configuration
      
      Dialog appears:
      "Verify Payment"
      └─► [Enter Code] [Submit]
      
      After valid code entry:
      └─► Reset to Day 0


CYCLE REPEATS
```

## Code Validation Logic

```
┌─────────────────────────────────────┐
│  Received Code: "BIOZONE2024"       │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ is_valid_payment_code(code)         │
└─────────────────────────────────────┘
           │
      ┌────┴────┐
      │          │
      ▼          ▼
  Check:     Check:
  VALID_     ADDITIONAL_
  PAYMENT_   PAYMENT_
  CODE       CODES
  │          │
  ├──────┬───┘
  │      │
  │   ┌──▼──┐
  │   │"DEMO"│
  │   └──┬──┘
  │      │
  │   ┌──▼──────────────┐
  │   │DEMO2024 == code?│
  │   └──┬──────────────┘
  │      │
  ▼      ▼
┌──────────────────────┐
│ Return: true/false   │
└──────────────────────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
 VALID   INVALID
   │       │
   ▼       ▼
 Unlock  Show
 System  Error
```

## File Organization

```
backend/
├── app/
│   ├── main.py
│   │   ├─ GET /system-settings/
│   │   ├─ PUT /system-settings/
│   │   └─ POST /system-settings/verify-payment/
│   │
│   ├── models.py
│   │   └─ class SystemSettings
│   │       ├─ labName
│   │       ├─ turnaroundTime
│   │       ├─ lastPaymentDate ◄─── PAYMENT
│   │       └─ paymentStatus ◄────── PAYMENT
│   │
│   ├── schemas.py
│   │   ├─ SystemSettingsBase
│   │   ├─ SystemSettingsOut
│   │   ├─ PaymentVerificationRequest
│   │   └─ PaymentVerificationResponse
│   │
│   ├── config.py
│   │   ├─ VALID_PAYMENT_CODE
│   │   ├─ ADDITIONAL_PAYMENT_CODES
│   │   ├─ is_valid_payment_code()
│   │   └─ get_code_license_type()
│   │
│   └── database.py
│       └─ SQLAlchemy session/engine
│
├── PAYMENT_SYSTEM_DOCS.md ◄────── FULL DOCS
├── PAYMENT_SETUP_GUIDE.md ◄────── SETUP
├── IMPLEMENTATION_SUMMARY.md ◄─── SUMMARY
└── QUICK_REFERENCE.md ◄────────── QUICK REF

frontend/
└── src/components/settings/
    └── SystemSettings.jsx
        ├─ GET /system-settings/
        ├─ POST /verify-payment/
        ├─ Red/Green status
        ├─ Locked/Active indicators
        └─ Payment dialog
```

## State Transitions

```
┌─────────────────┐
│  SYSTEM START   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  NO lastPaymentDate         │
│  paymentStatus = "inactive" │
│  ❌ LOCKED                  │
└────────┬────────────────────┘
         │
         │ User enters valid code
         ▼
┌─────────────────────────────┐
│  lastPaymentDate = NOW      │
│  paymentStatus = "active"   │
│  ✅ UNLOCKED                │
└────────┬────────────────────┘
         │
         │ 60 days pass
         ▼
┌─────────────────────────────┐
│  daysElapsed >= 60          │
│  ❌ LOCKED AGAIN            │
└────────┬────────────────────┘
         │
         │ User enters new code
         │ (back to UNLOCKED)
         ▼
       REPEAT...
```

---

**Visual Guide Created:** January 29, 2024
**All Systems Ready:** ✅ YES
