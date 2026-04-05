import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CustomCursor from '../components/CustomCursor';
import CaptchaWidget from '../components/CaptchaWidget';
import API from '../services/api';

export default function RegisterPage() {
    const navigate = useNavigate();

    const [role, setRole] = useState('student');
    const [form, setForm] = useState({
        username: '', email: '', password: '', first_name: '', last_name: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [captchaReset, setCaptchaReset] = useState(0);
    const captchaRef = useRef({ id: '', answer: '' });

    const handleCaptchaVerify = (id, answer) => {
        captchaRef.current = { id, answer };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!captchaRef.current.answer) {
            setError('Please solve the CAPTCHA before registering.');
            return;
        }

        setLoading(true);

        try {
            await API.post('/auth/register/', {
                ...form,
                role,
                captcha_id: captchaRef.current.id,
                captcha_answer: captchaRef.current.answer,
            });
            navigate('/login', { state: { registered: true } });
        } catch (err) {
            const msg = err.response?.data;
            if (msg?.captcha) {
                setError(msg.captcha);
            } else if (typeof msg === 'object') {
                setError(Object.entries(msg).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | '));
            } else {
                setError('Registration failed. Please try again.');
            }
            // Reset captcha on failure
            setCaptchaReset((c) => c + 1);
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    return (
        <div className="auth-page">
            <CustomCursor />
            <div className="antigravity-bg" />
            <div className="bg-particles" />

            <div className="auth-card">
                <>
                    <h1>Create Account</h1>
                    <p className="auth-subtitle">Join the certification platform</p>

                    {/* Role Tabs */}
                    <div className="role-tabs">
                        {['student', 'faculty'].map((r) => (
                            <button
                                key={r}
                                className={`role-tab ${role === r ? 'active' : ''}`}
                                onClick={() => setRole(r)}
                                type="button"
                            >
                                {r === 'student' ? '🎓' : '👨‍🏫'}{' '}
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                            </button>
                        ))}
                    </div>

                    {error && <div className="form-message error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="form-group">
                                <label>First Name</label>
                                <input type="text" className="form-input" placeholder="John" value={form.first_name} onChange={updateField('first_name')} required />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input type="text" className="form-input" placeholder="Doe" value={form.last_name} onChange={updateField('last_name')} required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Username</label>
                            <input type="text" className="form-input" placeholder="johndoe" value={form.username} onChange={updateField('username')} required />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" className="form-input" placeholder="john@example.com" value={form.email} onChange={updateField('email')} required />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" className="form-input" placeholder="Min 6 characters" value={form.password} onChange={updateField('password')} required minLength={6} />
                        </div>

                        {/* Custom CAPTCHA */}
                        <CaptchaWidget
                            onVerify={handleCaptchaVerify}
                            resetTrigger={captchaReset}
                        />

                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                            {loading ? '⏳ Creating...' : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                        </button>
                    </form>

                    <p className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </>
            </div>
        </div>
    );
}
