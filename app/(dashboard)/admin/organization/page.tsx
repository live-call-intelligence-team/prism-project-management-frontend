'use client';

import { Building, Upload, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function OrganizationPage() {
    return (
        <Container size="2xl">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Organization Profile
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Manage your company details and branding
                    </p>
                </div>

                {/* Company Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Company Details</CardTitle>
                        <CardDescription>Update your organization information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Company Logo
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="w-24 h-24 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                    <Building className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <Button variant="secondary" size="sm" leftIcon={<Upload className="w-4 h-4" />}>
                                        Upload Logo
                                    </Button>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        PNG, JPG, SVG up to 2MB
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Company Name" defaultValue="Demo Organization" />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Industry
                                </label>
                                <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500">
                                    <option>Technology</option>
                                    <option>Finance</option>
                                    <option>Healthcare</option>
                                    <option>Education</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Primary Email" type="email" defaultValue="contact@demo.com" />
                            <Input label="Phone Number" type="tel" defaultValue="+1 (555) 123-4567" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                rows={4}
                                defaultValue="A leading project management platform for agile teams."
                            />
                        </div>

                        <Button variant="primary" leftIcon={<Save className="w-5 h-5" />}>
                            Save Changes
                        </Button>
                    </CardContent>
                </Card>

                {/* Subscription Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription</CardTitle>
                        <CardDescription>Your current plan and usage</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Enterprise Plan</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">$99/month • Billed monthly</p>
                            </div>
                            <Button variant="primary" size="sm">Upgrade</Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-700 dark:text-gray-300">Users</span>
                                    <span className="font-medium text-gray-900 dark:text-white">45 / 100</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div className="bg-primary-600 h-2 rounded-full" style={{ width: '45%' }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-700 dark:text-gray-300">Storage</span>
                                    <span className="font-medium text-gray-900 dark:text-white">45.2 GB / 100 GB</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '45.2%' }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-700 dark:text-gray-300">Projects</span>
                                    <span className="font-medium text-gray-900 dark:text-white">42 / Unlimited</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
}
