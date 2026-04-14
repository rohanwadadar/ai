import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Compass, ExternalLink, GraduationCap, Microscope, BookOpen, School, CheckCircle2, Clock, Trash2, Zap, ChevronDown, ChevronUp, BookOpenCheck, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Roadmap.css';
import AiAvatar from './AiAvatar';

const STEPS_LIST = [
    "Analyzing Academic Vectors...",
    "Drafting Research Dimensions...",
    "Finalizing Scholarly Path...",
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Cache helpers (localStorage) ──────────────────────────────
const CACHE_KEY = 'lumina_roadmap_cache';
const MAX_HISTORY = 10;

const normalizeKey = (str) => str.trim().toLowerCase().replace(/\s+/g, ' ');

const readCache = () => {
    try {
        return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    } catch {
        return [];
    }
};

const writeCache = (entries) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
    } catch {
        // Storage full — drop oldest
        const trimmed = entries.slice(-MAX_HISTORY + 1);
        localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
    }
};

const getCached = (prompt) => {
    const key = normalizeKey(prompt);
    const entries = readCache();
    return entries.find((e) => normalizeKey(e.prompt) === key) || null;
};

const saveToCache = (prompt, data) => {
    const key = normalizeKey(prompt);
    let entries = readCache().filter((e) => normalizeKey(e.prompt) !== key);
    entries.push({ prompt, data, savedAt: Date.now() });
    if (entries.length > MAX_HISTORY) entries = entries.slice(-MAX_HISTORY);
    writeCache(entries);
};

const deleteFromCache = (prompt) => {
    const key = normalizeKey(prompt);
    writeCache(readCache().filter((e) => normalizeKey(e.prompt) !== key));
};

// ── Icon / Color helpers ───────────────────────────────────────
const getCategoryIcon = (index) => {
    const icons = [<GraduationCap size={24} />, <Microscope size={24} />, <BookOpen size={24} />, <School size={24} />, <GraduationCap size={24} />];
    return icons[index % icons.length];
};

const ACCENT_COLORS = [
    "#3b82f6",  // Blue
    "#14b8a6",  // Teal
    "#a855f7",  // Purple
    "#f43f5e",  // Rose
    "#f59e0b",  // Orange
];

const getCategoryColor = (index) => ACCENT_COLORS[index % ACCENT_COLORS.length];

