"""
Google reCAPTCHA v2 verification module.
Handles server-side verification of reCAPTCHA tokens.
"""

import requests
from django.conf import settings


def verify_recaptcha(token: str, remote_ip: str = None) -> dict:
    """
    Verify a reCAPTCHA v2 token with Google's verification API.

    Args:
        token (str): The reCAPTCHA response token from the frontend.
        remote_ip (str, optional): The user's IP address (for security scoring).

    Returns:
        dict: {
            'success': bool,
            'score': float (0.0-1.0, higher = more likely human),
            'action': str (expected 'submit'),
            'challenge_ts': str (timestamp of the challenge),
            'hostname': str (the hostname of the site where the challenge was solved),
            'error_codes': list (any error codes from Google),
            'message': str (human-readable message)
        }

    Error codes from Google:
        - missing-input-secret: The secret parameter is missing.
        - invalid-input-secret: The secret parameter is invalid or malformed.
        - missing-input-response: The response parameter is missing.
        - invalid-input-response: The response parameter is invalid or malformed.
        - bad-request: The request is invalid or malformed.
        - timeout-or-duplicate: The response is no longer valid: either is too old,
          or has been used previously.
    """
    secret_key = settings.RECAPTCHA_SECRET_KEY
    verify_url = settings.RECAPTCHA_VERIFY_URL

    if not secret_key:
        return {
            'success': False,
            'error_codes': ['missing-secret-key'],
            'message': 'reCAPTCHA secret key is not configured.',
        }

    if not token or not isinstance(token, str) or len(token.strip()) == 0:
        return {
            'success': False,
            'error_codes': ['missing-input-response'],
            'message': 'reCAPTCHA token is missing or empty.',
        }

    # Prepare payload for Google's verification API
    payload = {
        'secret': secret_key,
        'response': token.strip(),
    }

    # Include remote IP if provided (improves assessment)
    if remote_ip:
        payload['remoteip'] = remote_ip

    try:
        # Make request to Google's verification endpoint
        response = requests.post(verify_url, data=payload, timeout=5)
        response.raise_for_status()
        
        result = response.json()

        # Extract and format the response
        return {
            'success': result.get('success', False),
            'score': result.get('score', 0.0),
            'action': result.get('action', ''),
            'challenge_ts': result.get('challenge_ts', ''),
            'hostname': result.get('hostname', ''),
            'error_codes': result.get('error-codes', []),
            'message': 'reCAPTCHA verification successful.' if result.get('success') else 'reCAPTCHA verification failed.',
        }

    except requests.exceptions.Timeout:
        return {
            'success': False,
            'error_codes': ['timeout'],
            'message': 'reCAPTCHA verification timed out. Please try again.',
        }
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'error_codes': ['request-error'],
            'message': f'Error verifying reCAPTCHA: {str(e)}',
        }
    except ValueError as e:
        return {
            'success': False,
            'error_codes': ['invalid-json'],
            'message': f'Invalid response from reCAPTCHA service: {str(e)}',
        }
