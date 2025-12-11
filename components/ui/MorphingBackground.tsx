
'use client';

import { motion } from 'framer-motion';

export function MorphingBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden bg-black z-0 pointer-events-none">
            {/* Base Layer */}
            <div className="absolute inset-0 bg-transparent" />

            {/* Blob 1: Blue */}
            <motion.div
                className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[100px] mix-blend-screen"
                animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Blob 2: Purple */}
            <motion.div
                className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen"
                animate={{
                    x: [0, -50, 0],
                    y: [0, 100, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
            />

            {/* Blob 3: Pink/Accent */}
            <motion.div
                className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-pink-600/10 rounded-full blur-[120px] mix-blend-screen"
                animate={{
                    x: [0, 50, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
            />
        </div>
    );
}
