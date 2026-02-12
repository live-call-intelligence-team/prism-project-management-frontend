'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OryxLogo } from './OryxLogo';

interface CinematicIntroProps {
    children: React.ReactNode;
    userName?: string;
}

export const ZoomThroughTransition: React.FC<CinematicIntroProps> = ({ children, userName = "User" }) => {
    // We use a simple state to unmount the heavy intro layer after it's done, 
    // but the children (dashboard) need to stay visible.
    const [introComplete, setIntroComplete] = useState(false);

    // Welcome text animation state
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        // Timeline:
        // 0-0.8s: Spotlight
        // 0.8-2.0s: Zoom
        // 2.0s: Reveal starts (handled by variants)
        // 3.5s: Welcome text starts
        const welcomeTimer = setTimeout(() => setShowWelcome(true), 3500);
        const cleanupTimer = setTimeout(() => setIntroComplete(true), 6000); // Clear overlay well after animations

        return () => {
            clearTimeout(welcomeTimer);
            clearTimeout(cleanupTimer);
        };
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3, // Stagger sidebar, charts, etc.
                delayChildren: 2.0 // Start revealing after portal jump
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0, scale: 0.95 },
        visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 100, damping: 20 } as any
        }
    };

    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">

            {/* 3. Dashboard Content Layer */}
            {/* The dashboard sits underneath and animates in */}
            <motion.div
                className="relative z-10 w-full h-full"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Wrap children to apply standard stagger effect to the layout parts */}
                <motion.div variants={itemVariants} className="w-full h-full">
                    {children}
                </motion.div>
            </motion.div>

            {/* 1. & 2. Cinematic Overlay Layer */}
            {!introComplete && (
                <motion.div
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black pointer-events-none overflow-hidden"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0, pointerEvents: "none" }}
                    transition={{ duration: 1, delay: 2.5, ease: "easeOut" }} // Fade out overlay after reveal starts
                >
                    {/* Grid Background */}
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}
                    />

                    {/* Spotlight Effect */}
                    <motion.div
                        className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-80"
                        animate={{ scale: [1, 1.2, 30] }} // Spotlight widens -> explodes
                        transition={{ duration: 2.5, times: [0, 0.4, 1], ease: "easeInOut" }}
                    />

                    {/* Logo Sequence */}
                    <motion.div
                        className="relative z-20"
                        initial={{ scale: 0.5, opacity: 0, filter: "brightness(0)" }}
                        animate={{
                            scale: [1, 1, 50], // Start normal, hold, then ZOOM
                            opacity: [1, 1, 0],
                            filter: ["brightness(1)", "brightness(1.5)", "blur(10px)"],
                            z: [0, 500] // Depth illusion
                        }}
                        transition={{
                            duration: 2.0,
                            times: [0, 0.4, 1],
                            ease: [0.16, 1, 0.3, 1] // Custom refined curve
                        }}
                    >
                        <OryxLogo variant="icon" size={120} animate={true} />
                    </motion.div>

                    {/* Speed Lines / Portal Effect */}
                    <motion.div
                        className="absolute inset-0 z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.5, 0] }} // Flash during zoom
                        transition={{ duration: 1.0, delay: 0.8 }}
                    >
                        <div className="w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(255,255,255,0.1)_360deg)] animate-spin-slow" />
                    </motion.div>

                </motion.div>
            )}

            {/* 4. Welcome Personalization Toast */}
            <AnimatePresence>
                {showWelcome && (
                    <motion.div
                        className="fixed top-24 right-8 z-50 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-2xl flex items-center space-x-4 max-w-sm"
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {userName[0]}
                        </div>
                        <div>
                            <motion.h3
                                className="text-white font-medium"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                Welcome back, <span className="text-blue-400">{userName}</span>
                            </motion.h3>
                            <motion.p
                                className="text-xs text-gray-400"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • System Optimized
                            </motion.p>
                        </div>
                        <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-blue-500 to-transparent"
                            style={{ width: '100%' }}
                        // Simple progress bar animation
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
