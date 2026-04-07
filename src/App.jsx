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
   DETECT if the user's message is asking for an MCQ quiz
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

  const selectOption = (optIdx) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [q.id]: optIdx }));
  };

  const goNext = () => { if (currentQ < total - 1) setCurrentQ(currentQ + 1); };
  const goPrev = () => { if (currentQ > 0) setCurrentQ(currentQ - 1); };
  const handleSubmit = () => setSubmitted(true);

  const score = submitted
    ? questions.reduce((acc, q) => acc + (answers[q.id] === q.answer ? 1 : 0), 0)
    : 0;

  const allAnswered = Object.keys(answers).length === total;
  const progressPercent = ((currentQ + 1) / total) * 100;
  const scorePercent = submitted ? Math.round((score / total) * 100) : 0;
  const circumference = 2 * Math.PI * 40;

  if (!q) return null;

  return (
    <div className="mcq-card animate-mcq">
      {/* Header */}
      <div className="mcq-header">
        <span className="mcq-title">✦ {data.title || 'Quiz'}</span>
        <span className="mcq-counter">Question {currentQ + 1} of {total}</span>
      </div>
      <div className="mcq-progress-track">
        <div className="mcq-progress-bar" style={{ width: `${progressPercent}%` }} />
      </div>

      {submitted ? (
        /* ── Score result ─────────────────────────────── */
        <div className="mcq-score-panel animate-mcq">
          <div className="mcq-ring-container">
            <svg viewBox="0 0 100 100" className="mcq-ring-svg">
              <circle cx="50" cy="50" r="40" className="mcq-ring-bg" />
              <circle cx="50" cy="50" r="40" className="mcq-ring-fill"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: circumference - (circumference * scorePercent / 100)
                }}
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

          {/* Answer review */}
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
                  <span className={`mcq-review-icon ${isCorrect ? 'correct' : 'wrong'}`}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* Question */}
          <p className="mcq-question">{q.question}</p>

          {/* Options */}
          <div className="mcq-options">
            {q.options.map((opt, oi) => {
              const letter = String.fromCharCode(65 + oi);
              const isSelected = answers[q.id] === oi;
              return (
                <button
                  key={oi}
                  className={`mcq-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectOption(oi)}
                >
                  <span className="mcq-option-letter">{letter}</span>
                  <span className="mcq-option-text">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Nav */}
          <div className="mcq-nav">
            <button className="mcq-nav-btn" onClick={goPrev} disabled={currentQ === 0}>← Prev</button>
            <div className="mcq-dots">
              {questions.map((_, di) => (
                <span
                  key={di}
                  className={`mcq-dot ${di === currentQ ? 'active' : ''} ${answers[questions[di].id] !== undefined ? 'answered' : ''}`}
                  onClick={() => setCurrentQ(di)}
                />
              ))}
            </div>
            {currentQ < total - 1 ? (
              <button className="mcq-nav-btn" onClick={goNext}>Next →</button>
            ) : (
              <button className="mcq-submit-btn" onClick={handleSubmit} disabled={!allAnswered}>
                Submit Exam
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════ */
const WELCOME_MSG = { role: 'bot', text: "Hello! I'm Lumina AI, powered by Llama 3.1 via Groq. I **remember our conversation** for this session! Ask me anything — or request a quiz like **\"Give me 5 MCQ on JavaScript\"**!" };

// Production Backend URL (or localhost for dev)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [currentView, setCurrentView] = useState('chat'); // 'chat' or 'roadmap'
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef(null);
  const typeIntervalRef = useRef(null);
  const typeResolveRef = useRef(null);
  const debounceRef = useRef(null);
  const skipSuggestRef = useRef(false);

  // Unique session ID — generated once per page load, lives in RAM only
  const sessionIdRef = useRef(crypto.randomUUID());

  // New Chat handler — clears memory on both frontend and backend
  const handleNewChat = async () => {
    handleStop();
    try {
      await fetch(`${API_BASE}/api/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionIdRef.current })
      });
    } catch (_) { }
    sessionIdRef.current = crypto.randomUUID();
    setMessages([WELCOME_MSG]);
    setInput('');
    setSuggestions([]);
    setIsSuggesting(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Debounced suggestions ─────────────────────────────
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
      } catch (err) { console.error('Suggestion error:', err); setSuggestions([]); }
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

  // ── Send message ──────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    setSuggestions([]); setIsSuggesting(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      // ── Decide which endpoint to hit ──
      const mcqMode = isMcqRequest(userMessage);
      const endpoint = mcqMode
        ? `${API_BASE}/api/mcq`
        : `${API_BASE}/api/chat`;

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
        // ── MCQ response: render quiz card instantly ──
        setMessages(prev => [...prev, { role: 'bot', text: '', mcq: data }]);
        setIsTyping(false);
      } else {
        // ── Regular text: typewriter effect ──
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
          setRobotStatus('idle');
          resolve();
        }
      }, dynamicSpeed);
    });
  };

  if (currentView === 'roadmap') {
    return <Roadmap onBack={() => setCurrentView('chat')} />;
  }

  return (
    <div className="app-container">

      <header>
        <h1>Lumina AI <span className="badge">Llama 3.1 · Groq</span></h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="new-chat-btn roadmap-btn" onClick={() => setCurrentView('roadmap')} title="Generate a Learning Roadmap">
            View Roadmap Design
          </button>
          <button className="new-chat-btn" onClick={handleNewChat} title="Start a fresh conversation">
            + New Chat
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
  );
}

export default App;
