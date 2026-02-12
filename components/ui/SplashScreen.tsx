'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OryxLogo } from './OryxLogo';

interface SplashScreenProps {
    onComplete?: () => void;
    mode?: 'startup' | 'transition'; // New prop to distinguish startup vs post-login
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, mode = 'startup' }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Duration depends on mode: startup is longer, transition is snappy but elegant
        const duration = mode === 'startup' ? 4000 : 2500;

        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
        }, duration);

        return () => clearTimeout(timer);
    }, [onComplete, mode]);

    // Apple-style easing approximation
    const elegantEase = "easeInOut";

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black"
                    initial={{ opacity: mode === 'startup' ? 1 : 0 }} // Transition starts transparent if overlaid
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8, ease: elegantEase } }}
                >
                    <div className="relative flex flex-col items-center">

                        {/* Apple-style Logo Animation Container */}
                        <motion.div
                            className="relative w-48 h-48 mb-8 flex items-center justify-center"
                            initial={{ scale: mode === 'startup' ? 0.8 : 0.4, opacity: 0 }}
                            animate={{
                                scale: [0.8, 1, 1], // Gentle breathe
                                opacity: [0, 1, 1]
                            }}
                            transition={{
                                duration: mode === 'startup' ? 3 : 1.5,
                                times: [0, 0.4, 1],
                                ease: elegantEase as any
                            }}
                        >
                            {/* The Logo Pulse Effect */}
                            {mode === 'startup' && (
                                <motion.div
                                    className="absolute inset-0 rounded-full bg-blue-500/10 blur-3xl"
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                />
                            )}

                            {/* Main Logo Component */}
                            <OryxLogo variant="icon" size={120} />
                        </motion.div>

                        {/* Text Reveal Animation - Elegant Fade Up */}
                        <motion.div
                            initial={{ opacity: 0, y: 10, letterSpacing: "0.1em" }}
                            animate={{ opacity: 1, y: 0, letterSpacing: "0.2em" }}
                            transition={{
                                delay: mode === 'startup' ? 1.0 : 0.5,
                                duration: 1.2,
                                ease: elegantEase
                            }}
                            className="text-center"
                        >
                            <h1 className="text-4xl font-extralight tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-200 to-gray-500">
                                ORYX
                            </h1>
                            {mode === 'startup' && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 2, duration: 1 }}
                                    className="text-gray-500 text-xs mt-3 tracking-[0.3em] uppercase font-light"
                                >
                                    Project Intelligence
                                </motion.p>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
