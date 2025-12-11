
'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PrismLogo } from './PrismLogo';

interface DoorTransitionProps {
    children: React.ReactNode;
    userName?: string;
}

export function DoorTransition({ children, userName = 'User' }: DoorTransitionProps) {
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        // Total Sequence: ~3.5s
        const timer = setTimeout(() => {
            setIsComplete(true);
        }, 3500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative min-h-screen bg-black overflow-hidden shadow-2xl">
            {/* Dashboard Content - Revealed after zoom */}
            <motion.div
                className="min-h-screen w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.8, duration: 0.8 }}
            >
                {children}
            </motion.div>

            {/* Portal Overlay - The Sequence */}
            {!isComplete && (
                <motion.div
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black pointer-events-none"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: 3.2, duration: 0.3 }}
                >
                    {/* The Zoom Container - Holds everything and flies into camera */}
                    <motion.div
                        className="relative flex flex-col items-center justify-center"
                        animate={{
                            scale: [1, 1, 50],         // Normal -> Normal -> ZOOM
                            opacity: [1, 1, 0]         // Visible -> Visible -> Fade out
                        }}
                        transition={{
                            duration: 3.2,
                            times: [0, 0.8, 1],        // Wait for 80% of time, then Zoom
                            ease: [0.7, 0, 0.84, 0]    // Aggressive "In" ease for the zoom
                        }}
                    >

                        {/* 1. Logo Formation & Shine */}
                        <div className="relative mb-8">
                            <motion.div
                                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                transition={{ duration: 1.2, ease: "backOut" }} // Pop in formation
                            >
                                <div className="w-40 h-40">
                                    <PrismLogo animated={false} />
                                </div>
                            </motion.div>

                            {/* The Shine Effect */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/80 to-transparent skew-x-12"
                                initial={{ x: '-150%', opacity: 0 }}
                                animate={{ x: '150%', opacity: 1 }}
                                transition={{ delay: 1.2, duration: 0.8, ease: "easeInOut" }} // Shines after formation
                                style={{ width: '200%', height: '100%' }}
                            />
                        </div>

                        {/* 2. Welcome Text (Appears after Shine) */}
                        <motion.div
                            className="text-center"
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 1.5, duration: 0.5, ease: "easeOut" }}
                        >
                            <h2 className="text-gray-400 text-lg font-light tracking-[0.3em] uppercase mb-2">Welcome Back</h2>
                            <h1 className="text-white text-4xl font-bold tracking-tight">{userName}</h1>
                        </motion.div>

                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
