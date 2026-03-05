'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);

    // Reveal immediately after mount — warp animation already played on login
    useEffect(() => {
        const t = setTimeout(() => setIsRevealed(true), 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <ProtectedRoute>
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
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="fixed inset-y-0 left-0 z-50 flex-shrink-0"
                >
                    <Sidebar
                        onCollapsedChange={setSidebarCollapsed}
                        mobileOpen={mobileMenuOpen}
                        onMobileClose={() => setMobileMenuOpen(false)}
                    />
                </motion.div>

                {/* Main Content with fade-up */}
                <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} ml-0`}>
                    <Header
                        sidebarCollapsed={sidebarCollapsed}
                        onMobileMenuClick={() => setMobileMenuOpen(true)}
                    />
                    <motion.main
                        initial={{ opacity: 0, y: 20 }}
                        animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                        className="flex-1 pt-16"
                    >
                        <div className="p-4 md:p-6 transition-all duration-300">
                            {children}
                        </div>
                    </motion.main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
