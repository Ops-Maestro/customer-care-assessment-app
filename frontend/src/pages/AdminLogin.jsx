import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Color theme matching the main app
const colors = {
  primary: '#4361ee',
  secondary: '#3a0ca3',
  accent: '#7209b7',
  success: '#4cc9f0',
  warning: '#f72585',
  background: '#f8f9fa',
  text: '#2b2d42',
  lightText: '#8d99ae',
  white: '#ffffff',
  cardBg: '#ffffff',
  border: '#e9ecef',
  inputBg: '#ffffff'
};

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE = process.env.REACT_APP_API_URL;

  // ✅ Redirect if already logged in
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    const token = localStorage.getItem('authToken');
    if (isAdmin === 'true' && token) {
      navigate('/admin-dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      setLoading(true);

      // Send admin login data to backend
      const response = await axios.post(`${API_BASE}/api/admin/login`, {
        email: email.trim(),
        password: password
      });

      // Save JWT token and admin data
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminEmail', email);
        
        console.log('Admin login successful');
        
        // Redirect to admin dashboard
        navigate('/admin-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login. Please try again.');
      console.error('Admin login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: colors.white,
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        padding: '40px',
        width: '100%',
        maxWidth: '450px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '70px',
            height: '70px',
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.warning})`,
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <span style={{ fontSize: '28px', color: colors.white }}>🔐</span>
          </div>
          <h2 style={{ color: colors.text, margin: '0 0 8px 0' }}>Admin Login</h2>
          <p style={{ color: colors.lightText, margin: 0 }}>Access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: colors.text, marginBottom: '8px', fontWeight: '600' }}>
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Enter admin email"
              style={{
                width: '100%',
                padding: '15px',
                background: colors.inputBg,
                border: `2px solid ${colors.border}`,
                borderRadius: '10px',
                fontSize: '16px',
                color: colors.text
              }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', color: colors.text, marginBottom: '8px', fontWeight: '600' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter admin password"
              style={{
                width: '100%',
                padding: '15px',
                background: colors.inputBg,
                border: `2px solid ${colors.border}`,
                borderRadius: '10px',
                fontSize: '16px',
                color: colors.text
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fff5f5',
              border: `1px solid ${colors.warning}`,
              color: colors.warning,
              padding: '12px 15px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? colors.border : `linear-gradient(135deg, ${colors.accent}, ${colors.warning})`,
              color: colors.white,
              border: 'none',
              borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            {loading ? 'Logging in...' : 'Admin Login 🔑'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '25px',
          paddingTop: '20px',
          borderTop: `1px solid ${colors.border}`,
          color: colors.lightText,
          fontSize: '13px'
        }}>
          <p style={{ margin: 0 }}>Restricted access - authorized personnel only</p>
        </div>
      </div>
    </div>
  );
}