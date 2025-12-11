'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DoorTransition } from '@/components/ui/DoorTransition';
import { useAuthStore } from '@/lib/store/authStore';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuthStore();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <ProtectedRoute>
            <DoorTransition userName={user?.firstName || 'User'}>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                    <Sidebar onCollapsedChange={setSidebarCollapsed} />
                    <Header sidebarCollapsed={sidebarCollapsed} />
                    <main
                        className={`pt-16 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
                            }`}
                    >
                        <div className="p-6">
                            {children}
                        </div>
                    </main>
                </div>
            </DoorTransition>
        </ProtectedRoute>
    );
}
