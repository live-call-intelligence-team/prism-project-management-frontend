'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { ParticleButton } from '@/components/ui/ParticleButton';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/lib/store/authStore';
import { PrismLogo } from '@/components/ui/PrismLogo';
import { SplashScreen } from '@/components/ui/SplashScreen';
import { MorphingBackground } from '@/components/ui/MorphingBackground'; // Ensure this is imported
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function LoginPage() {
    const router = useRouter();
    const { success, error: showError } = useToast();
    const setUser = useAuthStore((state) => state.setUser);

    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSplash, setShowSplash] = useState(true);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Determine if email or username
            const isEmail = loginId.includes('@');
            const payload = isEmail ? { email: loginId, password } : { username: loginId, password };

            // Call backend API
            const response = await axios.post('http://localhost:5000/api/v1/auth/login', payload);

            if (response.data.success) {
                const { user, accessToken, forcePasswordChange } = response.data.data;

                // Store user data
                setUser({
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role.toLowerCase(),
                    orgId: user.orgId,
                });
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', accessToken);

                if (forcePasswordChange) {
                    success('Login Successful', 'Please update your password.');
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
                const route = roleRoutes[user.role.toLowerCase()] || '/dashboard';

                router.push(route);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Invalid credentials';
            setError(errorMessage);
            showError('Login Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
            <SplashScreen onComplete={() => setShowSplash(false)} />

            <MorphingBackground />

            {!showSplash && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full max-w-md bg-gray-900/60 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 mx-4"
                >
                    {/* Header with Logo */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="flex justify-center mb-6"
                        >
                            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center backdrop-blur-3xl border border-white/10 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                                <div className="w-12 h-12">
                                    <PrismLogo animated />
                                </div>
                            </div>
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-3xl font-bold text-white mb-2 tracking-tight"
                        >
                            PRISM
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="text-gray-400 text-sm"
                        >
                            Sign in to continue
                        </motion.p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-6 mt-8">
                        <Input
                            label="Email or Username"
                            type="text"
                            placeholder="user@prism.com or details"
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                            leftIcon={<Mail className="w-5 h-5" />}
                            className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500"
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            leftIcon={<Lock className="w-5 h-5" />}
                            className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500"
                            showPasswordToggle
                            required
                        />

                        <div className="flex items-center justify-between">
                            <label className="flex items-center group cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 border-gray-700 rounded bg-gray-800 focus:ring-indigo-500 transition-all"
                                />
                                <span className="ml-2 text-sm text-gray-400 group-hover:text-indigo-400 transition-colors">
                                    Remember me
                                </span>
                            </label>
                            <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors hover:underline">
                                Forgot password?
                            </a>
                        </div>

                        <ParticleButton
                            type="submit"
                            variant="primary"
                            className="w-full"
                            isLoading={isLoading}
                        >
                            Sign In
                        </ParticleButton>
                    </form>
                </motion.div>
            )}
        </div>
    );
}

