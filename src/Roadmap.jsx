import React, { useState } from 'react';
import { ArrowLeft, Loader2, Compass, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import './Roadmap.css';
import AiAvatar from './AiAvatar';

const STEPS_LIST = [
    "Analyzing subject...",
    "Building roadmap nodes...",
    "Finalizing learning path...",
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Roadmap({ onBack }) {
    const [prompt, setPrompt] = useState('Machine Learning');
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

            setRobotStatus('happy');
            setRobotFullScreen(false);
            setRoadmapData(data);
        } catch (err) {
            alert("Error generating roadmap.");
        } finally {
            clearInterval(stepInterval);
            setIsLoading(false);
            setTimeout(() => setRobotStatus('idle'), 2000);
        }
    };

    return (
        <div className="roadmap-container neon-void-mode">
            <AiAvatar status={robotStatus} fullScreen={robotFullScreen} />

            <aside className="roadmap-sidebar">
                {/* Standard Header */}
                <div className="sidebar-header">
                    <button className="back-button" onClick={onBack}>
                        <ArrowLeft size={20} />
                        <span className="desktop-only text-label">Back to Chat</span>
                    </button>
                    <h2 className="mobile-only-title">Roadmap Builder</h2>
                </div>

                <div className="input-group-container">
                    <div className="prompt-card">
                        <label className="desktop-only">What do you want to learn?</label>
                        <textarea
                            className="styled-textarea"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isLoading}
                            placeholder="e.g. React.js, Python, or Design Basics..."
                            rows={window.innerWidth < 1024 ? 2 : 4}
                        />
                    </div>

                    <button className="neon-btn main-action-btn" onClick={generateRoadmap} disabled={isLoading}>
                        {isLoading ? <Loader2 className="spin" size={20} /> : <><Compass size={20} /> Generate Path</>}
                    </button>
                </div>

                {isLoading && (
                    <div className="loading-status-area">
                        <p>{STEPS_LIST[activeStep]}</p>
                        <div className="progress-dots">
                            {STEPS_LIST.map((_, i) => (
                                <span key={i} className={`dot ${i === activeStep ? 'active' : ''}`} />
                            ))}
                        </div>
                    </div>
                )}
            </aside>

            <main className="roadmap-canvas">
                {!roadmapData && !isLoading && (
                    <div className="empty-state">Enter a topic to generate your interactive roadmap.</div>
                )}

                {isLoading && !roadmapData && (
                    <div className="empty-state">
                        <Loader2 className="spin" size={40} color="#4cd6fb" />
                        <p>Constructing your personalized learning path...</p>
                    </div>
                )}

                {roadmapData && (
                    <div className="scroll-wrapper">
                        <header className="content-header">
                            <h1 className="roadmap-title">{roadmapData.title}</h1>
                            <p className="roadmap-subtitle">Step-by-step masterclass curated by Lumina AI</p>
                        </header>

                        <div className="timeline-container">
                            <div className="timeline-line"></div>
                            {roadmapData.categories.map((cat, idx) => (
                                <motion.div
                                    className="roadmap-node"
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                >
                                    <div className="node-marker">0{idx + 1}</div>
                                    <div className="node-card">
                                        <h3 className="node-title">{cat.title}</h3>
                                        <ul className="topic-list">
                                            {cat.topics.map((topic, i) => (
                                                <li key={i} className="topic-item">
                                                    <span className="topic-bullet"></span>
                                                    <span className="topic-name">{topic.name}</span>
                                                    {topic.searchUrl && (
                                                        <a href={topic.searchUrl} target="_blank" rel="noopener noreferrer" className="topic-link">
                                                            <ExternalLink size={14} />
                                                        </a>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {roadmapData.resources && roadmapData.resources.length > 0 && (
                            <div className="resources-section">
                                <h3 className="section-label">Recommended Resources</h3>
                                <div className="resources-grid">
                                    {roadmapData.resources.map((res, i) => (
                                        <a href={res.url} target="_blank" rel="noopener noreferrer" key={i} className="resource-link-card">
                                            {res.title}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
