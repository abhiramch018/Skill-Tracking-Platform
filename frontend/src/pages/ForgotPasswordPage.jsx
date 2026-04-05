import { useState } from 'react';
import { Link } from 'react-router-dom';
import CustomCursor from '../components/CustomCursor';
import API from '../services/api';

const STEPS = { EMAIL: 0, OTP: 1, NEW_PASSWORD: 2, SUCCESS: 3 };

export default function ForgotPasswordPage() {
    const [step, setStep] = useState(STEPS.EMAIL);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // ── Step 1: Send OTP ──
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        if (!email) { setError('Please enter your email address.'); return; }

        setLoading(true);
        try {
            await API.post('/auth/forgot-password/', { email });
            setStep(STEPS.OTP);
            // Start 60s cooldown for resend
            startCountdown();
        } catch (err) {
            const data = err.response?.data;
            setError(data?.error || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Verify OTP & set password ──
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (!otp || otp.length !== 6) {
            setError('Please enter the 6-digit code from your email.');
            return;
        }
        if (!newPassword) { setError('Please enter a new password.'); return; }
        if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

        setLoading(true);
        try {
            await API.post('/auth/reset-password/', {
                email,
                otp,
                new_password: newPassword,
            });
            setStep(STEPS.SUCCESS);
        } catch (err) {
            const data = err.response?.data;
            setError(data?.error || 'Reset failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Resend OTP ──
    const handleResend = async () => {
        setError('');
        setLoading(true);
        try {
            await API.post('/auth/forgot-password/', { email });
            startCountdown();
        } catch {
            setError('Failed to resend. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const startCountdown = () => {
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) { clearInterval(timer); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    // ── Step indicator ──
    const stepLabels = ['Email', 'Verify', 'Reset'];
    const activeIdx = step === STEPS.SUCCESS ? 3 : step;

    return (
        <div className="auth-page">
            <CustomCursor />
            <div className="antigravity-bg" />
            <div className="bg-particles" />

            <div className="auth-card forgot-card">
                {/* Step Progress */}
                {step !== STEPS.SUCCESS && (
                    <div className="forgot-steps">
                        {stepLabels.map((label, i) => (
                            <div key={label} className={`forgot-step-dot ${i <= activeIdx ? 'active' : ''} ${i === activeIdx ? 'current' : ''}`}>
                                <div className="dot-circle">
                                    {i < activeIdx ? '✓' : i + 1}
                                </div>
                                <span className="dot-label">{label}</span>
                                {i < stepLabels.length - 1 && <div className={`dot-connector ${i < activeIdx ? 'filled' : ''}`} />}
                            </div>
                        ))}
                    </div>
                )}

                {/* ════════ STEP 1: Email ════════ */}
                {step === STEPS.EMAIL && (
                    <>
                        <div className="forgot-icon">🔒</div>
                        <h1>Forgot Password?</h1>
                        <p className="auth-subtitle">
                            Enter your registered email address and we'll send you a verification code.
                        </p>

                        {error && <div className="form-message error">{error}</div>}

                        <form onSubmit={handleSendOtp}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%' }}
                                disabled={loading}
                            >
                                {loading ? '⏳ Sending...' : '📧 Send Reset Code'}
                            </button>
                        </form>
                    </>
                )}

                {/* ════════ STEP 2: OTP ════════ */}
                {step === STEPS.OTP && (
                    <>
                        <div className="forgot-icon">📬</div>
                        <h1>Check Your Email</h1>
                        <p className="auth-subtitle">
                            We've sent a 6-digit code to <strong>{email}</strong>
                        </p>

                        {error && <div className="form-message error">{error}</div>}

                        <form onSubmit={(e) => { e.preventDefault(); setStep(STEPS.NEW_PASSWORD); }}>
                            <div className="form-group">
                                <label>Verification Code</label>
                                <input
                                    type="text"
                                    className="form-input otp-input"
                                    placeholder="• • • • • •"
                                    value={otp}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(val);
                                    }}
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%' }}
                                disabled={otp.length !== 6}
                            >
                                ✅ Verify Code
                            </button>
                        </form>

                        <div className="resend-row">
                            {countdown > 0 ? (
                                <span className="resend-timer">Resend in {countdown}s</span>
                            ) : (
                                <button className="resend-btn" onClick={handleResend} disabled={loading}>
                                    🔄 Resend Code
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* ════════ STEP 3: New Password ════════ */}
                {step === STEPS.NEW_PASSWORD && (
                    <>
                        <div className="forgot-icon">🔑</div>
                        <h1>Set New Password</h1>
                        <p className="auth-subtitle">
                            Create a strong password for your account.
                        </p>

                        {error && <div className="form-message error">{error}</div>}

                        <form onSubmit={handleResetPassword}>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Enter new password (min 6 chars)"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Re-enter new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Password strength indicator */}
                            {newPassword && (
                                <div className="password-strength">
                                    <div className="strength-bar">
                                        <div
                                            className={`strength-fill ${
                                                newPassword.length >= 10 ? 'strong' :
                                                newPassword.length >= 6 ? 'medium' : 'weak'
                                            }`}
                                            style={{
                                                width: newPassword.length >= 10 ? '100%' :
                                                       newPassword.length >= 6 ? '60%' : '30%'
                                            }}
                                        />
                                    </div>
                                    <span className={`strength-label ${
                                        newPassword.length >= 10 ? 'strong' :
                                        newPassword.length >= 6 ? 'medium' : 'weak'
                                    }`}>
                                        {newPassword.length >= 10 ? '🛡️ Strong' :
                                         newPassword.length >= 6 ? '⚠️ Medium' : '❌ Weak'}
                                    </span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%' }}
                                disabled={loading}
                            >
                                {loading ? '⏳ Resetting...' : '🔐 Reset Password'}
                            </button>
                        </form>
                    </>
                )}

                {/* ════════ STEP 4: Success ════════ */}
                {step === STEPS.SUCCESS && (
                    <div className="forgot-success">
                        <div className="success-icon-large">✅</div>
                        <h1>Password Reset!</h1>
                        <p className="auth-subtitle">
                            Your password has been successfully changed. You can now sign in with your new password.
                        </p>
                        <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '16px' }}>
                            🚀 Go to Login
                        </Link>
                    </div>
                )}

                {/* Footer */}
                {step !== STEPS.SUCCESS && (
                    <p className="auth-footer">
                        Remember your password? <Link to="/login">Sign in</Link>
                    </p>
                )}
            </div>
        </div>
    );
}
