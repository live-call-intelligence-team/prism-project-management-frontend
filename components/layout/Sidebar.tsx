'use client';


import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    FolderKanban,
    ListTodo,
    Timer,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Users,
    FileText,
    Kanban, // Added Kanban icon
    List,   // Added List icon
    CheckCircle, // Added CheckCircle icon
    BarChart,
    LogOut,
    Calendar,
    FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/authStore';
import NotificationBell from '@/components/layout/NotificationBell';

import { OryxLogo } from '@/components/ui/OryxLogo';

interface SidebarProps {
    onCollapsedChange?: (collapsed: boolean) => void;
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export function Sidebar({ onCollapsedChange, mobileOpen = false, onMobileClose }: SidebarProps = {}) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const toggleCollapse = () => {
        const newCollapsed = !collapsed;
        setCollapsed(newCollapsed);
        onCollapsedChange?.(newCollapsed);
    };

    // Normalize role to uppercase to match logic
    const role = user?.role?.toUpperCase() || 'EMPLOYEE';
    const isAdmin = role === 'ADMIN';

    const getDashboardPath = () => {
        switch (role) {
            case 'ADMIN': return '/admin/dashboard';
            case 'PROJECT_MANAGER': return '/pm/dashboard';
            case 'SCRUM_MASTER': return '/scrum/dashboard';
            case 'CLIENT': return '/client/dashboard';
            default: return '/employee/dashboard';
        }
    };

    const navItems = [
        // Common / Employee / Admin
        { name: 'Dashboard', href: getDashboardPath(), icon: LayoutDashboard },
        { name: 'My Work', href: '/my-work', icon: CheckCircle },
        { name: 'Projects', href: '/projects', icon: FolderKanban },
        { name: 'Issues', href: '/issues', icon: ListTodo },
        { name: 'Sprints', href: '/sprints', icon: Timer },
        { name: 'Backlog', href: '/scrum/backlog', icon: List },
        { name: 'Board', href: '/scrum/board', icon: Kanban },
        ...(isAdmin ? [
            { name: 'Users', href: '/admin/users', icon: Users },
            { name: 'Attendance', href: '/admin/attendance', icon: Calendar },
            { name: 'Leaves', href: '/admin/leave-management', icon: FileCheck },
            { name: 'Audit Logs', href: '/admin/audit-logs', icon: FileText }
        ] : []),
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    const clientNavItems = [
        { name: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
        { name: 'My Issues', href: '/client/my-issues', icon: ListTodo },
        { name: 'My Projects', href: '/client/projects', icon: FolderKanban },
        { name: 'Settings', href: '/client/settings', icon: Settings },
    ];

    const employeeNavItems = [
        { name: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
        { name: 'Attendance', href: '/employee/attendance', icon: Calendar },
        { name: 'Leaves', href: '/employee/leave-management', icon: FileCheck },
        { name: 'Board', href: '/employee/board', icon: Kanban },
        { name: 'My Work', href: '/my-work', icon: CheckCircle },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    const pmNavItems = [
        { name: 'Dashboard', href: '/pm/dashboard', icon: LayoutDashboard },
        { name: 'Projects', href: '/projects', icon: FolderKanban },
        { name: 'Sprints', href: '/sprints', icon: Timer }, // PMs manage sprints often
        { name: 'Issues', href: '/issues', icon: ListTodo },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    // Filter nav items based on role
    let filteredNavItems = navItems;
    if (role === 'CLIENT') {
        filteredNavItems = clientNavItems;
    } else if (role === 'EMPLOYEE') {
        filteredNavItems = employeeNavItems;
    } else if (role === 'PROJECT_MANAGER') {
        filteredNavItems = pmNavItems;
    } else {
        // Admin / Scrum Master
        filteredNavItems = navItems;
    }

    return (
        <>
            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onMobileClose}
                />
            )}

            <motion.aside
                initial={false}
                animate={{
                    x: mobileOpen ? 0 : 0, // In desktop x is controlled by layout entrance, on mobile by CSS transform mostly
                    opacity: 1
                }}
                className={cn(
                    'fixed left-0 top-0 h-screen bg-card dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-50',
                    // Mobile Styles
                    'transform md:transform-none',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0', // Hidden on mobile unless open
                    collapsed ? 'w-20' : 'w-64'
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
                    {!collapsed && (
                        <Link href={getDashboardPath()} className="flex items-center space-x-2" onClick={() => mobileOpen && onMobileClose?.()}>
                            <OryxLogo variant="full" size={32} />
                        </Link>
                    )}
                    {collapsed && (
                        <div className="flex items-center justify-center mx-auto">
                            <OryxLogo variant="icon" size={32} />
                        </div>
                    )}

                    {/* Mobile Close Button */}
                    <button
                        onClick={onMobileClose}
                        className="md:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-180px)]">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => mobileOpen && onMobileClose?.()}
                                className={cn(
                                    'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                                    isActive && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
                                    !isActive && 'text-gray-700 dark:text-gray-300',
                                    collapsed && 'justify-center'
                                )}
                            >
                                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-600 dark:text-primary-400')} />
                                {!collapsed && (
                                    <span className="font-medium truncate">{item.name}</span>
                                )}
                                {isActive && !collapsed && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400 flex-shrink-0"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile and Logout */}
                {!collapsed && (
                    <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-card dark:bg-gray-900">
                        <div className="flex-shrink-0 w-full group block">
                            <div className="flex items-center">
                                <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                                    {user?.firstName?.[0] || 'U'}
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 truncate">
                                        {user?.firstName} {user?.lastName}
                                    </p>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 truncate">
                                        {user?.role}
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <NotificationBell />
                                    <button
                                        onClick={handleLogout}
                                        className="ml-1 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-500"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 text-[10px] text-gray-400 text-center">
                            © 2026 ORYX v1.0
                        </div>
                    </div>
                )}

                {/* Collapse button (Desktop Only) */}
                <button
                    onClick={toggleCollapse}
                    className={cn(
                        'absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                        'hidden md:flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200',
                        'hover:scale-110'
                    )}
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    ) : (
                        <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    )}
                </button>
            </motion.aside>
        </>
    );
}
