import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';

const TEST_DURATION_SECONDS = 30 * 60; // 30 minutes
const LOCAL_STORAGE_KEY = 'testAnswers';

// Enhanced Color theme with more variations
const colors = {
  primary: '#4361ee',
  secondary: '#3a0ca3',
  accent: '#7209b7',
  success: '#4cc9f0',
  warning: '#f72585',
  info: '#4895ef',
  danger: '#e63946',
  background: '#f8f9fa',
  text: '#2b2d42',
  lightText: '#8d99ae',
  white: '#ffffff',
  cardBg: '#ffffff',
  border: '#e9ecef',
  inputBg: '#ffffff',
  
  // New colors for specific elements
  skipButton: '#6c757d',
  nextButton: '#4361ee',
  submitButton: '#2a9d8f',
  optionHover: '#e9ecef',
  optionSelected: '#4361ee',
  loadingBg: '#f8f9fa',
  progressBar: '#4cc9f0'
};

// ✅ NEW: Progress API functions
const saveProgress = async (currentQuestionIndex, timeRemaining, answers) => {
  try {
    const response = await api.post('/api/save-progress', {
      currentQuestionIndex,
      timeRemaining,
      answers
    });
    return response.data;
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
};

const getUserProgress = async () => {
  try {
    const response = await api.get('/api/user-progress');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch progress:', error);
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
  const [resumingProgress, setResumingProgress] = useState(false);

  // 🔐 Load user + questions + progress
  useEffect(() => {
    const initializeApp = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        alert('Please log in first.');
        window.location.href = '/login';
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser.email) {
        alert('Invalid user. Please log in again.');
        window.location.href = '/login';
        return;
      }
      setUser(parsedUser);

      try {
        // Load questions first
        const questionsResponse = await api.get('/api/questions');
        setQuestions(questionsResponse.data);

        // Then load user progress
        const progress = await getUserProgress();
        
        if (progress && progress.hasProgress) {
          setResumingProgress(true);
          setCurrentIndex(progress.currentQuestionIndex);
          setTimeLeft(progress.timeRemaining);
          setAnswers(progress.answers || {});
          console.log('Resuming from previous session...');
        } else {
          // Load saved answers from localStorage as fallback
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (saved) setAnswers(JSON.parse(saved));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load questions:', error);
        setError(`Failed to load questions: ${error.response?.data?.error || error.message}`);
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // ⏱ Timer + Auto-submit on timeout + Auto-save progress
  useEffect(() => {
    if (timeLeft <= 0 && !submitted) {
      handleSubmit(true);
      return;
    }
    if (submitted) return;

    const timerId = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [timeLeft, submitted]);

  // 💾 Auto-save progress to server every 30 seconds
  useEffect(() => {
    if (submitted || loading || questions.length === 0) return;

    const saveProgressInterval = setInterval(async () => {
      await saveProgress(currentIndex, timeLeft, answers);
    }, 30000); // Save every 30 seconds

    return () => clearInterval(saveProgressInterval);
  }, [currentIndex, timeLeft, answers, submitted, loading, questions.length]);

  // 💾 Auto-save to localStorage on answer change
  useEffect(() => {
    if (!submitted) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(answers));
    }
  }, [answers, submitted]);

  // ✅ NEW: Save progress when moving to next question
  const handleSelect = async (option) => {
    const newAnswers = { ...answers, [questions[currentIndex].id]: option };
    setAnswers(newAnswers);
    // Save progress immediately when answering
    await saveProgress(currentIndex, timeLeft, newAnswers);
  };

  // ✅ NEW: Save progress when skipping
  const handleSkip = async () => {
    const qid = questions[currentIndex].id;
    const newAnswers = { ...answers, [qid]: null };
    setAnswers(newAnswers);
    
    // Save progress before moving to next question
    await saveProgress(currentIndex, timeLeft, newAnswers);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  };

  // ✅ NEW: Save progress when going to next question
  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      // Save progress before moving
      await saveProgress(currentIndex + 1, timeLeft, answers);
      setCurrentIndex(i => i + 1);
    }
  };

  async function handleSubmit(silent = false) {
    if (submitted || submitting) return;

    if (!silent && !window.confirm('Are you sure you want to submit your test? You cannot go back after submitting.')) return;

    setSubmitting(true);
    setSubmitted(true);

    // ✅ Ensure all questions are included (answered or skipped)
    const completeAnswers = {};
    questions.forEach(q => {
      completeAnswers[q.id] = answers[q.id] ?? null;
    });

    try {
      await api.post('/api/submit', {
        answers: completeAnswers,
        overallScore: 0 // You can calculate this if needed
      });
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setSubmissionSummary(completeAnswers);
    } catch (err) {
      if (!silent) {
        alert('Failed to submit answers.');
        setSubmitted(false);
        setSubmitting(false);
      }
    }
  }

  function handleLogout() {
    // Clear ALL authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem(LOCAL_STORAGE_KEY); // Keep this for test answers
    
    window.location.href = '/login';
  }

  // Calculate progress
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).filter(key => answers[key] !== null).length;

  // UI States
  if (loading) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: `linear-gradient(135deg, ${colors.loadingBg}, ${colors.white})`
    }}>
      <div style={{
        background: colors.white,
        padding: '50px',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        border: `2px solid ${colors.border}`
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: `4px solid ${colors.border}`,
          borderTop: `4px solid ${colors.info}`,
          borderRadius: '50%',
          animation: 'spin 1.5s linear infinite',
          margin: '0 auto 25px'
        }}></div>
        <h3 style={{ 
          color: colors.text, 
          margin: '0 0 10px 0',
          fontSize: '1.5em'
        }}>Loading Assessment</h3>
        <p style={{ 
          color: colors.lightText,
          margin: 0
        }}>Preparing your questions...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ 
      maxWidth: 500, 
      margin: '50px auto', 
      padding: '40px',
      background: colors.white,
      borderRadius: '20px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      textAlign: 'center',
      border: `2px solid ${colors.danger}`
    }}>
      <div style={{ 
        fontSize: '64px', 
        color: colors.danger, 
        marginBottom: '20px' 
      }}>⚠️</div>
      <h3 style={{ 
        color: colors.text, 
        marginBottom: '15px',
        fontSize: '1.5em'
      }}>Error Loading Questions</h3>
      <p style={{ 
        color: colors.lightText, 
        marginBottom: '30px',
        lineHeight: '1.5'
      }}>{error}</p>
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            background: colors.info,
            color: colors.white,
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = colors.primary;
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = colors.info;
            e.target.style.transform = 'translateY(0)';
          }}
        >
          🔄 Retry
        </button>
        <button 
          onClick={handleLogout}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            color: colors.text,
            border: `2px solid ${colors.border}`,
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = colors.background;
            e.target.style.borderColor = colors.lightText;
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.borderColor = colors.border;
          }}
        >
          🚪 Go to Login
        </button>
      </div>
    </div>
  );

  if (questions.length === 0) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: colors.background
    }}>
      <div style={{
        background: colors.white,
        padding: '50px',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        border: `2px solid ${colors.border}`
      }}>
        <div style={{ 
          fontSize: '64px', 
          marginBottom: '20px' 
        }}>📝</div>
        <h3 style={{ 
          color: colors.text, 
          marginBottom: '10px' 
        }}>No Questions Available</h3>
        <p style={{ 
          color: colors.lightText,
          margin: 0
        }}>Please check back later.</p>
      </div>
    </div>
  );

  // ✅ Show submission summary after test
  if (submitted && submissionSummary) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.success}, ${colors.primary})`,
        padding: '20px'
      }}>
        <div style={{
          maxWidth: 800,
          margin: '30px auto',
          background: colors.white,
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            background: `linear-gradient(135deg, ${colors.submitButton}, ${colors.success})`,
            padding: '40px',
            textAlign: 'center',
            color: colors.white
          }}>
            <h1 style={{ margin: 0, fontSize: '3em' }}>🎉</h1>
            <h2 style={{ margin: '15px 0 10px', fontSize: '2em' }}>Test Submitted Successfully!</h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1em' }}>Thank you, {user.name}!</p>
          </div>
          
          <div style={{ padding: '40px' }}>
            <div style={{
              background: colors.background,
              padding: '25px',
              borderRadius: '15px',
              marginBottom: '30px',
              border: `2px solid ${colors.border}`
            }}>
              <h3 style={{ color: colors.text, marginBottom: '20px', textAlign: 'center' }}>Submission Summary</h3>
              <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '2em', 
                    fontWeight: 'bold', 
                    color: colors.primary 
                  }}>{questions.length}</div>
                  <div style={{ fontSize: '14px', color: colors.lightText }}>Total Questions</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '2em', 
                    fontWeight: 'bold', 
                    color: colors.success 
                  }}>{answeredCount}</div>
                  <div style={{ fontSize: '14px', color: colors.lightText }}>Answered</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '2em', 
                    fontWeight: 'bold', 
                    color: colors.warning 
                  }}>{questions.length - answeredCount}</div>
                  <div style={{ fontSize: '14px', color: colors.lightText }}>Skipped</div>
                </div>
              </div>
            </div>

            <h4 style={{ color: colors.text, marginBottom: '20px', textAlign: 'center' }}>Your Answers:</h4>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {questions.map((q, index) => (
                <div key={q.id} style={{
                  padding: '20px',
                  border: `2px solid ${submissionSummary[q.id] ? colors.success : colors.warning}`,
                  borderRadius: '12px',
                  marginBottom: '15px',
                  background: submissionSummary[q.id] ? `${colors.success}15` : `${colors.warning}15`
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{
                      background: submissionSummary[q.id] ? colors.success : colors.warning,
                      color: colors.white,
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: colors.text, fontSize: '1.1em' }}>Q: {q.question}</strong>
                      <div style={{ 
                        color: submissionSummary[q.id] ? colors.success : colors.warning,
                        marginTop: '10px',
                        fontWeight: '600',
                        fontSize: '1em'
                      }}>
                        Your Answer: {submissionSummary[q.id] ?? 'Skipped'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={handleLogout} 
              style={{
                width: '100%',
                padding: '18px',
                background: colors.primary,
                color: colors.white,
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '600',
                marginTop: '30px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = colors.secondary;
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = colors.primary;
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const selected = answers[q.id];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div style={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.background}, ${colors.white})`,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        background: colors.white,
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        border: `2px solid ${colors.border}`
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          padding: '30px',
          color: colors.white
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.8em', fontWeight: '700' }}>Customer Care Assessment</h2>
              <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '1.1em' }}>
                Welcome, <strong>{user.name}</strong> ({user.email})
              </p>
              {resumingProgress && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🔄 Resuming from previous session
                </div>
              )}
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

          {/* Progress Bar */}
          <div style={{ marginTop: '25px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              fontSize: '15px'
            }}>
              <span>Progress: {currentIndex + 1} of {questions.length}</span>
              <span>{answeredCount} answered • {questions.length - answeredCount} remaining</span>
            </div>
            <div style={{
              width: '100%',
              height: '10px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '5px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: colors.progressBar,
                borderRadius: '5px',
                transition: 'width 0.5s ease',
                boxShadow: `0 0 10px ${colors.progressBar}`
              }}></div>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div style={{
          background: timeLeft < 300 ? colors.warning : colors.accent,
          color: colors.white,
          padding: '18px 30px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '1.3em',
          borderBottom: `2px solid ${colors.border}`
        }}>
          ⏱️ Time Left: {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          {timeLeft < 300 && (
            <span style={{ 
              marginLeft: '10px',
              animation: 'pulse 1s infinite'
            }}>
              ⚠️ Hurry!
            </span>
          )}
        </div>

        {/* Question */}
        <div style={{ padding: '40px' }}>
          <div style={{
            background: `linear-gradient(135deg, ${colors.background}, ${colors.white})`,
            padding: '30px',
            borderRadius: '15px',
            marginBottom: '30px',
            border: `2px solid ${colors.border}`,
            borderLeft: `6px solid ${colors.info}`
          }}>
            <h3 style={{ 
              color: colors.info, 
              margin: '0 0 12px 0',
              fontSize: '1.1em',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Question {currentIndex + 1} of {questions.length}
            </h3>
            <p style={{ 
              color: colors.text, 
              margin: 0,
              fontSize: '1.3em',
              fontWeight: '500',
              lineHeight: '1.6'
            }}>
              {q.question}
            </p>
          </div>

          {/* Options */}
          <div style={{ marginBottom: '35px' }}>
            {q.options.map((opt, index) => (
              <label 
                key={index}
                style={{
                  display: 'block',
                  padding: '20px 25px',
                  marginBottom: '15px',
                  background: selected === opt 
                    ? colors.optionSelected 
                    : hoveredOption === index 
                    ? colors.optionHover 
                    : colors.cardBg,
                  color: selected === opt ? colors.white : colors.text,
                  border: `2px solid ${
                    selected === opt 
                      ? colors.optionSelected 
                      : hoveredOption === index 
                      ? colors.primary 
                      : colors.border
                  }`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: '500',
                  fontSize: '1.1em',
                  transform: selected === opt ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: selected === opt 
                    ? `0 5px 15px ${colors.optionSelected}40` 
                    : hoveredOption === index 
                    ? `0 5px 15px ${colors.primary}20` 
                    : '0 2px 5px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={() => setHoveredOption(index)}
                onMouseLeave={() => setHoveredOption(null)}
              >
                <input
                  type="radio"
                  name={`question-${q.id}`}
                  value={opt}
                  checked={selected === opt}
                  onChange={() => handleSelect(opt)}
                  style={{ 
                    marginRight: '15px',
                    transform: 'scale(1.3)',
                    accentColor: colors.primary
                  }}
                />
                {opt}
              </label>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '20px',
            justifyContent: currentIndex === questions.length - 1 ? 'center' : 'flex-end',
            alignItems: 'center'
          }}>
            {currentIndex < questions.length - 1 ? (
              <>
                <button 
                  onClick={handleSkip}
                  style={{
                    padding: '16px 32px',
                    background: colors.skipButton,
                    color: colors.white,
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#5a6268';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(108, 117, 125, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = colors.skipButton;
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  ⏭️ Skip Question
                </button>
                <button 
                  onClick={handleNext}
                  disabled={!selected}
                  style={{
                    padding: '16px 32px',
                    background: selected ? colors.nextButton : colors.border,
                    color: selected ? colors.white : colors.lightText,
                    border: 'none',
                    borderRadius: '12px',
                    cursor: selected ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => {
                    if (selected) {
                      e.target.style.background = colors.secondary;
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 20px rgba(67, 97, 238, 0.3)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selected) {
                      e.target.style.background = colors.nextButton;
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                >
                  Next Question ➡️
                </button>
              </>
            ) : (
              <button 
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                style={{
                  padding: '20px 50px',
                  background: submitting ? colors.border : colors.submitButton,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '15px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  minWidth: '220px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
                onMouseOver={(e) => {
                  if (!submitting) {
                    e.target.style.background = '#248277';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 10px 25px rgba(42, 157, 143, 0.3)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!submitting) {
                    e.target.style.background = colors.submitButton;
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                {submitting ? (
                  <>
                    <div style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      border: '2px solid transparent',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    📝 Submit Test
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}