'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const { success } = useToast();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsLoading(false);
        setIsSuccess(true);
        success('Email sent!', 'Check your inbox for the reset link');

        // Start countdown for resend
        let timer = 60;
        const interval = setInterval(() => {
            timer--;
            setCountdown(timer);
            if (timer === 0) {
                setCanResend(true);
                clearInterval(interval);
            }
        }, 1000);
    };

    const handleResend = async () => {
        setCanResend(false);
        setCountdown(60);

        await new Promise(resolve => setTimeout(resolve, 1000));
        success('Email resent!', 'Check your inbox again');

        // Restart countdown
        let timer = 60;
        const interval = setInterval(() => {
            timer--;
            setCountdown(timer);
            if (timer === 0) {
                setCanResend(true);
                clearInterval(interval);
            }
        }, 1000);
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Half - Branding Section */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-600">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full animate-float" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full animate-float" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white rounded-full animate-float" style={{ animationDelay: '2s' }} />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-16 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Logo */}
                        <div className="mb-12">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Sparkles className="w-7 h-7 text-white" />
                                </div>
                                <span className="text-2xl font-bold text-white">ProjectHub</span>
                            </div>
                        </div>

                        {/* Hero Text */}
                        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                            Don't Worry,<br />
                            We've Got You
                        </h1>
                        <p className="text-xl text-white/90 mb-12 max-w-md">
                            Reset your password and get back to managing your projects
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Half - Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-md"
                >
                    {!isSuccess ? (
                        <>
                            {/* Header */}
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    Forgot Password?
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Enter your email and we'll send you a reset link
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <Input
                                    label="Email Address"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    leftIcon={<Mail className="w-5 h-5" />}
                                    required
                                />

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    className="w-full"
                                    isLoading={isLoading}
                                >
                                    Send Reset Link
                                </Button>
                            </form>

                            {/* Back to Login */}
                            <div className="mt-6">
                                <Link
                                    href="/login"
                                    className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Sign In
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Success State */}
                            <div className="text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', duration: 0.5 }}
                                    className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6"
                                >
                                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                                </motion.div>

                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    Check Your Email!
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">
                                    We've sent a password reset link to
                                </p>
                                <p className="text-primary-600 dark:text-primary-400 font-semibold mb-8">
                                    {email}
                                </p>

                                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Didn't receive the email?{' '}
                                        {canResend ? (
                                            <button
                                                onClick={handleResend}
                                                className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                                            >
                                                Resend
                                            </button>
                                        ) : (
                                            <span className="text-gray-500 dark:text-gray-400">
                                                Resend in {countdown}s
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <Link href="/login">
                                    <Button variant="primary" size="lg" className="w-full">
                                        Back to Sign In
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
