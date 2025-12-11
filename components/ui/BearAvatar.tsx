
'use client';

import { motion } from 'framer-motion';

interface FunnyAvatarProps {
    isPasswordFocused: boolean;
    showPassword: boolean;
    isError?: boolean;
}

export function BearAvatar({ isPasswordFocused, showPassword, isError }: FunnyAvatarProps) {
    // Animation variants
    const handVariants = {
        hidden: { y: 130, x: 0 },
        covering: { y: 0, x: 0 },
        peeking: { y: 25, x: 0 },
        laughing: { y: 30, x: 0 }
    };

    return (
        <div className="w-32 h-32 relative mx-auto mb-4">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                {/* Ears */}
                <circle cx="30" cy="90" r="25" fill="#8d5524" />
                <circle cx="170" cy="90" r="25" fill="#8d5524" />
                <circle cx="30" cy="90" r="15" fill="#e0ac69" />
                <circle cx="170" cy="90" r="15" fill="#e0ac69" />

                {/* Head */}
                <circle cx="100" cy="110" r="75" fill="#8d5524" />

                {/* Face/Muzzle */}
                <path d="M 60 90 Q 100 60 140 90 Q 155 120 140 150 Q 100 180 60 150 Q 45 120 60 90" fill="#e0ac69" />

                {/* Eyes */}
                {/* Closed (Laughing/Error) vs Open */}
                {isError ? (
                    <g>
                        {/* Squinting Laughing Eyes > < */}
                        <path d="M 65 95 L 85 105 M 85 95 L 65 105" stroke="#3e2723" strokeWidth="4" strokeLinecap="round" />
                        <path d="M 115 95 L 135 105 M 135 95 L 115 105" stroke="#3e2723" strokeWidth="4" strokeLinecap="round" />
                    </g>
                ) : (
                    <g>
                        <circle cx="75" cy="100" r="12" fill="white" />
                        <circle cx="125" cy="100" r="12" fill="white" />
                        <circle cx="75" cy="100" r="4" fill="#1f2937" />
                        <circle cx="125" cy="100" r="4" fill="#1f2937" />
                    </g>
                )}

                {/* Nose */}
                <circle cx="100" cy="125" r="6" fill="#3e2723" />

                {/* Mouth */}
                {isError ? (
                    // Laughing Mouth
                    <path d="M 80 140 Q 100 160 120 140" stroke="#3e2723" strokeWidth="3" fill="#3e2723" />
                ) : (
                    // Smiling
                    <path d="M 85 145 Q 100 155 115 145" stroke="#3e2723" strokeWidth="3" fill="none" />
                )}

                {/* Hands */}
                <motion.g
                    initial="hidden"
                    animate={
                        isError ? "laughing" :
                            isPasswordFocused && !showPassword ? "covering" :
                                isPasswordFocused && showPassword ? "peeking" : "hidden"
                    }
                >
                    {/* Left Hand */}
                    <motion.g variants={{
                        hidden: { y: 130, x: -30 },
                        covering: { y: -30, x: 0 }, // Over eye
                        peeking: { y: 10, x: -10 },
                        laughing: { y: 40, x: -20, rotate: -20 } // Holding belly/side
                    }}>
                        <circle cx="50" cy="100" r="25" fill="#8d5524" />
                        <circle cx="50" cy="100" r="15" fill="#e0ac69" />
                    </motion.g>

                    {/* Right Hand */}
                    <motion.g variants={{
                        hidden: { y: 130, x: 30 },
                        covering: { y: -30, x: 0 }, // Over eye
                        peeking: { y: 10, x: 10 },
                        laughing: { y: 40, x: 20, rotate: 20 }
                    }}>
                        <circle cx="150" cy="100" r="25" fill="#8d5524" />
                        <circle cx="150" cy="100" r="15" fill="#e0ac69" />
                    </motion.g>
                </motion.g>
            </svg>
        </div>
    );
}
