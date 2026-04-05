import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CustomCursor from '../components/CustomCursor';
import API from '../services/api';

const CATEGORY_COLORS = {
    cloud: '#06b6d4', ai_ml: '#8b5cf6', web: '#3b82f6',
    cyber: '#ef4444', data: '#f59e0b', devops: '#10b981',
    mobile: '#ec4899', other: '#6b7280',
};

const FILTER_OPTIONS = ['all', 'pending', 'accepted', 'rejected'];

export default function FacultyDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('assigned');
    const [statusFilter, setStatusFilter] = useState('all');
    const [certificates, setCertificates] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewingId, setReviewingId] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [certRes, statsRes] = await Promise.all([
                API.get('/certificates/assigned/'),
                API.get('/certificates/faculty-stats/'),
            ]);
            setCertificates(certRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (certId, status) => {
        try {
            await API.put(`/certificates/review/${certId}/`, { status, remarks });
            setActionMsg({ type: 'success', text: `Certificate ${status} successfully.` });
            setReviewingId(null);
            setRemarks('');
            fetchData();
        } catch {
            setActionMsg({ type: 'error', text: 'Review failed.' });
        }
    };

    const handleLogout = () => { logout(); navigate('/'); };

    const filteredCerts = statusFilter === 'all'
        ? certificates
        : certificates.filter(c => c.status === statusFilter);

    const pendingCerts = certificates.filter(c => c.status === 'pending');
    const reviewedCerts = certificates.filter(c => c.status !== 'pending');

    if (loading) {
        return (
            <div className="dashboard">
                <CustomCursor /><div className="antigravity-bg" /><div className="bg-particles" />
                <div className="loading-container" style={{ width: '100%' }}><div className="spinner" /> Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <CustomCursor />
            <div className="antigravity-bg" />
            <div className="bg-particles" />

            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <h2>CertTrack</h2>
                    <span>Faculty Portal</span>
                </div>
                <nav className="sidebar-nav">
                    <a className={`sidebar-link ${activeTab === 'assigned' ? 'active' : ''}`} onClick={() => setActiveTab('assigned')}>
                        📋 All Certificates {stats?.pending > 0 && <span className="badge badge-pending" style={{ marginLeft: 'auto' }}>{stats.pending}</span>}
                    </a>
                    <a className={`sidebar-link ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>📊 Statistics</a>
                </nav>
                <div className="sidebar-footer">
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                        👤 {user?.first_name || user?.username}
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={handleLogout}>Sign Out</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {actionMsg.text && (
                    <div className={`alert-banner ${actionMsg.type}`}>
                        {actionMsg.type === 'success' ? '✅' : '❌'} {actionMsg.text}
                    </div>
                )}

                {/* Stats Row */}
                <div className="stats-grid">
                    <div className="stat-card purple"><div className="stat-value">{stats?.total_assigned || 0}</div><div className="stat-label">Total Assigned</div></div>
                    <div className="stat-card amber"><div className="stat-value">{stats?.pending || 0}</div><div className="stat-label">Pending</div></div>
                    <div className="stat-card green"><div className="stat-value">{stats?.accepted || 0}</div><div className="stat-label">Accepted</div></div>
                    <div className="stat-card pink"><div className="stat-value">{stats?.rejected || 0}</div><div className="stat-label">Rejected</div></div>
                </div>

                {/* Certificates Tab with Filter */}
                {activeTab === 'assigned' && (
                    <>
                        <div className="page-header flex justify-between items-center">
                            <div>
                                <h1>Assigned Certificates</h1>
                                <p>Review and manage student certificates</p>
                            </div>
                        </div>

                        {/* Filter Bar */}
                        <div className="filter-bar">
                            {FILTER_OPTIONS.map(f => (
                                <button
                                    key={f}
                                    className={`filter-btn ${statusFilter === f ? 'active' : ''}`}
                                    onClick={() => setStatusFilter(f)}
                                >
                                    {f === 'all' && '📋 All'}
                                    {f === 'pending' && `⏳ Pending${stats?.pending > 0 ? ` (${stats.pending})` : ''}`}
                                    {f === 'accepted' && '✅ Accepted'}
                                    {f === 'rejected' && '❌ Rejected'}
                                </button>
                            ))}
                        </div>

                        {filteredCerts.length === 0 ? (
                            <div className="card text-center" style={{ padding: 60 }}>
                                <div style={{ fontSize: '3rem', marginBottom: 16 }}>
                                    {statusFilter === 'pending' ? '✅' : '📋'}
                                </div>
                                <h3 style={{ marginBottom: 8 }}>
                                    {statusFilter === 'pending' ? 'All caught up!' : `No ${statusFilter} certificates`}
                                </h3>
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    {statusFilter === 'pending' ? 'No pending certificates to review.' : 'Nothing to show here yet.'}
                                </p>
                            </div>
                        ) : (
                            filteredCerts.map((cert) => (
                                <div key={cert.id} className="cert-card">
                                    <div className="cert-card-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                            <h3>{cert.title}</h3>
                                            {cert.category && cert.category !== 'other' && (
                                                <span className="skill-category-badge" style={{
                                                    background: CATEGORY_COLORS[cert.category] + '22',
                                                    color: CATEGORY_COLORS[cert.category],
                                                    border: `1px solid ${CATEGORY_COLORS[cert.category]}44`
                                                }}>
                                                    {cert.category_display}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`badge badge-${cert.status}`}>{cert.status}</span>
                                    </div>
                                    <div className="cert-card-meta">
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>👤 {cert.student_name}</span>
                                        <span>🏢 {cert.organization}</span>
                                        <span>📅 Issued: {cert.issue_date}</span>
                                        {cert.expiry_date && <span>⏰ Expires: {cert.expiry_date}</span>}
                                    </div>
                                    {cert.skill_tags && (
                                        <div className="skill-tags-row">
                                            {cert.skill_tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                                                <span key={tag} className="skill-tag">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                    {cert.remarks && <div className="cert-card-remarks">💬 {cert.remarks}</div>}

                                    <div className="cert-card-actions">
                                        <a href={cert.file} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                                            📄 View File
                                        </a>
                                        {cert.status === 'pending' && (
                                            reviewingId === cert.id ? (
                                                <div style={{ flex: 1 }}>
                                                    <textarea
                                                        className="form-input"
                                                        placeholder="Add remarks (optional)..."
                                                        value={remarks}
                                                        onChange={(e) => setRemarks(e.target.value)}
                                                        style={{ marginBottom: 8, minHeight: 60 }}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-success btn-sm" onClick={() => handleReview(cert.id, 'accepted')}>✅ Accept</button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleReview(cert.id, 'rejected')}>❌ Reject</button>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => { setReviewingId(null); setRemarks(''); }}>Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button className="btn btn-primary btn-sm" onClick={() => setReviewingId(cert.id)}>🔍 Review</button>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}

                {/* Stats Tab */}
                {activeTab === 'stats' && (
                    <>
                        <div className="page-header">
                            <h1>Review Statistics</h1>
                            <p>Your certification review overview</p>
                        </div>
                        <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
                            <h3 style={{ marginBottom: 24 }} className="section-title">📊 Overview</h3>
                            {[
                                { label: 'Total Assigned', val: stats?.total_assigned, color: 'var(--accent-purple)' },
                                { label: 'Accepted', val: stats?.accepted, color: 'var(--accent-green)' },
                                { label: 'Rejected', val: stats?.rejected, color: 'var(--accent-red)' },
                                { label: 'Pending', val: stats?.pending, color: 'var(--accent-amber)' },
                            ].map(({ label, val, color }) => (
                                <div key={label} style={{ marginBottom: 16 }}>
                                    <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>
                                        <span style={{ fontWeight: 700, color }}>{val || 0}</span>
                                    </div>
                                    <div className="progress-bar-container">
                                        <div className="progress-bar-fill" style={{
                                            width: `${stats?.total_assigned ? ((val || 0) / stats.total_assigned * 100) : 0}%`,
                                            background: color
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
