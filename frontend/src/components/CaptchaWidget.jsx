import ReCAPTCHA from 'react-google-recaptcha';
import { useRef, useEffect } from 'react';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

/**
 * Google reCAPTCHA v2 widget.
 *
 * Props:
 *   onVerify(token)   — called when user completes the captcha (token string)
 *   resetTrigger      — increment to force reset
 */
export default function CaptchaWidget({ onVerify, resetTrigger = 0 }) {
    const recaptchaRef = useRef(null);

    useEffect(() => {
        if (resetTrigger > 0 && recaptchaRef.current) {
            recaptchaRef.current.reset();
            onVerify('');
        }
    }, [resetTrigger]);

    const handleChange = (token) => {
        onVerify(token || '');
    };

    const handleExpired = () => {
        onVerify('');
    };

    return (
        <div className="captcha-widget">
            <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={SITE_KEY}
                onChange={handleChange}
                onExpired={handleExpired}
                theme="light"
                size="normal"
            />
        </div>
    );
}
