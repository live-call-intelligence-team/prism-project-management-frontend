'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirectPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (user) {
            switch (user.role) {
                case 'ADMIN':
                    router.push('/admin/dashboard');
                    break;
                case 'EMPLOYEE':
                    router.push('/employee/dashboard');
                    break;
                case 'SCRUM_MASTER':
                    router.push('/scrum/dashboard');
                    break;
                case 'CLIENT':
                    router.push('/client/portal');
                    break;
                default:
                    router.push('/login');
            }
        }
    }, [user, isAuthenticated, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">Redirecting to your dashboard...</p>
            </div>
        </div>
    );
}
