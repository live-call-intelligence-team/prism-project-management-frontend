'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [isVerifying, setIsVerifying] = useState(true);

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                setIsVerifying(false);
                if (!isAuthenticated) {
                    router.push('/login');
                }
                return;
            }

            if (user) {
                setIsVerifying(false);
                return;
            }

            // Token exists but no user (page reload logic)
            try {
                const { authApi } = await import('@/lib/api/auth');
                const response = await authApi.getCurrentUser();

                if (response.data && response.data.user) {
                    useAuthStore.setState({
                        user: response.data.user,
                        token,
                        isAuthenticated: true,
                    });
                } else {
                    throw new Error('Invalid response structure');
                }
            } catch (err) {
                console.error('Failed to restore session:', err);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                router.push('/login');
            } finally {
                setIsVerifying(false);
            }
        };

        verifyAuth();
    }, [isAuthenticated, user, router]);

    if (isVerifying) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Verifying session...</p>
                </div>
            </div>
        );
    }

    // Double check authentication before rendering
    if (!isAuthenticated && !localStorage.getItem('token')) {
        return null;
    }

    return <>{children}</>;
}
