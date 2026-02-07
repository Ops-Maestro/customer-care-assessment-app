import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Professional UI Color Palette
const colors = {
  primary: '#4361ee',
  secondary: '#3a0ca3',
  success: '#28a745',
  danger: '#dc3545',
  background: '#f1f5f9',
  textHeader: '#000000',
  textData: '#000000',
  white: '#ffffff',
  border: '#e2e8f0'
};

const styles = {
  th: { padding: '18px 25px', textAlign: 'left', fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '20px 25px', verticalAlign: 'middle' },
  logoutBtn: {
    padding: '10px 20px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', backdropFilter: 'blur(5px)'
  },
  statusBadge: {
    background: '#e0e7ff', color: colors.primary, padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700'
  },
  delBtn: {
    background: 'none', color: colors.danger, border: `1px solid ${colors.danger}`, padding: '8px 14px',
    borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '800', transition: 'all 0.3s'
  },
  searchBar: {
    width: '100%', padding: '12px 20px', marginBottom: '20px', borderRadius: '10px', border: `1px solid ${colors.border}`,
    fontSize: '14px', outline: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
  },
  // Added metric indicator style for the table
  metricBox: (color) => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '800',
    color: color,
    border: `1px solid ${color}30`,
    marginRight: '5px'
  })
};

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    if (isAdmin !== 'true') {
      navigate('/admin');
      return;
    }
    fetchUsers();
    fetchAdminLogs();
  }, [navigate]);

  const fetchUsers = () => {
    api.get('/api/admin/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  };

  const fetchAdminLogs = () => {
    api.get('/api/admin/admin-logs')
      .then(res => setAdminLogs(res.data))
      .catch(err => console.error(err));
  };

  const deleteUser = async (email) => {
    if (window.confirm(`Permanently delete records for ${email}?`)) {
      try {
        await api.delete(`/api/admin/users/${email}`);
        fetchUsers();
      } catch (error) { alert('Delete failed'); }
    }
  };

  const deleteAdminLog = async (id) => {
    if (window.confirm(`Permanently delete this admin login record?`)) {
      try {
        await api.delete(`/api/admin/admin-logs/${id}`);
        fetchAdminLogs();
      } catch (error) { alert('Delete failed'); }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/admin');
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return "No Login Recorded";
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // ✅ NEW: Helper to calculate duration till current period
  const calculateTimeAgo = (dateString) => {
    if (!dateString) return "";
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + (interval === 1 ? " year ago" : " years ago");
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + (interval === 1 ? " month ago" : " months ago");
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + (interval === 1 ? " day ago" : " days ago");
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + (interval === 1 ? " hour ago" : " hours ago");
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + (interval === 1 ? " minute ago" : " minutes ago");
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, padding: '30px', fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          padding: '30px', borderRadius: '15px', color: colors.white,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 10px 25px rgba(67, 97, 238, 0.3)', marginBottom: '30px'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>
              <i className="fas fa-user-shield" style={{ marginRight: '15px' }}></i>
              ADMIN MANAGEMENT PORTAL
            </h1>
            <p style={{ margin: '5px 0 0', opacity: 0.8, fontWeight: '400' }}>System Oversight & Security Logs</p>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i> LOGOUT
          </button>
        </div>

        {/* ADMIN ACCESS LOGS SECTION */}
        <div style={{ background: colors.white, borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '40px', border: `1px solid ${colors.primary}40` }}>
          <div style={{ padding: '20px 30px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', background: `${colors.primary}08` }}>
            <i className="fas fa-shield-alt" style={{ color: colors.secondary, marginRight: '10px' }}></i>
            <h3 style={{ margin: 0, fontWeight: '800', fontSize: '18px', color: colors.secondary }}>ADMIN LOGIN AUDIT</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: `2px solid ${colors.border}` }}>
                <th style={styles.th}>ADMIN IDENTITY</th>
                <th style={styles.th}>ACCESS STATUS</th>
                <th style={styles.th}>LOGIN TIMESTAMP</th>
                <th style={styles.th}>SESSION DURATION</th>
                <th style={styles.th}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {adminLogs.map((log, index) => (
                <tr key={index} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#000' }}>{log.email}</div>
                    {log.email === localStorage.getItem('adminEmail') && (
                      <div style={{ fontSize: '11px', color: colors.success, fontWeight: '800' }}>CURRENT SESSION</div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statusBadge, background: '#ecfdf5', color: '#059669' }}>Authorized Access</span>
                  </td>
                  <td style={styles.td}>{formatFullDate(log.timestamp)}</td>
                  {/* ✅ Added Duration Column */}
                  <td style={styles.td}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: colors.primary }}>
                      {calculateTimeAgo(log.timestamp)}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => deleteAdminLog(log._id || index)} style={styles.delBtn}>DELETE LOG</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* USER RECORDS TABLE */}
        <div style={{ background: colors.white, borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 30px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center' }}>
            <i className="fas fa-list-ul" style={{ color: colors.primary, marginRight: '10px' }}></i>
            <h3 style={{ margin: 0, fontWeight: '700', fontSize: '18px' }}>USER ACCESS LOGS</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: `2px solid ${colors.border}` }}>
                <th style={styles.th}>USER IDENTITY</th>
                <th style={styles.th}>MARKING METRICS</th>
                <th style={styles.th}>OVERALL SCORE</th>
                <th style={styles.th}>LOGIN TIMESTAMP</th>
                <th style={styles.th}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, index) => (
                <tr key={u.email} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#000' }}>{u.name || "Unknown User"}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{u.email}</div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ whiteSpace: 'nowrap' }}>
                      <span style={styles.metricBox(colors.success)}>R: {u.correctCount || 0}</span>
                      <span style={styles.metricBox(colors.danger)}>W: {u.wrongCount || 0}</span>
                      <span style={styles.metricBox('#f59e0b')}>S: {u.skippedCount || 0}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: colors.primary }}>
                      {/* ✅ Logic Update: Display score only if test is submitted, otherwise show Pending */}
                      {u.testSubmitted ? `${u.overallScore}%` : <span style={{fontSize: '12px', color: '#94a3b8'}}>PENDING</span>}
                    </div>
                    {u.testSubmitted && (
                      <div style={{ fontSize: '10px', color: colors.success, fontWeight: '800', marginTop: '4px' }}>
                        <i className="fas fa-envelope-open-text"></i> EMAIL DISPATCHED
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>{formatFullDate(u.lastLogin)}</td>
                  <td style={styles.td}>
                    <button onClick={() => deleteUser(u.email)} style={styles.delBtn}>CONFIRM & DELETE</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}