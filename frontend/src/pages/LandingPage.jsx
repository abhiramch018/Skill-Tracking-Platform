import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import CustomCursor from '../components/CustomCursor';

/* Animated counter hook */
function useCounter(target, duration = 1800) {
    const [count, setCount] = useState(0);
    const started = useRef(false);
    const ref = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const steps = 60;
                const increment = target / steps;
                let current = 0;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) { setCount(target); clearInterval(timer); }
                    else setCount(Math.floor(current));
                }, duration / steps);
            }
        }, { threshold: 0.3 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target, duration]);
    return [count, ref];
}

function AnimatedStat({ value, label, suffix = '+' }) {
    const [count, ref] = useCounter(value);
    return (
        <div ref={ref} className="landing-stat">
            <span className="landing-stat-value">{count}{suffix}</span>
            <span className="landing-stat-label">{label}</span>
        </div>
    );
}

const HOW_IT_WORKS = [
    { icon: '📝', step: '01', title: 'Register', desc: 'Create your account as a Student, Faculty, or Admin in seconds.' },
    { icon: '📤', step: '02', title: 'Upload', desc: 'Upload your certificate with category tags — PDF, JPG, or PNG.' },
    { icon: '🔍', step: '03', title: 'Review', desc: 'Faculty reviews your submission with our fair rotation system.' },
    { icon: '🏆', step: '04', title: 'Track', desc: 'Monitor your score, view analytics, and never miss an expiry.' },
];

const FEATURES = [
    { icon: '📜', color: '#8b5cf6', title: 'Certificate Upload', desc: 'PDF & image support with instant expiry and format validation' },
    { icon: '🔄', color: '#06b6d4', title: 'Faculty Rotation', desc: 'Workload-balanced auto-assignment ensures fair distribution' },
    { icon: '📊', color: '#10b981', title: 'Performance Score', desc: 'Live scores: Accepted ×10 − Rejected ×2, visualized as a ring' },
    { icon: '🔔', color: '#f59e0b', title: 'Expiry Alerts', desc: '30-day advance notifications on your dashboard' },
    { icon: '🏷️', color: '#ec4899', title: 'Skill Categories', desc: 'Cloud, AI/ML, Web, Cyber — tag and filter by domain' },
    { icon: '🏆', color: '#ef4444', title: 'Leaderboard', desc: 'Top-10 student rankings with gold, silver, bronze medals' },
];

export default function LandingPage() {
    return (
        <div className="landing">
            <CustomCursor />
            <div className="antigravity-bg" />
            <div className="bg-particles" />

            {/* Navigation */}
            <nav className="landing-nav">
                <div className="landing-nav-left">
                    <Link to="/login" state={{ role: 'student' }}>🎓 Student</Link>
                    <Link to="/login" state={{ role: 'faculty' }}>👨‍🏫 Faculty</Link>
                    <Link to="/login" state={{ role: 'admin' }}>🛡️ Admin</Link>
                </div>
                <div className="landing-nav-right">
                    <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                    <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="landing-hero">
                <div className="landing-hero-content">
                    <div className="hero-left">
                        <div className="hero-badge">✨ Powered by Django &amp; React</div>
                        <h1>
                            Track Your<br />
                            <span className="gradient-text">Certifications</span><br />
                            With Confidence
                        </h1>
                        <p>
                            A comprehensive platform for uploading, verifying, and monitoring
                            professional certifications. Role-based access for students,
                            faculty, and administrators with automated expiry alerts.
                        </p>
                        <div className="hero-actions">
                            <Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>
                            <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
                        </div>
                    </div>

                    <div className="hero-right">
                        <div className="hero-visual">
                            <div className="visual-item">
                                <div className="visual-icon purple">📜</div>
                                <div>
                                    <h4>Upload Certifications</h4>
                                    <p>PDF &amp; image support with instant validation</p>
                                </div>
                            </div>
                            <div className="visual-item">
                                <div className="visual-icon cyan">✅</div>
                                <div>
                                    <h4>Faculty Verification</h4>
                                    <p>Fair rotation system with workload balancing</p>
                                </div>
                            </div>
                            <div className="visual-item">
                                <div className="visual-icon green">📊</div>
                                <div>
                                    <h4>Performance Tracking</h4>
                                    <p>Real-time scores and analytics dashboard</p>
                                </div>
                            </div>
                            <div className="visual-item">
                                <div className="visual-icon pink">🔔</div>
                                <div>
                                    <h4>Expiry Alerts</h4>
                                    <p>30-day advance notification system</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Counter Strip */}
            <section className="landing-stats-strip">
                <AnimatedStat value={200} label="Certificates Verified" />
                <div className="stats-divider" />
                <AnimatedStat value={85} label="Students Enrolled" />
                <div className="stats-divider" />
                <AnimatedStat value={12} label="Faculty Members" />
                <div className="stats-divider" />
                <AnimatedStat value={30} label="Days Expiry Notice" suffix="" />
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <div className="section-header">
                    <div className="section-eyebrow">Simple Process</div>
                    <h2>How It <span className="gradient-text">Works</span></h2>
                    <p>From registration to certification tracking in four easy steps</p>
                </div>
                <div className="how-steps">
                    {HOW_IT_WORKS.map((step, i) => (
                        <div key={step.step} className="how-step">
                            <div className="how-step-icon">{step.icon}</div>
                            <div className="how-step-number">{step.step}</div>
                            <h3>{step.title}</h3>
                            <p>{step.desc}</p>
                            {i < HOW_IT_WORKS.length - 1 && <div className="how-step-connector" />}
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
                <div className="section-header">
                    <div className="section-eyebrow">Everything You Need</div>
                    <h2>Packed with <span className="gradient-text">Features</span></h2>
                    <p>Designed to handle the full certificate lifecycle for academic institutions</p>
                </div>
                <div className="features-grid">
                    {FEATURES.map(f => (
                        <div key={f.title} className="feature-card">
                            <div className="feature-icon" style={{ background: f.color + '22', color: f.color }}>
                                {f.icon}
                            </div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Footer */}
            <section className="landing-cta">
                <h2>Ready to Start Tracking?</h2>
                <p>Join your institution's certification management platform today.</p>
                <div className="hero-actions" style={{ justifyContent: 'center' }}>
                    <Link to="/register" className="btn btn-primary btn-lg">Create Free Account</Link>
                    <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
                </div>
            </section>
        </div>
    );
}
