
'use client';

import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ParticleButtonProps extends HTMLMotionProps<"button"> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary';
}

export function ParticleButton({ children, className, isLoading, onClick, variant = 'primary', ...props }: ParticleButtonProps) {
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; angle: number; color: string }[]>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const createParticles = (e: React.MouseEvent | React.TouchEvent, count: number, speed: number) => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;

        const newParticles = Array.from({ length: count }).map((_, i) => ({
            id: Date.now() + i,
            x: 'clientX' in e ? ((e as React.MouseEvent).clientX - rect.left) : rect.width / 2,
            y: 'clientY' in e ? ((e as React.MouseEvent).clientY - rect.top) : rect.height / 2,
            angle: Math.random() * 360,
            color: ['#0047AB', '#6A0DAD', '#4F46E5'][Math.floor(Math.random() * 3)] // ORYX colors
        }));

        setParticles(prev => [...prev.slice(-20), ...newParticles]);

        setTimeout(() => {
            setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
        }, 1000);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
        createParticles(e, 5, 20); // Small burst on hover enter
        props.onMouseEnter?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        createParticles(e, 30, 50); // Big burst on click
        onClick?.(e);
    };

    return (
        <motion.button
            ref={buttonRef}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={handleMouseEnter}
            onClick={handleClick}
            className={cn(
                "relative overflow-hidden px-6 py-3 rounded-xl font-medium transition-all duration-300",
                "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg hover:shadow-indigo-500/25",
                isLoading && "opacity-80 cursor-wait",
                className
            )}
            {...props}
        >
            <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {children as React.ReactNode}
            </span>

            {/* Particle Overlay */}
            <AnimatePresence>
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
                        animate={{
                            x: p.x + Math.cos(p.angle) * 100, // Fly out
                            y: p.y + Math.sin(p.angle) * 100,
                            opacity: 0,
                            scale: 0
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ backgroundColor: p.color }}
                        className="absolute w-2 h-2 rounded-full pointer-events-none z-0"
                    />
                ))}
            </AnimatePresence>
        </motion.button>
    );
}
