# reCAPTCHA Integration - API Reference

## Endpoints Overview

### Public Endpoints (No Auth Required)

| Method | Endpoint | Purpose | reCAPTCHA Required |
|--------|----------|---------|-------------------|
| POST | `/api/auth/login/` | User login | ✅ Yes |
| POST | `/api/auth/register/` | User registration | ✅ Yes |
| POST | `/api/auth/forgot-password/` | Initiate password reset | ❌ No* |
| POST | `/api/auth/reset-password/` | Complete password reset | ❌ No* |

*Note: These don't require reCAPTCHA currently, but could be added for additional security

---

## Login Endpoint

### Request Format

**Endpoint:** `POST /api/auth/login/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePassword123!",
  "recaptcha_token": "03AOLTBLSz2QRhp8..."
}
```

**Required Fields:**
- `username` (string) - User's username
- `password` (string) - User's password
- `recaptcha_token` (string) - Token from completed reCAPTCHA challenge

### Success Response (200 OK)

```json
{
  "message": "Login successful.",
  "token": "abc123def456xyz789",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "student",
    "first_name": "John",
    "last_name": "Doe",
    "is_active": true,
    "date_joined": "2024-01-15T10:30:00Z"
  }
}
```

### Error Responses

**400 Bad Request - reCAPTCHA Verification Failed:**
```json
{
  "recaptcha_token": "reCAPTCHA verification failed. Please try again."
}
```

**400 Bad Request - Invalid Credentials:**
```json
{
  "non_field_errors": ["Invalid username or password."]
}
```

**400 Bad Request - Missing Fields:**
```json
{
  "username": ["This field is required."],
  "password": ["This field is required."],
  "recaptcha_token": ["This field is required."]
}
```

---

## Register Endpoint

### Request Format

**Endpoint:** `POST /api/auth/register/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student",
  "recaptcha_token": "03AOLTBLSz2QRhp8..."
}
```

**Required Fields:**
- `username` (string) - Unique username (3-50 characters)
- `email` (string) - Valid email address
- `password` (string) - Password (minimum 6 characters)
- `first_name` (string) - User's first name
- `last_name` (string) - User's last name
- `role` (string) - Either "student" or "faculty"
- `recaptcha_token` (string) - Token from completed reCAPTCHA challenge

### Success Response (201 Created)

```json
{
  "message": "Registration successful!",
  "token": "abc123def456xyz789",
  "user": {
    "id": 2,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "student",
    "first_name": "John",
    "last_name": "Doe",
    "is_active": true,
    "date_joined": "2024-04-05T14:22:00Z"
  }
}
```

### Error Responses

**400 Bad Request - reCAPTCHA Verification Failed:**
```json
{
  "recaptcha_token": "reCAPTCHA verification failed. Please try again."
}
```

**400 Bad Request - Username Already Exists:**
```json
{
  "username": ["A user with this username already exists."]
}
```

**400 Bad Request - Email Already Exists:**
```json
{
  "email": ["A user with this email already exists."]
}
```

**400 Bad Request - Invalid Password:**
```json
{
  "password": ["This password is too common.", "Password must be at least 6 characters."]
}
```

**400 Bad Request - Missing Fields:**
```json
{
  "username": ["This field is required."],
  "email": ["This field is required."],
  "password": ["This field is required."],
  "first_name": ["This field is required."],
  "last_name": ["This field is required."],
  "role": ["This field is required."],
  "recaptcha_token": ["This field is required."]
}
```

---

## reCAPTCHA Token Details

### Token Structure

reCAPTCHA v2 token format:
```
03AOLTBLSz2QRhp8_bnU2s3c4M1mK6z2_4vZ8xY5wP3qA6rN9sM2hL7fJ4gH0eD5_VbC3xK9wQ8yT1uI6oPfR7aS
```

**Characteristics:**
- Long alphanumeric string (50-800+ characters depending on challenge complexity)
- Represents user's completion of reCAPTCHA challenge
- Valid for 2 minutes after generation
- Single-use only (cannot be reused for multiple requests)
- Specific to the domain it was generated on

### Token Lifecycle

