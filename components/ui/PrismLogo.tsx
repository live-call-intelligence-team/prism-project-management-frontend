
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function PrismLogo({ className, animated = false }: { className?: string; animated?: boolean }) {
    return (
        <div className={cn("relative flex items-center justify-center", className)}>
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
            >
                <motion.path
                    d="M50 5 L93.3 30 V80 L50 105 L6.7 80 V30 Z" // Hexagon-ish prism
                    fill="url(#gradient)"
                    initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
                    animate={animated ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <motion.path
                    d="M50 5 L50 55 M50 55 L93.3 80 M50 55 L6.7 80" // Internal lines for 3D effect
                    initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
                    animate={animated ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <defs>
                    <linearGradient id="gradient" x1="6.7" y1="5" x2="93.3" y2="105" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6366f1" /> {/* Indigo */}
                        <stop offset="1" stopColor="#a855f7" /> {/* Purple */}
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}
