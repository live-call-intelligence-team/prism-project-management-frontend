'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell,
    Search,
    Moon,
    Sun,
    User,
    Settings,
    LogOut,
    ChevronDown,
    Briefcase,
    CheckCircle2,
    FileText,
    Loader2,
    X,
    MessageSquare,
    AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { notificationsApi, Notification } from '@/lib/api/endpoints/notifications';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface HeaderProps {
    sidebarCollapsed?: boolean;
}

export function Header({ sidebarCollapsed = false }: HeaderProps) {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    // Initialize theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

        setTheme(initialTheme);
        if (initialTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // Fetch notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoadingNotifications(true);
                const data = await notificationsApi.getMyNotifications({ limit: 10 });
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            } catch (err) {
                console.error('Error fetching notifications:', err);
            } finally {
                setLoadingNotifications(false);
            }
        };

        if (user?.id) {
            fetchNotifications();
            // Refresh every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.id]);

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.markAsRead('all');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking notifications as read:', err);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'ISSUE_ASSIGNED': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
            case 'ISSUE_UPDATED': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
            case 'MENTION': return <MessageSquare className="w-4 h-4 text-purple-500" />;
            default: return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);

        // Update document class
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Save to localStorage
        localStorage.setItem('theme', newTheme);
    };

    const getInitials = (firstName?: string, lastName?: string) => {
        if (!firstName && !lastName) return 'U';
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    };

    // POOR MAN'S SEARCH IMPLEMENTATION (Quick & Dirty Debounce)
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ projects: any[], tasks: any[], files: any[] } | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                try {
                    const results = await projectsApi.globalSearch(searchQuery);
                    setSearchResults(results);
                    setShowResults(true);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults(null);
                setShowResults(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearchBlur = () => {
        // Delay hiding to allow clicking links
        setTimeout(() => setShowResults(false), 200);
    };

    return (
        <header className={cn(
            "fixed top-0 right-0 left-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-30 transition-all duration-300",
            sidebarCollapsed ? "md:left-20" : "md:left-64"
        )}>
            <div className="h-full px-6 flex items-center justify-between">
                {/* Search */}
                <div className="flex-1 max-w-2xl relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search projects, issues, or files..."
                            className={cn(
                                'w-full pl-10 pr-10 py-2 rounded-lg',
                                'bg-gray-50 dark:bg-gray-800',
                                'border border-gray-200 dark:border-gray-700',
                                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                                'transition-all duration-200'
                            )}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                            onBlur={handleSearchBlur}
                        />
                        {isSearching ? (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                        ) : searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showResults && searchResults && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-[80vh] overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                            {/* Empty State */}
                            {searchResults.projects.length === 0 && searchResults.tasks.length === 0 && searchResults.files.length === 0 && (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                    No results found for "{searchQuery}"
                                </div>
                            )}

                            {/* Projects */}
                            {searchResults.projects.length > 0 && (
                                <div className="p-2">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1">Projects</h4>
                                    {searchResults.projects.map(p => (
                                        <Link key={p.id} href={`/client/projects/${p.id}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 block">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</div>
                                                <div className="text-xs text-muted-foreground">{p.key}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Tasks */}
                            {searchResults.tasks.length > 0 && (
                                <div className="p-2 border-t dark:border-gray-700">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1 mt-1">Issues</h4>
                                    {searchResults.tasks.map(t => (
                                        <Link key={t.id} href={`/client/projects/${t.projectId}?issue=${t.id}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 block">
                                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md text-green-600 dark:text-green-400">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.title}</div>
                                                <div className="text-xs text-muted-foreground">{t.key} • {t.status.replace('_', ' ')}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Files */}
                            {searchResults.files.length > 0 && (
                                <div className="p-2 border-t dark:border-gray-700">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1 mt-1">Files</h4>
                                    {searchResults.files.map(f => (
                                        <Link key={f.id} href={`/client/projects/${f.projectId}?tab=files`} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 block">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-md text-purple-600 dark:text-purple-400">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{f.originalName}</div>
                                                <div className="text-xs text-muted-foreground">in {f.project?.key}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right section */}
                <div className="flex items-center space-x-4 ml-6">
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        {theme === 'light' ? (
                            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                    </button>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            className="text-xs text-primary-600 hover:underline"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {loadingNotifications ? (
                                        <div className="px-4 py-8 text-center">
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-gray-500">
                                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No notifications yet</p>
                                        </div>
                                    ) : (
                                        notifications.map(notification => (
                                            <Link
                                                key={notification.id}
                                                href={notification.data?.issueId ? `/issues/${notification.data.issueId}` : '#'}
                                                onClick={() => setShowNotifications(false)}
                                            >
                                                <div className={cn(
                                                    "px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex gap-3",
                                                    !notification.isRead && "bg-blue-50 dark:bg-blue-900/10"
                                                )}>
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                            {new Date(notification.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    {!notification.isRead && (
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                                                    )}
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                                        <Link
                                            href="/notifications"
                                            className="text-sm text-primary-600 hover:underline block text-center"
                                            onClick={() => setShowNotifications(false)}
                                        >
                                            View all notifications
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* User menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white text-sm font-medium">
                                {getInitials(user?.firstName, user?.lastName)}
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>

                        {/* User dropdown */}
                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {user?.firstName} {user?.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                                </div>
                                <button
                                    onClick={() => router.push('/settings/profile')}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                    <User className="w-4 h-4" />
                                    <span>Profile</span>
                                </button>
                                <button
                                    onClick={() => router.push('/settings')}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>Settings</span>
                                </button>
                                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
