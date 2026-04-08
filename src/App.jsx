import { useState, useRef, useEffect, Component } from 'react';
import ReactMarkdown from 'react-markdown';
import './index.css';
import Roadmap from './Roadmap';

/* ═══════════════════════════════════════════════════════
   ERROR BOUNDARY
═══════════════════════════════════════════════════════ */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="message-content" style={{ color: 'var(--on-surface)' }}>{this.props.fallback || 'Something went wrong.'}</div>;
    return this.props.children;
  }
}

/* ═══════════════════════════════════════════════════════
   SUGGESTION LOADER
═══════════════════════════════════════════════════════ */
function SuggestLoader() {
  return (
    <div className="suggest-loader">
      <span className="suggest-orb" />
      <span className="suggest-orb" />
      <span className="suggest-orb" />
      <span className="suggest-loader-text">Finding better prompts…</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DETECT MCQ REQUEST
═══════════════════════════════════════════════════════ */
function isMcqRequest(text) {
  const lower = text.toLowerCase();
  const keywords = ['mcq', 'quiz', 'exam', 'test me', 'multiple choice', 'questions on', 'question on'];
  return keywords.some(kw => lower.includes(kw));
}

/* ═══════════════════════════════════════════════════════
   MCQ QUIZ COMPONENT
═══════════════════════════════════════════════════════ */
function McqQuiz({ data }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const questions = data.questions || [];
  const total = questions.length;
  const q = questions[currentQ];

  const selectOption = (optIdx) => { if (submitted) return; setAnswers(prev => ({ ...prev, [q.id]: optIdx })); };
  const goNext = () => { if (currentQ < total - 1) setCurrentQ(currentQ + 1); };
  const goPrev = () => { if (currentQ > 0) setCurrentQ(currentQ - 1); };
  const handleSubmit = () => setSubmitted(true);

  const score = submitted ? questions.reduce((acc, q) => acc + (answers[q.id] === q.answer ? 1 : 0), 0) : 0;
  const allAnswered = Object.keys(answers).length === total;
  const progressPercent = ((currentQ + 1) / total) * 100;
  const scorePercent = submitted ? Math.round((score / total) * 100) : 0;
  const circumference = 2 * Math.PI * 40;

  if (!q) return null;

  return (
    <div className="mcq-card animate-mcq">
      <div className="mcq-header">
        <span className="mcq-title">✦ {data.title || 'Quiz'}</span>
        <span className="mcq-counter">Question {currentQ + 1} of {total}</span>
      </div>
      <div className="mcq-progress-track">
        <div className="mcq-progress-bar" style={{ width: `${progressPercent}%` }} />
      </div>

      {submitted ? (
        <div className="mcq-score-panel animate-mcq">
          <div className="mcq-ring-container">
            <svg viewBox="0 0 100 100" className="mcq-ring-svg">
              <circle cx="50" cy="50" r="40" className="mcq-ring-bg" />
              <circle cx="50" cy="50" r="40" className="mcq-ring-fill"
                style={{ strokeDasharray: circumference, strokeDashoffset: circumference - (circumference * scorePercent / 100) }}
              />
            </svg>
            <span className="mcq-ring-text">{score}/{total}</span>
          </div>
          <div className="mcq-score-info">
            <span className="mcq-score-headline">
              {scorePercent >= 80 ? '🎉 Excellent!' : scorePercent >= 50 ? '👍 Good Try!' : '📚 Keep Learning!'}
            </span>
            <span className="mcq-score-sub">You scored {scorePercent}% — {score} correct out of {total}</span>
          </div>
          <div className="mcq-review">
            {questions.map((rq, ri) => {
              const userAns = answers[rq.id];
              const isCorrect = userAns === rq.answer;
              return (
                <div key={rq.id} className={`mcq-review-item ${isCorrect ? 'correct' : 'wrong'}`}>
                  <span className="mcq-review-num">{ri + 1}</span>
                  <div className="mcq-review-body">
                    <span className="mcq-review-q">{rq.question}</span>
                    <span className="mcq-review-ans">
                      Your answer: {rq.options[userAns] ?? 'Skipped'}
                      {!isCorrect && <> · Correct: <strong>{rq.options[rq.answer]}</strong></>}
                    </span>
                  </div>
                  <span className={`mcq-review-icon ${isCorrect ? 'correct' : 'wrong'}`}>{isCorrect ? '✓' : '✗'}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <p className="mcq-question">{q.question}</p>
          <div className="mcq-options">
            {q.options.map((opt, oi) => {
              const letter = String.fromCharCode(65 + oi);
              const isSelected = answers[q.id] === oi;
              return (
                <button key={oi} className={`mcq-option ${isSelected ? 'selected' : ''}`} onClick={() => selectOption(oi)}>
                  <span className="mcq-option-letter">{letter}</span>
                  <span className="mcq-option-text">{opt}</span>
                </button>
              );
            })}
          </div>
          <div className="mcq-nav">
            <button className="mcq-nav-btn" onClick={goPrev} disabled={currentQ === 0}>← Prev</button>
            <div className="mcq-dots">
              {questions.map((_, di) => (
                <span key={di} className={`mcq-dot ${di === currentQ ? 'active' : ''} ${answers[questions[di].id] !== undefined ? 'answered' : ''}`} onClick={() => setCurrentQ(di)} />
              ))}
            </div>
            {currentQ < total - 1 ? (
              <button className="mcq-nav-btn" onClick={goNext}>Next →</button>
            ) : (
              <button className="mcq-submit-btn" onClick={handleSubmit} disabled={!allAnswered}>Submit Exam</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CHAT CACHE HELPERS (localStorage)
═══════════════════════════════════════════════════════ */
const CHAT_STORE_KEY = 'lumina_chat_sessions';
const MAX_SESSIONS = 30;

const loadSessions = () => {
  try { return JSON.parse(localStorage.getItem(CHAT_STORE_KEY) || '[]'); }
  catch { return []; }
};

const saveSessions = (sessions) => {
  try {
    const trimmed = sessions.slice(-MAX_SESSIONS);
    localStorage.setItem(CHAT_STORE_KEY, JSON.stringify(trimmed));
  } catch { /* storage full — ignore */ }
};

const makeSessionTitle = (messages) => {
  const firstUser = messages.find(m => m.role === 'user');
  if (!firstUser) return 'New Chat';
  const title = firstUser.text.trim();
  return title.length > 40 ? title.slice(0, 40) + '…' : title;
};

const relTime = (ts) => {
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
};

/* ═══════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════ */
const WELCOME_MSG = {
  role: 'bot',
  text: "Hello! I'm **Lumina AI**, powered by Llama 3.1 via Groq. I remember our conversation for this session!\n\nAsk me anything — or try:\n- **\"Give me 5 MCQ on JavaScript\"** for a quiz\n- **\"Explain recursion\"** for a detailed answer"
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [currentView, setCurrentView] = useState('chat');
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  const chatEndRef = useRef(null);
  const typeIntervalRef = useRef(null);
  const typeResolveRef = useRef(null);
  const debounceRef = useRef(null);
  const skipSuggestRef = useRef(false);
  const sessionIdRef = useRef(crypto.randomUUID());

  // ── On mount: load sessions from cache ──────────────────
  useEffect(() => {
    const stored = loadSessions();
    setChatSessions(stored);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Save current chat to localStorage ──────────────────
  const persistCurrentChat = (msgs, sessionId) => {
    if (msgs.length <= 1) return; // don't save empty/welcome-only chats
    const sessions = loadSessions();
    const idx = sessions.findIndex(s => s.id === sessionId);
    const sessionData = {
      id: sessionId,
      title: makeSessionTitle(msgs),
      messages: msgs,
      updatedAt: Date.now(),
    };
    if (idx >= 0) sessions[idx] = sessionData;
    else sessions.push(sessionData);
    saveSessions(sessions);
    setChatSessions([...sessions].reverse());
  };

  // ── + New Chat: save current → start fresh ──────────────
  const handleNewChat = async () => {
    handleStop();
    // Save current session if it has real messages
    persistCurrentChat(messages, sessionIdRef.current);

    // Clear backend session
    try {
      await fetch(`${API_BASE}/api/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionIdRef.current })
      });
    } catch (_) { }

    // Create new session
    const newId = crypto.randomUUID();
    sessionIdRef.current = newId;
    setActiveSessionId(newId);
    setMessages([WELCOME_MSG]);
    setInput('');
    setSuggestions([]);
    setIsSuggesting(false);
    setSidebarOpen(false);
  };

  // ── Load a past session ─────────────────────────────────
  const loadSession = (session) => {
    // Save current session first
    persistCurrentChat(messages, sessionIdRef.current);
    handleStop();

    sessionIdRef.current = session.id;
    setActiveSessionId(session.id);
    setMessages(session.messages);
    setInput('');
    setSuggestions([]);
    setSidebarOpen(false);
  };

  // ── Delete a session ────────────────────────────────────
  const deleteSession = (e, sessionId) => {
    e.stopPropagation();
    const updated = loadSessions().filter(s => s.id !== sessionId);
    saveSessions(updated);
    setChatSessions([...updated].reverse());
    if (sessionIdRef.current === sessionId) {
      handleNewChat();
    }
  };

  // ── Auto-save when messages change ─────────────────────
  useEffect(() => {
    if (messages.length > 1 && !isTyping) {
      persistCurrentChat(messages, sessionIdRef.current);
    }
  }, [messages, isTyping]);

  // ── Debounced suggestions ───────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (skipSuggestRef.current) { skipSuggestRef.current = false; return; }
    if (input.trim().length < 10) { setSuggestions([]); setIsSuggesting(false); return; }

    setIsSuggesting(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/suggest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: input })
        });
        const data = await res.json();
        const list = data.suggestions || (data.suggestion ? [data.suggestion] : []);
        setSuggestions(list.slice(0, 2));
      } catch { setSuggestions([]); }
      finally { setIsSuggesting(false); }
    }, 900);
    return () => clearTimeout(debounceRef.current);
  }, [input]);

  const applySuggestion = (text) => {
    skipSuggestRef.current = true;
    setInput(text);
    setSuggestions([]);
    setIsSuggesting(false);
  };

  const handleStop = () => {
    if (typeIntervalRef.current) { clearInterval(typeIntervalRef.current); typeIntervalRef.current = null; }
    if (typeResolveRef.current) { typeResolveRef.current(); typeResolveRef.current = null; }
    setIsTyping(false);
  };

  // ── Send message ────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    setSuggestions([]); setIsSuggesting(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const mcqMode = isMcqRequest(userMessage);
      const endpoint = mcqMode ? `${API_BASE}/api/mcq` : `${API_BASE}/api/chat`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage, session_id: sessionIdRef.current })
      });

      if (!response.ok) {
        let errorMsg = 'Failed to fetch from backend';
        try { const errData = await response.json(); errorMsg = errData.error || errorMsg; } catch (_) { }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (mcqMode && data.mcq && Array.isArray(data.questions)) {
        setMessages(prev => [...prev, { role: 'bot', text: '', mcq: data }]);
        setIsTyping(false);
      } else {
        const botText = data.response || JSON.stringify(data);
        await new Promise(res => {
          const timeout = setTimeout(res, 300);
          typeResolveRef.current = () => { clearTimeout(timeout); res(); };
        });
        setMessages(prev => [...prev, { role: 'bot', text: '' }]);
        await typeWriter(botText);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: `⚠️ ${error.message}. Is your Flask backend running?` }]);
      setIsTyping(false);
    }
  };

  const typeWriter = (text) => {
    return new Promise((resolve) => {
      typeResolveRef.current = resolve;
      let i = 0;
      const dynamicSpeed = Math.max(1, Math.min(10, 1500 / text.length));
      const charsPerTick = text.length > 500 ? 5 : 2;
      typeIntervalRef.current = setInterval(() => {
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'bot') lastMsg.text = text.slice(0, i + charsPerTick);
          return updated;
        });
        i += charsPerTick;
        if (i >= text.length) {
          clearInterval(typeIntervalRef.current); typeIntervalRef.current = null;
          setIsTyping(false);
          resolve();
        }
      }, dynamicSpeed);
    });
  };

  if (currentView === 'roadmap') {
    return <Roadmap onBack={() => setCurrentView('chat')} />;
  }

  return (
    <div className="app-shell">

      {/* ── Chat History Sidebar ── */}
      <aside className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="chat-sidebar-inner">
          {/* Sidebar Header */}
          <div className="chat-sidebar-header">
            <div className="chat-sidebar-brand">
              <span className="chat-sidebar-brand-icon">✦</span>
              <span className="chat-sidebar-brand-name">Lumina AI</span>
            </div>
            <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>

          {/* New Chat button */}
          <button className="sidebar-new-chat-btn" onClick={handleNewChat}>
            <span>＋</span> New Chat
          </button>

          {/* Session list */}
          <div className="session-list-label">Recent Conversations</div>
          {chatSessions.length === 0 ? (
            <div className="session-empty">No saved chats yet.<br />Start a conversation!</div>
          ) : (
            <ul className="session-list">
              {chatSessions.map((session) => (
                <li
                  key={session.id}
                  className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
                  onClick={() => loadSession(session)}
                >
                  <div className="session-item-body">
                    <span className="session-title">{session.title}</span>
                    <span className="session-time">{relTime(session.updatedAt)}</span>
                  </div>
                  <button className="session-delete-btn" onClick={(e) => deleteSession(e, session.id)} title="Delete chat">
                    🗑
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Footer */}
          <div className="chat-sidebar-footer">
            <span>Lumina AI · 2025</span>
          </div>
        </div>
      </aside>

      {/* Sidebar backdrop */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main chat area ── */}
      <div className="app-container">
        <header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(true)} title="Chat History">
              ☰
            </button>
            <h1>Lumina AI <span className="badge">Llama 3.1 · Groq</span></h1>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="new-chat-btn roadmap-btn" onClick={() => setCurrentView('roadmap')} title="Generate a Learning Roadmap">
              View Roadmap
            </button>
            <button className="new-chat-btn" onClick={handleNewChat} title="Start a fresh conversation">
              ＋ New Chat
            </button>
          </div>
        </header>

        <main className="chat-container">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}-message`}>
              {msg.role === 'bot' ? (
                msg.mcq ? (
                  <McqQuiz data={msg.mcq} />
                ) : (
                  <div className="message-content markdown-body">
                    <ErrorBoundary fallback={msg.text}>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </ErrorBoundary>
                  </div>
                )
              ) : (
                <div className="message-content">{msg.text}</div>
              )}
            </div>
          ))}

          {isTyping && !typeIntervalRef.current && (
            <div className="message bot-message typing">
              <div className="dot" /><div className="dot" /><div className="dot" />
            </div>
          )}
          <div ref={chatEndRef} />
        </main>

        <section className="input-area">
          {isSuggesting && <SuggestLoader />}
          {!isSuggesting && suggestions.length > 0 && (
            <div className="suggestions-row">
              <span className="suggestions-header">✦ Try instead:</span>
              {suggestions.map((s, i) => (
                <div key={i} className="suggestion-box animate-suggestion" onClick={() => applySuggestion(s)}>
                  <span className="suggestion-num">{i + 1}</span>
                  <span className="suggestion-text">{s}</span>
                </div>
              ))}
            </div>
          )}
          <div className="input-row">
            <input
              type="text" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSend()}
              placeholder="Ask anything, or try: 'Give me 5 MCQ on Python'…"
              disabled={isTyping && typeIntervalRef.current === null}
            />
            {isTyping && typeIntervalRef.current ? (
              <button className="stop-btn" onClick={handleStop}>Stop</button>
            ) : (
              <button className="send-btn" onClick={handleSend} disabled={isTyping || !input.trim()}>
                {isTyping ? 'Thinking…' : 'Send'}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
