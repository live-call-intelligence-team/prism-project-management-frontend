'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { ParticleButton } from '@/components/ui/ParticleButton';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/lib/store/authStore';
import { OryxLogo } from '@/components/ui/OryxLogo';
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
        }, 3000); // 3 seconds matching the logo rotation + pause

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
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden text-neutral-200 font-sans selection:bg-gold-500/30">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black opacity-80" />
            <MorphingBackground />

            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">

                {/* Rotating Logo Container */}
                {/* We use LayoutGroup to smoothly animate the layout change from Center to Top-Center/Left */}
                <motion.div
                    layout
                    className={`flex flex-col items-center transition-all duration-1000 ease-in-out absolute ${stage === 'intro' ? 'top-1/2 -translate-y-1/2' : 'top-8 md:top-12'}`}
                >
                    <motion.div
                        layoutId="logo-container"
                        className="flex flex-col items-center"
                    >
                        <OryxLogo
                            variant={stage === 'intro' ? 'full' : 'icon'}
                            size={stage === 'intro' ? 80 : 40}
                            animate={stage === 'intro'}
                        />
                    </motion.div>

                    <motion.div layoutId="brand-text" className="text-center">
                        <h1 className={`font-extralight tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-gray-500 ${stage === 'intro' ? 'text-4xl mt-6' : 'text-xl md:text-2xl'}`}>
                            ORYX
                        </h1>
                    </motion.div>
                </motion.div>

                {/* Login Form Container - Glassmorphism */}
                <AnimatePresence>
                    {stage === 'form' && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                            className="w-[90%] md:w-full max-w-md mt-24 md:mt-32 bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)]"
                        >
                            <div className="mb-8 text-center">
                                <h2 className="text-xl text-[#E5E4E2] font-light tracking-wide">Welcome Back</h2>
                                <p className="text-gray-500 text-sm mt-1">Sign in to your dashboard</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-6">
                                <Input
                                    label="Email or Username"
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                    leftIcon={<Mail className="w-5 h-5 text-[#0047AB]" />}
                                    className="bg-black/40 border-white/10 text-white focus:border-[#0047AB]/50 placeholder:text-gray-600 transition-colors"
                                    required
                                />

                                <Input
                                    label="Password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    leftIcon={<Lock className="w-5 h-5 text-[#0047AB]" />}
                                    className="bg-black/40 border-white/10 text-white focus:border-[#0047AB]/50 placeholder:text-gray-600 transition-colors"
                                    showPasswordToggle
                                    required
                                />

                                <div className="flex items-center justify-between text-sm">
                                    <label className="flex items-center cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="rounded border-white/20 bg-black/40 text-[#D4AF37] focus:ring-[#D4AF37]/30"
                                        />
                                        <span className="ml-2 text-gray-400 group-hover:text-[#D4AF37] transition-colors">Remember me</span>
                                    </label>
                                    <a href="#" className="text-gray-400 hover:text-[#D4AF37] transition-colors">Forgot password?</a>
                                </div>

                                <ParticleButton
                                    type="submit"
                                    variant="primary"
                                    className="w-full bg-gradient-to-r from-[#0047AB] to-[#6A0DAD] hover:from-[#0056D2] hover:to-[#7E22CE] text-white font-bold border-none shadow-[0_0_20px_rgba(0,71,171,0.2)]"
                                    isLoading={isLoading}
                                >
                                    Login
                                </ParticleButton>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}


