'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('token');

        if (!token && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    // For demo purposes, let's set a mock user if token exists
    // Verify token and fetch user if needed
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !user) {
            import('@/lib/api/auth').then(({ authApi }) => {
                authApi.getCurrentUser()
                    .then(response => {
                        if (response.data && response.data.user) {
                            useAuthStore.setState({
                                user: response.data.user,
                                token,
                                isAuthenticated: true,
                            });
                        } else {
                            throw new Error('Invalid response structure');
                        }
                    })
                    .catch((err) => {
                        console.error('Failed to restore session:', err);
                        localStorage.removeItem('token');
                        localStorage.removeItem('refreshToken');
                        router.push('/login');
                    });
            });
        }
    }, [user, router]);

    return <>{children}</>;
}
