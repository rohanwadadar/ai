import React, { useState } from 'react';
import { ArrowLeft, Loader2, Compass, ExternalLink, GraduationCap, Microscope, BookOpen, School, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import './Roadmap.css';
import AiAvatar from './AiAvatar';

const STEPS_LIST = [
    "Analyzing Academic Vectors...",
    "Drafting Research Dimensions...",
    "Finalizing Scholarly Path...",
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper to pick an icon based on category index
const getCategoryIcon = (index) => {
    const icons = [<GraduationCap size={24} />, <Microscope size={24} />, <BookOpen size={24} />, <School size={24} />, <GraduationCap size={24} />];
    return icons[index % icons.length];
};

// Helper for distinct gradient colors
const getCategoryColor = (index) => {
    const colors = [
        "linear-gradient(135deg, #3b82f6, #2563eb)", // Blue
        "linear-gradient(135deg, #14b8a6, #0d9488)", // Teal
        "linear-gradient(135deg, #a855f7, #9333ea)", // Purple
        "linear-gradient(135deg, #f43f5e, #e11d48)", // Rose
        "linear-gradient(135deg, #f59e0b, #d97706)"  // Orange
    ];
    return colors[index % colors.length];
};

export default function Roadmap({ onBack }) {
    const [prompt, setPrompt] = useState('Organic Chemistry Research');
    const [roadmapData, setRoadmapData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [robotStatus, setRobotStatus] = useState('idle');
    const [robotFullScreen, setRobotFullScreen] = useState(false);

    const generateRoadmap = async () => {
        if (!prompt.trim()) return;

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

    return (
        <div className="roadmap-container academic-mode">
            {/* The Persistent AI Assistant */}
            <div className="avatar-portal">
                <AiAvatar status={robotStatus} fullScreen={robotFullScreen} />
            </div>

            <aside className="roadmap-sidebar">
                <div className="sidebar-header">
                    <button className="back-button" onClick={onBack}>
                        <ArrowLeft size={18} />
                        <span className="desktop-only">Back to Terminal</span>
                    </button>
                    <h2 className="mobile-only-title">Scholar's Path</h2>
                </div>

                <div className="input-group-container">
                    <div className="prompt-card">
                        <label className="desktop-only text-label">Target Field of Study:</label>
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
                        {isLoading ? <Loader2 className="spin" size={20} /> : <><Compass size={20} /> Generate Academic Path</>}
                    </button>
                </div>

                {isLoading && (
                    <div className="scholarly-loading">
                        <p>{STEPS_LIST[activeStep]}</p>
                        <div className="scholarly-bar">
                            <div className="bar-fill" style={{ width: `${(activeStep + 1) * 33}%` }} />
                        </div>
                    </div>
                )}
            </aside>

            <main className="roadmap-canvas">
                {!roadmapData && !isLoading && (
                    <div className="scholarly-empty-state">
                        <div className="orb-bg" />
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h2>Ready to begin your journey?</h2>
                            <p>Enter your research interest to construct a professional learning roadmap.</p>
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

                        {/* Mobile Side Timeline (Visible on mobile/tablet) */}
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
                                                    <div className="icon-badge" style={{ background: accentColor }}>
                                                        {getCategoryIcon(index)}
                                                    </div>
                                                    <div className="card-info">
                                                        <h3 className="degree-title">{item.title}</h3>
                                                        <div className="accent-line" style={{ background: accentColor }} />
                                                    </div>
                                                    <div className="year-pill" style={{ background: accentColor }}>
                                                        STAGE 0{index + 1}
                                                    </div>
                                                </header>

                                                <div className="card-content">
                                                    <ul className="learning-topics">
                                                        {item.topics.map((topic, i) => (
                                                            <li key={i} className="topic-li">
                                                                <CheckCircle2 size={14} style={{ color: '#14b8a6', flexShrink: 0, marginTop: '2px' }} />
                                                                <span>{topic.name}</span>
                                                                {topic.searchUrl && (
                                                                    <a href={topic.searchUrl} target="_blank" rel="noopener noreferrer" className="scholar-link">
                                                                        <ExternalLink size={12} />
                                                                    </a>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <footer className="academic-card-footer">
                                                    <span className="milestone-text">Milestone {index + 1}/{roadmapData.categories.length}</span>
                                                    <div className="milestone-track">
                                                        {roadmapData.categories.map((_, i) => (
                                                            <div key={i} className={`milestone-dot ${i <= index ? 'filled' : ''}`} style={{ background: i <= index ? accentColor : '#eee' }} />
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
