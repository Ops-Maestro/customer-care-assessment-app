import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Color theme matching the main app
const colors = {
  primary: '#4361ee',
  secondary: '#3a0ca3',
  accent: '#7209b7',
  success: '#4cc9f0',
  warning: '#f72585',
  danger: '#e63946',
  background: '#f8f9fa',
  text: '#2b2d42',
  lightText: '#8d99ae',
  white: '#ffffff',
  cardBg: '#ffffff',
  border: '#e9ecef',
  tableHeader: '#3a0ca3',
  tableStriped: '#f8f9fa'
};

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [errorUsers, setErrorUsers] = useState('');
  const [errorSubs, setErrorSubs] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState('');
  const navigate = useNavigate();

  // ✅ Quick initial auth check
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    const token = localStorage.getItem('authToken');
    
    if (isAdmin !== 'true' || !token) {
      alert('Access denied. Admins only. Please log in as admin.');
      navigate('/admin');
      return;
    }
    
    // Start loading data immediately
    fetchUsers();
    fetchSubmissions();
    
    // Verify token validity in background
    verifyToken();
  }, [navigate]);

  // ✅ Verify token validity in background
  const verifyToken = async () => {
    try {
      await api.get('/api/admin/users');
      setAuthChecked(true);
    } catch (error) {
      console.error('Token verification failed:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthError('Session expired. Please log in again.');
        // Don't redirect immediately, let user see the error
      }
    }
  };

  // ✅ Fetch users and submissions
  const fetchUsers = () => {
    setLoadingUsers(true);
    api.get('/api/admin/users')
      .then(res => {
        setUsers(res.data);
        setErrorUsers('');
      })
      .catch((error) => {
        console.error('Users fetch error:', error);
        setErrorUsers(`Failed to load users: ${error.response?.data?.error || error.message}`);
      })
      .finally(() => setLoadingUsers(false));
  };

  const fetchSubmissions = () => {
    setLoadingSubs(true);
    api.get('/api/admin/submissions')
      .then(res => {
        setSubmissions(res.data);
        setErrorSubs('');
      })
      .catch((error) => {
        console.error('Submissions fetch error:', error);
        setErrorSubs(`Failed to load submissions: ${error.response?.data?.error || error.message}`);
      })
      .finally(() => setLoadingSubs(false));
  };

  // ✅ Delete user function
  const deleteUser = async (email) => {
    if (authError) {
      alert('Authentication error. Please log in again.');
      handleLogout();
      return;
    }

    if (window.confirm(`Are you sure you want to delete user ${email}? This will remove all their data including progress and submissions.`)) {
      try {
        await api.delete(`/api/admin/users/${email}`);
        fetchUsers();
        alert('User deleted successfully');
      } catch (error) {
        console.error('Delete error:', error);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          alert('Authentication failed. Please log in again as admin.');
          handleLogout();
        } else {
          alert('Failed to delete user: ' + (error.response?.data?.error || error.message));
        }
      }
    }
  };

  // ✅ Bulk delete function
  const handleBulkDelete = async () => {
    if (authError) {
      alert('Authentication error. Please log in again.');
      handleLogout();
      return;
    }

    if (selectedUsers.length === 0) {
      alert('Please select users to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) {
      try {
        await api.post('/api/admin/users/bulk-delete', { emails: selectedUsers });
        setSelectedUsers([]);
        fetchUsers();
        alert(`${selectedUsers.length} users deleted successfully`);
      } catch (error) {
        console.error('Bulk delete error:', error);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          alert('Authentication failed. Please log in again as admin.');
          handleLogout();
        } else {
          alert('Failed to delete users: ' + (error.response?.data?.error || error.message));
        }
      }
    }
  };

  // ✅ Toggle user selection
  const toggleUserSelection = (email) => {
    setSelectedUsers(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  // ✅ Select all users
  const selectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.email));
    }
  };

  // ✅ Logout function
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('adminEmail');
    navigate('/admin');
  };

  // ✅ Re-authenticate function
  const handleReauthenticate = () => {
    handleLogout();
  };

  // Format date nicely
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.background}, ${colors.white})`,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        {/* Auth Error Banner */}
        {authError && (
          <div style={{
            background: colors.danger,
            color: colors.white,
            padding: '15px 20px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(230, 57, 70, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2em' }}>⚠️</span>
              <span>{authError}</span>
            </div>
            <button 
              onClick={handleReauthenticate}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.2)',
                color: colors.white,
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Login Again
            </button>
          </div>
        )}

        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          padding: '30px',
          borderRadius: authError ? '10px' : '20px 20px 0 0',
          color: colors.white,
          marginBottom: '0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: '2.2em',
                fontWeight: '700'
              }}>
                Admin Dashboard
              </h1>
              <p style={{ 
                margin: '10px 0 0', 
                opacity: 0.9,
                fontSize: '1.1em'
              }}>
                Monitor user activity and test submissions
                {!authChecked && !authError && (
                  <span style={{ marginLeft: '10px', fontSize: '0.9em' }}>
                    (Verifying access...)
                  </span>
                )}
              </p>
            </div>
            
            <button 
              onClick={handleLogout}
              style={{
                padding: '12px 24px',
                background: 'rgba(255,255,255,0.2)',
                color: colors.white,
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.3)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🚪 Logout
            </button>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginTop: '30px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '20px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              flex: '1',
              minWidth: '200px'
            }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{users.length}</div>
              <div style={{ opacity: 0.9 }}>Total Users</div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '20px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              flex: '1',
              minWidth: '200px'
            }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{submissions.length}</div>
              <div style={{ opacity: 0.9 }}>Test Submissions</div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '20px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              flex: '1',
              minWidth: '200px'
            }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold' }}>
                {users.filter(u => new Date(u.lastLogin) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
              </div>
              <div style={{ opacity: 0.9 }}>Active Today</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          background: colors.white,
          borderRadius: authError ? '10px' : '0 0 20px 20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          marginTop: authError ? '20px' : '0'
        }}>
          {/* Users Section */}
          <section style={{ padding: '40px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  width: '4px',
                  height: '30px',
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                  borderRadius: '2px'
                }}></div>
                <h3 style={{ 
                  color: colors.text, 
                  margin: 0,
                  fontSize: '1.5em',
                  fontWeight: '600'
                }}>
                  Registered Users
                </h3>
                <span style={{
                  background: colors.primary,
                  color: colors.white,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {users.length}
                </span>
              </div>

              {selectedUsers.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  disabled={!!authError}
                  style={{
                    padding: '10px 20px',
                    background: authError ? colors.lightText : colors.danger,
                    color: colors.white,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: authError ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: authError ? 'none' : 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    if (!authError) {
                      e.target.style.background = '#c1121f';
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!authError) {
                      e.target.style.background = colors.danger;
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  🗑️ Delete Selected ({selectedUsers.length})
                </button>
              )}
            </div>

            {loadingUsers ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: colors.lightText
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: `3px solid ${colors.border}`,
                  borderTop: `3px solid ${colors.primary}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 15px'
                }}></div>
                Loading users...
              </div>
            ) : errorUsers ? (
              <div style={{
                background: '#fff5f5',
                border: `1px solid ${colors.danger}`,
                color: colors.danger,
                padding: '20px',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                ⚠️ {errorUsers}
              </div>
            ) : users.length === 0 ? (
              <div style={{
                background: colors.background,
                padding: '40px',
                borderRadius: '10px',
                textAlign: 'center',
                color: colors.lightText
              }}>
                <div style={{ fontSize: '3em', marginBottom: '10px' }}>👥</div>
                <h4 style={{ color: colors.text, margin: '0 0 10px 0' }}>No Users Found</h4>
                <p>No users have registered yet.</p>
              </div>
            ) : (
              <div style={{
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 5px 15px rgba(0,0,0,0.08)'
              }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{
                      background: `linear-gradient(135deg, ${colors.tableHeader}, ${colors.secondary})`,
                      color: colors.white
                    }}>
                      <th style={{ 
                        padding: '16px 20px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '15px',
                        width: '50px'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={selectAllUsers}
                          disabled={!!authError}
                          style={{
                            transform: 'scale(1.2)',
                            cursor: authError ? 'not-allowed' : 'pointer'
                          }}
                        />
                      </th>
                      <th style={{ 
                        padding: '16px 20px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '15px'
                      }}>
                        Name
                      </th>
                      <th style={{ 
                        padding: '16px 20px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '15px'
                      }}>
                        Email
                      </th>
                      <th style={{ 
                        padding: '16px 20px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '15px'
                      }}>
                        Last Login
                      </th>
                      <th style={{ 
                        padding: '16px 20px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '15px',
                        width: '100px'
                      }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, index) => (
                      <tr key={u.email} style={{
                        background: index % 2 === 0 ? colors.white : colors.tableStriped,
                        borderBottom: `1px solid ${colors.border}`,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = colors.background;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = index % 2 === 0 ? colors.white : colors.tableStriped;
                      }}>
                        <td style={{ 
                          padding: '16px 20px',
                          textAlign: 'center'
                        }}>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(u.email)}
                            onChange={() => toggleUserSelection(u.email)}
                            disabled={!!authError}
                            style={{
                              transform: 'scale(1.2)',
                              cursor: authError ? 'not-allowed' : 'pointer'
                            }}
                          />
                        </td>
                        <td style={{ 
                          padding: '16px 20px',
                          color: colors.text,
                          fontWeight: '500'
                        }}>
                          {u.name || (
                            <span style={{ color: colors.lightText, fontStyle: 'italic' }}>
                              Not provided
                            </span>
                          )}
                        </td>
                        <td style={{ 
                          padding: '16px 20px',
                          color: colors.text
                        }}>
                          {u.email}
                        </td>
                        <td style={{ 
                          padding: '16px 20px',
                          color: colors.lightText,
                          fontSize: '13px'
                        }}>
                          {formatDate(u.lastLogin)}
                        </td>
                        <td style={{ 
                          padding: '16px 20px',
                          textAlign: 'center'
                        }}>
                          <button 
                            onClick={() => deleteUser(u.email)}
                            disabled={!!authError}
                            style={{
                              padding: '6px 12px',
                              background: authError ? colors.lightText : colors.danger,
                              color: colors.white,
                              border: 'none',
                              borderRadius: '6px',
                              cursor: authError ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              transition: authError ? 'none' : 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              if (!authError) {
                                e.target.style.background = '#c1121f';
                                e.target.style.transform = 'scale(1.05)';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!authError) {
                                e.target.style.background = colors.danger;
                                e.target.style.transform = 'scale(1)';
                              }
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Submissions Section */}
          <section style={{ 
            padding: '40px',
            borderTop: `1px solid ${colors.border}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '25px'
            }}>
              <div style={{
                width: '4px',
                height: '30px',
                background: `linear-gradient(135deg, ${colors.success}, ${colors.accent})`,
                borderRadius: '2px'
              }}></div>
              <h3 style={{ 
                color: colors.text, 
                margin: 0,
                fontSize: '1.5em',
                fontWeight: '600'
              }}>
                Test Submissions
              </h3>
              <span style={{
                background: colors.success,
                color: colors.white,
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {submissions.length}
              </span>
            </div>

            {loadingSubs ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: colors.lightText
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: `3px solid ${colors.border}`,
                  borderTop: `3px solid ${colors.success}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 15px'
                }}></div>
                Loading submissions...
              </div>
            ) : errorSubs ? (
              <div style={{
                background: '#fff5f5',
                border: `1px solid ${colors.danger}`,
                color: colors.danger,
                padding: '20px',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                ⚠️ {errorSubs}
              </div>
            ) : submissions.length === 0 ? (
              <div style={{
                background: colors.background,
                padding: '40px',
                borderRadius: '10px',
                textAlign: 'center',
                color: colors.lightText
              }}>
                <div style={{ fontSize: '3em', marginBottom: '10px' }}>📝</div>
                <h4 style={{ color: colors.text, margin: '0 0 10px 0' }}>No Submissions Yet</h4>
                <p>No test submissions have been recorded.</p>
              </div>
            ) : (
              <div style={{
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 5px 15px rgba(0,0,0,0.08)'
              }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{
                      background: `linear-gradient(135deg, ${colors.success}, #38b2ac)`,
                      color: colors.white
                    }}>
                      <th style={{ 
                        padding: '16px 20px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '15px'
                      }}>
                        User Email
                      </th>
                      <th style={{ 
                        padding: '16px 20px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '15px'
                      }}>
                        Submission Time
                      </th>
                      <th style={{ 
                        padding: '16px 20px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '15px'
                      }}>
                        Answers Summary
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub, index) => (
                      <tr key={index} style={{
                        background: index % 2 === 0 ? colors.white : colors.tableStriped,
                        borderBottom: `1px solid ${colors.border}`,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = colors.background;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = index % 2 === 0 ? colors.white : colors.tableStriped;
                      }}>
                        <td style={{ 
                          padding: '16px 20px',
                          color: colors.text,
                          fontWeight: '500'
                        }}>
                          {sub.email || sub.user}
                        </td>
                        <td style={{ 
                          padding: '16px 20px',
                          color: colors.lightText,
                          fontSize: '13px'
                        }}>
                          {formatDate(sub.assessmentDate || sub.submittedAt)}
                        </td>
                        <td style={{ 
                          padding: '16px 20px',
                          color: colors.text
                        }}>
                          <div style={{ maxWidth: '300px' }}>
                            {sub.responses && sub.responses.slice(0, 3).map((response, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '4px',
                                fontSize: '13px'
                              }}>
                                <span style={{
                                  background: response.answer ? colors.success : colors.warning,
                                  color: colors.white,
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: '600'
                                }}>
                                  Q{response.questionId}
                                </span>
                                <span style={{
                                  color: response.answer ? colors.success : colors.warning,
                                  fontWeight: '500'
                                }}>
                                  {response.answer || 'Skipped'}
                                </span>
                              </div>
                            ))}
                            {sub.responses && sub.responses.length > 3 && (
                              <div style={{
                                color: colors.lightText,
                                fontSize: '12px',
                                fontStyle: 'italic',
                                marginTop: '5px'
                              }}>
                                +{sub.responses.length - 3} more answers
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}