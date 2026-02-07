import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

export default function Login() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setError('Name and Email are required');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/api/login`, {
        name: trimmedName,
        email: trimmedEmail
      });

      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      
      localStorage.setItem('user', JSON.stringify({
        name: trimmedName,
        email: trimmedEmail
      }));

      navigate('/');
    } catch (err) {
      setError('Failed to login. Please try again.');
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
        borderRadius: '25px', // Increased roundness
        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        padding: '50px 40px',
        width: '100%',
        maxWidth: '450px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements kept as per your design */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: `linear-gradient(135deg, ${colors.accent}, ${colors.warning})`, borderRadius: '50%', opacity: 0.1 }}></div>
        <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '100px', height: '100px', background: `linear-gradient(135deg, ${colors.success}, ${colors.primary})`, borderRadius: '50%', opacity: 0.1 }}></div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '35px', position: 'relative' }}>
          <div style={{
            width: '70px',
            height: '70px',
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 10px 20px rgba(67, 97, 238, 0.3)'
          }}>
            {/* Font Awesome icon instead of emoji */}
            <i className="fas fa-file-signature" style={{ fontSize: '28px', color: '#fff' }}></i>
          </div>
          <h2 style={{ color: '#000', margin: '0 0 8px 0', fontSize: '1.8em', fontWeight: '800' }}>CANDIDATE LOGIN</h2>
          <p style={{ color: colors.lightText, margin: 0, fontWeight: '500' }}>Ready to begin your assessment?</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'flex', alignItems: 'center', color: '#000', marginBottom: '10px', fontWeight: '700', fontSize: '14px' }}>
              <i className="fas fa-user-edit" style={{ marginRight: '8px', color: colors.primary }}></i>
              FULL NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="John Doe"
              style={{
                width: '100%',
                padding: '15px',
                background: colors.inputBg,
                border: `2px solid ${colors.border}`,
                borderRadius: '12px',
                fontSize: '15px', // 15px
                fontWeight: '700', // Bold
                color: '#000',     // Black
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'flex', alignItems: 'center', color: '#000', marginBottom: '10px', fontWeight: '700', fontSize: '14px' }}>
              <i className="fas fa-envelope-open-text" style={{ marginRight: '8px', color: colors.primary }}></i>
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="john@example.com"
              style={{
                width: '100%',
                padding: '15px',
                background: colors.inputBg,
                border: `2px solid ${colors.border}`,
                borderRadius: '12px',
                fontSize: '15px', // 15px
                fontWeight: '700', // Bold
                color: '#000',     // Black
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fff5f5', border: `1px solid ${colors.warning}`, color: colors.warning,
              padding: '12px 15px', borderRadius: '10px', marginBottom: '20px',
              fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px',
              background: loading ? colors.border : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              color: colors.white,
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '800',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 20px rgba(67, 97, 238, 0.2)'
            }}
          >
            {loading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <span>START ASSESSMENT <i className="fas fa-chevron-right" style={{ marginLeft: '10px' }}></i></span>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '30px', paddingTop: '20px', borderTop: `1px solid ${colors.border}`, color: colors.lightText, fontSize: '12px', fontWeight: '600' }}>
          <p style={{ margin: 0, letterSpacing: '0.5px' }}>
            <i className="fas fa-info-circle" style={{ marginRight: '5px' }}></i>
            SECURE ASSESSMENT ENVIRONMENT
          </p>
        </div>
      </div>
    </div>
  );
}