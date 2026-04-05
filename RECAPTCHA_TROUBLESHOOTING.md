# reCAPTCHA Integration - Detailed Troubleshooting Guide

## Common Issues & Step-by-Step Solutions

### Issue #1: reCAPTCHA Widget Not Appearing

**Symptoms:**
- Login/Register page loads but no checkbox visible
- No errors in console

**Step 1: Check Site Key**
```javascript
// Open browser console and run:
console.log(import.meta.env.VITE_RECAPTCHA_SITE_KEY)
```
- If undefined, `.env` file not loaded
- If showing a key, proceed to Step 2

**Step 2: Check if Script is Loading**
```javascript
// Open DevTools Network tab
// Filter for: "recaptcha"
// Should see: recaptcha__en.js being loaded
```

**Step 3: Verify Environment Variable**

`frontend/.env`:
```
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
VITE_API_BASE=http://localhost:8000/api
```

Frontend restart required after changing `.env`:
```bash
# Stop the dev server (Ctrl+C)
npm run dev
```

**Step 4: Check Domain Registration**
1. Go to [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Select your site
3. Check **Settings** tab
4. Verify `localhost` is listed under Domains

---

### Issue #2: "Invalid Domain for Site Key"

**Symptoms:**
- reCAPTCHA widget appears initially
- Shows error: "Invalid domain for site key"

**Cause:** Domain not registered in reCAPTCHA console

**Fix:**

1. Go to [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click your site name
3. **Settings** tab → **Domains** → **+ Add domain**
4. Add your exact domain:
   - For local: `localhost` (no port in registration)
   - For Vercel: `skill-tracking-platform-t1n1.vercel.app`
   - For preview: `*.vercel.app` (wildcard for all Vercel previews)
5. Save and wait 1-2 minutes

---

### Issue #3: Backend Returns "reCAPTCHA verification failed"

**Symptoms:**
```json
{
  "recaptcha_token": "reCAPTCHA verification failed. Please try again."
}
```

**Debugging:**

**Step 1: Check Secret Key on Backend**
```bash
# SSH into Render or check Render Dashboard
# Settings → Environment Variables
# Verify RECAPTCHA_SECRET_KEY is set
```

**Step 2: Enable Debug Logging**

Add to `backend/accounts/recaptcha.py` temporarily:
```python
import logging
logger = logging.getLogger(__name__)

def verify_recaptcha(token: str, remote_ip: str = None) -> dict:
    # ... existing code ...
    
    try:
        response = requests.post(verify_url, data=payload, timeout=5)
        logger.debug(f"Google response: {response.status_code}")
        logger.debug(f"Google response body: {response.json()}")
        # ... rest of code ...
    except Exception as e:
        logger.error(f"reCAPTCHA error: {str(e)}")
```

**Step 3: Check Secret Key Value**
```python
# Add temporary debug in views.py
from django.conf import settings

def post(self, request):
    print(f"DEBUG: Secret key exists: {bool(settings.RECAPTCHA_SECRET_KEY)}")
    print(f"DEBUG: Secret key length: {len(settings.RECAPTCHA_SECRET_KEY)}")
    # ... rest of code ...
```

---

### Issue #4: "invalid-input-response" or "invalid-input-secret"

**Symptoms:**
```json
{
  "success": false,
  "error-codes": ["invalid-input-response"]
}
```

**Causes & Fixes:**

| Error Code | Cause | Fix |
|-----------|-------|-----|
| `invalid-input-response` | Token is empty, malformed, or expired (>2 min) | User must click checkbox and submit within 2 minutes |
| `invalid-input-secret` | Secret key is wrong or empty | Verify `RECAPTCHA_SECRET_KEY` on Render |
| `missing-input-secret` | Secret key not provided to Google | Check settings.py has the key |
| `timeout-or-duplicate` | Token already used or too old | Generate new token by re-checking box |

---

### Issue #5: CORS Error Between Frontend & Backend

**Symptoms:**
```
Access to XMLHttpRequest at 'https://backend-url/api/auth/login/' 
from origin 'https://frontend-url' has been blocked by CORS policy
```

**Fix:**

**Step 1: Update Backend Settings**

File: `backend/backend/settings.py`

```python
# Make sure this is set correctly
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = [
        FRONTEND_URL,
    ]
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r'^https://.*\.vercel\.app$',
    ]
```

**Step 2: Verify Environment Variable**

On Render → Environment Variables:
```
FRONTEND_URL=https://skill-tracking-platform-t1n1.vercel.app
```

**Step 3: Redeploy Backend**
```bash
git add .
git commit -m "Fix CORS configuration"
git push
```

---

### Issue #6: Token Not Sent in Request

**Symptoms:**
- reCAPTCHA works
- But POST request doesn't include `recaptcha_token`

**Debugging:**

**Step 1: Check Browser Console**
```javascript
// In RegisterPage.jsx or LoginPage.jsx
console.log("Token before submit:", captchaRef.current)
```

**Step 2: Inspect Network Request**

Open DevTools → Network tab → Click on Login POST request

**Request Payload should show:**
```json
{
  "username": "testuser",
  "password": "pass123",
  "recaptcha_token": "03AOLTBLSz..."
}
```

**Step 3: Check Component State**

In `LoginPage.jsx`:
```javascript
const handleCaptchaVerify = (token) => {
    console.log("Received token:", token); // Debug
    captchaRef.current = token;
};

const handleSubmit = async (e) => {
    console.log("Before submit, token:", captchaRef.current); // Debug
    
    if (!captchaRef.current) {
        setError('Please complete the reCAPTCHA verification.');
        return;
    }
    // ... rest of code ...
};
```

---

### Issue #7: Works Locally But Fails in Production

**Symptoms:**
- Works at `localhost:5173`
- Fails at `skill-tracking-platform-t1n1.vercel.app` (Vercel)

**Step 1: Verify Domains in reCAPTCHA Console**
1. Open [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Check that `skill-tracking-platform-t1n1.vercel.app` is in Domains list
3. If not, add it and wait 5 minutes for propagation

**Step 2: Check Environment Variables**

Vercel → Settings → Environment Variables:
```
VITE_RECAPTCHA_SITE_KEY=<correct-key>
VITE_API_BASE=https://skill-tracking-platform-1.onrender.com/api
```

**Step 3: Check Production URL Format**
```javascript
// Vercel automatically injects environment variables
// Verify in browser console:
console.log("Site Key:", import.meta.env.VITE_RECAPTCHA_SITE_KEY)
console.log("API Base:", import.meta.env.VITE_API_BASE)
```

**Step 4: Clear Cache & Hard Refresh**
- Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- This clears browser cache and reloads fresh

---

### Issue #8: Backend Can't Reach Google's Verification API

**Symptoms:**
```
Error verifying reCAPTCHA: Connection timeout
```

**Cause:** Network connectivity issue or Google API is down

**Fix:**

**Step 1: Check Render Outbound Network**

Render free tier may have limited outbound connectivity. 
- Verify by checking Render logs: `Settings → Plan` 

**Step 2: Test Manually**

SSH into Render and test:
```bash
# Test connectivity to Google
curl -X POST https://www.google.com/recaptcha/api/siteverify \
  -d "secret=YOUR_SECRET_KEY&response=TOKEN"
```

**Step 3: Increase Timeout**

In `backend/accounts/recaptcha.py`:
```python
# Change from 5 seconds to 10 seconds
response = requests.post(verify_url, data=payload, timeout=10)
```

**Step 4: Add Retry Logic (Optional)**

```python
import time

def verify_recaptcha(token: str, remote_ip: str = None) -> dict:
    # ... existing code ...
    
    for attempt in range(3):  # Retry up to 3 times
        try:
            response = requests.post(verify_url, data=payload, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            if attempt < 2:
                time.sleep(1)  # Wait before retrying
                continue
            return {
                'success': False,
                'error_codes': ['timeout'],
                'message': 'Connection timeout after 3 attempts'
            }
```

---

### Issue #9: "recaptcha_token: This field is required"

**Symptoms:**
- User didn't complete CAPTCHA verification
- Still clicked Submit

**Fix:** This is expected behavior

**Frontend should prevent this:**
```javascript
if (!captchaRef.current) {
    setError('Please complete the reCAPTCHA verification.');
    return;
}
```

If still seeing this error:
1. reCAPTCHA widget didn't load properly
2. User skipped CAPTCHA
3. Token expired (>2 minutes)

---

### Issue #10: Intermittent Failures (Works Sometimes)

**Symptoms:**
- Login succeeds sometimes
- Other times gets "reCAPTCHA verification failed"
- No clear pattern

**Cause:** Often due to token expiration or race conditions

**Debug:**

```javascript
// In LoginPage.jsx - add timing info
const handleCaptchaVerify = (token) => {
    captchaRef.current = {
        token: token,
        receivedAt: Date.now()
    };
};

const handleSubmit = async (e) => {
    const timeSinceReceived = (Date.now() - captchaRef.current.receivedAt) / 1000;
    console.log(`Token age: ${timeSinceReceived} seconds`);
    
    if (timeSinceReceived > 120) {
        setError('reCAPTCHA token expired. Please try again.');
        setCaptchaReset((c) => c + 1);
        return;
    }
    // ... proceed with login ...
};
```

**Fix:** Add warning when token getting old:
```javascript
useEffect(() => {
    if (!captchaRef.current.token) return;
    
    const warningTimeout = setTimeout(() => {
        setWarning('reCAPTCHA expiring soon. Please submit quickly.');
    }, 90000); // 90 seconds
    
    return () => clearTimeout(warningTimeout);
}, [captchaRef.current.token]);
```

---

## Diagnostic Checklist

When experiencing issues, go through this checklist:

### Frontend Diagnostics
```javascript
// Open browser console and run:

// 1. Check environment variables
console.log("Site Key:", import.meta.env.VITE_RECAPTCHA_SITE_KEY)
console.log("API Base:", import.meta.env.VITE_API_BASE)

// 2. Check if reCAPTCHA component loaded
console.log("ReCAPTCHA loaded:", window.grecaptcha !== undefined)

// 3. Check if token is being captured
// (should see token after clicking captcha)

// 4. Check Network tab
// POST request should include recaptcha_token in body
```

### Backend Diagnostics
```bash
# 1. Check environment variables
echo $RECAPTCHA_SECRET_KEY
echo $FRONTEND_URL

# 2. Test Django settings
python manage.py shell
>>> from django.conf import settings
>>> settings.RECAPTCHA_SECRET_KEY
>>> settings.RECAPTCHA_VERIFY_URL

# 3. Test requests library
>>> import requests
>>> requests.post('https://www.google.com/recaptcha/api/siteverify', 
                 data={'secret': 'test', 'response': 'test'}, timeout=5)
```

### Production Diagnostics

**Render Logs:**
```bash
1. Go to Render Dashboard
2. Your Backend Service → Logs
3. Look for:
   - Startup errors
   - reCAPTCHA verification attempts
   - Any connection errors to Google API
```

**Vercel Logs:**
```bash
1. Go to Vercel Dashboard
2. Your Frontend Project → Deployments
3. Click latest deployment → Logs
4. Look for:
   - Build errors
   - Environment variable warnings
   - Network errors to backend
```

---

## Performance Optimization

If experiencing slow responses:

```python
# Add caching for verification results (optional)
from django.core.cache import cache

def verify_recaptcha(token: str, remote_ip: str = None) -> dict:
    # Check cache first
    cache_key = f"recaptcha_token_{token[:20]}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    # ... verification code ...
    
    # Cache for 2 minutes (same as Google's token TTL)
    cache.set(cache_key, result, timeout=120)
    return result
```

---

## Advanced: Custom Error Messages

Customize error messages for better UX:

```python
# In views.py
def post(self, request):
    captcha_result = verify_recaptcha(recaptcha_token, client_ip)
    
    if not captcha_result['success']:
        error_codes = captcha_result.get('error_codes', [])
        
        error_messages = {
            'timeout': 'Connection timeout. Please try again.',
            'timeout-or-duplicate': 'Token expired. Please check the box again.',
            'invalid-input-response': 'Invalid verification. Please try again.',
            'invalid-input-secret': '[Internal error]',
        }
        
        message = error_messages.get(error_codes[0], 'reCAPTCHA verification failed.')
        
        return Response(
            {'recaptcha_token': message},
            status=status.HTTP_400_BAD_REQUEST,
        )
```

---

## Advanced: Rate Limiting

Prevent brute force with rate limiting:

```python
# Install: pip install django-ratelimit

from django_ratelimit.decorators import ratelimit

class LoginView(APIView):
    @ratelimit(key='ip', rate='5/h', method='POST')
    def post(self, request):
        # ... existing code ...
```

Or implement manual rate limiting:

```python
from django.core.cache import cache

def is_rate_limited(ip: str) -> bool:
    key = f"login_attempts_{ip}"
    attempts = cache.get(key, 0)
    if attempts >= 5:
        return True
    cache.set(key, attempts + 1, timeout=3600)  # 1 hour
    return False

class LoginView(APIView):
    def post(self, request):
        client_ip = request.META.get('REMOTE_ADDR')
        if is_rate_limited(client_ip):
            return Response(
                {'error': 'Too many login attempts. Try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
```

---

## Monitoring

Add logs to monitor integration health:

```python
import logging

logger = logging.getLogger('recaptcha')

def log_verification_attempt(request, token, result):
    logger.info(
        f"Verification attempt",
        extra={
            'ip': request.META.get('REMOTE_ADDR'),
            'success': result['success'],
            'score': result.get('score'),
            'errors': result.get('error_codes', []),
        }
    )
```

Track metrics over time:
- Total verification attempts
- Success rate
- Common error codes
- Average verification time

---

Last Updated: April 2026
