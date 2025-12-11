'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PrismLogo } from './PrismLogo';

interface SplashScreenProps {
    onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Total Sequence: ~3.5s
        const totalDuration = 3500;
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 600); // Exit transition
        }, totalDuration);

        return () => clearTimeout(timer);
    }, [onComplete]);

    // Apple-style ease (cubic-bezier)
    // Framer Motion requires an array of 4 numbers [x1, y1, x2, y2]
    const smoothEase = [0.25, 0.1, 0.25, 1];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                >
                    <div className="relative w-80 h-80 flex items-center justify-center perspective-[1000px]">
                        {/* 1. Sharp Rotating Rings (Formation) */}
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ rotate: 0, scale: 0.8 }}
                            animate={{
                                rotate: 360,
                                scale: 1
                            }}
                            transition={{ duration: 2, ease: smoothEase as any }}
                        >
                            {/* Ring 1: Blue */}
                            <motion.div
                                className="absolute w-48 h-48 border-2 border-indigo-500 rounded-full"
                                style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }}
                                initial={{ opacity: 0, rotateZ: 0 }}
                                animate={{ opacity: [0, 1, 0], rotateZ: 360 }}
                                transition={{ duration: 2, times: [0, 0.2, 1], ease: smoothEase as any }}
                            />
                            {/* Ring 2: Purple */}
                            <motion.div
                                className="absolute w-40 h-40 border-2 border-purple-500 rounded-full"
                                style={{ borderBottomColor: 'transparent', borderRightColor: 'transparent' }}
                                initial={{ opacity: 0, rotateZ: 120 }}
                                animate={{ opacity: [0, 1, 0], rotateZ: 480 }}
                                transition={{ duration: 2, times: [0, 0.2, 1], ease: smoothEase as any, delay: 0.1 }}
                            />
                            {/* Ring 3: Pink */}
                            <motion.div
                                className="absolute w-32 h-32 border-2 border-pink-500 rounded-full"
                                style={{ borderTopColor: 'transparent', borderRightColor: 'transparent' }}
                                initial={{ opacity: 0, rotateZ: 240 }}
                                animate={{ opacity: [0, 1, 0], rotateZ: 600 }}
                                transition={{ duration: 2, times: [0, 0.2, 1], ease: smoothEase as any, delay: 0.2 }}
                            />
                        </motion.div>

                        {/* 2. Main Logo Container (3D Reveal) */}
                        <motion.div
                            className="relative z-10 w-40 h-40"
                            initial={{ scale: 0, opacity: 0, rotateX: 60 }}
                            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                            transition={{ delay: 1.8, duration: 1.0, ease: "circOut" }}
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            <PrismLogo animated />

                            {/* 3. Metallic Shine Effect (Light Sweep) */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-25deg]"
                                initial={{ x: '-150%', opacity: 0 }}
                                animate={{ x: '150%', opacity: 1 }}
                                transition={{ delay: 2.6, duration: 0.6, ease: "easeInOut" }}
                                style={{ width: '200%', height: '100%' }}
                            />
                        </motion.div>

                        {/* 4. Impact Flash background */}
                        <motion.div
                            className="absolute inset-0 bg-indigo-500/10 rounded-full blur-3xl"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 1.8] }}
                            transition={{ delay: 1.8, duration: 0.8 }}
                        />

                        {/* 5. Text Reveal */}
                        <motion.div
                            className="absolute -bottom-24 left-0 right-0 text-center"
                            initial={{ opacity: 0, y: 20, filter: 'blur(5px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ delay: 2.8, duration: 0.7, ease: "easeOut" }}
                        >
                            <h1 className="text-4xl font-light text-white tracking-[0.4em] font-sans">PRISM</h1>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
