import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds for display purposes if needed

export function useSessionTimeout() {
    const router = useRouter();
    const logout = useAuthStore((state) => state.logout);

    // Keep state values for components that might still consume them,
    // but never trigger a timeout naturally.
    const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATION);
    const [showWarningModal, setShowWarningModal] = useState(false);

    const handleLogout = useCallback(() => {
        logout();
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/login');
    }, [logout, router]);

    const extendSession = useCallback(() => {
        setTimeRemaining(SESSION_DURATION);
        setShowWarningModal(false);
    }, []);

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    return {
        timeRemaining,
        showWarningModal,
        setShowWarningModal,
        extendSession,
        handleLogout,
        formatTime,
    };
}
