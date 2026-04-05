# reCAPTCHA Integration - Visual Guides & Diagrams

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SKILL TRACKING PLATFORM                              │
├──────────────────────────────┬──────────────────────────────────────────┤
│                              │                                          │
│   FRONTEND (Vercel)          │       BACKEND (Render)                  │
│   https://...vercel.app      │       https://...onrender.com           │
│                              │                                          │
│  ┌──────────────────────┐   │   ┌────────────────────────────────┐    │
│  │  React App           │   │   │  Django REST API               │    │
│  │                      │   │   │                                │    │
│  │  ├─ Login Page       │   │   │  ├─ /api/auth/login/         │    │
│  │  ├─ Register Page    │   │   │  ├─ /api/auth/register/      │    │
│  │  └─ CaptchaWidget    │   │   │  ├─ /api/auth/profile/       │    │
│  │                      │   │   │  └─ /api/certificates/       │    │
│  │  VITE_RECAPTCHA_     │   │   │                                │    │
│  │  SITE_KEY            │   │   │  RECAPTCHA_SECRET_KEY         │    │
│  │  (Public)            │   │   │  (Private)                     │    │
│  └──────────────────────┘   │   └────────────────────────────────┘    │
│           │                 │                   │                      │
│           │                 │                   ▼                      │
│           │                 │        ┌──────────────────────┐         │
│           │                 │        │ recaptcha.py         │         │
│           │                 │        │                      │         │
│           │                 │        │ verify_recaptcha()   │         │
│           │                 │        └──────────────────────┘         │
│           │                 │                   │                      │
└───────────┼─────────────────┼───────────────────┼──────────────────────┘
            │                 │                   │
            │                 │                   ▼
            │                 │        ┌──────────────────────────┐
            │                 │        │ Google reCAPTCHA API     │
            │                 │        │ siteverify endpoint      │
            │ (Token)         │ (Token + Secret)                  │
            ├────────────────►│─────────────────►│                │
            │                 │                   │ Verify Token   │
            │                 │                   │ Check Domain   │
            │                 │                   │ Check Score    │
            │                 │◄─────────────────┤                │
            │                 │ Success/Failure   │                │
            │                 │                   └──────────────────────┘
            │                 │
            ▼                 ▼
    ┌────────────────────┐   ┌────────────────────────┐
    │ User authenticated │   │ Login session starts   │
    │ Redirected to      │   │ Auth token returned    │
    │ Dashboard          │   │ User data sent         │
    └────────────────────┘   └────────────────────────┘
```

---

## Request/Response Flow

### Success Flow

```
User lands on Login page
│
├─► FRONTEND loads reCAPTCHA widget using SITE_KEY
│
├─► User enters credentials
│
├─► User clicks "I'm not a robot"
│
├─► User completes reCAPTCHA challenge (puzzle/image)
│
├─► reCAPTCHA generates TOKEN (valid 2 minutes)
│
├─► User clicks "Login" button
│
├─► FRONTEND sends POST request:
│   {
│     "username": "john_doe",
│     "password": "pass123",
│     "recaptcha_token": "03AOLTBLSz2QRhp8..."
│   }
│
├─► BACKEND receives request
│
├─► BACKEND extracts token and user IP
│
├─► BACKEND calls verify_recaptcha(token, ip)
│
├─► verify_recaptcha() makes HTTPS call to Google:
│   POST https://www.google.com/recaptcha/api/siteverify
│   With: secret=SECRET_KEY, response=TOKEN, remoteip=IP
│
├─► Google API validates:
│   ✓ Is the token real?
│   ✓ Hasn't it been used before?
│   ✓ Is it within 2-minute window?
│   ✓ Is it for the correct domain?
│
├─► Google responds: { "success": true, "score": 0.85, ... }
│
├─► BACKEND receives success response
│
├─► BACKEND proceeds with normal login flow:
│   - Check username/password
│   - Create/retrieve auth token
│   - Return user data
│
├─► FRONTEND receives response with auth token
│
├─► FRONTEND stores auth token in localStorage
│
├─► FRONTEND redirects to dashboard
│
└─► User is logged in! ✅
```

---

### Failure Flow (Bad reCAPTCHA)

```
User enters credentials
│
├─► User skips reCAPTCHA or doesn't complete it
│
├─► User clicks "Login" anyway
│
├─► FRONTEND detects missing token:
│   if (!captchaRef.current) {
│     showError('Please complete reCAPTCHA');
│     return; ◄─┐ Form submission blocked
│   }           │ Client-side validation ✓

    OR

