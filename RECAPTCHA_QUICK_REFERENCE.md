# reCAPTCHA Integration - Quick Reference Checklist

## Pre-Deployment Checklist

### reCAPTCHA Setup
- [ ] Visit [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [ ] Create new site with type: "reCAPTCHA v2 (Checkbox)"
- [ ] Add these domains:
  - [ ] `localhost`
  - [ ] `localhost:5173`
  - [ ] `your-vercel-domain.vercel.app`
  - [ ] `your-render-domain.onrender.com`
- [ ] Copy **Site Key** (public)
- [ ] Copy **Secret Key** (keep private!)

### Local Development
- [ ] Create `backend/.env` with `RECAPTCHA_SECRET_KEY=your-key`
- [ ] Create `frontend/.env` with `VITE_RECAPTCHA_SITE_KEY=your-key`
- [ ] Run `pip install -r requirements.txt` (includes new `requests` library)
- [ ] Run `npm install` in frontend (already has `react-google-recaptcha`)
- [ ] Test login/register locally

### Backend (Render)
- [ ] Go to Render Dashboard → Your Backend Service
- [ ] Environment Variables → Add:
  ```
  RECAPTCHA_SECRET_KEY=<paste-your-secret-key>
  FRONTEND_URL=https://your-vercel-domain.vercel.app
  ```
- [ ] Commit and push code to trigger redeploy
- [ ] Check Render logs after deployment

### Frontend (Vercel)
- [ ] Go to Vercel Dashboard → Your Frontend Project
- [ ] Settings → Environment Variables → Add:
  ```
  VITE_RECAPTCHA_SITE_KEY=<paste-your-site-key>
  VITE_API_BASE=https://your-render-domain.onrender.com/api
  ```
- [ ] Trigger redeploy (or push new commit)
- [ ] Test in production

---

## Code Changes Made

### Files Modified
1. `backend/backend/settings.py` - Added reCAPTCHA config
2. `backend/accounts/views.py` - Updated login/register endpoints
3. `backend/accounts/urls.py` - Removed old captcha endpoint
4. `backend/requirements.txt` - Added `requests` library
5. `frontend/src/pages/RegisterPage.jsx` - Updated to use token

### Files Created
1. `backend/accounts/recaptcha.py` - New verification module
2. `RECAPTCHA_DEPLOYMENT_GUIDE.md` - Deployment documentation

### Files Already Compatible
- `frontend/src/pages/LoginPage.jsx` ✅
- `frontend/src/components/CaptchaWidget.jsx` ✅
- `frontend/src/services/api.js` ✅

---

## Testing Checklist

### Local Testing
- [ ] Start backend: `python manage.py runserver`
- [ ] Start frontend: `npm run dev`
- [ ] Open http://localhost:5173/login
- [ ] See reCAPTCHA checkbox appear ✓
- [ ] Click checkbox and verify (you should see a token)
- [ ] Enter credentials
- [ ] Submit form
- [ ] Check Network tab in DevTools: `recaptcha_token` sent ✓
- [ ] Should successfully log in or see field validation errors
- [ ] Try invalid captcha (open console, modify token) - should get error

### Production Testing
- [ ] Open https://your-vercel-app/login
- [ ] reCAPTCHA checkbox appears ✓
- [ ] Complete verification
- [ ] Login succeeds ✓
- [ ] Check backend logs on Render (should show successful verification)
- [ ] Open https://your-vercel-app/register
- [ ] Register new account
- [ ] Should complete without captcha errors ✓

---

## Environment Variables Summary

### Backend (Render .env or Environment Variables)
```
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAB92rZEHblvgdRxKIZvUVLh5Ijwn
FRONTEND_URL=https://skill-tracking-platform-t1n1.vercel.app
# ... other vars
```

### Frontend (Vercel Environment Variables)
```
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
VITE_API_BASE=https://skill-tracking-platform-1.onrender.com/api
```

---

## Common Commands

### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
python manage.py runserver

# Check for errors
python manage.py check

# Create superuser
python manage.py createsuperuser
```

### Frontend
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Debugging Quick Links

### If reCAPTCHA Widget Doesn't Appear
1. Check browser console for errors
2. Verify `VITE_RECAPTCHA_SITE_KEY` is set
3. Check Network tab - is `recaptcha__en.js` loaded?

### If Verification Fails at Backend
1. Check Render logs for error messages
2. Verify `RECAPTCHA_SECRET_KEY` is set on Render
3. Verify domain is registered in reCAPTCHA Admin Console

### If CORS Error
1. Check backend logs for CORS error
2. Verify `FRONTEND_URL` is set correctly on backend
3. Check `CORS_ALLOWED_ORIGINS` in settings.py

### If Token Validation Fails
1. Token valid for only 2 minutes - user must submit quickly
2. Check Network tab to see actual token being sent
3. Verify backend is calling Google's verification API

---

## Rollback Plan (if needed)

If issues arise, you can revert to custom CAPTCHA:

1. In `backend/accounts/views.py`:
   - Import `from .captcha import verify_captcha`
   - Change `verify_recaptcha(token)` back to `verify_captcha(id, answer)`

2. In frontend pages:
   - Use `captcha_id` and `captcha_answer` instead of `recaptcha_token`

3. Un-remove the `CaptchaView` endpoint in `views.py` and `urls.py`

But we recommend testing thoroughly before deployment to avoid needing this!

---

## Security Notes

⚠️ **NEVER:**
- Commit `.env` files to Git
- Expose `RECAPTCHA_SECRET_KEY` in frontend code
- Use placeholder keys in production

✅ **ALWAYS:**
- Use environment variables for secrets
- Verify token on backend (never skip)
- Use HTTPS in production
- Keep dependencies updated

---

## Support & Resources

- [Google reCAPTCHA Docs](https://developers.google.com/recaptcha)
- [react-google-recaptcha](https://github.com/google-recaptcha/react-google-recaptcha)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

---

## Questions Answered

### Q: Why do I need the Secret Key on the backend?
**A:** Google's API requires the secret key to verify that the captcha token is legitimate. This prevents frontend manipulation.

### Q: Is the Site Key sensitive?
**A:** No, it's public. It's only used to load the reCAPTCHA widget on the frontend.

### Q: How long is the token valid?
**A:** Tokens are valid for 2 minutes. Users must submit the form immediately after verification.

### Q: Can tokens be reused?
**A:** No. Each token is single-use. A new token is required for each login/register attempt.

### Q: What if reCAPTCHA fails due to network issues?
**A:** The error response from Google is returned to the user. Implement a "Try Again" button for retry logic.

### Q: Do I need rate limiting?
**A:** Recommended for additional security. Consider adding after basic integration works.

---

Last Updated: April 2026
