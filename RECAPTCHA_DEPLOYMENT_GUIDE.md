# Google reCAPTCHA v2 Integration - Complete Deployment Guide

## Overview
This guide covers the complete integration of Google reCAPTCHA v2 (checkbox) into your Skill Tracking Platform, including deployment to Render (backend) and Vercel (frontend).

---

## Table of Contents
1. [Setup reCAPTCHA Admin Console](#setup-recaptcha-admin-console)
2. [Local Development](#local-development)
3. [Deployment to Render & Vercel](#deployment-to-render--vercel)
4. [Testing](#testing)
5. [Debugging](#debugging)
6. [Security Best Practices](#security-best-practices)
7. [Common Issues & Solutions](#common-issues--solutions)

---

## Setup reCAPTCHA Admin Console

### Step 1: Create reCAPTCHA v2 (Checkbox) Keys
1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click **"✚ Create"** to register a new site
3. **Label**: "Skill Tracking Platform"
4. **reCAPTCHA type**: Select "reCAPTCHA v2" → "I'm not a robot" Checkbox
5. **Domains**: Add your domains:
   - `localhost`
   - `localhost:5173` (frontend dev port)
   - `skill-tracking-platform-t1n1.vercel.app` (Vercel frontend)
   - `skill-tracking-platform-1.onrender.com` (Render backend)
   - `your-custom-domain.com` (if applicable)

### Step 2: Copy Your Keys
After creating, you will see:
- **Site Key** (public, safe to expose)
- **Secret Key** (PRIVATE, keep secure!)

---

## Local Development

### Frontend Setup

1. **Create `.env` file** in `frontend/` directory:
```
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
VITE_API_BASE=http://localhost:8000/api
```

2. **Install dependency** (already in package.json):
```bash
npm install react-google-recaptcha
```

3. **Run dev server**:
```bash
npm run dev
```

### Backend Setup

1. **Create `.env` file** in `backend/` directory:
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/cert_tracker_db
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAB92rZEHblvgdRxKIZvUVLh5Ijwn
ALLOWED_HOSTS=localhost,127.0.0.1
FRONTEND_URL=http://localhost:5173
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Run migrations**:
```bash
python manage.py migrate
```

4. **Run dev server**:
```bash
python manage.py runserver
```

### Test Login/Register
- Frontend: http://localhost:5173/login
- The reCAPTCHA checkbox should appear
- Click it and you should see a token being sent to the backend
- Check browser DevTools (Network tab) to verify the `recaptcha_token` is being sent

---

## Deployment to Render & Vercel

### Backend (Render) Deployment

#### 1. Set Environment Variables on Render

Go to your Render service → **Environment**:

```
DEBUG=False
SECRET_KEY=<your-django-secret-key>
DATABASE_URL=<your-postgresql-url>
RECAPTCHA_SECRET_KEY=<your-actual-secret-key>
ALLOWED_HOSTS=skill-tracking-platform-1.onrender.com,.onrender.com
FRONTEND_URL=https://skill-tracking-platform-t1n1.vercel.app
CORS_ALLOWED_ORIGINS=https://skill-tracking-platform-t1n1.vercel.app
EMAIL_HOST_USER=<your-email@gmail.com>
EMAIL_HOST_PASSWORD=<your-app-password>
```

#### 2. Update Django Settings (Already Done)
Your `backend/settings.py` now includes:
```python
RECAPTCHA_SECRET_KEY = os.environ.get('RECAPTCHA_SECRET_KEY', '')
RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'
```

#### 3. Deploy
```bash
git add .
git commit -m "Add Google reCAPTCHA v2 integration"
git push
# Render auto-deploys on push
```

### Frontend (Vercel) Deployment

#### 1. Set Environment Variables on Vercel

Go to Vercel project → **Settings** → **Environment Variables**:

```
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
VITE_API_BASE=https://skill-tracking-platform-1.onrender.com/api
```

#### 2. Redeploy
```bash
git add .
git commit -m "Update reCAPTCHA integration"
git push
# Vercel auto-deploys
```

---

## Testing

### Test Locally
1. Navigate to Login/Register page
2. reCAPTCHA checkbox should appear
3. Click the checkbox and complete verification
4. Submit the form
5. Check Network tab: POST request should include `recaptcha_token`

### Test in Production
1. Go to https://skill-tracking-platform-t1n1.vercel.app/login
2. reCAPTCHA should appear
3. Complete verification and submit
4. Monitor backend logs on Render for verification requests

---

## Debugging

### Browser DevTools (Network Tab)

When submitting login/register:

**Request Payload** should show:
```json
{
  "username": "testuser",
  "password": "password123",
  "recaptcha_token": "03AOLTBLSz...[long token]"
}
```

**Response** should be:
```json
{
  "token": "abc123xyz...",
  "user": {
    "id": 1,
    "username": "testuser",
    "role": "student"
  }
}
```

### Backend Logs (Render)

Check Render logs in your service dashboard:

**Success logs:**
```
POST /api/auth/login/ - reCAPTCHA verification successful
```

**Error logs:**
```
POST /api/auth/login/ - reCAPTCHA verification failed: invalid-input-response
```

### Common Debug Scenarios

**Scenario 1: "Invalid domain for site key"**
- **Cause**: Domain not added in reCAPTCHA Admin Console
- **Fix**: 
  1. Go to Google reCAPTCHA Admin Console
  2. Edit your site
  3. Add the exact domain (e.g., `skill-tracking-platform-t1n1.vercel.app`)
  4. Wait 1-2 minutes for propagation

**Scenario 2: "reCAPTCHA verification failed: missing-input-secret"**
- **Cause**: `RECAPTCHA_SECRET_KEY` not set on Render
- **Fix**: 
  1. Go to Render → Environment Variables
  2. Verify `RECAPTCHA_SECRET_KEY` is set correctly
  3. Redeploy

**Scenario 3: Backend throws 400 with "recaptcha_token: reCAPTCHA verification failed"**
- **Cause**: Token invalid or expired (>2 minutes old)
- **Fix**: 
  1. Token only valid for 2 minutes
  2. User must complete CAPTCHA and submit immediately
  3. Add error message: "reCAPTCHA verification expired, please try again"

---

## Security Best Practices

### 1. Protect Secret Key
✅ **DO:**
- Store in environment variables
- Never commit to version control
- Use different keys for dev/production

❌ **DON'T:**
- Hardcode in source files
- Commit `.env` files
- Share via Slack/email

### 2. Client-Side Token Handling
✅ **DO:**
- Extract token immediately after user completes CAPTCHA
- Send with login/register request
- Reset token on form failure

❌ **DON'T:**
- Store token in localStorage
- Reuse tokens across requests
- Store for multiple transactions

### 3. Server-Side Verification
✅ **DO:**
- Always verify on the backend
- Check `success` field in response
- Log verification attempts (optional but recommended)

❌ **DON'T:**
- Trust frontend validation
- Skip Google verification
- Accept invalid tokens

### 4. Rate Limiting (Optional but Recommended)
Add rate limiting to prevent brute force attempts:

```python
# In Django settings
RATELIMIT_ENABLE = True
LOGIN_ATTEMPT_LIMIT = 5  # Max 5 attempts per 15 minutes
```

---

## API Response Examples

### Successful Registration
**Request:**
```bash
POST https://skill-tracking-platform-1.onrender.com/api/auth/register/
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student",
  "recaptcha_token": "03AOLTBLSz..."
}
```

**Response (201 Created):**
```json
{
  "message": "Registration successful!",
  "token": "abc123token...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "student",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Failed reCAPTCHA Verification
**Response (400 Bad Request):**
```json
{
  "recaptcha_token": "reCAPTCHA verification failed. Please try again."
}
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| reCAPTCHA box not showing | Site key missing/wrong | Check `VITE_RECAPTCHA_SITE_KEY` in `.env` |
| "Invalid domain" error | Domain not registered | Add domain to reCAPTCHA Admin Console |
| Backend verification fails | Secret key missing/wrong | Check `RECAPTCHA_SECRET_KEY` on Render |
| Token expires before submit | User takes too long | Add timeout warning after 100 seconds |
| CORS errors | Frontend/Backend domain mismatch | Check `CORS_ALLOWED_ORIGINS` in Django |
| 502 Bad Gateway on login | Request to Google times out | Check backend network logs, retry |

---

## Verification Flow Diagram

```
Frontend                          Backend                      Google
   |                               |                             |
   |--- Complete CAPTCHA -------->|                             |
   |<-- Get Token ------------------|                             |
   |                               |                             |
   |--- Send Token + Creds ------->|                             |
   |                               |--- POST to /siteverify --->|
   |                               |<-- Success/Failure --------|
   |                               |                             |
   |<-- Auth Token (if valid) -----|                             |
```

---

## File Changes Summary

### Backend
- `backend/settings.py`: Added reCAPTCHA configuration
- `accounts/recaptcha.py`: New module for verification
- `accounts/views.py`: Updated RegisterView & LoginView
- `accounts/urls.py`: Removed old captcha endpoint
- `requirements.txt`: Added `requests` library

### Frontend
- `src/pages/RegisterPage.jsx`: Updated to use token-based approach
- `src/pages/LoginPage.jsx`: Already using token-based approach
- `src/components/CaptchaWidget.jsx`: Already configured for reCAPTCHA v2

---

## Next Steps

1. ✅ Add reCAPTCHA keys to reCAPTCHA Admin Console
2. ✅ Configure environment variables locally
3. ✅ Test login/register locally
4. ✅ Deploy to Render (backend) with environment variables
5. ✅ Deploy to Vercel (frontend) with environment variables
6. ✅ Test in production
7. ✅ Monitor logs for errors
8. (Optional) Add rate limiting for additional security
9. (Optional) Add analytics to monitor captcha success rate

---

## Support

For issues not covered here:
- Check Google reCAPTCHA documentation: https://developers.google.com/recaptcha/docs/v2
- Review Django REST Framework docs: https://www.django-rest-framework.org/
- React reCAPTCHA docs: https://github.com/google-recaptcha/react-google-recaptcha
