'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/lib/store/authStore';
import apiClient from '@/lib/api/client';
import axios from 'axios';

// ═══════════════════════════════════════════════════════════
// PRISM SVG Logo Component (reusable)
// ═══════════════════════════════════════════════════════════

function PrismSVG({ className = '', size = 80 }: { className?: string; size?: number }) {
    return (
        <svg viewBox="0 0 100 100" className={className} width={size} height={size}>
            <defs>
                <linearGradient id="prismFill" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818CF8" />
                    <stop offset="50%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#4F46E5" />
                </linearGradient>
                <filter id="prismGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            <path d="M50 12 L88 82 L12 82 Z" fill="url(#prismFill)" opacity="0.9" filter="url(#prismGlow)" />
            <path d="M50 12 L50 48 L88 82" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" fill="none" />
            <path d="M50 12 L50 48 L12 82" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" fill="none" />
            <path d="M12 82 L50 48 L88 82" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" fill="none" />
        </svg>
    );
}

// ═══════════════════════════════════════════════════════════
// Premium Logo Splash (120fps Canvas — plays before login)
// ═══════════════════════════════════════════════════════════

function LogoSplash({ onComplete }: { onComplete: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [textPhase, setTextPhase] = useState<'hidden' | 'prism' | 'tagline' | 'fadeout'>('hidden');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.scale(dpr, dpr);

        const W = window.innerWidth;
        const H = window.innerHeight;
        const cx = W / 2;
        const cy = H / 2;

        // Particles
        interface Particle {
            x: number; y: number; vx: number; vy: number;
            r: number; alpha: number; hue: number; life: number; maxLife: number;
        }

        const particles: Particle[] = [];
        const PARTICLE_COUNT = 120;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 0.3 + 0.1;
            particles.push({
                x: cx + (Math.random() - 0.5) * 300,
                y: cy + (Math.random() - 0.5) * 300,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                r: Math.random() * 2 + 0.5,
                alpha: 0,
                hue: 230 + Math.random() * 40,
                life: 0,
                maxLife: 200 + Math.random() * 200,
            });
        }

        let animId: number;
        let frame = 0;
        const startTime = Date.now();

        // Timeline triggers
        setTimeout(() => setTextPhase('prism'), 400);
        setTimeout(() => setTextPhase('tagline'), 1200);
        setTimeout(() => setTextPhase('fadeout'), 2800);
        setTimeout(() => {
            cancelAnimationFrame(animId);
            onComplete();
        }, 3600);

        const animate = () => {
            frame++;
            const elapsed = (Date.now() - startTime) / 1000;

            // Transparent trail
            ctx.fillStyle = `rgba(3, 7, 18, ${elapsed < 2.5 ? 0.08 : 0.15})`;
            ctx.fillRect(0, 0, W, H);

            // Central glow — pulsing
            const pulseAlpha = 0.06 + Math.sin(elapsed * 2) * 0.02;
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 250);
            gradient.addColorStop(0, `rgba(99, 102, 241, ${pulseAlpha})`);
            gradient.addColorStop(0.4, `rgba(79, 70, 229, ${pulseAlpha * 0.5})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, W, H);

            // Draw particles
            for (const p of particles) {
                p.life++;
                if (p.life > p.maxLife) {
                    p.life = 0;
                    p.x = cx + (Math.random() - 0.5) * 300;
                    p.y = cy + (Math.random() - 0.5) * 300;
                }

                // Orbit around center
                const dx = p.x - cx;
                const dy = p.y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const orbitSpeed = 0.002 / Math.max(dist * 0.01, 0.3);
                const angle = Math.atan2(dy, dx) + orbitSpeed;
                p.x = cx + Math.cos(angle) * dist + p.vx;
                p.y = cy + Math.sin(angle) * dist + p.vy;

                // Fade in/out
                const lifeRatio = p.life / p.maxLife;
                p.alpha = lifeRatio < 0.1 ? lifeRatio * 10 : lifeRatio > 0.8 ? (1 - lifeRatio) * 5 : 1;
                p.alpha *= 0.6;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${p.alpha})`;
                ctx.fill();

                // Connection lines to nearby particles
                if (frame % 2 === 0) {
                    for (const other of particles) {
                        const d = Math.hypot(p.x - other.x, p.y - other.y);
                        if (d < 80 && d > 5) {
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(other.x, other.y);
                            ctx.strokeStyle = `hsla(240, 60%, 70%, ${(1 - d / 80) * 0.08})`;
                            ctx.lineWidth = 0.5;
                            ctx.stroke();
                        }
                    }
                }
            }

            // Spinning ring around center
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(elapsed * 0.5);
            ctx.beginPath();
            ctx.arc(0, 0, 90, 0, Math.PI * 0.6);
            ctx.strokeStyle = `rgba(129, 140, 248, ${0.1 + Math.sin(elapsed * 3) * 0.05})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, 90, Math.PI, Math.PI * 1.6);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 + Math.sin(elapsed * 3 + 1) * 0.04})`;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();

            animId = requestAnimationFrame(animate);
        };

        // Initial fill
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, W, H);

        animId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animId);
    }, [onComplete]);

    return (
        <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
            <canvas ref={canvasRef} className="absolute inset-0" />

            {/* Logo + Text Overlay */}
            <div className="relative z-10 flex flex-col items-center pointer-events-none">
                {/* SVG Prism Logo */}
                <motion.div
                    initial={{ scale: 0, opacity: 0, rotate: -30 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    className="mb-8"
                    style={{ filter: 'drop-shadow(0 0 30px rgba(99, 102, 241, 0.3))' }}
                >
                    <PrismSVG size={100} />
                </motion.div>

                {/* PRISM Text */}
                <AnimatePresence>
                    {(textPhase === 'prism' || textPhase === 'tagline') && (
                        <motion.h1
                            className="text-5xl font-extralight tracking-[0.5em] text-white/90 mb-3"
                            initial={{ opacity: 0, y: 15, letterSpacing: '0.8em' }}
                            animate={{ opacity: 1, y: 0, letterSpacing: '0.5em' }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        >
                            PRISM
                        </motion.h1>
                    )}
                </AnimatePresence>

                {/* Gradient line */}
                <motion.div
                    className="h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent"
                    initial={{ width: 0 }}
                    animate={{ width: textPhase !== 'hidden' ? 160 : 0 }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                />

                {/* Tagline */}
                <AnimatePresence>
                    {textPhase === 'tagline' && (
                        <motion.p
                            className="text-[11px] tracking-[0.5em] text-indigo-300/50 uppercase mt-4"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            Project Intelligence
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════
// Warp Drive Animation (plays after successful login)
// ═══════════════════════════════════════════════════════════

function WarpSplash({ onComplete }: { onComplete: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [phase, setPhase] = useState<'buildup' | 'warp' | 'flash'>('buildup');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.scale(dpr, dpr);

        const W = window.innerWidth;
        const H = window.innerHeight;
        const cx = W / 2;
        const cy = H / 2;

        interface Star { x: number; y: number; z: number; prevX: number; prevY: number; brightness: number; }
        const STAR_COUNT = 800;
        const stars: Star[] = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 600 + 50;
            stars.push({
                x: Math.cos(angle) * dist, y: Math.sin(angle) * dist,
                z: Math.random() * 1500 + 100, prevX: cx, prevY: cy,
                brightness: Math.random() * 0.5 + 0.5,
            });
        }

        let speed = 0.5;
        let animId: number;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;

            if (elapsed < 1.0) {
                speed = 0.5 + elapsed * 3;
            } else if (elapsed < 1.8) {
                speed = 3.5 + (elapsed - 1.0) * 45;
                if (phase !== 'warp') setPhase('warp');
            } else if (elapsed < 2.6) {
                speed = 40 + (elapsed - 1.8) * 35;
            } else if (elapsed < 3.0) {
                speed = 68;
                if (phase !== 'flash') setPhase('flash');
            } else {
                cancelAnimationFrame(animId);
                onComplete();
                return;
            }

            ctx.fillStyle = `rgba(3, 7, 18, ${elapsed < 1.8 ? 0.2 : 0.06})`;
            ctx.fillRect(0, 0, W, H);

            for (const star of stars) {
                star.prevX = (star.x / star.z) * 600 + cx;
                star.prevY = (star.y / star.z) * 600 + cy;
                star.z -= speed;

                if (star.z <= 1) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * 600 + 50;
                    star.x = Math.cos(angle) * dist;
                    star.y = Math.sin(angle) * dist;
                    star.z = 1500;
                    star.prevX = cx; star.prevY = cy;
                    continue;
                }

                const sx = (star.x / star.z) * 600 + cx;
                const sy = (star.y / star.z) * 600 + cy;
                if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) continue;

                const lineLen = Math.sqrt((sx - star.prevX) ** 2 + (sy - star.prevY) ** 2);
                const alpha = Math.min(1, star.brightness * (1 - star.z / 1500));
                const width = Math.max(0.5, Math.min(3, (1 - star.z / 1500) * 3 + speed * 0.02));
                const warpMix = Math.min(1, speed / 40);

                ctx.beginPath();
                ctx.moveTo(star.prevX, star.prevY);
                ctx.lineTo(sx, sy);
                ctx.strokeStyle = `rgba(${Math.round(120 + warpMix * 135)}, ${Math.round(140 + warpMix * 115)}, 255, ${alpha})`;
                ctx.lineWidth = width;
                ctx.stroke();

                if (lineLen > 5) {
                    ctx.beginPath();
                    ctx.arc(sx, sy, width * 0.8, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                    ctx.fill();
                }
            }

            if (elapsed > 1.2) {
                const glowAlpha = Math.min(0.12, (elapsed - 1.2) * 0.1);
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300);
                g.addColorStop(0, `rgba(139, 92, 246, ${glowAlpha})`);
                g.addColorStop(0.5, `rgba(59, 130, 246, ${glowAlpha * 0.5})`);
                g.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, W, H);
            }

            animId = requestAnimationFrame(animate);
        };

        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, W, H);
        animId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animId);
    }, [onComplete]);

    return (
        <motion.div className="fixed inset-0 z-[200]" exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <canvas ref={canvasRef} className="absolute inset-0" />

            {/* Logo during buildup */}
            <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
                animate={{
                    opacity: phase === 'buildup' ? 1 : 0,
                    scale: phase === 'buildup' ? 1 : 1.5,
                }}
                transition={{ duration: 0.6 }}
            >
                <PrismSVG size={80} className="mb-4" />
                <h1 className="text-2xl font-extralight tracking-[0.4em] text-white/80">PRISM</h1>
            </motion.div>

            {/* White flash */}
            {phase === 'flash' && (
                <motion.div
                    className="absolute inset-0 bg-white z-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1] }}
                    transition={{ duration: 0.4, ease: 'easeIn' }}
                />
            )}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════
// Grid Background
// ═══════════════════════════════════════════════════════════

function GridBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-[#030712] via-[#0f172a] to-[#020617]" />
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(148, 163, 184, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.5) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }}
            />
            <motion.div
                className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)' }}
                animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute bottom-[5%] right-[10%] w-[400px] h-[400px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)' }}
                animate={{ x: [0, -25, 0], y: [0, 15, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// Main Login Page
// ═══════════════════════════════════════════════════════════

type PageStage = 'splash' | 'login' | 'warping';

export default function LoginPage() {
    const router = useRouter();
    const { toasts, close, success, error: showError } = useToast();

    const [stage, setStage] = useState<PageStage>('splash');
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [pendingRoute, setPendingRoute] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const spotlightX = useTransform(mouseX, (v) => v - 200);
    const spotlightY = useTransform(mouseY, (v) => v - 200);

    const handleMouseMove = (e: React.MouseEvent) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
    };

    const handleSplashComplete = useCallback(() => {
        setStage('login');
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFormError('');

        try {
            const isEmail = loginId.includes('@');
            const payload = isEmail ? { email: loginId, password } : { username: loginId, password };
            const response = await apiClient.post('/auth/login', payload);

            if (response.data?.data?.mfaRequired) {
                const msg = response.data?.message || 'MFA token required.';
                setFormError(msg);
                showError('Login Failed', msg);
                return;
            }

            if (!response.data?.success || !response.data?.data?.user || !response.data?.data?.accessToken) {
                throw new Error(response.data?.message || 'Login failed');
            }

            const { user, accessToken, refreshToken, forcePasswordChange } = response.data.data;
            const normalizedUser = { ...user, role: String(user.role || '').toUpperCase() };

            localStorage.setItem('user', JSON.stringify(normalizedUser));
            localStorage.setItem('token', accessToken);
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

            useAuthStore.setState({
                user: normalizedUser,
                token: accessToken,
                isAuthenticated: true,
                error: null,
            });

            if (forcePasswordChange) {
                router.push('/change-password');
                return;
            }

            const roleRoutes: Record<string, string> = {
                admin: '/admin/dashboard',
                project_manager: '/pm/dashboard',
                scrum_master: '/scrum/dashboard',
                employee: '/employee/dashboard',
                client: '/client/dashboard',
            };

            setPendingRoute(roleRoutes[normalizedUser.role.toLowerCase()] || '/dashboard');
            setStage('warping');
        } catch (err: unknown) {
            const axiosMessage =
                axios.isAxiosError(err) && typeof err.response?.data?.message === 'string'
                    ? err.response.data.message : undefined;
            const timeoutMessage =
                axios.isAxiosError(err) && err.code === 'ECONNABORTED'
                    ? 'Request timed out. Check backend connectivity.' : undefined;
            const networkMessage =
                axios.isAxiosError(err) && err.code === 'ERR_NETWORK'
                    ? 'Network error. Try http://localhost:3000 or check CORS.' : undefined;
            const genericMessage = err instanceof Error ? err.message : undefined;
            const msg = timeoutMessage || networkMessage || axiosMessage || genericMessage || 'Invalid credentials';
            setFormError(msg);
            showError('Login Failed', msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWarpComplete = useCallback(() => {
        router.push(pendingRoute);
    }, [pendingRoute, router]);

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans" onMouseMove={handleMouseMove}>
            <GridBackground />

            {/* Mouse spotlight */}
            {stage === 'login' && (
                <motion.div
                    className="absolute w-[400px] h-[400px] rounded-full pointer-events-none z-0"
                    style={{
                        x: spotlightX, y: spotlightY,
                        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.04) 0%, transparent 70%)',
                    }}
                />
            )}

            {/* Login Form — visible in 'login' stage */}
            <AnimatePresence>
                {stage === 'login' && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 w-full max-w-[440px] mx-4"
                    >
                        <div className="relative bg-gray-900/60 backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/40 overflow-hidden">
                            {/* Top gradient border */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

                            {/* Logo */}
                            <div className="text-center mb-10">
                                <motion.div
                                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 border border-indigo-500/20 mb-5 shadow-lg shadow-indigo-500/10"
                                    initial={{ scale: 0, rotate: -20 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                                >
                                    <PrismSVG size={32} />
                                </motion.div>

                                <motion.h1
                                    className="text-2xl font-light tracking-[0.3em] text-white/90 mb-1"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35, duration: 0.6 }}
                                >
                                    PRISM
                                </motion.h1>
                                <motion.p
                                    className="text-[11px] tracking-[0.4em] text-gray-500 uppercase"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.6 }}
                                >
                                    Project Intelligence
                                </motion.p>
                            </div>

                            {/* Welcome */}
                            <motion.div className="mb-8"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            >
                                <h2 className="text-lg font-medium text-white/90 mb-1">Welcome back</h2>
                                <p className="text-sm text-gray-500">Enter your credentials to continue</p>
                            </motion.div>

                            {/* Form */}
                            <motion.form
                                onSubmit={handleLogin}
                                className="space-y-5"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.5 }}
                            >
                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email or Username</label>
                                    <div className={`relative rounded-xl border transition-all duration-300 ${focusedField === 'email' ? 'border-indigo-500/50 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/5' : 'border-white/[0.06] hover:border-white/10'}`}>
                                        <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${focusedField === 'email' ? 'text-indigo-400' : 'text-gray-600'}`} />
                                        <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} className="w-full bg-white/[0.03] text-white text-sm pl-11 pr-4 py-3.5 rounded-xl focus:outline-none placeholder:text-gray-600" placeholder="you@company.com" required />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Password</label>
                                    <div className={`relative rounded-xl border transition-all duration-300 ${focusedField === 'password' ? 'border-indigo-500/50 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/5' : 'border-white/[0.06] hover:border-white/10'}`}>
                                        <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${focusedField === 'password' ? 'text-indigo-400' : 'text-gray-600'}`} />
                                        <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} className="w-full bg-white/[0.03] text-white text-sm pl-11 pr-12 py-3.5 rounded-xl focus:outline-none placeholder:text-gray-600" placeholder="••••••••" required />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Error */}
                                <AnimatePresence>
                                    {formError && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{formError}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Remember / Forgot */}
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center cursor-pointer group">
                                        <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${rememberMe ? 'bg-indigo-500 border-indigo-500' : 'border-white/10 hover:border-white/20'}`}>
                                            {rememberMe && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                        <span className="ml-2 text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Remember me</span>
                                    </label>
                                    <a href="/forgot-password" className="text-xs text-gray-500 hover:text-indigo-400 transition-colors">Forgot password?</a>
                                </div>

                                {/* Submit */}
                                <motion.button type="submit" disabled={isLoading} className="relative w-full py-3.5 rounded-xl text-sm font-medium text-white overflow-hidden transition-all disabled:opacity-50 group" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 transition-all group-hover:from-indigo-500 group-hover:via-indigo-400 group-hover:to-violet-500" />
                                    <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" animate={{ x: ['-200%', '200%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
                                    <div className="absolute inset-0 shadow-lg shadow-indigo-500/25" />
                                    <span className="relative flex items-center justify-center gap-2">
                                        {isLoading ? (
                                            <><motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />Signing in...</>
                                        ) : (
                                            <>Sign In<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                                        )}
                                    </span>
                                </motion.button>
                            </motion.form>

                            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
                        </div>

                        <motion.p className="text-center text-[11px] text-gray-600 mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                            PRISM Intelligence Suite · Secure Access
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Logo Splash Animation — plays first */}
            <AnimatePresence>
                {stage === 'splash' && <LogoSplash onComplete={handleSplashComplete} />}
            </AnimatePresence>

            {/* Warp Drive Animation — plays after login */}
            <AnimatePresence>
                {stage === 'warping' && <WarpSplash onComplete={handleWarpComplete} />}
            </AnimatePresence>

            <ToastContainer toasts={toasts} onClose={close} />
        </div>
    );
}