```
User clicks "I'm not a robot"
         ↓
User completes challenge (puzzle/image selection)
         ↓
Token generated (valid for 2 minutes)
         ↓
User submits form → Token included
         ↓
Backend receives token
         ↓
Backend calls Google's verification API
         ↓
Google validates token:
  - Is it real?
  - Hasn't it been used before?
  - Is it for correct domain?
  - Is it still within 2-minute window?
         ↓
Result: success=true or success=false
```

---

## Backend Verification Process

### What Happens on Server

```python
def post(self, request):
    # 1. Extract token from request
    recaptcha_token = request.data.get('recaptcha_token', '')
    
    # 2. Get user's IP address
    client_ip = request.META.get('REMOTE_ADDR')
    
    # 3. Call verification function
    captcha_result = verify_recaptcha(recaptcha_token, client_ip)
    
    # 4. Check result
    if not captcha_result['success']:
        return Response(
            {'recaptcha_token': 'reCAPTCHA verification failed.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 5. Continue with normal flow
    # ... login/register logic ...
```

### Google API Request

```
POST https://www.google.com/recaptcha/api/siteverify

Headers:
  Content-Type: application/x-www-form-urlencoded

Body:
  secret=<RECAPTCHA_SECRET_KEY>
  response=<token_from_frontend>
  remoteip=<user_ip_address>
```

### Google API Response (Success)

```json
{
  "success": true,
  "challenge_ts": "2024-04-05T14:22:33Z",
  "hostname": "skill-tracking-platform-t1n1.vercel.app",
  "score": 0.9,
  "action": "submit"
}
```

### Google API Response (Failure)

```json
{
  "success": false,
  "challenge_ts": "2024-04-05T14:22:33Z",
  "hostname": "skill-tracking-platform-t1n1.vercel.app",
  "error-codes": [
    "invalid-input-response"
  ]
}
```

---

## HTTP Status Codes

| Code | Meaning | Scenario |
|------|---------|----------|
| 200 | OK | Successful login |
| 201 | Created | Successful registration |
| 400 | Bad Request | Invalid reCAPTCHA, validation errors |
| 401 | Unauthorized | Invalid credentials |
| 403 | Forbidden | No permission (admin endpoints) |
| 404 | Not Found | Endpoint doesn't exist |
| 429 | Too Many Requests | Rate limited (if implemented) |
| 500 | Server Error | Backend error |
| 502 | Bad Gateway | Connection error with Google API |

---

## Full Request/Response Examples

### Example 1: Successful Login

**Request:**
```bash
curl -X POST https://skill-tracking-platform-1.onrender.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecurePass123!",
    "recaptcha_token": "03AOLTBLSz2QRhp8..."
  }'
```

**Response (200 OK):**
```json
{
  "message": "Login successful.",
  "token": "a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "student",
    "first_name": "John",
    "last_name": "Doe",
    "is_active": true,
    "date_joined": "2024-01-15T10:30:00Z"
  }
}
```

---

### Example 2: Failed reCAPTCHA Verification

**Request:**
```bash
curl -X POST https://skill-tracking-platform-1.onrender.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecurePass123!",
    "recaptcha_token": "invalid_or_expired_token"
  }'
```

**Response (400 Bad Request):**
```json
{
  "recaptcha_token": "reCAPTCHA verification failed. Please try again."
}
```

---

### Example 3: Successful Registration

**Request:**
```bash
curl -X POST https://skill-tracking-platform-1.onrender.com/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jane_smith",
    "email": "jane@example.com",
    "password": "SecurePass456!",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "faculty",
    "recaptcha_token": "03AOLTBLSz2QRhp8..."
  }'
```

**Response (201 Created):**
```json
{
  "message": "Registration successful!",
  "token": "x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0",
  "user": {
    "id": 2,
    "username": "jane_smith",
    "email": "jane@example.com",
    "role": "faculty",
    "first_name": "Jane",
    "last_name": "Smith",
    "is_active": true,
    "date_joined": "2024-04-05T14:22:00Z"
  }
}
```

---

### Example 4: Missing reCAPTCHA Token

**Request:**
```bash
curl -X POST https://skill-tracking-platform-1.onrender.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecurePass123!"
  }'
```

**Response (400 Bad Request):**
```json
{
  "recaptcha_token": ["This field is required."]
}
```

---

## Frontend Usage Examples

