'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumLogo } from './PremiumLogo';

interface SplashScreenProps {
    onComplete?: () => void;
    mode?: 'startup' | 'transition';
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, mode = 'startup' }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const duration = mode === 'startup' ? 4500 : 2500;

        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
        }, duration);

        return () => clearTimeout(timer);
    }, [onComplete, mode]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
                    initial={{ opacity: mode === 'startup' ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 1.0, ease: "easeInOut" } }}
                    style={{
                        background: "radial-gradient(circle at center, #064e3b 0%, #022c22 40%, #000000 100%)"
                    }}
                >
                    {/* Ambient Glow */}
                    <motion.div
                        className="absolute w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    <div className="relative flex flex-col items-center z-10">
                        {/* Logo Animation */}
                        <motion.div
                            className="mb-10"
                            initial={{ scale: 0.8, opacity: 0, rotateY: 30 }}
                            animate={{
                                scale: 1,
                                opacity: 1,
                                rotateY: 0
                            }}
                            transition={{
                                duration: 1.5,
                                ease: "easeOut"
                            }}
                        >
                            <PremiumLogo size={140} animate={true} />
                        </motion.div>

                        {/* Text Animation */}
                        <div className="text-center">
                            <motion.h1
                                className="text-5xl font-extralight tracking-[0.3em] text-white"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, duration: 1.0 }}
                            >
                                PRISM
                            </motion.h1>

                            <motion.div
                                className="h-[1px] w-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-6"
                                initial={{ width: 0 }}
                                animate={{ width: 120 }}
                                transition={{ delay: 1.2, duration: 1.5, ease: "easeOut" }}
                            />

                            {mode === 'startup' && (
                                <motion.p
                                    className="text-emerald-400/60 text-xs mt-4 tracking-[0.5em] uppercase"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.8, duration: 1.0 }}
                                >
                                    Intelligence Suite
                                </motion.p>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
