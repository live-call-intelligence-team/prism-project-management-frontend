'use client';

import { Download, FileText, TrendingUp, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { getUserStats, getUserGrowthData } from '@/lib/data/mockUsers';
import { getProjectStats } from '@/lib/data/mockProjects';

export default function ReportsPage() {
    const userStats = getUserStats();
    const projectStats = getProjectStats();
    const userGrowth = getUserGrowthData();

    return (
        <Container size="2xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Reports & Analytics
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            View insights and export data
                        </p>
                    </div>
                    <Button variant="primary" leftIcon={<Download className="w-5 h-5" />}>
                        Export Report
                    </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{userStats.total}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{userStats.active}</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Projects</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{projectStats.total}</p>
                                </div>
                                <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{projectStats.completed}</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* User Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Distribution by Role</CardTitle>
                        <CardDescription>Breakdown of users across different roles</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(userStats.byRole).map(([role, count]) => {
                                const percentage = (count / userStats.total) * 100;
                                return (
                                    <div key={role}>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-700 dark:text-gray-300 capitalize">
                                                {role.toLowerCase().replace('_', ' ')}
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {count} ({percentage.toFixed(0)}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-primary-600 h-2 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Export Options */}
                <Card>
                    <CardHeader>
                        <CardTitle>Export Options</CardTitle>
                        <CardDescription>Download reports in various formats</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button variant="secondary" className="w-full">
                                Export as PDF
                            </Button>
                            <Button variant="secondary" className="w-full">
                                Export as Excel
                            </Button>
                            <Button variant="secondary" className="w-full">
                                Export as CSV
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
}
