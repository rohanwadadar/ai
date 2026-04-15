import { useState, useRef, useEffect, Component } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, FileText, Download } from 'lucide-react';
import './index.css';
import Roadmap from './Roadmap';
import FlashCards from './FlashCards';
import CodeBlock from './CodeBlock';
import VoiceToTextUI, { MicIcon } from './VoiceToText';
import voiceStyles from './VoiceToText.module.css';

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

function isFlashcardRequest(text) {
  const lower = text.toLowerCase();
  const keywords = ['flashcard', 'flash card', 'flash-card', 'spaced repetition', 'generate cards on', 'make cards on', 'study cards'];
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
  text: "Hello! I'm **Lumina AI**, powered by Llama 3.1 via Groq. How can I help you learn today?"
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
  const [isExporting, setIsExporting] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const triggerPrint = (text) => {
    setPrintData(text);
    setTimeout(() => {
      window.print();
      setPrintData(null);
    }, 500); // 500ms allows React to render the print-container fully before print dialog opens
  };

  const chatEndRef = useRef(null);
  // v1.0 refs (PRESERVED BY ROHAN) — used by old typeWriter animation:
  // const typeIntervalRef = useRef(null);
  // const typeResolveRef = useRef(null);
  // v2.0 - Changed by Rohan: typeWriter removed; streaming IS the animation now
  const debounceRef = useRef(null);
  const skipSuggestRef = useRef(false);
  const sessionIdRef = useRef(crypto.randomUUID());
  const abortControllerRef = useRef(null);
  const readerRef = useRef(null);
  // v2.2 - SMOOTH DISPLAY ENGINE by Rohan
  // Groq sends all tokens in ~0.5s → old flush dumped everything at once.
  // Fix: rate-limit the DISPLAY to CHARS_PER_TICK per 40ms tick (~250 chars/sec).
  // Short responses (< SHORT_THRESHOLD) still show instantly — no fake delay.
  const CHARS_PER_TICK = 10;
  const SHORT_THRESHOLD = 80;
  const tokenBufferRef = useRef('');
  const flushIntervalRef = useRef(null);
  const streamDoneRef = useRef(false);

  const startFlushInterval = () => {
    if (flushIntervalRef.current) return;
    streamDoneRef.current = false;
    flushIntervalRef.current = setInterval(() => {
      const buf = tokenBufferRef.current;

      if (buf.length === 0) {
        // Buffer empty — if Groq stream is also done, stop the interval
        if (streamDoneRef.current) {
          clearInterval(flushIntervalRef.current);
          flushIntervalRef.current = null;
          setIsTyping(false);
        }
        return;
      }

      // Short response: stream done + remaining buffer is small → show all at once
      if (streamDoneRef.current && buf.length < SHORT_THRESHOLD) {
        tokenBufferRef.current = '';
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'bot') last.text = (last.text || '') + buf;
          return updated;
        });
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
        setIsTyping(false);
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      // Long response: reveal at controlled rate — CHARS_PER_TICK chars per tick
      const toDisplay = buf.slice(0, CHARS_PER_TICK);
      tokenBufferRef.current = buf.slice(CHARS_PER_TICK);
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'bot') last.text = (last.text || '') + toDisplay;
        return updated;
      });
      chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 40);
  };

  // signalStreamDone: called when SSE [DONE] received — lets interval drain buffer at pace
  const signalStreamDone = () => { streamDoneRef.current = true; };

  // stopFlushInterval: called by Stop button — immediately dumps remaining buffer
  const stopFlushInterval = () => {
    streamDoneRef.current = true;
    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
      flushIntervalRef.current = null;
    }
    const remaining = tokenBufferRef.current;
    tokenBufferRef.current = '';
    if (remaining) {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'bot') last.text = (last.text || '') + remaining;
        return updated;
      });
    }
  };

  // ── On mount: load sessions from cache ──────────────────
  useEffect(() => {
    const stored = loadSessions();
    setChatSessions(stored);
  }, []);

  // Smooth scroll only when NOT streaming (avoids scroll-fight during generation)
  useEffect(() => {
    if (!flushIntervalRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
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

  // ════════════════════════════════════════════════════════
  // v1.0 - handleStop (PRESERVED BY ROHAN)
  // Only cancelled the browser fetch. Backend kept running.
  // Groq continued generating — all tokens were wasted.
  // ════════════════════════════════════════════════════════
  // const handleStop_v1 = () => {
  //   if (abortControllerRef.current) {
  //     abortControllerRef.current.abort();
  //     abortControllerRef.current = null;
  //   }
  //   if (typeIntervalRef.current) {
  //     clearInterval(typeIntervalRef.current);
  //     typeIntervalRef.current = null;
  //   }
  //   if (typeResolveRef.current) {
  //     typeResolveRef.current();
  //     typeResolveRef.current = null;
  //   }
  //   setIsTyping(false);
  // };

  // v2.0 - Changed by Rohan: handleStop now ALSO tells the backend to close the Groq connection
  const handleStop = () => {
    // Step 1: Drain buffer and stop the flush timer cleanly
    stopFlushInterval();
    tokenBufferRef.current = '';
    // Step 2: Cancel the browser-side fetch
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Step 3: Tell the Flask backend to close the Groq connection
    fetch(`${API_BASE}/api/chat/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionIdRef.current })
    }).catch(() => { });
    setIsTyping(false);
  };

  // ════════════════════════════════════════════════════════
  // v1.0 - handleSend (PRESERVED BY ROHAN)
  // Used blocking fetch + await res.json() — waited for the
  // full LLM response before doing anything.
  // Then used a fake typeWriter() animation to simulate streaming.
  // ════════════════════════════════════════════════════════
  // const handleSend_v1 = async () => {
  //   if (!input.trim() || isTyping) return;
  //   ... (blocking fetch to /api/chat) ...
  //   const data = await response.json();
  //   const botText = data.response || JSON.stringify(data);
  //   setMessages(prev => [...prev, { role: 'bot', text: '' }]);
  //   await typeWriter(botText);  // fake animation
  // };
  //
  // v1.0 - typeWriter (PRESERVED BY ROHAN)
  // A fake character-by-character animation using setInterval.
  // Completely replaced by real SSE streaming in v2.0.
  // const typeWriter = (text) => {
  //   return new Promise((resolve) => {
  //     typeResolveRef.current = resolve;
  //     let i = 0;
  //     const dynamicSpeed = Math.max(1, Math.min(10, 1500 / text.length));
  //     const charsPerTick = text.length > 500 ? 5 : 2;
  //     typeIntervalRef.current = setInterval(() => {
  //       setMessages(prev => {
  //         const updated = [...prev];
  //         const lastMsg = updated[updated.length - 1];
  //         if (lastMsg && lastMsg.role === 'bot') lastMsg.text = text.slice(0, i + charsPerTick);
  //         return updated;
  //       });
  //       i += charsPerTick;
  //       if (i >= text.length) {
  //         clearInterval(typeIntervalRef.current); typeIntervalRef.current = null;
  //         setIsTyping(false); resolve();
  //       }
  //     }, dynamicSpeed);
  //   });
  // };

  // ── Send message (v2.0 — Changed by Rohan) ──────────────
  // For normal chat: uses ReadableStream to read SSE token-by-token.
  // For MCQ/Flashcards: still uses standard JSON (no streaming needed).
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    setSuggestions([]);
    setIsSuggesting(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    abortControllerRef.current = new AbortController();

    try {
      const flashMode = isFlashcardRequest(userMessage);
      const mcqMode = !flashMode && isMcqRequest(userMessage);

      // ── MCQ / Flashcard: still use standard blocking JSON (no SSE needed) ──
      if (flashMode || mcqMode) {
        const endpoint = flashMode ? `${API_BASE}/api/flashcards` : `${API_BASE}/api/mcq`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userMessage, session_id: sessionIdRef.current }),
          signal: abortControllerRef.current.signal
        });
        if (!response.ok) {
          let errorMsg = 'Failed to fetch from backend';
          try { const errData = await response.json(); errorMsg = errData.error || errorMsg; } catch (_) { }
          throw new Error(errorMsg);
        }
        const data = await response.json();
        if (flashMode && data.flashcards && Array.isArray(data.cards)) {
          setMessages(prev => [...prev, { role: 'bot', text: '', flashcards: data }]);
        } else if (mcqMode && data.mcq && Array.isArray(data.questions)) {
          setMessages(prev => [...prev, { role: 'bot', text: '', mcq: data }]);
        }
        setIsTyping(false);
        return;
      }

      // ── Normal chat: v2.0 SSE streaming ──────────────────
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage, session_id: sessionIdRef.current }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        let errorMsg = 'Failed to fetch from backend';
        try { const errData = await response.json(); errorMsg = errData.error || errorMsg; } catch (_) { }
        throw new Error(errorMsg);
      }

      // v2.0: Get a reader from the SSE response body stream
      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      // v2.1 GLITCH FIX: Add empty bot message then start the flush timer
      setMessages(prev => [...prev, { role: 'bot', text: '' }]);
      tokenBufferRef.current = '';
      startFlushInterval(); // starts draining buffer to screen at 25fps

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const raw = trimmed.slice('data:'.length).trim();
          if (!raw) continue;

          try {
            const parsed = JSON.parse(raw);

            if (parsed.error) {
              stopFlushInterval();
              setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'bot', text: `⚠️ ${parsed.error}` }
              ]);
              setIsTyping(false);
              return;
            }

            if (parsed.done) {
              // Stream finished — signal done, let interval drain buffer at pace
              signalStreamDone();
              break;
            }

            if (parsed.token) {
              // v2.1: Push token into buffer ONLY — flush interval handles the DOM update
              tokenBufferRef.current += parsed.token;
            }
          } catch (_) { /* ignore malformed SSE lines */ }
        }
      }

      // SSE loop exited naturally (done=true reached) — signal done to flush engine
      signalStreamDone();
      // setIsTyping is handled by the flush interval once buffer drains

    } catch (error) {
      stopFlushInterval(); // abort/error: dump buffer immediately
      if (error.name === 'AbortError') {
        console.log('[v2.2] SSE stream stopped by user.');
        return;
      }
      setMessages(prev => [...prev, { role: 'bot', text: `⚠️ ${error.message}. Is your Flask backend running?` }]);
      setIsTyping(false);
    } finally {
      abortControllerRef.current = null;
      readerRef.current = null;
    }
  };

  // ── EXPORT STUDY GUIDE / CHEAT SHEET ──────────────────
  const handleExportStudyGuide = async () => {
    if (messages.length < 3 || isTyping || isExporting) return;
    setIsExporting(true);

    try {
      const response = await fetch(`${API_BASE}/api/cheat-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });

      if (!response.ok) throw new Error('Failed to generate study guide');
      const data = await response.json();

      setMessages(prev => [
        ...prev,
        { role: 'bot', text: data.markdown, isCheatSheet: true }
      ]);

      // Auto-scroll to the newly generated guide
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    } catch (e) {
      alert("Failed to export study guide: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (currentView === 'roadmap') {
    return <Roadmap onBack={() => setCurrentView('chat')} />;
  }

  return (
    <div className={`app-shell ${printData ? 'is-printing' : ''}`}>
      {printData && (
        <div className="print-container markdown-body">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const codeStr = String(children);
                const isInline = inline || !codeStr.includes('\n');
                if (isInline) {
                  return <code className={className} style={{ background: '#eee', padding: '0.15em 0.45em', borderRadius: '5px', fontSize: '0.85em', fontFamily: 'monospace', color: 'black' }} {...props}>{children}</code>;
                }
                return <pre style={{ background: '#f5f5f5', padding: '1rem', color: 'black', borderRadius: '5px' }}><code className={className} {...props}>{children}</code></pre>;
              }
            }}
          >
            {printData}
          </ReactMarkdown>
        </div>
      )}

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
            <span style={{ fontSize: '0.75rem' }}>Lumina AI · 2025</span>
            <span className="creator-tag">
              Developed by <a href="https://rohanwadadar.github.io/portfolio/" target="_blank" rel="noopener noreferrer">Rohan Wadadar</a>
            </span>
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
            <h1>Lumina AI <span className="badge">Llama 3.1</span></h1>
          </div>

          <div className="header-creator">
            <a href="https://rohanwadadar.github.io/portfolio/" target="_blank" rel="noopener noreferrer" className="creator-badge">
              <span className="creator-sparkle">✦</span>
              Made by <strong style={{ color: 'var(--cyan-primary)' }}>Rohan Wadadar</strong>
            </a>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="new-chat-btn roadmap-btn"
              onClick={handleExportStudyGuide}
              disabled={isExporting || isTyping || messages.length < 3}
              title="Generate a Markdown Study Guide from this chat"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(124, 58, 237, 0.1)', borderColor: 'rgba(124, 58, 237, 0.3)', color: '#a855f7' }}
            >
              {isExporting ? <Loader2 size={14} className="spin" /> : <FileText size={14} />}
              <span className="desktop-only">Export Cheat Sheet</span>
            </button>
            <button className="new-chat-btn roadmap-btn" onClick={() => setCurrentView('roadmap')} title="Generate a Learning Roadmap">
              Roadmap
            </button>
            <button className="new-chat-btn" onClick={handleNewChat} title="Start a fresh conversation">
              ＋ New Chat
            </button>
          </div>
        </header>

        <main className="chat-container">
          {messages.map((msg, idx) => {
            // Apply .streaming class to the last bot message while generating
            const isLastBotStreaming = isTyping && msg.role === 'bot' && idx === messages.length - 1;
            return (
              <div key={idx} className={`message ${msg.role}-message${isLastBotStreaming ? ' streaming' : ''}`}>
                {msg.role === 'bot' ? (
                  msg.flashcards ? (
                    <FlashCards data={msg.flashcards} />
                  ) : msg.mcq ? (
                    <McqQuiz data={msg.mcq} />
                  ) : (
                    <>
                      {msg.isCheatSheet && (
                        <div className="cheat-sheet-header">
                          <span className="cheat-sheet-title">✨ Markdown Study Guide Generated</span>
                          <button className="download-pdf-btn" onClick={() => triggerPrint(msg.text)}>
                            <Download size={14} /> Download PDF
                          </button>
                        </div>
                      )}
                      <div className={`message-content markdown-body ${msg.isCheatSheet ? 'cheat-sheet-body' : ''}`}>
                        <ErrorBoundary fallback={msg.text}>
                          <ReactMarkdown
                            components={{
                              code({ node, inline, className, children, ...props }) {
                                // In newer react-markdown, 'inline' may be undefined.
                                // Detect inline code by checking if it has no newlines.
                                const codeStr = String(children);
                                const isInline = inline || !codeStr.includes('\n');
                                if (isInline) {
                                  return <code className={className} style={{ background: 'rgba(255,255,255,0.06)', padding: '0.15em 0.45em', borderRadius: '5px', fontSize: '0.85em', fontFamily: 'monospace' }} {...props}>{children}</code>;
                                }
                                return <CodeBlock className={className}>{children}</CodeBlock>;
                              }
                            }}
                          >{msg.text}</ReactMarkdown>
                        </ErrorBoundary>
                      </div>
                    </>
                  )
                ) : (
                  <div className="message-content">{msg.text}</div>
                )}
              </div>
            );
          })}

          {/* ── Initial Feature Guide ── */}
          {messages.length === 1 && !isTyping && (
            <div className="feature-guide-container animate-mcq">
              <h3 className="feature-guide-title">✨ What I can do for you</h3>
              <div className="feature-guide-grid">
                <div className="feature-card" onClick={() => setInput("Generate a learning roadmap on Machine Learning")}>
                  <div className="feature-card-icon">🗺️</div>
                  <div className="feature-card-content">
                    <h4>Learning Roadmaps</h4>
                    <p>Structured, step-by-step paths with internet resources.</p>
                  </div>
                </div>
                <div className="feature-card" onClick={() => setInput("Generate 5 flashcards on Python Basics")}>
                  <div className="feature-card-icon">🃏</div>
                  <div className="feature-card-content">
                    <h4>3D Flashcards</h4>
                    <p>Spaced-repetition study cards with flip animations.</p>
                  </div>
                </div>
                <div className="feature-card" onClick={() => setInput("Give me 5 MCQ on ReactJS")}>
                  <div className="feature-card-icon">✅</div>
                  <div className="feature-card-content">
                    <h4>Interactive MCQs</h4>
                    <p>Test your knowledge with real-time scoring and review.</p>
                  </div>
                </div>
                <div className="feature-card" onClick={() => setInput("Write a Python function to check if a number is prime")}>
                  <div className="feature-card-icon">💻</div>
                  <div className="feature-card-content">
                    <h4>Live Code Editor</h4>
                    <p>Generate, edit, and run Python/JS code directly in chat!</p>
                  </div>
                </div>
                <div className="feature-card" onClick={() => setInput("What is the weather in Kolkata today?")}>
                  <div className="feature-card-icon">🌐</div>
                  <div className="feature-card-content">
                    <h4>Live Web Search</h4>
                    <p>Real-time internet access for up-to-date answers.</p>
                  </div>
                </div>
                <div className="feature-card" onClick={() => setInput("Can you act as a Senior Web Developer and review my code?")}>
                  <div className="feature-card-icon">👩‍💻</div>
                  <div className="feature-card-content">
                    <h4>Expert Chat</h4>
                    <p>In-depth explanations, code generation, and tutoring.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* v2.0 - Changed by Rohan: typing dots now show while waiting for first SSE token */}
          {/* v1.0 (PRESERVED BY ROHAN): {isTyping && !typeIntervalRef.current && (...)} */}
          {isTyping && (
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
          {isRecording ? (
            /* ── Voice recorder replaces the input row while recording ── */
            <VoiceToTextUI
              onTranscript={(text) => {
                if (text) setInput(text);
                setIsRecording(false);
              }}
              onCancel={() => setIsRecording(false)}
            />
          ) : (
            <div className="input-row">
              <input
                type="text" value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSend()}
                placeholder="Ask anything, or try: 'Give me 5 MCQ on Python'…"
                disabled={isTyping}
              />
              {/* Mic button — only visible when not streaming */}
              {!isTyping && (
                <button
                  type="button"
                  className={voiceStyles['mic-btn']}
                  onClick={() => setIsRecording(true)}
                  title="Speak your message"
                  aria-label="Start voice input"
                >
                  <MicIcon />
                </button>
              )}
              {isTyping ? (
                <button className="stop-btn" onClick={handleStop}>Stop</button>
              ) : (
                <button className="send-btn" onClick={handleSend} disabled={!input.trim()}>
                  Send
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
