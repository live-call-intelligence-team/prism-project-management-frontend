'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Save, Settings, Eye, Mail, Shield } from 'lucide-react';
import apiClient from '@/lib/api/client';

interface PortalSettings {
    clientPortalEnabled: boolean;
    defaultTaskVisibility: boolean;
    allowClientFileUpload: boolean;
    maxFileUploadSizeMB: number;
    emailNotificationsEnabled: boolean;
    requireApprovalForTasks: boolean;
}

export default function ClientPortalSettingsPage() {
    const [settings, setSettings] = useState<PortalSettings>({
        clientPortalEnabled: true,
        defaultTaskVisibility: false,
        allowClientFileUpload: true,
        maxFileUploadSizeMB: 10,
        emailNotificationsEnabled: true,
        requireApprovalForTasks: false,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await apiClient.get<{ success: boolean; data?: { settings?: PortalSettings } }>('/admin/portal-settings');
            const fetched = response.data?.data?.settings;
            if (fetched) {
                setSettings(fetched);
            }
        } catch (error: unknown) {
            console.error('Failed to fetch settings', error);
            setStatusMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to fetch settings',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setStatusMessage(null);

        try {
            const response = await apiClient.put<{ success: boolean; message?: string; data?: { settings?: PortalSettings } }>(
                '/admin/portal-settings',
                settings
            );

            const persisted = response.data?.data?.settings;
            if (persisted) {
                setSettings(persisted);
            }

            setStatusMessage({
                type: 'success',
                text: response.data?.message || 'Settings saved successfully',
            });
        } catch (error: unknown) {
            console.error('Failed to save settings', error);
            setStatusMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to save settings',
            });
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = <K extends keyof PortalSettings>(key: K, value: PortalSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Settings className="h-8 w-8 text-primary" />
                        Client Portal Settings
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Configure how clients interact with the portal
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            {statusMessage && (
                <div
                    className={`rounded-lg border px-4 py-3 text-sm ${statusMessage.type === 'success'
                        ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}
                >
                    {statusMessage.text}
                </div>
            )}

            {/* General Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        General Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Portal Enabled */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                            <h3 className="font-medium mb-1">Enable Client Portal</h3>
                            <p className="text-sm text-muted-foreground">
                                Allow clients to access the portal and view their projects
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.clientPortalEnabled}
                                onChange={(e) => updateSetting('clientPortalEnabled', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {/* Require Approval */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                            <h3 className="font-medium mb-1">Require Client Approval for Tasks</h3>
                            <p className="text-sm text-muted-foreground">
                                All completed tasks must be approved by clients before marking as done
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.requireApprovalForTasks}
                                onChange={(e) => updateSetting('requireApprovalForTasks', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </CardContent>
            </Card>

            {/* Visibility Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        Visibility & Access
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Default Task Visibility */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                            <h3 className="font-medium mb-1">Default Task Visibility</h3>
                            <p className="text-sm text-muted-foreground">
                                Make new tasks visible to clients by default
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.defaultTaskVisibility}
                                onChange={(e) => updateSetting('defaultTaskVisibility', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {/* Client File Upload */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                            <h3 className="font-medium mb-1">Allow Client File Uploads</h3>
                            <p className="text-sm text-muted-foreground">
                                Let clients upload files to their projects
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.allowClientFileUpload}
                                onChange={(e) => updateSetting('allowClientFileUpload', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {/* Max File Size */}
                    {settings.allowClientFileUpload && (
                        <div className="p-4 border rounded-lg">
                            <label className="block mb-2">
                                <h3 className="font-medium mb-1">Maximum File Upload Size (MB)</h3>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Set the maximum file size clients can upload
                                </p>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={settings.maxFileUploadSizeMB}
                                    onChange={(e) => updateSetting('maxFileUploadSizeMB', Number.parseInt(e.target.value, 10) || 1)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </label>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        Notification Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                            <h3 className="font-medium mb-1">Email Notifications</h3>
                            <p className="text-sm text-muted-foreground">
                                Send email notifications for important events
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.emailNotificationsEnabled}
                                onChange={(e) => updateSetting('emailNotificationsEnabled', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button (Bottom) */}
            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving} size="lg">
                    <Save className="mr-2 h-5 w-5" />
                    {saving ? 'Saving Changes...' : 'Save All Settings'}
                </Button>
            </div>
        </div>
    );
}