### React Component Integration

```javascript
import { useRef, useState } from 'react';
import CaptchaWidget from '../components/CaptchaWidget';
import API from '../services/api';

export default function LoginPage() {
    const [form, setForm] = useState({ username: '', password: '' });
    const captchaRef = useRef('');

    const handleCaptchaVerify = (token) => {
        captchaRef.current = token;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!captchaRef.current) {
            alert('Please complete reCAPTCHA');
            return;
        }

        try {
            const res = await API.post('/auth/login/', {
                ...form,
                recaptcha_token: captchaRef.current,
            });

            console.log('Login successful!');
            console.log('Token:', res.data.token);
            console.log('User:', res.data.user);

            // Store token and navigate
            localStorage.setItem('token', res.data.token);
            window.location.href = '/dashboard';

        } catch (err) {
            const errorMsg = err.response?.data?.recaptcha_token || 
                            'Login failed. Please try again.';
            alert(errorMsg);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
            />

            <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <CaptchaWidget onVerify={handleCaptchaVerify} />

            <button type="submit">Login</button>
        </form>
    );
}
```

---

## Backend Usage Examples

### Django View Integration

```python
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .recaptcha import verify_recaptcha

class LoginView(APIView):
    def post(self, request):
        # Extract reCAPTCHA token
        recaptcha_token = request.data.get('recaptcha_token', '')

        # Get client IP
        client_ip = request.META.get('REMOTE_ADDR')
        if x_forwarded_for := request.META.get('HTTP_X_FORWARDED_FOR'):
            client_ip = x_forwarded_for.split(',')[0].strip()

        # Verify reCAPTCHA
        captcha_result = verify_recaptcha(recaptcha_token, client_ip)

        if not captcha_result['success']:
            return Response(
                {
                    'recaptcha_token': 'reCAPTCHA verification failed. Please try again.',
                    'details': captcha_result.get('error_codes', [])
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Continue with login logic
        username = request.data.get('username')
        password = request.data.get('password')

        try:
            user = authenticate(username=username, password=password)
            if user:
                token, _ = Token.objects.get_or_create(user=user)
                return Response({
                    'token': token.key,
                    'user': UserSerializer(user).data
                })
            else:
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

---

## Error Code Reference

### Common reCAPTCHA Error Codes

| Error Code | Meaning | Solution |
|-----------|---------|----------|
| `missing-input-secret` | Secret key not sent to Google | Check `RECAPTCHA_SECRET_KEY` is set |
| `invalid-input-secret` | Secret key is invalid | Verify correct secret key is set |
| `missing-input-response` | Token missing from request | Ensure token is sent from frontend |
| `invalid-input-response` | Token is invalid/malformed/expired | User must re-verify reCAPTCHA |
| `bad-request` | Request malformed | Check request format |
| `timeout-or-duplicate` | Token already used or >2 min old | User must get new token |

---

## Response Handling Best Practices

### Frontend

```javascript
// Always check for recaptcha_token error specifically
try {
    const res = await API.post('/auth/login/', {...});
    // Success
} catch (err) {
    const data = err.response?.data;
    
    if (data?.recaptcha_token) {
        // reCAPTCHA failed - ask user to try again
        showError(data.recaptcha_token);
        resetCaptcha(); // Reset the widget
    } else if (data?.username || data?.password) {
        // Validation error
        showError('Invalid username or password');
    } else {
        // Other error
        showError('Login failed. Please try again.');
    }
}
```

### Backend

```python
# Always return structured error responses
if not captcha_result['success']:
    return Response(
        {
            'recaptcha_token': 'reCAPTCHA verification failed.',
            'error_codes': captcha_result.get('error_codes', [])
        },
        status=status.HTTP_400_BAD_REQUEST
    )
```

---

## Testing with cURL

### Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "username": "testuser",
  "password": "testpass123",
  "recaptcha_token": "test_token_123"
}
EOF
```

### Test Registration
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepass123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student",
  "recaptcha_token": "test_token_123"
}
EOF
```

---

## Rate Limiting (Optional)

If implementing rate limiting:

```python
# 429 Too Many Requests
{
  "detail": "Request was throttled. Try again in 300 seconds."
}
```

---

Last Updated: April 2026
