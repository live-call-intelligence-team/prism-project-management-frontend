'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    data?: Record<string, any>;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNotifications();

        // Set up polling for new notifications
        const interval = setInterval(() => {
            fetchNotifications(true);
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async (silent = false) => {
        if (!silent) setLoading(true);

        try {
            const response = await fetch('/api/v1/notifications?limit=10');
            const data = await response.json();

            if (data.success) {
                setNotifications(data.data.notifications);
                setUnreadCount(data.data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/v1/notifications/${id}/read`, {
                method: 'PATCH',
            });

            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/v1/notifications/read-all', {
                method: 'PATCH',
            });

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await fetch(`/api/v1/notifications/${id}`, {
                method: 'DELETE',
            });

            setNotifications(prev => prev.filter(n => n.id !== id));
            if (notifications.find(n => n.id === id && !n.isRead)) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        // Return different icons based on notification type
        return '🔔';
    };

    return (
        <div className="relative">
            {/* Bell Icon with Badge */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Card */}
                    <Card className="absolute right-0 mt-2 w-96 max-h-[600px] overflow-hidden z-50 shadow-xl">
                        <CardHeader className="border-b sticky top-0 bg-white dark:bg-gray-900 z-10">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Notifications</CardTitle>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={markAllAsRead}
                                            className="text-xs"
                                        >
                                            <Check className="h-3 w-3 mr-1" />
                                            Mark all read
                                        </Button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0 overflow-y-auto max-h-[500px]">
                            {loading ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                    Loading...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground">
                                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="text-2xl shrink-0">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <h4 className="font-medium text-sm">
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.isRead && (
                                                            <div className="h-2 w-2 bg-blue-500 rounded-full shrink-0 mt-1" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            {!notification.isRead && (
                                                                <button
                                                                    onClick={() => markAsRead(notification.id)}
                                                                    className="p-1 text-xs text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                                                                    title="Mark as read"
                                                                >
                                                                    <Check className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => deleteNotification(notification.id)}
                                                                className="p-1 text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {notifications.length > 0 && (
                                <div className="p-3 border-t sticky bottom-0 bg-white dark:bg-gray-900">
                                    <Link href="/notifications" className="block text-center text-sm text-primary hover:underline font-medium">
                                        View all notifications
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
