import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CustomCursor from '../components/CustomCursor';
import API from '../services/api';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('analytics');
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [allCerts, setAllCerts] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [analyticsRes, usersRes, certsRes, lbRes] = await Promise.all([
                API.get('/certificates/analytics/'),
                API.get('/auth/users/'),
                API.get('/certificates/all/'),
                API.get('/certificates/leaderboard/'),
            ]);
            setAnalytics(analyticsRes.data);
            setUsers(usersRes.data);
            setAllCerts(certsRes.data);
            setLeaderboard(lbRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (!confirm(`Delete user "${username}"? This action cannot be undone.`)) return;
        try {
            await API.delete(`/auth/users/${userId}/`);
            setActionMsg({ type: 'success', text: `User "${username}" deleted.` });
            fetchData();
        } catch {
            setActionMsg({ type: 'error', text: 'Delete failed.' });
        }
    };

    const handleLogout = () => { logout(); navigate('/'); };

    if (loading) {
        return (
            <div className="dashboard">
                <CustomCursor /><div className="antigravity-bg" /><div className="bg-particles" />
                <div className="loading-container" style={{ width: '100%' }}><div className="spinner" /> Loading dashboard...</div>
            </div>
        );
    }

    const students = users.filter(u => u.role === 'student');
    const faculty = users.filter(u => u.role === 'faculty');

    return (
        <div className="dashboard">
            <CustomCursor />
            <div className="antigravity-bg" />
            <div className="bg-particles" />

            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <h2>CertTrack</h2>
                    <span>Admin Panel</span>
                </div>
                <nav className="sidebar-nav">
                    <a className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>📊 Analytics</a>
                    <a className={`sidebar-link ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>🏆 Leaderboard</a>
                    <a className={`sidebar-link ${activeTab === 'certificates' ? 'active' : ''}`} onClick={() => setActiveTab('certificates')}>📜 Certificates</a>
                    <a className={`sidebar-link ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>🎓 Students</a>
                    <a className={`sidebar-link ${activeTab === 'faculty' ? 'active' : ''}`} onClick={() => setActiveTab('faculty')}>👨‍🏫 Faculty</a>
                    <a className={`sidebar-link ${activeTab === 'workload' ? 'active' : ''}`} onClick={() => setActiveTab('workload')}>⚖️ Workload</a>
                </nav>
                <div className="sidebar-footer">
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                        🛡️ {user?.username}
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

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <>
                        <div className="page-header">
                            <h1>System Analytics</h1>
                            <p>Platform-wide overview and statistics</p>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card purple"><div className="stat-value">{analytics?.total_certificates || 0}</div><div className="stat-label">Total Certificates</div></div>
                            <div className="stat-card green"><div className="stat-value">{analytics?.total_students || 0}</div><div className="stat-label">Total Students</div></div>
                            <div className="stat-card amber"><div className="stat-value">{analytics?.total_faculty || 0}</div><div className="stat-label">Total Faculty</div></div>
                            <div className="stat-card pink"><div className="stat-value">{users.length}</div><div className="stat-label">Total Users</div></div>
                        </div>

                        {/* Certificate Status Distribution */}
                        <div className="card" style={{ marginBottom: 24 }}>
                            <h3 className="section-title">📊 Certificate Status Distribution</h3>
                            {analytics?.certificates_by_status && (
                                <div>
                                    {[
                                        { label: 'Accepted', val: analytics.certificates_by_status.accepted, color: 'var(--accent-green)' },
                                        { label: 'Pending', val: analytics.certificates_by_status.pending, color: 'var(--accent-amber)' },
                                        { label: 'Rejected', val: analytics.certificates_by_status.rejected, color: 'var(--accent-red)' },
                                    ].map(({ label, val, color }) => (
                                        <div key={label} style={{ marginBottom: 16 }}>
                                            <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>
                                                <span style={{ fontWeight: 700, color }}>{val}</span>
                                            </div>
                                            <div className="progress-bar-container">
                                                <div className="progress-bar-fill" style={{
                                                    width: `${analytics.total_certificates ? (val / analytics.total_certificates * 100) : 0}%`,
                                                    background: color
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Category Distribution */}
                        {analytics?.certificates_by_category && analytics.certificates_by_category.some(c => c.count > 0) && (
                            <div className="card">
                                <h3 className="section-title">🏷️ Certificates by Category</h3>
                                {analytics.certificates_by_category
                                    .filter(c => c.count > 0)
                                    .sort((a, b) => b.count - a.count)
                                    .map(({ code, label, count }) => (
                                        <div key={code} style={{ marginBottom: 14 }}>
                                            <div className="flex justify-between items-center" style={{ marginBottom: 5 }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>
                                                <span style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>{count}</span>
                                            </div>
                                            <div className="progress-bar-container">
                                                <div className="progress-bar-fill" style={{
                                                    width: `${analytics.total_certificates ? (count / analytics.total_certificates * 100) : 0}%`,
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </>
                )}

                {/* Leaderboard Tab */}
                {activeTab === 'leaderboard' && (
                    <>
                        <div className="page-header">
                            <h1>🏆 Student Leaderboard</h1>
                            <p>Top 10 students ranked by performance score</p>
                        </div>

                        {leaderboard.length === 0 ? (
                            <div className="card text-center" style={{ padding: 60 }}>
                                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏆</div>
                                <h3>No student data yet</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>Leaderboard will populate once students upload certificates.</p>
                            </div>
                        ) : (
                            <div className="leaderboard-list">
                                {leaderboard.map((s, i) => (
                                    <div key={s.id} className={`leaderboard-row ${i < 3 ? 'top-three' : ''}`}>
                                        <div className="leaderboard-rank">
                                            {i < 3 ? (
                                                <span className="medal">{MEDAL[i]}</span>
                                            ) : (
                                                <span className="rank-num">#{i + 1}</span>
                                            )}
                                        </div>
                                        <div className="leaderboard-info">
                                            <div className="leaderboard-name">{s.name}</div>
                                            <div className="leaderboard-username">@{s.username}</div>
                                        </div>
                                        <div className="leaderboard-stats">
                                            <span className="lb-stat green">✅ {s.accepted}</span>
                                            <span className="lb-stat pink">❌ {s.rejected}</span>
                                            <span className="lb-stat muted">📜 {s.total}</span>
                                        </div>
                                        <div className="leaderboard-score">
                                            <span className="score-value text-gradient">{s.score}</span>
                                            <span className="score-label">pts</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Certificates Tab */}
                {activeTab === 'certificates' && (
                    <>
                        <div className="page-header">
                            <h1>All Certificates</h1>
                            <p>{allCerts.length} total certificates in the system</p>
                        </div>
                        {allCerts.length === 0 ? (
                            <div className="card text-center" style={{ padding: 60 }}>
                                <div style={{ fontSize: '3rem', marginBottom: 16 }}>📜</div>
                                <h3>No certificates uploaded yet</h3>
                            </div>
                        ) : (
                            allCerts.map((cert) => (
                                <div key={cert.id} className="cert-card">
                                    <div className="cert-card-header">
                                        <h3>{cert.title}</h3>
                                        <span className={`badge badge-${cert.status}`}>{cert.status}</span>
                                    </div>
                                    <div className="cert-card-meta">
                                        <span>👤 Student: {cert.student_name}</span>
                                        <span>🏢 {cert.organization}</span>
                                        <span>📅 Issued: {cert.issue_date}</span>
                                        {cert.expiry_date && <span>⏰ Expires: {cert.expiry_date}</span>}
                                        <span>👨‍🏫 Faculty: {cert.faculty_name}</span>
                                    </div>
                                    {cert.skill_tags && (
                                        <div className="skill-tags-row">
                                            {cert.skill_tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                                                <span key={tag} className="skill-tag">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="cert-card-actions">
                                        <a href={cert.file} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                                            📄 View File
                                        </a>
                                    </div>
                                    {cert.remarks && <div className="cert-card-remarks">💬 {cert.remarks}</div>}
                                </div>
                            ))
                        )}
                    </>
                )}

                {/* Students Tab */}
                {activeTab === 'students' && (
                    <>
                        <div className="page-header">
                            <h1>Students</h1>
                            <p>{students.length} registered students</p>
                        </div>
                        <div className="card" style={{ overflow: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th><th>Username</th><th>Email</th>
                                        <th>Joined</th><th>Status</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((u) => (
                                        <tr key={u.id}>
                                            <td>{u.first_name} {u.last_name}</td>
                                            <td>{u.username}</td>
                                            <td>{u.email}</td>
                                            <td>{new Date(u.date_joined).toLocaleDateString()}</td>
                                            <td><span className={`badge ${u.is_active ? 'badge-accepted' : 'badge-rejected'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                                            <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u.id, u.username)}>🗑️</button></td>
                                        </tr>
                                    ))}
                                    {students.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No students registered</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Faculty Tab */}
                {activeTab === 'faculty' && (
                    <>
                        <div className="page-header">
                            <h1>Faculty Members</h1>
                            <p>{faculty.length} registered faculty</p>
                        </div>
                        <div className="card" style={{ overflow: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th><th>Username</th><th>Email</th>
                                        <th>Joined</th><th>Status</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {faculty.map((u) => (
                                        <tr key={u.id}>
                                            <td>{u.first_name} {u.last_name}</td>
                                            <td>{u.username}</td>
                                            <td>{u.email}</td>
                                            <td>{new Date(u.date_joined).toLocaleDateString()}</td>
                                            <td><span className={`badge ${u.is_active ? 'badge-accepted' : 'badge-rejected'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                                            <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u.id, u.username)}>🗑️</button></td>
                                        </tr>
                                    ))}
                                    {faculty.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No faculty registered</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Workload Tab */}
                {activeTab === 'workload' && (
                    <>
                        <div className="page-header">
                            <h1>Faculty Workload</h1>
                            <p>Current assignment distribution (max 5 pending per faculty)</p>
                        </div>
                        {analytics?.faculty_workload?.length > 0 ? (
                            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                {analytics.faculty_workload.map((f) => (
                                    <div key={f.id} className="card">
                                        <h3 style={{ marginBottom: 4 }}>{f.first_name} {f.last_name}</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>@{f.username}</p>
                                        <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                                            <span style={{ fontSize: '0.85rem' }}>Pending Slots</span>
                                            <span style={{ fontWeight: 700, color: f.pending_count >= 5 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                                                {f.pending_count}/5
                                            </span>
                                        </div>
                                        <div className="progress-bar-container" style={{ marginBottom: 16 }}>
                                            <div className="progress-bar-fill" style={{
                                                width: `${(f.pending_count / 5) * 100}%`,
                                                background: f.pending_count >= 5 ? 'linear-gradient(135deg, var(--accent-red), #dc2626)' : 'var(--gradient-cool)'
                                            }} />
                                        </div>
                                        <div className="flex justify-between" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            <span>Total Assigned: {f.total_assigned}</span>
                                            <span className={`badge ${f.pending_count >= 5 ? 'badge-rejected' : 'badge-accepted'}`}>
                                                {f.pending_count >= 5 ? 'Full' : 'Available'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="card text-center" style={{ padding: 60 }}>
                                <div style={{ fontSize: '3rem', marginBottom: 16 }}>👨‍🏫</div>
                                <h3>No faculty registered yet</h3>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
