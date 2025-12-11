'use client';

import { useState, useEffect } from 'react';
import {
    User,
    Bell,
    Moon,
    Sun,
    Shield,
    Mail,
    Smartphone,
    Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';
import { usersApi } from '@/lib/api/endpoints/users';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
    const { user, setUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Profile Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
        }
    }, [user]);

    // Initialize theme from localStorage
    useState(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
            setTheme(savedTheme || 'light');
        }
    });

    const toggleTheme = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const updatedUser = await usersApi.update(user.id, { firstName, lastName });
            setUser(updatedUser as any); // Update local store
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Failed to update profile', error);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Appearance', icon: Moon },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    return (
        <Container size="lg">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your account settings and preferences
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar */}
                    <div className="w-full md:w-64 space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                        activeTab === tab.id
                                            ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Personal Information</CardTitle>
                                        <CardDescription>Update your personal details and public profile</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-2xl font-bold">
                                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                                            </div>
                                            <div>
                                                <button
                                                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                    onClick={() => toast('Avatar upload coming soon!', { icon: '📷' })}
                                                >
                                                    Change Avatar
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                defaultValue={user?.email}
                                                disabled
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 cursor-not-allowed"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={isSaving}
                                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                            >
                                                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                Save Changes
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notification Preferences</CardTitle>
                                    <CardDescription>Choose how you want to be notified</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Mail className="w-5 h-5 text-gray-500" />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                                                    <p className="text-sm text-gray-500">Receive emails about your account activity</p>
                                                </div>
                                            </div>
                                            <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Smartphone className="w-5 h-5 text-gray-500" />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                                                    <p className="text-sm text-gray-500">Receive push notifications on your device</p>
                                                </div>
                                            </div>
                                            <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500" />
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <button
                                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                                            onClick={() => toast.success('Preferences saved!')}
                                        >
                                            Save Preferences
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Appearance Tab */}
                        {activeTab === 'appearance' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Appearance</CardTitle>
                                    <CardDescription>Customize the look and feel of the application</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => toggleTheme('light')}
                                                className={cn(
                                                    "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
                                                    theme === 'light'
                                                        ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                )}
                                            >
                                                <Sun className="w-5 h-5" />
                                                <span>Light Mode</span>
                                            </button>
                                            <button
                                                onClick={() => toggleTheme('dark')}
                                                className={cn(
                                                    "flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
                                                    theme === 'dark'
                                                        ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                )}
                                            >
                                                <Moon className="w-5 h-5" />
                                                <span>Dark Mode</span>
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Security</CardTitle>
                                    <CardDescription>Manage your password and security settings</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <button
                                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            onClick={() => toast('Password change flow coming soon')}
                                        >
                                            Change Password
                                        </button>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Two-Factor Authentication</p>
                                        <p className="text-sm text-gray-500 mb-4">Add an extra layer of security to your account</p>
                                        <button
                                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                            onClick={() => toast('MFA flow coming soon')}
                                        >
                                            Enable 2FA
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </Container>
    );
}
