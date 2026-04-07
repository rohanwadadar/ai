import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AiAvatar({ status, fullScreen }) {
    // status: 'idle' | 'thinking' | 'happy'

    return (
        <AnimatePresence>
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    top: fullScreen ? '50%' : '20px',
                    left: fullScreen ? '50%' : 'calc(100vw - 120px)',
                    transform: fullScreen ? 'translate(-50%, -50%)' : 'translate(0, 0)',
                    width: fullScreen ? '300px' : '80px',
                    height: fullScreen ? '300px' : '80px',
                    position: 'fixed',
                    zIndex: 9999
                }}
                transition={{ type: "spring", stiffness: 80, damping: 15 }}
                className={`ai-avatar-container ${status}`}
            >
                {/* 3D Rotating Background - only visible when full screen */}
                <AnimatePresence>
                    {fullScreen && (
                        <motion.div
                            className="holo-3d-bg"
                            initial={{ opacity: 0, rotateX: 60, scale: 0.5 }}
                            animate={{ opacity: 1, rotateX: 60, rotateZ: 360, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            transition={{ rotateZ: { repeat: Infinity, duration: 10, ease: "linear" } }}
                        />
                    )}
                </AnimatePresence>

                {/* Robot Core Body */}
                <motion.div className="robot-chassis">
                    {/* Facial Screen */}
                    <div className="robot-screen">
                        {/* Eyes */}
                        <div className={`robot-eyes ${status}`}>
                            <div className="eye left"></div>
                            <div className="eye right"></div>
                        </div>
                        {/* The Scanning Laser or Smile */}
                        {status === 'thinking' && <div className="scanning-laser"></div>}
                    </div>
                </motion.div>

                {/* Floating Ring during thinking */}
                {status === 'thinking' && (
                    <motion.div
                        className="thinking-ring"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    />
                )}

            </motion.div>
        </AnimatePresence>
    );
}
