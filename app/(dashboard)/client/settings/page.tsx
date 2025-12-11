'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { User, Bell, Moon, Shield, Lock, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');

    const [isLoading, setIsLoading] = useState(false);

    const handleSave = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            toast.success('Settings saved successfully');
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Container size="xl" className="py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Navigation */}
                    <div className="space-y-2">
                        {[
                            { id: 'profile', label: 'Profile', icon: User },
                            { id: 'notifications', label: 'Notifications', icon: Bell },
                            { id: 'appearance', label: 'Appearance', icon: Moon },
                            { id: 'security', label: 'Security', icon: Lock },
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                    ${activeTab === item.id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-white hover:shadow-sm'}
                                `}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <Card>
                            <CardContent className="p-8">
                                {activeTab === 'profile' && (
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Personal Information</h2>

                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                                                {user?.firstName?.[0]}
                                            </div>
                                            <Button variant="outline" size="sm">Change Avatar</Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">First Name</label>
                                                <input type="text" defaultValue={user?.firstName} className="w-full px-4 py-2 border rounded-lg" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Last Name</label>
                                                <input type="text" defaultValue={user?.lastName} className="w-full px-4 py-2 border rounded-lg" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                                <input type="email" defaultValue={user?.email} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Notifications</h2>

                                        <div className="space-y-4">
                                            <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                                <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-blue-600 rounded" />
                                                <div>
                                                    <span className="block font-bold text-gray-900 text-sm">Request Updates</span>
                                                    <span className="block text-xs text-gray-500">Get notified when status changes or agents comment</span>
                                                </div>
                                            </label>

                                            <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                                <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-blue-600 rounded" />
                                                <div>
                                                    <span className="block font-bold text-gray-900 text-sm">Email Digest</span>
                                                    <span className="block text-xs text-gray-500">Receive a daily summary of activity</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                    <Button onClick={handleSave} isLoading={isLoading} className="flex items-center gap-2">
                                        <Save className="w-4 h-4" /> Save Changes
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </Container>
        </div>
    );
}
