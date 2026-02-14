'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { ParticleButton } from '@/components/ui/ParticleButton';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/lib/store/authStore';
import { PremiumLogo } from '@/components/ui/PremiumLogo';
import { MorphingBackground } from '@/components/ui/MorphingBackground';
import axios from 'axios';

const getApiUrl = () => {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    if (url.endsWith('/api/v1')) return url;
    return `${url}/api/v1`;
};

const API_URL = getApiUrl();

export default function LoginPage() {
    const router = useRouter();
    const { success, error: showError } = useToast();
    const setUser = useAuthStore((state) => state.setUser);

    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Animation Stages: 'intro' (logo center) -> 'form' (logo top-left, form visible)
    const [stage, setStage] = useState<'intro' | 'form'>('intro');

    useEffect(() => {
        // Trigger transition after intro animation
        const timer = setTimeout(() => {
            setStage('form');
        }, 3500); // Extended slightly for the premium entrance feel

        return () => clearTimeout(timer);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const isEmail = loginId.includes('@');
            const payload = isEmail ? { email: loginId, password } : { username: loginId, password };
            const response = await axios.post(`${API_URL}/auth/login`, payload);

            if (response.data.success) {
                const { user, accessToken, forcePasswordChange } = response.data.data;
                setUser({ ...user, role: user.role.toLowerCase() });
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', accessToken);

                if (forcePasswordChange) {
                    router.push('/change-password');
                    return;
                }

                success('Welcome back!', `Signed in successfully`);
                const roleRoutes: Record<string, string> = {
                    admin: '/admin/dashboard',
                    scrum_master: '/scrum/dashboard',
                    employee: '/employee/dashboard',
                    client: '/client/dashboard',
                };
                router.push(roleRoutes[user.role.toLowerCase()] || '/dashboard');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Invalid credentials';
            showError('Login Failed', msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden text-neutral-200 font-sans selection:bg-emerald-500/30">
            {/* Background Atmosphere - Deep Emerald/Navy */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#022c22] via-[#064e3b] to-black opacity-90" />
            <MorphingBackground />

            {/* Premium Gold/Emerald Glow */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px]" />

            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">

                {/* Rotating Logo Container */}
                <motion.div
                    layout
                    className={`flex flex-col items-center transition-all duration-1000 ease-in-out absolute ${stage === 'intro' ? 'top-1/2 -translate-y-1/2' : 'top-8 md:top-12'}`}
                >
                    <motion.div
                        layoutId="logo-container"
                        className="flex flex-col items-center"
                    >
                        <PremiumLogo
                            variant={stage === 'intro' ? 'full' : 'icon'}
                            size={stage === 'intro' ? 140 : 60}
                            animate={true}
                        />
                    </motion.div>

                    <motion.div layoutId="brand-text" className="text-center mt-6">
                        <h1 className={`font-light tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-white to-amber-200 ${stage === 'intro' ? 'text-4xl' : 'text-2xl'}`}>
                            PRISM
                        </h1>
                        {stage === 'intro' && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="text-emerald-400/60 text-xs mt-2 tracking-[0.5em] uppercase"
                            >
                                Intelligence Suite
                            </motion.p>
                        )}
                    </motion.div>
                </motion.div>

                {/* Login Form Container - Glassmorphism */}
                <AnimatePresence>
                    {stage === 'form' && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                            className="w-[90%] md:w-full max-w-md mt-32 md:mt-40 bg-black/20 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.6)] relative overflow-hidden"
                        >
                            {/* Subtle border gradient */}
                            <div className="absolute inset-0 border-2 border-transparent rounded-3xl [mask:linear-gradient(white,white)_content-box,linear-gradient(white,white)]"
                                style={{ background: 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.3), rgba(245, 158, 11, 0.1)) border-box' }}
                            />

                            <div className="mb-8 text-center relative z-10">
                                <h2 className="text-xl text-[#E5E4E2] font-light tracking-wide">Welcome Back</h2>
                                <p className="text-gray-400 text-sm mt-1">Sign in to your dashboard</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                                <Input
                                    label="Email or Username"
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                    leftIcon={<Mail className="w-4 h-4 text-emerald-500" />}
                                    className="bg-black/40 border-white/10 text-white focus:border-emerald-500/50 placeholder:text-gray-600 transition-colors h-12"
                                    required
                                />

                                <Input
                                    label="Password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    leftIcon={<Lock className="w-4 h-4 text-emerald-500" />}
                                    className="bg-black/40 border-white/10 text-white focus:border-emerald-500/50 placeholder:text-gray-600 transition-colors h-12"
                                    showPasswordToggle
                                    required
                                />

                                <div className="flex items-center justify-between text-sm">
                                    <label className="flex items-center cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="rounded border-white/20 bg-black/40 text-emerald-500 focus:ring-emerald-500/30"
                                        />
                                        <span className="ml-2 text-gray-400 group-hover:text-emerald-400 transition-colors">Remember me</span>
                                    </label>
                                    <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">Forgot password?</a>
                                </div>

                                <ParticleButton
                                    type="submit"
                                    variant="primary"
                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-medium tracking-wide border-none shadow-[0_0_20px_rgba(16,185,129,0.2)] h-12 rounded-xl"
                                    isLoading={isLoading}
                                >
                                    Sign In
                                </ParticleButton>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}