├─► reCAPTCHA widget fails to load
│
├─► User doesn't realize and clicks Login
│
├─► FRONTEND sends request with empty token: ""
│
├─► BACKEND receives request with empty token
│
├─► BACKEND calls verify_recaptcha("")
│
├─► verify_recaptcha() returns { "success": false, ... }
│
├─► BACKEND returns 400 Bad Request:
│   {
│     "recaptcha_token": "reCAPTCHA verification failed. Please try again."
│   }
│
├─► FRONTEND displays error message
│
├─► reCAPTCHA widget is reset (user tries again)
│
└─► User completes reCAPTCHA and tries again ✓
```

---

## Environment Variables Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│          GOOGLE reCAPTCHA ADMIN CONSOLE                          │
│          https://www.google.com/recaptcha/admin                  │
│                                                                  │
│  Site: "Skill Tracking Platform"                               │
│  Type: reCAPTCHA v2 (Checkbox)                                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Site Key (Public)  ────────────┐                         │   │
│  │                                 │                         │   │
│  │ Secret Key (Private) ─────┐     │                         │   │
│  │                           │     │                         │   │
│  │ Domains:                  │     │                         │   │
│  │  - localhost              │     │                         │   │
│  │  - localhost:5173         │     │                         │   │
│  │  - *.vercel.app           │     │                         │   │
│  │  - *.onrender.com         │     │                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │     │                                │
└───────────────────────────┼─────┼────────────────────────────────┘
                            │     │
                      ┌─────┘     └─────┐
                      │                 │
          ┌───────────▼──────┐  ┌──────▼───────────┐
          │  FRONTEND        │  │  BACKEND        │
          │  (Vercel)        │  │  (Render)       │
          │                  │  │                 │
          │ .env file:       │  │ Environment:    │
          │ VITE_RECAPTCHA_  │  │ RECAPTCHA_      │
          │ SITE_KEY=        │  │ SECRET_KEY=     │
          │ [paste public]   │  │ [paste private] │
          └──────────────────┘  └─────────────────┘
```

---

## Token Lifecycle

```
Timeline: 0 minutes ──────────────────► 2 minutes ──────► After 2 minutes

User clicks           Token           User can still      Token is
"I'm not a robot"   GENERATED       submit form          EXPIRED
       │                │               │                   │
       │◄───────────────►│               │                   │
       │   Challenge     │               │                   │
       │   Puzzle        │               │                   │
       │                 │   User fills    Submission too    Cannot
       │◄─────────────────│   form          late = FAILS    reuse
       │  Token Ready    │                │                  token
       │                 │                │
       │                 │[Valid]        [Invalid]
       │                 │                │
       ├─────────────────────────────────┤
       │        ◄─── 120 seconds ────►   │
       │                                 │
       │ Can submit form anytime         │
       │ within this window              │
       │                                 │
       └─────────────────────────────────► [Token Expired]
                                         Cannot submit
                                         User must re-verify
```

---

## Error Handling Decision Tree

```
                    reCAPTCHA Verification
                            │
                ┌───────────┬┴────────────┬──────────┐
                │           │            │          │
            Success?    Issue?      Corruption?   Network Error?
                │           │            │          │
                ▼           ▼            ▼          ▼
              YES          NO           NO         YES
                │           │            │          │
                ├─►Continue  ├─► Token    ├─►Invalid├─►Timeout
                │  Login     │   Issue    │ Token   │  Retry
                │            │           │         │  Later
                │            ├─►Expired  │         │
                │            │ (>2 min)  │         └─►Show Error
                │            │           │             Wait 5sec
                │            ├─►Reused   │
                │            │           │
                │            ├─►Bad      │
                │            │ Domain    │
                │            │           │
                │            ├─►Invalid  │
                │            │ Secret    │
                │            │           │
                │            └─►Bad IP/  │
                │              Domain    │
                │                        │
                ▼                        ▼
            Return Auth         Return 400
            Token & User        Error to User
                                Reset Captcha
                                Ask Retry
```

---

## Code Structure

### Backend Structure
```
backend/
├── accounts/
│   ├── views.py                  ← Updated (uses verify_recaptcha)
│   ├── urls.py                   ← Updated (removed captcha endpoint)
│   ├── recaptcha.py             ← NEW (verification logic)
│   ├── captcha.py               ← OLD (can be removed if not needed)
│   └── ...
├── backend/
│   └── settings.py               ← Updated (added RECAPTCHA config)
├── requirements.txt              ← Updated (added requests)
└── ...
```

### Frontend Structure
```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx         ← Already using token
│   │   ├── RegisterPage.jsx      ← Updated (now using token)
│   │   └── ...
│   ├── components/
│   │   └── CaptchaWidget.jsx     ← Already configured for reCAPTCHA
│   ├── services/
│   │   └── api.js                ← Already correct
│   └── ...
├── .env                          ← ADD: VITE_RECAPTCHA_SITE_KEY
└── ...
```

---

## Security Layers

