import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

/**
 * Custom CAPTCHA widget — fetches a distorted math-challenge image
 * from the backend and provides an input for the user's answer.
 *
 * Props:
 *   onVerify(captchaId, captchaAnswer) — called whenever the user types an answer
 *   resetTrigger — increment this value to force a CAPTCHA refresh
 */
export default function CaptchaWidget({ onVerify, resetTrigger = 0 }) {
    const [captchaId, setCaptchaId] = useState('');
    const [captchaImage, setCaptchaImage] = useState('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchCaptcha = useCallback(async () => {
        setLoading(true);
        setAnswer('');
        try {
            const res = await API.get('/auth/captcha/');
            setCaptchaId(res.data.captcha_id);
            setCaptchaImage(res.data.captcha_image);
            onVerify(res.data.captcha_id, '');
        } catch {
            console.error('Failed to load CAPTCHA');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on mount + whenever resetTrigger changes
    useEffect(() => {
        fetchCaptcha();
    }, [resetTrigger]);

    const handleChange = (e) => {
        const val = e.target.value;
        setAnswer(val);
        onVerify(captchaId, val);
    };

    return (
        <div className="captcha-widget">
            <label className="captcha-label">🔒 Security Check</label>
            <div className="captcha-body">
                <div className="captcha-image-wrap">
                    {loading ? (
                        <div className="captcha-skeleton">
                            <div className="spinner" style={{ width: 24, height: 24 }} />
                        </div>
                    ) : (
                        <img
                            src={`data:image/png;base64,${captchaImage}`}
                            alt="CAPTCHA challenge"
                            className="captcha-image"
                            draggable={false}
                        />
                    )}
                    <button
                        type="button"
                        className="captcha-refresh"
                        onClick={fetchCaptcha}
                        title="Load new CAPTCHA"
                    >
                        🔄
                    </button>
                </div>
                <input
                    type="text"
                    className="form-input captcha-input"
                    placeholder="Your answer"
                    value={answer}
                    onChange={handleChange}
                    autoComplete="off"
                    required
                />
            </div>
        </div>
    );
}
