'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface OryxLogoProps {
    className?: string;
    variant?: 'full' | 'icon' | 'wordmark';
    animate?: boolean;
    size?: number;
}

export const OryxLogo: React.FC<OryxLogoProps> = ({
    className = '',
    variant = 'full',
    animate = true,
    size = 40
}) => {
    // Colors
    const techBlue = '#0047AB';
    const techPurple = '#6A0DAD';
    const glowColor = 'rgba(0, 71, 171, 0.5)';

    // Animation Variants
    const hornVariants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                duration: 1.5,
                ease: "easeInOut" as any
            }
        }
    };

    const containerVariants = {
        animate: {
            rotateY: [0, 8, 0, -8, 0],
            transition: {
                duration: 4,
                ease: "easeInOut" as any,
                repeat: Infinity,
            }
        }
    };

    const pulseVariants = {
        animate: {
            filter: [
                `drop-shadow(0 0 2px ${glowColor})`,
                `drop-shadow(0 0 10px ${glowColor})`,
                `drop-shadow(0 0 2px ${glowColor})`
            ],
            transition: {
                duration: 2,
                ease: "easeInOut" as any,
                repeat: Infinity,
            }
        }
    };

    return (
        <div
            className={`flex items-center gap-3 ${className}`}
            style={{ perspective: '1000px' }}
        >
            {(variant === 'full' || variant === 'icon') && (
                <motion.div
                    style={{
                        width: size,
                        height: size,
                        transformStyle: 'preserve-3d'
                    }}
                    variants={animate ? containerVariants : {}}
                    animate="animate"
                >
                    <motion.svg
                        viewBox="0 0 100 100"
                        className="w-full h-full"
                        variants={animate ? pulseVariants : {}}
                        animate="animate"
                    >
                        <defs>
                            <linearGradient id="oryxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={techBlue} />
                                <stop offset="100%" stopColor={techPurple} />
                            </linearGradient>
                        </defs>

                        {/* Antelope Horns - Geometric Minimalist */}
                        {/* Horn 1: Main curve */}
                        <motion.path
                            d="M30 80 C 30 40, 50 20, 80 15"
                            fill="none"
                            stroke="url(#oryxGradient)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            variants={hornVariants}
                            initial="hidden"
                            animate="visible"
                        />

                        {/* Horn 2: Secondary curve creating the negative space arrow */}
                        <motion.path
                            d="M45 80 C 45 50, 60 35, 85 30"
                            fill="none"
                            stroke="url(#oryxGradient)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            variants={hornVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.3, ease: "easeInOut" as any }}
                        />

                        {/* Negative space arrow helper (subtle background element if needed, 
                            but the curves themselves form it) */}
                        <motion.path
                            d="M35 70 L 50 55 L 65 70"
                            fill="none"
                            stroke={techBlue}
                            strokeWidth="2"
                            opacity="0.2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.2 }}
                            transition={{ delay: 1.5 }}
                        />
                    </motion.svg>
                </motion.div>
            )}

            {(variant === 'full' || variant === 'wordmark') && (
                <motion.span
                    className="font-sans font-extralight tracking-[0.2em] text-2xl uppercase"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    style={{
                        color: techBlue,
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                    }}
                >
                    ORYX
                </motion.span>
            )}
        </div>
    );
};
