import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FlashCards.css';

/* ══════════════════════════════════════════════════════
   Full Flashcard Deck Component (Study / Focus Only)
══════════════════════════════════════════════════════ */
const ACCENT_COLORS = [
    '#3b82f6', '#14b8a6', '#a855f7',
    '#f43f5e', '#f59e0b', '#10b981',
    '#6366f1', '#ec4899',
];

export default function FlashCards({ data }) {
    const [focusIdx, setFocusIdx] = useState(0);
    const [focusFlipped, setFocusFlipped] = useState(false);

    const cards = data.cards || [];
    const total = cards.length;
    const current = cards[focusIdx];

    const goNext = () => {
        setFocusFlipped(false);
        setTimeout(() => setFocusIdx(i => Math.min(i + 1, total - 1)), 100);
    };
    const goPrev = () => {
        setFocusFlipped(false);
        setTimeout(() => setFocusIdx(i => Math.max(i - 1, 0)), 100);
    };

    if (!current) return null;

    return (
        <div className="flashdeck-root">
            {/* Header */}
            <div className="flashdeck-header">
                <div className="flashdeck-title-row">
                    <span className="flashdeck-icon">🃏</span>
                    <div>
                        <h3 className="flashdeck-title">{data.title}</h3>
                        <span className="flashdeck-subtitle">Practice Mode · {total} Cards</span>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="flashdeck-progress-row">
                <div className="flashdeck-progress-track">
                    <div
                        className="flashdeck-progress-fill"
                        style={{ width: `${((focusIdx + 1) / total) * 100}%` }}
                    />
                </div>
                <span className="flashdeck-progress-label">{focusIdx + 1} / {total}</span>
            </div>

            {/* ── FOCUS / STUDY MODE ── */}
            <div className="flashdeck-focus">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={focusIdx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
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
                                <div className="flashcard-num">CARD {focusIdx + 1}</div>
                                <div className="flashcard-front-body">
                                    <span className="flashcard-front-icon">?</span>
                                    <p className="flashcard-front-text">{current.front}</p>
                                </div>
                                <div className="flashcard-tap-hint">Click to reveal answer →</div>
                            </div>
                            {/* Back */}
                            <div className="flashcard-face flashcard-back focus-face">
                                <div className="flashcard-back-body">
                                    <div className="flashcard-num">ANSWER</div>
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
                    <button className="focus-nav-btn" onClick={goPrev} disabled={focusIdx === 0}>← Previous</button>
                    <div className="focus-dots desktop-only">
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
        </div>
    );
}