// ── Relative time helper ───────────────────────────────────────
const relativeTime = (ts) => {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

// ══════════════════════════════════════════════════════════════
export default function Roadmap({ onBack }) {
    const [prompt, setPrompt] = useState('Organic Chemistry Research');
    const [roadmapData, setRoadmapData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [robotStatus, setRobotStatus] = useState('idle');
    const [robotFullScreen, setRobotFullScreen] = useState(false);
    const [cacheHistory, setCacheHistory] = useState([]);
    const [fromCache, setFromCache] = useState(false);
    // ── Topic Info Panel state ─────────────────────────────────
    const [topicDetails, setTopicDetails] = useState({}); // key: "catIdx-topicIdx" → data
    const [loadingTopic, setLoadingTopic] = useState(null); // key of currently loading topic
    const [openTopic, setOpenTopic] = useState(null);       // key of currently open panel

    const topicKey = (catIdx, topicIdx) => `${catIdx}-${topicIdx}`;

    const handleTopicClick = async (topic, subject, catIdx, topicIdx) => {
        const key = topicKey(catIdx, topicIdx);
        // Toggle: close if already open
        if (openTopic === key) { setOpenTopic(null); return; }
        setOpenTopic(key);
        // Return cached result if already fetched
        if (topicDetails[key]) return;

        setLoadingTopic(key);
        try {
            const res = await fetch(`${API_BASE}/api/topic-info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topic.name, subject })
            });
            const data = await res.json();
            setTopicDetails(prev => ({ ...prev, [key]: data }));
        } catch (e) {
            setTopicDetails(prev => ({ ...prev, [key]: { error: 'Failed to load.' } }));
        } finally {
            setLoadingTopic(null);
        }
    };

    // Load history on mount
    useEffect(() => {
        setCacheHistory([...readCache()].reverse());
    }, []);

    const refreshHistory = () => setCacheHistory([...readCache()].reverse());

    // ── Generate (cache-first) ─────────────────────────────────
    const generateRoadmap = async () => {
        if (!prompt.trim()) return;

        // 1. Check cache first
        const cached = getCached(prompt);
        if (cached) {
            setRoadmapData(cached.data);
            setFromCache(true);
            return;
        }

        // 2. Cache miss — call backend
        setFromCache(false);
        setIsLoading(true);
        setRoadmapData(null);
        setActiveStep(0);
        setRobotStatus('thinking');
        setRobotFullScreen(true);

        const stepInterval = setInterval(() => {
            setActiveStep(prev => (prev < STEPS_LIST.length - 1 ? prev + 1 : prev));
        }, 1200);

        try {
            const res = await fetch(`${API_BASE}/api/roadmap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!res.ok) throw new Error("Failed");
            const data = await res.json();

            // Save to cache
            saveToCache(prompt, data);
            refreshHistory();

            setRoadmapData(data);
            setRobotStatus('happy');
        } catch (err) {
            alert("Error generating the Academic Roadmap.");
        } finally {
            setRobotStatus('idle');
            setRobotFullScreen(false);
            clearInterval(stepInterval);
            setIsLoading(false);
        }
    };

    // ── Load a history entry ───────────────────────────────────
    const loadFromHistory = (entry) => {
        setPrompt(entry.prompt);
        setRoadmapData(entry.data);
        setFromCache(true);
    };

    // ── Delete a history entry ─────────────────────────────────
    const removeHistory = (e, entryPrompt) => {
        e.stopPropagation();
        deleteFromCache(entryPrompt);
        refreshHistory();
        if (normalizeKey(entryPrompt) === normalizeKey(prompt)) {
            setRoadmapData(null);
            setFromCache(false);
        }
    };

    // ── Force refresh (bypass cache) ──────────────────────────
    const forceRefresh = async () => {
        deleteFromCache(prompt);
        refreshHistory();
        setFromCache(false);
        setRoadmapData(null);
        await generateRoadmap();
    };

    return (
        <div className="roadmap-container academic-mode">
            {/* The Persistent AI Assistant */}
            <div className="avatar-portal">
                <AiAvatar status={robotStatus} fullScreen={robotFullScreen} />
            </div>

            <aside className="roadmap-sidebar">
                <div className="sidebar-inner">
                    {/* Header */}
                    <div className="sidebar-header">
                        <div className="sidebar-brand">
                            <div className="sidebar-brand-icon">✦</div>
                            <span className="sidebar-brand-text desktop-only">Lumina AI</span>
                        </div>
                        <button className="back-button" onClick={onBack}>
                            <ArrowLeft size={16} />
                            <span className="desktop-only">Back</span>
                        </button>
                        <h2 className="mobile-only-title">Scholar's Path</h2>
                    </div>

                    {/* Input */}
                    <div className="input-group-container">
                        <div className="prompt-card">
                            <label className="desktop-only sidebar-section-label">Target Field of Study</label>
                            <textarea
                                className="scholar-textarea"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={isLoading}
                                placeholder="e.g. Polymer Chemistry, Advanced Pedagogy..."
                                rows={3}
                            />
                        </div>

                        <button className="initiate-btn" onClick={generateRoadmap} disabled={isLoading}>
                            {isLoading
                                ? <Loader2 className="spin" size={20} />
                                : <><Compass size={18} /> Generate Academic Path</>
                            }
                        </button>
                    </div>

                    {/* Loading bar */}
                    {isLoading && (
                        <div className="scholarly-loading">
                            <p>{STEPS_LIST[activeStep]}</p>
                            <div className="scholarly-bar">
                                <div className="bar-fill" style={{ width: `${(activeStep + 1) * 33}%` }} />
                            </div>
                        </div>
                    )}

                    {/* Cache hit indicator */}
                    {fromCache && roadmapData && (
                        <div className="cache-hit-banner">
                            <Zap size={12} />
                            <span>Loaded from cache</span>
                            <button className="cache-refresh-btn" onClick={forceRefresh} title="Re-generate from AI">
                                ↺ Refresh
                            </button>
                        </div>
                    )}

                    {/* Stats */}
                    {roadmapData && (
                        <div className="sidebar-stats desktop-only">
                            <div className="stat-chip">
                                <span className="stat-chip-value">{roadmapData.categories?.length || 0}</span>
                                <span className="stat-chip-label">Stages</span>
                            </div>
                            <div className="stat-chip">
                                <span className="stat-chip-value">
                                    {roadmapData.categories?.reduce((acc, c) => acc + (c.topics?.length || 0), 0) || 0}
                                </span>
                                <span className="stat-chip-label">Topics</span>
                            </div>
                            <div className="stat-chip">
                                <span className="stat-chip-value">{cacheHistory.length}</span>
                                <span className="stat-chip-label">Cached</span>
                            </div>
                        </div>
                    )}

                    {/* History Panel */}
                    {cacheHistory.length > 0 && (
                        <div className="history-panel desktop-only">
                            <div className="history-panel-header">
                                <Clock size={12} />
                                <span>Recent Roadmaps</span>
                            </div>
                            <ul className="history-list">
                                {cacheHistory.map((entry, i) => (
                                    <li
                                        key={i}
                                        className={`history-item ${normalizeKey(entry.prompt) === normalizeKey(prompt) ? 'active' : ''}`}
                                        onClick={() => loadFromHistory(entry)}
                                    >
                                        <div className="history-item-text">
                                            <span className="history-prompt">{entry.prompt}</span>
                                            <span className="history-time">{relativeTime(entry.savedAt)}</span>
                                        </div>
                                        <button
                                            className="history-delete"
                                            onClick={(e) => removeHistory(e, entry.prompt)}
                                            title="Remove from cache"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="sidebar-footer desktop-only">
                        <p className="sidebar-footer-text">POWERED BY LUMINA AI · 2025</p>
                    </div>
                </div>
            </aside>

            <main className="roadmap-canvas">
                {!roadmapData && !isLoading && (
                    <div className="scholarly-empty-state">
                        <div className="orb-bg" />
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h2>Ready to begin your journey?</h2>
                            <p>Enter your research interest to construct a professional learning roadmap.</p>
                            {cacheHistory.length > 0 && (
                                <p className="empty-cache-hint">
                                    ⚡ {cacheHistory.length} roadmap{cacheHistory.length > 1 ? 's' : ''} cached — click one in the sidebar to load instantly.
                                </p>
                            )}
                        </motion.div>
                    </div>
                )}

                {roadmapData && (
                    <section className="academic-timeline-root">
                        {/* Heading */}
                        <div className="academic-header">
                            <span className="academic-badge">Systematic Learning Hierarchy</span>
                            <h2 className="academic-main-title">{roadmapData.title}</h2>
                            <p className="academic-hero-text">A comprehensive path through rigorous training and specialized mastery.</p>
                        </div>

                        {/* The Central Path Timeline (Desktop Only) */}
                        <div className="desktop-road-timeline">
                            <div className="road-body">
                                <div className="road-markers">
                                    {[...Array(15)].map((_, i) => <div key={i} className="road-dash" />)}
                                </div>
                            </div>
                        </div>

                        {/* Mobile Side Timeline */}
                        <div className="mobile-side-timeline" />

                        <div className="stages-wrapper">
                            {roadmapData.categories.map((item, index) => {
                                const isEven = index % 2 === 0;
                                const accentColor = getCategoryColor(index);

                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 40 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-50px" }}
                                        className={`stage-row ${isEven ? 'row-alt' : ''}`}
                                    >
                                        <div className="stage-spacer" />

                                        <div className="stage-card-wrap">
                                            <div className="academic-card">
                                                <div className="card-accent" style={{ background: accentColor }} />

                                                <header className="academic-card-header">
                                                    <div className="icon-badge" style={{ color: accentColor }}>
                                                        {getCategoryIcon(index)}
                                                    </div>
                                                    <div className="card-info">
                                                        <h3 className="degree-title">{item.title}</h3>
                                                    </div>
                                                    <div className="year-pill" style={{ color: accentColor }}>
                                                        STAGE 0{index + 1}
                                                    </div>
                                                </header>

                                                <div className="card-content">
                                                    <ul className="learning-topics">
                                                        {item.topics.map((topic, i) => {
                                                            const key = topicKey(index, i);
                                                            const isOpen = openTopic === key;
                                                            const isLoadingThis = loadingTopic === key;
                                                            const detail = topicDetails[key];
                                                            return (
                                                                <li key={i} className="topic-li topic-li-clickable" onClick={() => handleTopicClick(topic, roadmapData.title, index, i)}>
                                                                    <div className="topic-li-row">
                                                                        <CheckCircle2 size={14} style={{ color: accentColor, flexShrink: 0, marginTop: '2px' }} />
                                                                        <span>{topic.name}</span>
                                                                        <div className="topic-li-actions">
                                                                            {topic.searchUrl && (
                                                                                <a href={topic.searchUrl} target="_blank" rel="noopener noreferrer" className="scholar-link" onClick={e => e.stopPropagation()}>
                                                                                    <ExternalLink size={12} />
                                                                                </a>
                                                                            )}
                                                                            {isLoadingThis
                                                                                ? <Loader2 size={13} className="spin" style={{ color: accentColor }} />
                                                                                : <span className="topic-chevron" style={{ color: accentColor }}>{isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                    <AnimatePresence>
                                                                        {isOpen && (
                                                                            <motion.div
                                                                                key="panel"
                                                                                initial={{ opacity: 0, height: 0 }}
                                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                                exit={{ opacity: 0, height: 0 }}
                                                                                transition={{ duration: 0.28, ease: 'easeInOut' }}
                                                                                className="topic-detail-panel"
                                                                                style={{ borderColor: accentColor + '33' }}
                                                                                onClick={e => e.stopPropagation()}
                                                                            >
                                                                                {isLoadingThis || !detail ? (
                                                                                    <div className="topic-detail-loading">
                                                                                        <Loader2 size={16} className="spin" style={{ color: accentColor }} />
                                                                                        <span>Fetching explanation…</span>
                                                                                    </div>
                                                                                ) : detail.error ? (
                                                                                    <p className="topic-detail-error">{detail.error}</p>
                                                                                ) : (
                                                                                    <>
                                                                                        <div className="topic-detail-explanation">
                                                                                            <BookOpenCheck size={13} style={{ color: accentColor, flexShrink: 0 }} />
                                                                                            <p>{detail.explanation}</p>
                                                                                        </div>
                                                                                        {detail.example && (
                                                                                            <div className="topic-detail-example">
                                                                                                <span className="topic-example-label">Example</span>
                                                                                                <pre className="topic-example-pre"><code>{detail.example}</code></pre>
                                                                                            </div>
                                                                                        )}
                                                                                        {detail.sources && detail.sources.length > 0 && (
                                                                                            <div className="topic-detail-sources">
                                                                                                <Link2 size={11} style={{ color: accentColor }} />
                                                                                                <span className="topic-sources-label">Web Sources</span>
                                                                                                <div className="topic-sources-list">
                                                                                                    {detail.sources.map((s, si) => (
                                                                                                        <a key={si} href={s.url} target="_blank" rel="noopener noreferrer" className="topic-source-link">
                                                                                                            {s.title}
                                                                                                        </a>
                                                                                                    ))}
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>

                                                <footer className="academic-card-footer">
                                                    <span className="milestone-text">Milestone {index + 1}/{roadmapData.categories.length}</span>
                                                    <div className="milestone-track">
                                                        {roadmapData.categories.map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className={`milestone-dot ${i <= index ? 'filled' : ''}`}
                                                                style={{ background: i <= index ? accentColor : '#222' }}
                                                            />
                                                        ))}
                                                    </div>
                                                </footer>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Achievement Badge */}
                        <div className="final-achievement">
                            <div className="achievement-capsule">
                                <CheckCircle2 size={20} />
                                <span>Complete Scholarly Path Constructed</span>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