```
Layer 1: Frontend
┌─────────────────────────────────────────┐
│ - reCAPTCHA checkbox visible            │
│ - User must interact and prove human    │
│ - Token generated after completion      │
│ - Token included in request             │
│ - Invalid token prevents submission     │
└─────────────────────────────────────────┘
              │
              ▼
Layer 2: HTTPS/TLS
┌─────────────────────────────────────────┐
│ - All traffic encrypted                 │
│ - Token protected in transit            │
│ - Secret key never sent over HTTP       │
│ - Domain verified via SSL certificate   │
└─────────────────────────────────────────┘
              │
              ▼
Layer 3: Backend Verification
┌─────────────────────────────────────────┐
│ - Secret key kept private               │
│ - Token verified with Google API        │
│ - Token checked for expiration          │
│ - Token checked for reuse               │
│ - Domain validation                     │
│ - User IP address logged                │
└─────────────────────────────────────────┘
              │
              ▼
Layer 4: Google Verification
┌─────────────────────────────────────────┐
│ - Token validated                       │
│ - Domain verified                       │
│ - Challenge authenticity checked        │
│ - Behavior analysis (optional)          │
│ - Risk assessment score provided        │
│ - Anti-bot protection                   │
└─────────────────────────────────────────┘
```

---

## Deployment Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│ DEVELOPMENT                                                  │
│                                                              │
│ Local machine (.env files)                                   │
│   └─► npm run dev (frontend)                                 │
│   └─► python manage.py runserver (backend)                  │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│ VERSION CONTROL (Git)                                        │
│                                                              │
│ git add . && git commit -m "Add reCAPTCHA" && git push      │
└──────────────────┬───────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│ VERCEL           │  │ RENDER           │
│ (Frontend)       │  │ (Backend)        │
│                  │  │                  │
│ Auto-deploy:     │  │ Auto-deploy:     │
│ - Detect push    │  │ - Detect push    │
│ - npm install    │  │ - pip install    │
│ - npm build      │  │ - migrations     │
│ - Deploy dist/   │  │ - gunicorn start │
│                  │  │                  │
│ Set Env Vars:    │  │ Set Env Vars:    │
│ VITE_RECAPTCHA_  │  │ RECAPTCHA_       │
│ SITE_KEY         │  │ SECRET_KEY       │
│ VITE_API_BASE    │  │ FRONTEND_URL     │
└──────────────────┘  └──────────────────┘
        │                     │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  PRODUCTION TEST    │
        │                     │
        │ 1. Login page loads │
        │ 2. reCAPTCHA widget │
        │ 3. Complete captcha │
        │ 4. Login succeeds   │
        │ 5. Check logs       │
        └─────────────────────┘
```

---

## Testing Matrix

| Scenario | Frontend | Backend | Google | Expected |
|----------|----------|---------|--------|----------|
| Valid token, valid creds | ✓ | ✓ | ✓ | Login OK |
| Empty token, valid creds | ✗ | - | - | Blocked at FE |
| Expired token, valid creds | ✓ | ✓ | ✗ | 400 Error |
| Valid token, invalid creds | ✓ | ✓ | ✓ | Invalid creds error |
| Valid token, wrong domain | ✓ | ✓ | ✗ | Domain error |
| No reCAPTCHA load | - | - | - | FE error |
| Network timeout to Google | ✓ | ? | ✗ | 502 Error |
| Wrong secret key | ✓ | ✓ | ✗ | Verification failed |

---

## Configuration Checklist Visual

```
BEFORE DEPLOYMENT:

Google reCAPTCHA
    ├─ [ ] Create site account
    ├─ [ ] Get Site Key
    ├─ [ ] Get Secret Key
    └─ [ ] Register domains:
         ├─ [ ] localhost
         ├─ [ ] localhost:5173
         ├─ [ ] vercel-frontend-domain
         └─ [ ] render-backend-domain

Frontend Setup
    ├─ [ ] .env: VITE_RECAPTCHA_SITE_KEY
    ├─ [ ] .env: VITE_API_BASE
    └─ [ ] npm install (react-google-recaptcha)

Backend Setup
    ├─ [ ] .env: RECAPTCHA_SECRET_KEY
    ├─ [ ] pip install requests
    ├─ [ ] Update settings.py
    ├─ [ ] Update views.py
    └─ [ ] Test locally

Render Deployment
    ├─ [ ] Set RECAPTCHA_SECRET_KEY
    ├─ [ ] Set FRONTEND_URL
    └─ [ ] Redeploy

Vercel Deployment
    ├─ [ ] Set VITE_RECAPTCHA_SITE_KEY
    ├─ [ ] Set VITE_API_BASE
    └─ [ ] Redeploy

Production Testing
    ├─ [ ] Visit login page
    ├─ [ ] reCAPTCHA loads
    ├─ [ ] Complete verification
    ├─ [ ] Submit form
    └─ [ ] Login works
```

---

Last Updated: April 2026
