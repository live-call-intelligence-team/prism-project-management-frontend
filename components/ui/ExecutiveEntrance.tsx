'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OryxLogo } from './OryxLogo';
import { User } from 'lucide-react';
import { Particles } from './Particles';

interface ExecutiveEntranceProps {
    children: React.ReactNode;
    userName?: string;
    onReveal?: () => void; // Callback to trigger dashboard animations
}

export const ExecutiveEntrance: React.FC<ExecutiveEntranceProps> = ({ children, userName = "User", onReveal }) => {
    const [phase, setPhase] = useState<'intro' | 'portal' | 'reveal' | 'complete'>('intro');
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        // Timeline Management
        // 0s: Intro (Spotlight)
        // 1.5s: Portal (Zoom)
        // 2.5s: Reveal (Dashboard visible, Overlay fade) -> Trigger onReveal
        // 3.0s: Welcome Text
        // 4.0s: Complete (Cleanup)

        const t1 = setTimeout(() => setPhase('portal'), 1500);
        const t2 = setTimeout(() => {
            setPhase('reveal');
            if (onReveal) onReveal();
        }, 2200);
        const t3 = setTimeout(() => setShowWelcome(true), 2800);

        // Hide overlay completely after animation
        const t4 = setTimeout(() => setPhase('complete'), 4600);

        // Hide welcome message after 2 seconds
        const t5 = setTimeout(() => setShowWelcome(false), 5000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
            clearTimeout(t5);
        };
    }, [onReveal]);

    // Custom Easing
    const customEase = [0.25, 0.46, 0.45, 0.94] as const;

    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950">

            {/* 3. Dashboard Content (Children) */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>

            {/* 1. & 2. The Interaction Overlay */}
            <AnimatePresence>
                {phase !== 'complete' && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1437] overflow-hidden" // Deep Navy
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, pointerEvents: "none" }}
                        animate={phase === 'reveal' ? { opacity: 0 } : { opacity: 1 }}
                        transition={{ duration: 0.8, ease: customEase }}
                    >
                        {/* Dot Grid Background */}
                        <div
                            className="absolute inset-0 opacity-10"
                            style={{
                                backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                                backgroundSize: '30px 30px'
                            }}
                        />

                        {/* Spotlight */}
                        <motion.div
                            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,71,171,0.15)_0%,transparent_60%)]" // Blue spotlight
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />

                        {/* Ambient Particles */}
                        <div className="absolute inset-0 overflow-hidden">
                            <Particles />
                        </div>

                        {/* Central Logo */}
                        <motion.div
                            className="relative z-20"
                            initial={{ scale: 0.8, opacity: 0, rotateY: 0 }}
                            animate={
                                phase === 'intro' ? { scale: 1.2, opacity: 1, rotateY: 5 } :
                                    phase === 'portal' ? { scale: 30, opacity: 0, filter: "blur(20px)" } : {}
                            }
                            transition={{
                                duration: phase === 'portal' ? 1.0 : 1.5, // 4s total seq logic
                                ease: customEase
                            }}
                        >
                            {/* Metallic Texture Simulation Wrapper */}
                            <div className="relative w-48 h-48 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
                                <OryxLogo variant="icon" size={120} animate={true} />
                                {/* Add a simple shine overlay if feasible without breaking layout */}
                            </div>
                        </motion.div>

                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. Welcome Text Toast */}
            <AnimatePresence>
                {showWelcome && (
                    <motion.div
                        className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 1.5, ease: "easeInOut" } }} // Slow fade out
                    >
                        {/* Backdrop for focus */}
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                        <motion.div
                            className="relative bg-white/10 dark:bg-[#0B1437]/80 backdrop-blur-md border border-blue-500/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,71,171,0.2)] text-center min-w-[300px]"
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 1.1, opacity: 0, filter: "blur(20px)" }} // Slow motion "dissolve"
                            transition={{ duration: 0.8, ease: customEase }}
                        >
                            <div className="flex flex-col items-center">
                                <motion.span
                                    className="text-sm font-medium text-gray-200 uppercase tracking-widest mb-2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    System Access Granted
                                </motion.span>

                                <div className="relative">
                                    <motion.h2
                                        className="text-3xl font-bold text-white mb-2"
                                        initial={{ clipPath: 'inset(0 100% 0 0)' }}
                                        animate={{ clipPath: 'inset(0 0 0 0)' }}
                                        transition={{ duration: 1.0, ease: "linear", delay: 0.3 }}
                                    >
                                        Welcome, <span className="text-blue-400">{userName}</span>
                                    </motion.h2>
                                    {/* Blue Underline */}
                                    <motion.div
                                        className="h-[2px] bg-blue-500 mx-auto"
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 0.8, delay: 1.0, ease: "circOut" }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
