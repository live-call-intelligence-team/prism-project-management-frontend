'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumLogo } from './PremiumLogo';
import { Particles } from './Particles';

interface PremiumEntranceProps {
    children: React.ReactNode;
    userName?: string;
    onComplete?: () => void;
}

export const PremiumEntrance: React.FC<PremiumEntranceProps> = ({ children, userName = "User", onComplete }) => {
    const [phase, setPhase] = useState<'intro' | 'reveal' | 'complete'>('intro');

    useEffect(() => {
        // Timeline:
        // 0s-3s: Logo assembly & Particles (Intro)
        // 3s-4.5s: Reveal dashboard
        // 4.5s: Cleanup

        const t1 = setTimeout(() => {
            setPhase('reveal');
            if (onComplete) onComplete();
        }, 3000);

        const t2 = setTimeout(() => {
            setPhase('complete');
        }, 4500);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [onComplete]);

    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">

            {/* Dashboard Content - Underneath */}
            <div className={`relative z-10 w-full h-full transition-opacity duration-1000 ${phase === 'intro' ? 'opacity-0' : 'opacity-100'}`}>
                {children}
            </div>

            {/* Premium Overlay */}
            <AnimatePresence>
                {phase !== 'complete' && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        style={{
                            background: "linear-gradient(135deg, #022c22 0%, #064e3b 40%, #000000 100%)" // Deep Rich Emerald/Dark Theme
                        }}
                    >
                        {/* Golden Particles */}
                        <div className="absolute inset-0 opacity-40">
                            {/* Reusing existing Particles but could override colors if component supports it, 
                                 assuming standard white/transparent particles, blend mode helps match theme */}
                            <Particles />
                        </div>

                        {/* Ambient Light */}
                        <motion.div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        />

                        {/* Centered Logo Sequence */}
                        <div className="relative z-20 flex flex-col items-center">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            >
                                <PremiumLogo size={180} animate={true} />
                            </motion.div>

                            <motion.div
                                className="mt-8 text-center"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.0, duration: 1.0 }}
                            >
                                <h1 className="text-4xl md:text-5xl font-extralight tracking-[0.3em] text-white">
                                    PRISM
                                </h1>
                                <motion.div
                                    className="h-[1px] w-24 bg-gradient-to-r from-transparent via-emerald-400 to-transparent mx-auto mt-4"
                                    initial={{ width: 0 }}
                                    animate={{ width: 100 }}
                                    transition={{ delay: 1.5, duration: 1.0 }}
                                />
                                <p className="text-emerald-400/80 text-xs mt-3 tracking-[0.5em] uppercase">
                                    INTELLIGENCE SUITE
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
