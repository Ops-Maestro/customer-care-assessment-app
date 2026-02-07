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
        // ✅ Ensure the exact email used is saved for the Audit trail to pick up
        localStorage.setItem('adminEmail', email.trim());
        
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
      padding: '20px',
      fontFamily: "'Poppins', sans-serif" // Applied Poppins font
    }}>
      <div style={{
        background: colors.white,
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        padding: '40px',
        width: '100%',
        maxWidth: '450px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '75px',
            height: '75px',
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.warning})`,
            borderRadius: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 10px 20px rgba(114, 9, 183, 0.3)'
          }}>
            {/* Replaced emoji with Font Awesome icon */}
            <i className="fas fa-user-shield" style={{ fontSize: '32px', color: colors.white }}></i>
          </div>
          <h2 style={{ color: colors.text, margin: '0 0 8px 0', fontWeight: '800', letterSpacing: '-0.5px' }}>ADMIN ACCESS</h2>
          <p style={{ color: colors.lightText, margin: 0, fontWeight: '500' }}>Enter your credentials to manage the portal</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', color: colors.text, marginBottom: '8px', fontWeight: '700', fontSize: '14px' }}>
              <i className="fas fa-envelope" style={{ marginRight: '8px', color: colors.primary }}></i>
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              style={{
                width: '100%',
                padding: '15px',
                background: colors.inputBg,
                border: `2px solid ${colors.border}`,
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700', // Set to 15px Bold
                color: '#000000', // Set to Black
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'flex', alignItems: 'center', color: colors.text, marginBottom: '8px', fontWeight: '700', fontSize: '14px' }}>
              <i className="fas fa-lock" style={{ marginRight: '8px', color: colors.primary }}></i>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '15px',
                background: colors.inputBg,
                border: `2px solid ${colors.border}`,
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700', // Set to 15px Bold
                color: '#000000', // Set to Black
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fff5f5',
              border: `1px solid ${colors.warning}`,
              color: colors.warning,
              padding: '12px 15px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <i className="fas fa-exclamation-triangle"></i>
              {error}
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
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '800',
              boxShadow: loading ? 'none' : '0 8px 15px rgba(114, 9, 183, 0.2)',
              transition: 'transform 0.2s, boxShadow 0.2s'
            }}
          >
            {loading ? 'Verifying...' : 'SIGN IN TO PANEL'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '25px',
          paddingTop: '20px',
          borderTop: `1px solid ${colors.border}`,
          color: colors.lightText,
          fontSize: '13px',
          fontWeight: '600'
        }}>
          <p style={{ margin: 0 }}>
            <i className="fas fa-shield-alt" style={{ marginRight: '5px' }}></i> 
            Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}