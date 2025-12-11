'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Mail, Shield, Plug, Save, FileText, Database, Sliders } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { settingsApi } from '@/lib/api/endpoints/settings';

type SettingsTab = 'general' | 'email' | 'security' | 'integrations' | 'audit' | 'backup' | 'advanced';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [loading, setLoading] = useState(false);
    const { success, error } = useToast();

    // State for form values (simplified for MVP, ideally should be managed by form hook)
    const [settings, setSettings] = useState<any>({});

    // Load initial settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await settingsApi.get();
                // Transform array to object for easier access
                const settingsMap = (data.settings || []).reduce((acc: any, curr: any) => {
                    acc[curr.key] = curr.value;
                    return acc;
                }, {});
                setSettings(settingsMap);
            } catch (err) {
                console.error('Failed to load settings', err);
            }
        };
        loadSettings();
    }, []);

    const handleSave = async (section: string, data: any) => {
        setLoading(true);
        try {
            // Save each key individually or batch if API supported it. For now, we save per section key.
            // Assuming we store entire section config as one JSON object under a key like 'settings_general', 'settings_email' etc.
            // Or individual keys.
            // Let's assume grouping by section key for simplicity: 'general_config', 'email_config', etc.

            await settingsApi.update(`${section}_config`, {
                value: data,
                description: `${section} configuration`
            });

            setSettings((prev: any) => ({ ...prev, [`${section}_config`]: data }));
            success('Settings Saved', 'Your preferences have been updated successfully.');
        } catch (err) {
            console.error(err);
            error('Save Failed', 'Could not save settings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'general' as SettingsTab, label: 'General', icon: SettingsIcon },
        { id: 'email' as SettingsTab, label: 'Email', icon: Mail },
        { id: 'security' as SettingsTab, label: 'Security', icon: Shield },
        { id: 'integrations' as SettingsTab, label: 'Integrations', icon: Plug },
        { id: 'audit' as SettingsTab, label: 'Audit & Compliance', icon: FileText },
        { id: 'backup' as SettingsTab, label: 'Backup & Recovery', icon: Database },
        { id: 'advanced' as SettingsTab, label: 'Advanced', icon: Sliders },
    ];

    return (
        <Container size="2xl">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        System Settings
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Configure your system preferences
                    </p>
                </div>

                {/* Tabs + Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardContent className="p-4">
                                <nav className="space-y-1">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={cn(
                                                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all',
                                                    activeTab === tab.id
                                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                )}
                                            >
                                                <Icon className="w-5 h-5" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </nav>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        {activeTab === 'general' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>General Settings</CardTitle>
                                    <CardDescription>Manage your organization details and preferences</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form className="space-y-6" onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        handleSave('general', Object.fromEntries(formData));
                                    }}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input name="orgName" label="Organization Name" defaultValue={settings['general_config']?.orgName || "Demo Organization"} />
                                            <Input name="websiteUrl" label="Website URL" type="url" defaultValue={settings['general_config']?.websiteUrl || "https://demo.com"} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Time Zone
                                                </label>
                                                <select name="timezone" defaultValue={settings['general_config']?.timezone} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500">
                                                    <option>UTC (GMT+0:00)</option>
                                                    <option>EST (GMT-5:00)</option>
                                                    <option>PST (GMT-8:00)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Language
                                                </label>
                                                <select name="language" defaultValue={settings['general_config']?.language} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500">
                                                    <option value="en">English</option>
                                                    <option value="es">Spanish</option>
                                                    <option value="fr">French</option>
                                                </select>
                                            </div>
                                        </div>
                                        <Button type="submit" variant="primary" isLoading={loading} leftIcon={<Save className="w-5 h-5" />}>
                                            Save Changes
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'email' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Email Configuration</CardTitle>
                                    <CardDescription>SMTP Server settings for system emails</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form className="space-y-6" onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        handleSave('email', Object.fromEntries(formData));
                                    }}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input name="smtpHost" label="SMTP Host" defaultValue={settings['email_config']?.smtpHost} placeholder="smtp.example.com" />
                                            <Input name="smtpPort" label="SMTP Port" type="number" defaultValue={settings['email_config']?.smtpPort} placeholder="587" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input name="username" label="Username" defaultValue={settings['email_config']?.username} />
                                            <Input name="password" label="Password" type="password" defaultValue={settings['email_config']?.password} />
                                        </div>
                                        <div className="flex gap-3">
                                            <Button type="button" variant="secondary" onClick={() => settingsApi.testEmail(settings['email_config'])}>
                                                Test Connection
                                            </Button>
                                            <Button type="submit" variant="primary" isLoading={loading} leftIcon={<Save className="w-5 h-5" />}>
                                                Save Changes
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'security' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Security Settings</CardTitle>
                                    <CardDescription>Manage authentication and access policies</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form className="space-y-6" onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        // Handle checkboxes manually if needed, or rely on them being absent from formData if unchecked
                                        handleSave('security', Object.fromEntries(formData));
                                    }}>
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">Password Policy</h3>
                                            <Input name="minLength" label="Minimum Length" type="number" defaultValue={settings['security_config']?.minLength || 8} />
                                            <Input name="sessionTimeout" label="Session Timeout (minutes)" type="number" defaultValue={settings['security_config']?.sessionTimeout || 60} />

                                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">Enable 2FA</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Require two-factor authentication for all admins</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input name="enable2FA" type="checkbox" className="sr-only peer" defaultChecked={settings['security_config']?.enable2FA === 'on'} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                        <Button type="submit" variant="primary" isLoading={loading} leftIcon={<Save className="w-5 h-5" />}>
                                            Save Changes
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'integrations' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Integrations</CardTitle>
                                    <CardDescription>Manage third-party connections</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {['Slack', 'GitHub', 'Jira', 'Google Workspace'].map((service) => (
                                            <div key={service} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                                        <Plug className="w-5 h-5 text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white">{service}</h4>
                                                        <p className="text-sm text-gray-500">Not connected</p>
                                                    </div>
                                                </div>
                                                <Button variant="secondary" size="sm">Configure</Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'audit' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Audit & Compliance</CardTitle>
                                    <CardDescription>Data retention and compliance reporting</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form className="space-y-6" onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        handleSave('audit', Object.fromEntries(formData));
                                    }}>
                                        <Input name="retentionDays" label="Data Retention (Days)" type="number" defaultValue={settings['audit_config']?.retentionDays || 90} />
                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">Detailed Logging</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Log all read operations (High Volume)</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input name="detailedLogging" type="checkbox" className="sr-only peer" defaultChecked={settings['audit_config']?.detailedLogging === 'on'} />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>
                                        <Button type="submit" variant="primary" isLoading={loading} leftIcon={<Save className="w-5 h-5" />}>
                                            Save Settings
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'backup' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Backup & Recovery</CardTitle>
                                    <CardDescription>Manage automated backups</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
                                            <Database className="w-5 h-5 text-blue-600 mt-1" />
                                            <div>
                                                <h4 className="font-medium text-blue-900 dark:text-blue-200">Last Successful Backup</h4>
                                                <p className="text-sm text-blue-700 dark:text-blue-300">{new Date().toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            handleSave('backup', Object.fromEntries(new FormData(e.currentTarget)));
                                        }}>
                                            <div className="space-y-4">
                                                <Input name="schedule" label="Backup Schedule (Cron)" defaultValue={settings['backup_config']?.schedule || "0 0 * * *"} />
                                                <Input name="location" label="Backup Location (S3 Bucket)" defaultValue={settings['backup_config']?.location} />
                                            </div>
                                            <div className="mt-6 flex gap-3">
                                                <Button type="button" variant="secondary">Trigger Manual Backup</Button>
                                                <Button type="submit" variant="primary" isLoading={loading}>Save Schedule</Button>
                                            </div>
                                        </form>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'advanced' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Advanced Settings</CardTitle>
                                    <CardDescription>System-level configurations</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form className="space-y-6" onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSave('advanced', Object.fromEntries(new FormData(e.currentTarget)));
                                    }}>
                                        <Input name="rateLimit" label="API Rate Limit (Req/Min)" type="number" defaultValue={settings['advanced_config']?.rateLimit || 100} />
                                        <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900 rounded-lg">
                                            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Maintenance Mode</h4>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-yellow-700 dark:text-yellow-300">Disable access for all non-admin users</p>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input name="maintenanceMode" type="checkbox" className="sr-only peer" defaultChecked={settings['advanced_config']?.maintenanceMode === 'on'} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"></div>
                                                </label>
                                            </div>
                                        </div>
                                        <Button type="submit" variant="primary" isLoading={loading} leftIcon={<Save className="w-5 h-5" />}>
                                            Save Advanced Settings
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </Container>
    );
}
