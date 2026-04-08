import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FlashCards.css';

/* ══════════════════════════════════════════════════════
   Single 3D Flip Card
══════════════════════════════════════════════════════ */
function FlipCard({ card, index, accentColors }) {
    const [flipped, setFlipped] = useState(false);
    const color = accentColors[index % accentColors.length];

    return (
        <motion.div
            className="flashcard-scene"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4 }}
        >
            <div
                className={`flashcard-inner ${flipped ? 'flipped' : ''}`}
                onClick={() => setFlipped(!flipped)}
                style={{ '--card-accent': color }}
            >
                {/* FRONT */}
                <div className="flashcard-face flashcard-front">
                    <div className="flashcard-num">#{card.id}</div>
                    <div className="flashcard-front-body">
                        <span className="flashcard-front-icon">?</span>
                        <p className="flashcard-front-text">{card.front}</p>
                    </div>
                    <div className="flashcard-tap-hint">Tap to reveal →</div>
                </div>

                {/* BACK */}
                <div className="flashcard-face flashcard-back">
                    <div className="flashcard-num">#{card.id}</div>
                    <div className="flashcard-back-body">
                        <span className="flashcard-back-icon">✦</span>
                        <p className="flashcard-back-text">{card.back}</p>
                    </div>
                    <div className="flashcard-tap-hint">← Tap to flip back</div>
                </div>
            </div>
        </motion.div>
    );
}

/* ══════════════════════════════════════════════════════
   Full Flashcard Deck Component
══════════════════════════════════════════════════════ */
const ACCENT_COLORS = [
    '#3b82f6', '#14b8a6', '#a855f7',
    '#f43f5e', '#f59e0b', '#10b981',
    '#6366f1', '#ec4899',
];

export default function FlashCards({ data }) {
    const [mode, setMode] = useState('grid'); // 'grid' | 'focus'
    const [focusIdx, setFocusIdx] = useState(0);
    const [focusFlipped, setFocusFlipped] = useState(false);

    const cards = data.cards || [];
    const total = cards.length;
    const current = cards[focusIdx];

    const goNext = () => { setFocusFlipped(false); setTimeout(() => setFocusIdx(i => Math.min(i + 1, total - 1)), 100); };
    const goPrev = () => { setFocusFlipped(false); setTimeout(() => setFocusIdx(i => Math.max(i - 1, 0)), 100); };

    return (
        <div className="flashdeck-root">
            {/* Header */}
            <div className="flashdeck-header">
                <div className="flashdeck-title-row">
                    <span className="flashdeck-icon">🃏</span>
                    <div>
                        <h3 className="flashdeck-title">{data.title}</h3>
                        <span className="flashdeck-subtitle">{total} cards · Click any card to flip</span>
                    </div>
                </div>
                <div className="flashdeck-mode-toggle">
                    <button
                        className={`mode-btn ${mode === 'grid' ? 'active' : ''}`}
                        onClick={() => setMode('grid')}
                        title="Grid view"
                    >⊞ Grid</button>
                    <button
                        className={`mode-btn ${mode === 'focus' ? 'active' : ''}`}
                        onClick={() => { setMode('focus'); setFocusIdx(0); setFocusFlipped(false); }}
                        title="Focus mode"
                    >▶ Study</button>
                </div>
            </div>

            {/* Progress bar */}
            {mode === 'focus' && (
                <div className="flashdeck-progress-row">
                    <div className="flashdeck-progress-track">
                        <div
                            className="flashdeck-progress-fill"
                            style={{ width: `${((focusIdx + 1) / total) * 100}%` }}
                        />
                    </div>
                    <span className="flashdeck-progress-label">{focusIdx + 1} / {total}</span>
                </div>
            )}

            {/* ── GRID MODE ── */}
            {mode === 'grid' && (
                <div className="flashdeck-grid">
                    {cards.map((card, i) => (
                        <FlipCard key={card.id} card={card} index={i} accentColors={ACCENT_COLORS} />
                    ))}
                </div>
            )}

            {/* ── FOCUS / STUDY MODE ── */}
            {mode === 'focus' && current && (
                <div className="flashdeck-focus">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={focusIdx}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.25 }}
                            className="focus-card-scene"
                        >
                            <div
                                className={`focus-card-inner ${focusFlipped ? 'flipped' : ''}`}
                                onClick={() => setFocusFlipped(f => !f)}
                                style={{ '--card-accent': ACCENT_COLORS[focusIdx % ACCENT_COLORS.length] }}
                            >
                                {/* Front */}
                                <div className="flashcard-face flashcard-front focus-face">
                                    <div className="flashcard-num">Card {focusIdx + 1}</div>
                                    <div className="flashcard-front-body">
                                        <span className="flashcard-front-icon">?</span>
                                        <p className="flashcard-front-text">{current.front}</p>
                                    </div>
                                    <div className="flashcard-tap-hint">Click to reveal answer →</div>
                                </div>
                                {/* Back */}
                                <div className="flashcard-face flashcard-back focus-face">
                                    <div className="flashcard-num">Answer</div>
                                    <div className="flashcard-back-body">
                                        <span className="flashcard-back-icon">✦</span>
                                        <p className="flashcard-back-text">{current.back}</p>
                                    </div>
                                    <div className="flashcard-tap-hint">← Click to flip back</div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="focus-nav">
                        <button className="focus-nav-btn" onClick={goPrev} disabled={focusIdx === 0}>← Prev</button>
                        <div className="focus-dots">
                            {cards.map((_, i) => (
                                <span
                                    key={i}
                                    className={`focus-dot ${i === focusIdx ? 'active' : ''}`}
                                    onClick={() => { setFocusFlipped(false); setFocusIdx(i); }}
                                />
                            ))}
                        </div>
                        <button className="focus-nav-btn" onClick={goNext} disabled={focusIdx === total - 1}>Next →</button>
                    </div>
                </div>
            )}
        </div>
    );
}
