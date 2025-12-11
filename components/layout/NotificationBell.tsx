'use client';

import { useState, useEffect, useRef } from 'react';
import { notificationsApi, Notification } from '@/lib/api/endpoints/notifications';
import { Bell, Check, Loader2 } from 'lucide-react';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { success, error: toastError } = useToast();

    useOnClickOutside(ref, () => setIsOpen(false));

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await notificationsApi.getMyNotifications({ limit: 5 });
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchNotifications();

        // Poll every minute (simple real-time substitute)
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            // Optimistic update
            if (id === 'all') {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
                success('All marked as read');
            } else {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error(error);
            toastError('Failed to mark as read');
        }
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchNotifications(); // Refresh on open
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={toggleDropdown}
                className="relative p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => handleMarkAsRead('all')}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center"
                            >
                                <Check className="w-3 h-3 mr-1" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="p-4 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                                            !notification.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-gray-400">
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5"
                                                    title="Mark as read"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
