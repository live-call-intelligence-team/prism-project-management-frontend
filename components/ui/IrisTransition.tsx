'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OryxLogo } from './OryxLogo';
import { usePathname } from 'next/navigation';

interface IrisTransitionProps {
    children: React.ReactNode;
    userName?: string;
}

export const IrisTransition: React.FC<IrisTransitionProps> = ({ children, userName }) => {
    // We only trigger this full animation on initial mount (hard refresh) or specific navigate?
    // For now, let's run it on mount to simulate the post-login effect for the user.
    // In a real app, we might check a session flag or recentlyLoggedIn state.
    const [isAnimating, setIsAnimating] = useState(true);
    const pathname = usePathname();

    // To prevent running on every route change, we could check global state.
    // But for this task "now after login animation", implies we want to see it.
    // Let's assume layout re-mounts or we force it. layout.tsx in Next.js persists?
    // Yes, layout persists on navigation. So this will run once on full reload or initial entry.

    // Animation Variants
    const containerVariants = {
        hidden: {
            clipPath: 'circle(0% at 50% 50%)',
            opacity: 0 // Start slightly transparent to blend with black bg?
        },
        visible: {
            clipPath: 'circle(150% at 50% 50%)',
            opacity: 1,
            transition: {
                duration: 1.5,
                ease: [0.25, 1, 0.5, 1] as any // Deceleration curve
            }
        }
    };

    const logoVariants = {
        initial: {
            top: '50%',
            left: '50%',
            x: '-50%',
            y: '-50%',
            scale: 5, // Large center
            opacity: 1,
            position: 'absolute' as const
        },
        animate: {
            top: '32px', // Centered vertically in h-16 (64px) -> 32px
            left: '36px', // Centered in collapsed sidebar/padding -> approx
            x: '-50%',
            y: '-50%', // Keep anchor center
            scale: 1, // Match sidebar logo size (w-6 h-6 approx)
            opacity: 0, // Fade out as it "becomes" the sidebar logo? Or stay visible?
            // User said "floats to top-left". Usually implies it stays visible.
            // But we have a real sidebar logo there. If we keep this one overlaying, it interacts weirdly.
            // Best trick: Animate to position, then fade out just as it lands.
            transition: {
                duration: 1.5,
                ease: [0.25, 1, 0.5, 1] as any
            }
        }
    };

    return (
        <div className="relative min-h-screen bg-black overflow-hidden">
            {/* The Dashboard Content Layer - Revealed by Iris */}
            <motion.div
                className="relative z-10 w-full h-full bg-gray-50 dark:bg-gray-950"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* 
                   We can add parallax or staggered fade-in to children by wrapping them? 
                   But children is a ReactNode. We can wrap it in a motion.div 
                   that staggers its children if possible.
                */}
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }} // Staggered start after iris opens a bit
                >
                    {children}
                </motion.div>
            </motion.div>

            {/* The Floating Logo Overlay */}
            <motion.div
                className="fixed z-50 pointer-events-none"
                initial="initial"
                animate="animate"
                variants={logoVariants}
                onAnimationComplete={() => setIsAnimating(false)}
            >
                <div className="w-8 h-8 flex items-center justify-center">
                    <OryxLogo size={32} animate />
                </div>
            </motion.div>

            {/* Background Atmosphere (visible when Iris is closed/opening) */}
            <div className="absolute inset-0 bg-black -z-10" />

            {/* Radial Gradient Background during transition as requested? 
                 "Logo centered full-screen with radial gradient background"
             */}
            <motion.div
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-black to-black -z-0 pointer-events-none"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.5, delay: 0.2 }}
            />

        </div>
    );
};
