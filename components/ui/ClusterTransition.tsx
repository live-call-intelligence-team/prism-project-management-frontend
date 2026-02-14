'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrismLogo } from './PrismLogo';
import { CheckCircle2, Cpu, Wifi, Activity } from 'lucide-react';

interface ClusterTransitionProps {
    children: React.ReactNode;
    userName?: string;
}

export const ClusterTransition: React.FC<ClusterTransitionProps> = ({ children, userName = "User" }) => {
    const [phase, setPhase] = useState<'off' | 'ignition' | 'check' | 'ready' | 'active'>('off');

    useEffect(() => {
        // Sequence Timeline
        // 0ms: OFF
        // 500ms: IGNITION (Logo Glow)
        // 1500ms: CHECK (System texts)
        // 3000ms: READY ("System Ready")
        // 3500ms: ACTIVE (Dashboard On)

        const t1 = setTimeout(() => setPhase('ignition'), 500);
        const t2 = setTimeout(() => setPhase('check'), 1500);
        const t3 = setTimeout(() => setPhase('ready'), 3500);
        const t4 = setTimeout(() => setPhase('active'), 4500);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
        };
    }, []);

    // Dashboard Content Variants - simulates gauges powering on
    // Mask reveal + scale up
    const dashboardVariants = {
        hidden: {
            opacity: 0,
            scale: 0.98,
            filter: "grayscale(100%)", // Startup mostly monochrome then color
        },
        visible: {
            opacity: 1,
            scale: 1,
            filter: "grayscale(0%)",
            transition: {
                duration: 0.8,
                ease: [0.34, 1.56, 0.64, 1] as any // Overshoot "needle" feel
            }
        }
    };

    return (
        <div className="relative min-h-screen bg-black overflow-hidden font-mono">

            {/* 3. The Dashboard (The "Cluster") */}
            <motion.div
                className="relative z-10 w-full h-full bg-gray-50 dark:bg-gray-950"
                initial="hidden"
                animate={phase === 'active' ? "visible" : "hidden"}
                variants={dashboardVariants}
            >
                {/* Overlay to simulate screen warming up? */}
                <motion.div
                    className="absolute inset-0 bg-cyan-500/10 z-20 pointer-events-none mix-blend-overlay"
                    initial={{ opacity: 0 }}
                    animate={phase === 'active' ? { opacity: [0, 1, 0] } : {}}
                    transition={{ duration: 0.5 }}
                />

                {children}
            </motion.div>

            {/* 1. & 2. Startup Screen Overlay */}
            <AnimatePresence>
                {phase !== 'active' && (
                    <motion.div
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-cyan-500"
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Ambient Glow Center */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_70%)]" />

                        {/* Logo Ignition */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="relative z-10 mb-12"
                        >
                            <PrismLogo variant="icon" size={120} animate={false} className={phase === 'ignition' ? 'animate-pulse' : ''} />

                            {/* Ring Ripple */}
                            {phase === 'ignition' && (
                                <motion.div
                                    className="absolute inset-0 rounded-full border border-cyan-500/30"
                                    animate={{ scale: [1, 2], opacity: [1, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            )}
                        </motion.div>

                        {/* System Check List */}
                        <div className="h-32 w-64 space-y-2 relative z-10">
                            <AnimatePresence mode="wait">
                                {phase === 'check' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-2 text-xs tracking-widest uppercase text-cyan-400/80"
                                    >
                                        <CheckRow text="BIOS_CHECK... OK" delay={0} />
                                        <CheckRow text="LOADING_MODULES... OK" delay={0.4} />
                                        <CheckRow text="ESTABLISHING_SEC_CONN... OK" delay={0.8} />
                                        <CheckRow text="USER_PROFILE_SYNC... OK" delay={1.2} />
                                    </motion.div>
                                )}

                                {phase === 'ready' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1.2 }}
                                        className="absolute inset-0 flex flex-col items-center justify-center"
                                    >
                                        <h2 className="text-2xl font-bold text-white tracking-[0.2em] border-b-2 border-cyan-500 pb-2 mb-2">
                                            PRISM_INIT
                                        </h2>
                                        <p className="text-cyan-500 text-sm">WELCOME {userName.toUpperCase()}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Bottom Ambient Bar */}
                        <motion.div
                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: phase !== 'off' ? 1 : 0 }}
                            transition={{ duration: 1 }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ambient Lighting Spreading (Footer/Header Glow) - stays a bit after active */}
            <motion.div
                className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none z-40"
                initial={{ opacity: 0 }}
                animate={phase === 'active' ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 2 }}
            />
        </div>
    );
};

const CheckRow = ({ text, delay }: { text: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay }}
        className="flex items-center space-x-2"
    >
        <CheckCircle2 className="w-3 h-3 text-cyan-500" />
        <span>{text}</span>
    </motion.div>
);
