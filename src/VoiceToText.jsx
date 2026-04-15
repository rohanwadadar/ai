"use client";

import { useRef, useEffect, useState } from "react";
import styles from "./VoiceToText.module.css";

/* ══════════════════════════════════════════════════════════
   VoiceToTextUI — waveform recorder that replaces the input row
   Props:
     onTranscript(text)  — called with final text when user confirms
     onCancel()          — called when user cancels recording
   ══════════════════════════════════════════════════════════ */
const VoiceToTextUI = ({ onTranscript, onCancel }) => {
    const [bars, setBars] = useState(Array(60).fill(2));
    const animRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const ctxRef = useRef(null);

    const transcriptRef = useRef("");
    const recognitionRef = useRef(null);

    useEffect(() => {
        let dead = false;

        (async () => {
            try {
                // 1. Initialize Web Speech API for STT
                const SpeechRecognition =
                    window.SpeechRecognition || window.webkitSpeechRecognition;
                if (SpeechRecognition) {
                    const recognition = new SpeechRecognition();
                    recognition.continuous = true;
                    recognition.interimResults = true;
                    recognition.lang = "en-US";

                    recognition.onresult = (event) => {
                        let currentTranscript = "";
                        for (let i = 0; i < event.results.length; i++) {
                            currentTranscript += event.results[i][0].transcript;
                        }
                        transcriptRef.current = currentTranscript;
                    };

                    recognition.start();
                    recognitionRef.current = recognition;
                }

                if (!navigator.mediaDevices?.getUserMedia) {
                    if (!dead) demoBars();
                    return;
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                });
                if (dead) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                streamRef.current = stream;

                const Ctx = window.AudioContext || window.webkitAudioContext;
                if (Ctx) {
                    const ctx = new Ctx();
                    ctxRef.current = ctx;
                    const analyser = ctx.createAnalyser();
                    analyser.fftSize = 256;
                    ctx.createMediaStreamSource(stream).connect(analyser);
                    analyserRef.current = analyser;
                }

                liveBars();
            } catch {
                if (!dead) demoBars();
            }
        })();

        return () => {
            dead = true;
            stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stop = () => {
        cancelAnimationFrame(animRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        if (ctxRef.current?.state !== "closed") ctxRef.current?.close();
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (_) { }
        }
    };

    const liveBars = () => {
        const a = analyserRef.current;
        if (!a) return;
        const d = new Uint8Array(a.frequencyBinCount);
        const tick = () => {
            a.getByteFrequencyData(d);
            setBars(
                Array.from({ length: 60 }, (_, i) => {
                    const weight = Math.sin((Math.PI * i) / 59);
                    const rawHeight = (d[Math.floor((i / 60) * d.length)] / 255) * 52;
                    return Math.max(2, rawHeight * weight);
                })
            );
            animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
    };

    const demoBars = () => {
        let p = 0;
        const tick = () => {
            p += 0.08;
            setBars(
                Array.from({ length: 60 }, (_, i) => {
                    const weight = Math.sin((Math.PI * i) / 59);
                    const wave1 = Math.sin(p - i * 0.25) * 0.5 + 0.5;
                    const wave2 = Math.sin(p * 1.7 - i * 0.15) * 0.3 + 0.3;
                    const wave3 = Math.sin(p * 0.5 - i * 0.4) * 0.2 + 0.2;
                    const combined = wave1 + wave2 + wave3;
                    const noise = Math.random() > 0.85 ? Math.random() * 18 : 0;
                    return Math.max(2, (combined * 36 + noise) * weight);
                })
            );
            animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
    };

    return (
        <div className={styles["recording-bar"]}>
            {/* Cancel */}
            <button
                type="button"
                className={styles["cancel-btn"]}
                onClick={() => { stop(); onCancel?.(); }}
                aria-label="Cancel recording"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            {/* Waveform */}
            <div className={styles["waveform"]}>
                {bars.map((h, i) => (
                    <span key={i} className={styles["bar"]} style={{ height: `${h}px` }} />
                ))}
            </div>

            {/* Confirm */}
            <button
                type="button"
                className={styles["confirm-btn"]}
                onClick={() => { stop(); onTranscript?.(transcriptRef.current); }}
                aria-label="Confirm recording"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </button>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   MicIcon — exported for use in the input row
   ══════════════════════════════════════════════════════════ */
export const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="9" y1="22" x2="15" y2="22" />
    </svg>
);

export default VoiceToTextUI;
