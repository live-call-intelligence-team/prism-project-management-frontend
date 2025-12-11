import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/lib/store/authStore';

const SESSION_DURATION = 30 * 60; // 30 minutes in seconds
const WARNING_TIME_1 = 15 * 60; // 15 minutes
const WARNING_TIME_2 = 5 * 60; // 5 minutes

export function useSessionTimeout() {
    const router = useRouter();
    const { warning, error: showError } = useToast();
    const logout = useAuthStore((state) => state.logout);

    const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATION);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [hasShownWarning1, setHasShownWarning1] = useState(false);

    const handleLogout = useCallback(() => {
        logout();
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        showError('Session expired', 'Please sign in again to continue');
        router.push('/login');
    }, [logout, showError, router]);

    const extendSession = useCallback(() => {
        setTimeRemaining(SESSION_DURATION);
        setShowWarningModal(false);
        setHasShownWarning1(false);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                const newTime = prev - 1;

                // Show first warning toast at 15 minutes
                if (newTime === WARNING_TIME_1 && !hasShownWarning1) {
                    warning(
                        'Session expiring soon',
                        'Your session will expire in 15 minutes',
                        10000
                    );
                    setHasShownWarning1(true);
                }

                // Show modal at 5 minutes
                if (newTime === WARNING_TIME_2) {
                    setShowWarningModal(true);
                }

                // Auto-logout at 0
                if (newTime <= 0) {
                    handleLogout();
                    return 0;
                }

                return newTime;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [hasShownWarning1, warning, handleLogout]);

    // Reset timer on user activity
    useEffect(() => {
        const resetTimer = () => {
            if (timeRemaining < SESSION_DURATION - 60) {
                // Only reset if more than 1 minute has passed
                setTimeRemaining(SESSION_DURATION);
                setHasShownWarning1(false);
                setShowWarningModal(false);
            }
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach((event) => {
            document.addEventListener(event, resetTimer);
        });

        return () => {
            events.forEach((event) => {
                document.removeEventListener(event, resetTimer);
            });
        };
    }, [timeRemaining]);

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
