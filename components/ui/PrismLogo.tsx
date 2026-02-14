'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PrismLogoProps {
    className?: string;
    variant?: 'full' | 'icon' | 'wordmark';
    animate?: boolean;
    size?: number;
}

export const PrismLogo: React.FC<PrismLogoProps> = ({
    className = '',
    variant = 'full',
    animate = true,
    size = 40
}) => {
    // Colors
    const primaryColor = '#3B82F6'; // Blue-500
    const secondaryColor = '#8B5CF6'; // Violet-500
    const accentColor = '#06B6D4'; // Cyan-500

    // Animation Variants
    const containerVariants = {
        animate: {
            rotateY: [0, 360],
            transition: {
                duration: 20,
                ease: "linear" as any,
                repeat: Infinity,
            }
        }
    };

    const floatVariants = {
        animate: {
            y: [0, -10, 0],
            transition: {
                duration: 4,
                ease: "easeInOut" as any,
                repeat: Infinity,
            }
        }
    };

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {(variant === 'full' || variant === 'icon') && (
                <motion.div
                    style={{
                        width: size,
                        height: size,
                        perspective: '1000px'
                    }}
                    variants={animate ? floatVariants : {}}
                    animate="animate"
                >
                    <motion.svg
                        viewBox="0 0 100 100"
                        className="w-full h-full"
                        variants={animate ? containerVariants : {}}
                        animate="animate"
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        <defs>
                            <linearGradient id="prismGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={primaryColor} stopOpacity="0.9" />
                                <stop offset="50%" stopColor={secondaryColor} stopOpacity="0.8" />
                                <stop offset="100%" stopColor={accentColor} stopOpacity="0.9" />
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Main Prism Shape - Triangle */}
                        <path
                            d="M50 15 L85 80 L15 80 Z"
                            fill="url(#prismGradient)"
                            stroke={primaryColor}
                            strokeWidth="1"
                            filter="url(#glow)"
                            opacity="0.9"
                        />

                        {/* Internal facets for 3D effect */}
                        <path
                            d="M50 15 L50 45 L85 80"
                            stroke="white"
                            strokeWidth="0.5"
                            strokeOpacity="0.5"
                            fill="none"
                        />
                        <path
                            d="M50 15 L50 45 L15 80"
                            stroke="white"
                            strokeWidth="0.5"
                            strokeOpacity="0.5"
                            fill="none"
                        />
                        <path
                            d="M15 80 L50 45 L85 80"
                            stroke="white"
                            strokeWidth="0.5"
                            strokeOpacity="0.5"
                            fill="none"
                        />
                    </motion.svg>
                </motion.div>
            )}

            {(variant === 'full' || variant === 'wordmark') && (
                <motion.span
                    className="font-sans font-bold tracking-[0.2em] text-2xl uppercase"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    style={{
                        background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}
                >
                    PRISM
                </motion.span>
            )}
        </div>
    );
};
