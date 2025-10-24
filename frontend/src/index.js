import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import App from './pages/App';               // Test taker app
import Login from './pages/Login';           // User login page
import AdminLogin from './pages/AdminLogin'; // Admin login page
import AdminDashboard from './pages/AdminDashboard'; // Admin panel

// Enhanced ProtectedRoute with JWT check
function ProtectedRoute({ children }) {
  const [isAuth, setIsAuth] = React.useState(null);

  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    setIsAuth(!!token && !!user);
  }, []);

  if (isAuth === null) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return isAuth ? children : <Navigate to="/login" />;
}

// Enhanced AdminRoute with JWT check
function AdminRoute({ children }) {
  const [isAdmin, setIsAdmin] = React.useState(null);

  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    const isAdminVal = localStorage.getItem('isAdmin');
    setIsAdmin(!!token && !!isAdminVal);
  }, []);

  if (isAdmin === null) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return isAdmin ? children : <Navigate to="/admin" />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <Routes>
      {/* Public login pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminLogin />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
      <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      {/* Redirect all unknown paths to home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </Router>
);