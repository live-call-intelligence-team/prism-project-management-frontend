'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ExecutiveEntrance } from '@/components/ui/ExecutiveEntrance';
import { useAuthStore } from '@/lib/store/authStore';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuthStore();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Animation trigger state
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <ProtectedRoute>
            <ExecutiveEntrance
                userName={user?.firstName || 'User'}
                onReveal={() => setIsRevealed(true)}
            >
                <div className="min-h-screen bg-background dark:bg-gray-950 flex relative">
                    {/* Mobile Backdrop */}
                    {mobileMenuOpen && (
                        <div
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                    )}

                    {/* Sidebar with slide-in animation */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={isRevealed ? { x: 0 } : { x: '-100%' }}
                        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }} // Custom cubic-bezier
                        className="fixed inset-y-0 left-0 z-50 flex-shrink-0" // Increased z-index to 50
                    >
                        <Sidebar
                            onCollapsedChange={setSidebarCollapsed}
                            mobileOpen={mobileMenuOpen}
                            onMobileClose={() => setMobileMenuOpen(false)}
                        />
                    </motion.div>

                    {/* Main Content with fade-up stagger */}
                    <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} ml-0`}>

                        <Header
                            sidebarCollapsed={sidebarCollapsed}
                            onMobileMenuClick={() => setMobileMenuOpen(true)}
                        />

                        <motion.main
                            initial={{ opacity: 0, y: 30 }}
                            animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} // Slight delay after sidebar
                            className="flex-1 pt-16"
                        >
                            <div className="p-6">
                                {children}
                            </div>
                        </motion.main>
                    </div>

                </div>
            </ExecutiveEntrance>
        </ProtectedRoute>
    );
}
