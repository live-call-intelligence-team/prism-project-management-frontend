'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PremiumLogoProps {
    className?: string;
    size?: number;
    animate?: boolean;
    variant?: 'icon' | 'full';
}

export const PremiumLogo: React.FC<PremiumLogoProps> = ({
    className = '',
    size = 120,
    animate = true,
    variant = 'icon'
}) => {
    // Premium Colors: Emerald & Gold
    const emeraldGradient = ["#10B981", "#059669", "#047857"];
    const goldGradient = ["#F59E0B", "#D97706", "#B45309"];

    // Glass effect styles
    const glassStyle = {
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    };

    // Shard Animation Variants
    // Each shard floats independently to create a "suspended" accumulation effect
    const shardVariants = {
        initial: { opacity: 0, scale: 0, rotate: -20, x: -50, y: 50 },
        animate: (i: number) => ({
            opacity: [0.4, 0.8, 0.4],
            scale: 1,
            rotate: 0,
            x: 0,
            y: 0,
            transition: {
                delay: i * 0.1,
                duration: 2,
                ease: "easeOut",
                // Breathing/Floating loop after entry
                opacity: {
                    repeat: Infinity,
                    duration: 3 + i,
                    repeatType: "reverse",
                    ease: "easeInOut"
                },
                y: {
                    repeat: Infinity,
                    duration: 4 + i,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    from: 0,
                    to: -5 * (i % 2 === 0 ? 1 : -1)
                }
            } as any // Cast to any to avoid strict type inference issues with complex transitions
        })
    };

    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <motion.svg
                viewBox="0 0 200 200"
                className="w-full h-full overflow-visible"
                initial="initial"
                animate={animate ? "animate" : "initial"}
            >
                <defs>
                    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={emeraldGradient[0]} stopOpacity="0.6" />
                        <stop offset="50%" stopColor={emeraldGradient[1]} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={emeraldGradient[2]} stopOpacity="0.6" />
                    </linearGradient>
                    <linearGradient id="goldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={goldGradient[0]} stopOpacity="0.8" />
                        <stop offset="50%" stopColor={goldGradient[1]} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={goldGradient[2]} stopOpacity="0.8" />
                    </linearGradient>
                    <filter id="glassGlow">
                        <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* 
                    Constructing the Prism from multiple "shards" (triangles/polygons).
                    They overlap to create depth and the glass effect.
                */}

                {/* Base Shard (Darker Emerald) */}
                <motion.path
                    custom={0}
                    variants={shardVariants}
                    d="M100 20 L40 180 L160 180 Z"
                    fill="url(#emeraldGrad)"
                    stroke={emeraldGradient[1]}
                    strokeWidth="0.5"
                    style={glassStyle}
                    filter="url(#glassGlow)"
                />

                {/* Left Shard (Gold Accent) */}
                <motion.path
                    custom={1}
                    variants={shardVariants}
                    d="M100 20 L40 180 L100 150 Z"
                    fill="url(#goldGrad)"
                    stroke={goldGradient[0]}
                    strokeWidth="0.5"
                    opacity="0.6"
                    style={{ mixBlendMode: 'screen' }}
                />

                {/* Right Shard (Lighter Emerald/Glass) */}
                <motion.path
                    custom={2}
                    variants={shardVariants}
                    d="M100 20 L160 180 L100 150 Z"
                    fill="url(#emeraldGrad)"
                    stroke="white"
                    strokeWidth="0.5"
                    fillOpacity="0.3"
                    style={{ mixBlendMode: 'overlay' }}
                />

                {/* Center Core (Bright Gold Highlight) */}
                <motion.path
                    custom={3}
                    variants={shardVariants}
                    d="M100 50 L80 140 L120 140 Z"
                    fill="none"
                    stroke={goldGradient[1]}
                    strokeWidth="1"
                    filter="url(#glassGlow)"
                />

                {/* Floating Particles around the logo */}
                {[...Array(5)].map((_, i) => (
                    <motion.circle
                        key={i}
                        cx={100 + (Math.random() * 100 - 50)}
                        cy={100 + (Math.random() * 100 - 50)}
                        r={Math.random() * 2 + 1}
                        fill={goldGradient[0]}
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [0, 1, 0],
                            y: [0, -20],
                            scale: [0, 1.5, 0]
                        }}
                        transition={{
                            duration: 2 + Math.random(),
                            repeat: Infinity,
                            delay: Math.random() * 2
                        }}
                    />
                ))}
            </motion.svg>
        </div>
    );
};
