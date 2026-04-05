import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CustomCursor from '../components/CustomCursor';
import API from '../services/api';

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const initialRole = location.state?.role || 'student';

    const [role, setRole] = useState(initialRole);
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        setLoading(true);

        try {
            const res = await API.post('/auth/login/', {
                ...form,
            });
            const { token, user } = res.data;

            if (user.role !== role) {
                setError(`This account is registered as "${user.role}", not "${role}".`);
                setLoading(false);
                return;
            }

            login(token, user);
            const dashboards = { student: '/student', faculty: '/faculty', admin: '/admin' };
            navigate(dashboards[user.role] || '/');
        } catch (err) {
            const data = err.response?.data;
            if (data?.non_field_errors) setError(data.non_field_errors[0]);
            else if (typeof data === 'object') setError(Object.values(data).flat().join(' '));
            else setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <CustomCursor />
            <div className="antigravity-bg" />
            <div className="bg-particles" />

            <div className="auth-card">
                <h1>Welcome Back</h1>
                <p className="auth-subtitle">Sign in to your account</p>

                {/* Role Tabs */}
                <div className="role-tabs">
                    {['student', 'faculty', 'admin'].map((r) => (
                        <button
                            key={r}
                            className={`role-tab ${role === r ? 'active' : ''}`}
                            onClick={() => setRole(r)}
                            type="button"
                        >
                            {r === 'student' ? '🎓' : r === 'faculty' ? '👨‍🏫' : '🛡️'}{' '}
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>

                {error && <div className="form-message error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter your username"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>

                    <div className="forgot-link-row">
                        <Link to="/forgot-password">Forgot Password?</Link>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                        {loading ? '⏳ Signing in...' : `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>
    );
}
