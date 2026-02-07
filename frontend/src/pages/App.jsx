import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../services/api';

const TEST_DURATION_SECONDS = 30 * 60; 
const LOCAL_STORAGE_KEY = 'testAnswers';

const colors = {
  primary: '#4361ee',
  secondary: '#3a0ca3',
  accent: '#7209b7',
  success: '#10b981', // Green for status/submit
  warning: '#ffb703', // Yellow for Skip
  danger: '#e63946',  // Red for Exit
  wine: '#800020',    // Wine for Logout
  background: '#f1f5f9',
  text: '#000000',
  white: '#ffffff',
  border: '#e2e8f0',
  progressBar: '#4cc9f0'
};

const saveProgress = async (currentQuestionIndex, timeRemaining, answers) => {
  try {
    await api.post('/api/save-progress', { 
      currentQuestionIndex, 
      timeRemaining, 
      answers 
    });
  } catch (error) { 
    console.error('Save error:', error); 
  }
};

const getUserProgress = async () => {
  try {
    const response = await api.get('/api/user-progress');
    return response.data;
  } catch (error) { 
    return null; 
  }
};

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_SECONDS);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [submissionSummary, setSubmissionSummary] = useState(null);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [results, setResults] = useState(null); // ✅ Added to store marking metrics

  useEffect(() => {
    const initializeApp = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) { 
        window.location.href = '/login'; 
        return; 
      }
      
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      try {
        const questionsResponse = await api.get('/api/questions');
        setQuestions(questionsResponse.data);
        
        const progress = await getUserProgress();
        if (progress && progress.hasProgress) {
          setCurrentIndex(progress.currentQuestionIndex);
          setTimeLeft(progress.timeRemaining);
          setAnswers(progress.answers || {});
        } else {
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (saved) {
            setAnswers(JSON.parse(saved));
          }
        }
        setLoading(false);
      } catch (err) {
        setError(`Failed to load assessment`);
        setLoading(false);
      }
    };
    initializeApp();
  }, []);

  const handleSubmit = useCallback(async (silent = false) => {
    if (submitted || submitting || questions.length === 0) return;
    if (!silent && !window.confirm('Submit your test?')) return;
    
    setSubmitting(true);
    
    const completeAnswers = {};
    questions.forEach((q) => { 
      completeAnswers[q.id] = answers[q.id] ?? null; 
    });

    try {
      const response = await api.post('/api/submit', { 
        answers: completeAnswers, 
        overallScore: 0 
      });
      
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setResults(response.data); // ✅ Store the marking results (score, correctCount, etc.)
      setSubmissionSummary(completeAnswers);
      setSubmitted(true);
      setSubmitting(false);
    } catch (err) {
      if (!silent) { 
        alert('Submission failed'); 
        setSubmitted(false); 
        setSubmitting(false); 
      }
    }
  }, [answers, questions, submitted, submitting]);

  useEffect(() => {
    if (timeLeft <= 0 && !submitted) { 
      handleSubmit(true); 
      return; 
    }
    if (submitted) return;
    
    const timerId = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [timeLeft, submitted, handleSubmit]);

  const handleSelect = async (option) => {
    if (!questions[currentIndex]) return;
    const newAnswers = { 
      ...answers, 
      [questions[currentIndex].id]: option 
    };
    setAnswers(newAnswers);
    await saveProgress(currentIndex, timeLeft, newAnswers);
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      await saveProgress(currentIndex + 1, timeLeft, answers);
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          background: colors.background 
        }}
      >
        <i 
          className="fas fa-circle-notch fa-spin" 
          style={{ 
            fontSize: '40px', 
            color: colors.primary 
          }}
        ></i>
      </div>
    );
  }

  if (!questions || questions.length === 0 || !questions[currentIndex]) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          background: colors.background 
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <i 
            className="fas fa-sync fa-spin" 
            style={{ 
              fontSize: '30px', 
              color: colors.primary, 
              marginBottom: '15px' 
            }}
          ></i>
          <p style={{ fontWeight: '800' }}>
            INITIALIZING ASSESSMENT DATA...
          </p>
        </div>
      </div>
    );
  }

  if (submitted && submissionSummary) {
    return (
      <div 
        style={{ 
          minHeight: '100vh', 
          background: colors.background, 
          padding: '40px', 
          fontFamily: "'Poppins', sans-serif" 
        }}
      >
        <div 
          style={{ 
            maxWidth: 800, 
            margin: '0 auto', 
            background: '#fff', 
            borderRadius: '20px', 
            padding: '50px', 
            textAlign: 'center', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)' 
          }}
        >
          <i 
            className="fas fa-check-circle" 
            style={{ 
              fontSize: '60px', 
              color: colors.success, 
              marginBottom: '20px' 
            }}
          ></i>
          <h2 style={{ fontWeight: '800', fontSize: '24px', color: '#000' }}>
            ASSESSMENT COMPLETED
          </h2>
          
          {/* ✅ UPDATED: Cleaned up the scores view */}
          {results && (
            <div style={{ marginTop: '30px', marginBottom: '30px' }}>
               <div style={{ fontSize: '56px', fontWeight: '900', color: colors.primary, marginBottom: '10px' }}>
                {results.score}%
              </div>
              <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                A detailed breakdown of your results will be sent to your email.
              </p>
            </div>
          )}

          <p 
            style={{ 
              fontWeight: '700', 
              fontSize: '15px', 
              color: '#000', 
              marginBottom: '30px' 
            }}
          >
            Thank you, {user?.name}. Your responses have been successfully recorded.
          </p>
          <button 
            onClick={handleLogout} 
            style={styles.primaryBtn}
          >
            <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i> 
            EXIT SYSTEM
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const selected = answers[q.id];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        backgroundColor: colors.background, 
        padding: '20px', 
        fontFamily: "'Poppins', sans-serif" 
      }}
    >
      <div 
        style={{ 
          maxWidth: 900, 
          margin: '0 auto', 
          background: colors.white, 
          borderRadius: '20px', 
          overflow: 'hidden', 
          boxShadow: '0 15px 35px rgba(0,0,0,0.05)' 
        }}
      >
        
        {/* Header Section */}
        <div 
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, 
            padding: '30px', 
            color: '#fff' 
          }}
        >
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontWeight: '800', fontSize: '20px' }}>
                CANDIDATE SYSTEM ASSESSMENT
              </h2>
              <div 
                style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  opacity: 0.9,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '5px'
                }}
              >
                {/* Green Login Status Dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div 
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: '#00ff00', 
                      borderRadius: '50%',
                      boxShadow: '0 0 5px #00ff00' 
                    }}
                  ></div>
                  <span>{user?.name}</span>
                </div>

                {/* Wine Colored Logout */}
                <span 
                  onClick={handleLogout}
                  style={{
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '800',
                    background: colors.wine,
                    color: '#fff',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}
                >
                  Logout
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '22px', fontWeight: '800' }}>
                <i className="fas fa-stopwatch" style={{ marginRight: '10px' }}></i>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                Remaining Time
              </div>
            </div>
          </div>

          <div style={{ marginTop: '25px' }}>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '13px', 
                fontWeight: '700', 
                marginBottom: '8px' 
              }}
            >
              <span>QUESTION {currentIndex + 1} OF {questions.length}</span>
              <span>{Math.round(progress)}% COMPLETE</span>
            </div>
            <div 
              style={{ 
                height: '8px', 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: '10px' 
              }}
            >
              <div 
                style={{ 
                  width: `${progress}%`, 
                  height: '100%', 
                  background: colors.progressBar, 
                  borderRadius: '10px', 
                  transition: 'width 0.4s ease' 
                }}
              ></div>
            </div>
          </div>
        </div>

        <div style={{ padding: '40px' }}>
          <div style={{ marginBottom: '30px' }}>
            <p 
              style={{ 
                fontSize: '18px', 
                fontWeight: '800', 
                color: '#000', 
                lineHeight: '1.6' 
              }}
            >
              {q.question}
            </p>
          </div>

          <div style={{ marginBottom: '40px' }}>
            {q.options.map((opt, idx) => (
              <label 
                key={idx} 
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '18px 25px', 
                  marginBottom: '12px',
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  transition: '0.2s',
                  border: `2px solid ${selected === opt ? colors.primary : colors.border}`,
                  backgroundColor: selected === opt ? '#f0f4ff' : hoveredOption === idx ? '#f8fafc' : '#fff'
                }}
                onMouseEnter={() => setHoveredOption(idx)}
                onMouseLeave={() => setHoveredOption(null)}
              >
                <input 
                  type="radio" 
                  checked={selected === opt} 
                  onChange={() => handleSelect(opt)} 
                  style={{ 
                    marginRight: '15px', 
                    transform: 'scale(1.2)' 
                  }} 
                />
                <span style={{ fontWeight: '700', fontSize: '15px', color: '#000' }}>
                  {opt}
                </span>
              </label>
            ))}
          </div>

          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}
          >
            {/* Red Exit Button */}
            <button 
              onClick={handleLogout} 
              style={styles.exitBtn}
            >
              <i className="fas fa-power-off" style={{ marginRight: '8px' }}></i>
              EXIT
            </button>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              {/* Yellow Skip Button */}
              {currentIndex < questions.length - 1 && (
                <button 
                  onClick={handleNext} 
                  style={styles.skipBtn}
                >
                  SKIP
                </button>
              )}

              {currentIndex < questions.length - 1 ? (
                <button 
                  onClick={handleNext} 
                  disabled={!selected} 
                  style={selected ? styles.primaryBtn : styles.disabledBtn}
                >
                  NEXT QUESTION 
                  <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
                </button>
              ) : (
                <button 
                  onClick={() => handleSubmit(false)} 
                  style={styles.submitBtn}
                >
                  <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i> 
                  SUBMIT ASSESSMENT
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  primaryBtn: {
    padding: '12px 25px',
    background: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '800',
    fontSize: '14px',
    cursor: 'pointer',
    transition: '0.3s'
  },
  submitBtn: {
    padding: '12px 30px',
    background: colors.success,
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '800',
    fontSize: '14px',
    cursor: 'pointer',
    transition: '0.3s'
  },
  skipBtn: {
    padding: '12px 25px',
    background: colors.warning,
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '800',
    fontSize: '14px',
    cursor: 'pointer',
    transition: '0.3s'
  },
  exitBtn: {
    padding: '10px 20px',
    background: colors.danger,
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
    transition: '0.2s'
  },
  disabledBtn: {
    padding: '12px 25px',
    background: '#e2e8f0',
    color: '#94a3b8',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '800',
    fontSize: '14px',
    cursor: 'not-allowed'
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontWeight: '800',
    fontSize: '14px',
    cursor: 'pointer',
    transition: '0.2s'
  }
};