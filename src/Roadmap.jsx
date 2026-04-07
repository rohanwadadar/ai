import React, { useState } from 'react';
import { ArrowLeft, Loader2, Compass, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import './Roadmap.css';
import AiAvatar from './AiAvatar';

const STEPS_LIST = [
    "Initializing coordinates",
    "Generating dimensional pathways",
    "Structuring holographic nodes",
    "Rendering Neon Void interface"
];

export default function Roadmap({ onBack }) {
    const [prompt, setPrompt] = useState('Machine Learning Core');
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
        }, 900);

        try {
            const fetchPromise = fetch('http://localhost:5000/api/roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            const delayPromise = new Promise(resolve => setTimeout(resolve, 4000));

            const [response, _] = await Promise.all([fetchPromise, delayPromise]);

            if (!response.ok) throw new Error("Failed to generate");

            const data = await response.json();

            setRobotStatus('happy');
            setRobotFullScreen(false);

            setRoadmapData(data);
            setActiveStep(STEPS_LIST.length);
            setTimeout(() => setRobotStatus('idle'), 3000);
        } catch (err) {
            console.error(err);
            alert("System Error generating the void map.");
        } finally {
            clearInterval(stepInterval);
            setIsLoading(false);
        }
    };

    return (
        <div className="roadmap-container neon-void-mode">

            <AiAvatar status={robotStatus} fullScreen={robotFullScreen} />

            {/* Configuration Sidebar */}
            <aside className="roadmap-sidebar">
                <button className="back-button" onClick={onBack}>
                    <ArrowLeft size={18} />
                    <span>Exit Interface</span>
                </button>

                <div className="prompt-card">
                    <label>Target Domain:</label>
                    <textarea
                        className="styled-textarea"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                        rows={2}
                        placeholder="e.g., Python Architecture..."
                    />
                </div>

                {isLoading && (
                    <div className="steps-section">
                        <h3>Booting Sequence...</h3>
                        <ul className="steps-list">
                            {STEPS_LIST.map((step, idx) => (
                                <li key={idx} className={idx <= activeStep ? 'active' : 'pending'}>
                                    {idx <= activeStep ? <span className="neon-tick">✓</span> : <span className="void-dot">•</span>}
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="sidebar-footer">
                    <button
                        className="create-content-btn neon-btn"
                        onClick={generateRoadmap}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="spin" size={20} /> : <><Compass size={18} /> Initiate Sequence</>}
                    </button>
                </div>
            </aside>

            {/* Main Canvas with Scrolling Vector Map */}
            <main className="roadmap-canvas">
                {!roadmapData && !isLoading && (
                    <div className="empty-state pulse-text">Awaiting terminal input mapping...</div>
                )}

                {isLoading && !roadmapData && (
                    <div className="empty-state"><Loader2 className="spin" size={30} style={{ marginRight: '1rem', color: '#4cd6fb' }} /> Calibrating vectors...</div>
                )}

                {roadmapData && (
                    <div className="scroll-wrapper">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="void-main-title"
                        >
                            {roadmapData.title}
                            <span className="subtitle">System Generated Learning Vectors</span>
                        </motion.h1>

                        <div className="vector-path-container">
                            {/* The Literal Continuous Future Vector Background */}
                            <div className="neon-vector-line"></div>

                            {roadmapData.categories.map((cat, idx) => {
                                const isLeft = idx % 2 === 0;

                                return (
                                    <motion.div
                                        key={idx}
                                        className={`void-stage-row ${isLeft ? 'row-left' : 'row-right'}`}
                                        initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                    >
                                        {/* The holographic junction node */}
                                        <div className="vector-junction">
                                            <div className="junction-core"></div>
                                        </div>

                                        {/* The Holographic Connector */}
                                        <div className="holographic-connector"></div>

                                        {/* The Holographic Info Card */}
                                        <div className="holographic-card">

                                            <div className="card-header">
                                                <h3 className="card-title">{cat.title}</h3>
                                                <div className="card-index">0{idx + 1}</div>
                                            </div>

                                            <div className="card-body">
                                                <ul className="hologram-bullets">
                                                    {cat.topics.map((t, i) => (
                                                        <li key={i} className={`level-${t.level}`}>
                                                            <span className="holo-bullet-glow"></span>
                                                            <span className="holo-text">{t.name}</span>
                                                            {t.searchUrl && (
                                                                <a href={t.searchUrl} target="_blank" rel="noopener noreferrer" className="holo-link" title="Query Database">
                                                                    <ExternalLink size={14} />
                                                                </a>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Web Search Resources returned by DuckDuckGo */}
                        {roadmapData.resources && roadmapData.resources.length > 0 && (
                            <motion.div
                                className="void-resources-container"
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 }}
                            >
                                <h3><ExternalLink size={18} style={{ marginRight: '0.5rem', display: 'inline-block' }} /> External Data Hubs</h3>
                                <div className="void-links-grid">
                                    {roadmapData.resources.map((res, i) => (
                                        <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" className="void-resource-card">
                                            <span className="truncate">{res.title}</span>
                                        </a>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                    </div>
                )}
            </main>
        </div>
    );
}
