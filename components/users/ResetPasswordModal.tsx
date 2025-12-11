import { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
    userName: string;
}

export default function ResetPasswordModal({ isOpen, onClose, userId, userName }: ResetPasswordModalProps) {
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen || !userId) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            await apiClient.post(`/users/${userId}/change-password`, {
                newPassword: newPassword
            });
            toast.success('Password reset successfully');
            setNewPassword('');
            onClose();
        } catch (error: any) {
            console.error('Failed to reset password:', error);
            toast.error(error.response?.data?.error || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="flex items-center mb-4 text-amber-600">
                    <Lock className="h-6 w-6 mr-2" />
                    <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
                </div>

                <p className="mb-4 text-sm text-gray-600">
                    Resetting password for <strong>{userName}</strong>.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <input
                            type="password"
                            required
                            placeholder="Min 8 characters"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="mr-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
