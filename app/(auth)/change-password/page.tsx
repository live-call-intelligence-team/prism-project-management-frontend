'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Save } from 'lucide-react';
import { ParticleButton } from '@/components/ui/ParticleButton';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/lib/store/authStore';
import { MorphingBackground } from '@/components/ui/MorphingBackground';
import { authApi } from '@/lib/api/auth';
import { PrismLogo } from '@/components/ui/PrismLogo';

export default function ChangePasswordPage() {
    const router = useRouter();
    const { success, error: showError } = useToast();
    const logout = useAuthStore((state) => state.logout);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError("New passwords don't match");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setIsLoading(true);

        try {
            await authApi.changePassword({
                oldPassword,
                newPassword
            });

            success('Password Updated', 'Your password has been changed successfully.');

            // Optional: Logout and force re-login, or redirect to dashboard
            // Spec implies they continue to dashboard.
            // But usually good to re-login to verify new credentials?
            // "Client sees ONLY assigned project" -> Redirect to dashboard is seamless

            // We need to update user store? No, password doesn't affect store data.
            // But we should probably route them to dashboard.

            // However, our backend clears refreshToken in some flows? No, changePassword logic kept current token?
            // "user.refreshToken = undefined; // Optional: invalidate other sessions? Keep current one." -> I commented it out in controller or kept it?
            // "user.refreshToken = undefined;" was in my code snippet! 
            // Wait, "user.refreshToken = undefined;" means this session's refresh token might be invalid if not re-issued?
            // Actually, if I invalidate ALL sessions, I should issue new pair here?
            // The controller I wrote returned `success: true` but NO data.
            // So if I invalidated tokens in backend, the current access token works until expiry.
            // But refresh will fail.
            // So safer to LOGOUT or Return New Tokens.
            // Given I didn't return new tokens in `changePassword`, I should probably force re-login or update controller.
            // Let's force re-login for security hygiene.

            logout(); // Clear store
            router.push('/login');
            success('Success', 'Please login with your new password');

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to change password';
            setError(errorMessage);
            showError('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
            <MorphingBackground />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-gray-900/60 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 mx-4"
            >
                {/* Header with Logo */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-2xl flex items-center justify-center backdrop-blur-3xl border border-white/5 shadow-[0_0_30px_rgba(0,71,171,0.1)]">
                            <PrismLogo variant="icon" size={64} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Change Password</h2>
                    <p className="text-gray-400 text-sm">
                        For your security, please update your password to continue.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Current Password"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        leftIcon={<Lock className="w-5 h-5" />}
                        className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500"
                        showPasswordToggle
                        required
                    />

                    <div className="space-y-4">
                        <Input
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            leftIcon={<Lock className="w-5 h-5" />}
                            className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500"
                            showPasswordToggle
                            required
                        />

                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            leftIcon={<Lock className="w-5 h-5" />}
                            className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500"
                            showPasswordToggle
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                            {error}
                        </p>
                    )}

                    <ParticleButton
                        type="submit"
                        variant="primary"
                        className="w-full"
                        isLoading={isLoading}
                    >
                        Update Password
                    </ParticleButton>
                </form>
            </motion.div>
        </div>
    );
}
