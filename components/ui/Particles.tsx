'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Particle {
    id: number;
    width: number;
    height: number;
    top: number;
    left: number;
    duration: number;
}

export const Particles = () => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const newParticles = Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            top: Math.random() * 100,
            left: Math.random() * 100,
            duration: 3 + Math.random() * 2,
        }));
        setParticles(newParticles);
    }, []);

    return (
        <>
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute bg-white/30 rounded-full"
                    style={{
                        width: p.width,
                        height: p.height,
                        top: `${p.top}%`,
                        left: `${p.left}%`,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </>
    );
};
