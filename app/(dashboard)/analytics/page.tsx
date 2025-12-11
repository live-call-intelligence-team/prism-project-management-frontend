'use client';

import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import {
    LayoutDashboard,
    CheckCircle2,
    AlertCircle,
    Clock,
    Users,
    FolderKanban,
    Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { dashboardApi, DashboardStats } from '@/lib/api/endpoints';
import { cn } from '@/lib/utils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await dashboardApi.getStats();
                setStats(data);
            } catch (err) {
                console.error('Error fetching analytics:', err);
                setError('Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <Container size="2xl">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <LoadingSkeleton variant="stat" count={4} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <LoadingSkeleton variant="chart" count={2} />
                    </div>
                </div>
            </Container>
        );
    }

    if (error || !stats) {
        return (
            <Container size="2xl">
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Error Loading Analytics</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
                </div>
            </Container>
        );
    }

    // Prepare data for charts
    const statusData = stats.issuesByStatus.map(item => ({
        name: item.status.replace('_', ' '),
        value: parseInt(item.count)
    }));

    const priorityData = stats.issuesByPriority.map(item => ({
        name: item.priority,
        value: parseInt(item.count)
    }));

    return (
        <Container size="2xl">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Overview of project performance and statistics
                    </p>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stats.overview.projects}
                                </h3>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                <FolderKanban className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Issues</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stats.overview.issues}
                                </h3>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sprints</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stats.overview.activeSprints}
                                </h3>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stats.overview.activeUsers}
                                </h3>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Status Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Issue Status Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                borderRadius: '8px',
                                                border: 'none',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Priority Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Issues by Priority</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={priorityData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                borderRadius: '8px',
                                                border: 'none',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                            {priorityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary-600" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recentActivity.length > 0 ? (
                                stats.recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium text-sm shrink-0">
                                            {activity.user.firstName[0]}{activity.user.lastName[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {activity.user.firstName} {activity.user.lastName}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                                {activity.action} {activity.resource.toLowerCase()}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                {new Date(activity.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    No recent activity found
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
}
