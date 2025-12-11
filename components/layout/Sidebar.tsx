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
    LogOut, // Added LogOut icon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/authStore';
import NotificationBell from '@/components/layout/NotificationBell';

import { PrismLogo } from '@/components/ui/PrismLogo';

interface SidebarProps {
    onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ onCollapsedChange }: SidebarProps = {}) {
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
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={cn(
                'fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-40',
                collapsed ? 'w-20' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
                {!collapsed && (
                    <Link href={getDashboardPath()} className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                            <PrismLogo className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                            PRISM
                        </span>
                    </Link>
                )}
                {collapsed && (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto">
                        <PrismLogo className="w-6 h-6" />
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                                'hover:bg-gray-100 dark:hover:bg-gray-800',
                                isActive && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
                                !isActive && 'text-gray-700 dark:text-gray-300',
                                collapsed && 'justify-center'
                            )}
                        >
                            <Icon className={cn('w-5 h-5', isActive && 'text-primary-600 dark:text-primary-400')} />
                            {!collapsed && (
                                <span className="font-medium">{item.name}</span>
                            )}
                            {isActive && !collapsed && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile and Logout */}
            {!collapsed && (
                <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
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
                            <NotificationBell />
                            <button
                                onClick={handleLogout}
                                className="ml-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-500"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Collapse button */}
            <button
                onClick={toggleCollapse}
                className={cn(
                    'absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                    'flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200',
                    'hover:scale-110'
                )}
            >
                {collapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                    <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
            </button>

            {/* Footer */}
            {!collapsed && (
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        © 2024 ProjectHub
                    </div>
                </div>
            )}
        </motion.aside>
    );
}
