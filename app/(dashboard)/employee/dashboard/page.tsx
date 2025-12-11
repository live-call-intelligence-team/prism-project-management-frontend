'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { analyticsApi } from '@/lib/api/endpoints/analytics';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import Container from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { CheckCircle, Clock, Zap, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any | null>(null);
    const [myIssues, setMyIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);

    const loadDashboard = async () => {
        try {
            const [statsData, issuesData] = await Promise.all([
                analyticsApi.getPersonalStats(),
                issuesApi.getMyIssues()
            ]);
            setStats(statsData);
            setMyIssues(issuesData.issues || []);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    if (loading) {
        return (
            <Container>
                <div className="space-y-6">
                    <LoadingSkeleton count={1} className="h-24 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <LoadingSkeleton count={4} className="h-32" />
                    </div>
                    <LoadingSkeleton count={3} className="h-48" />
                </div>
            </Container>
        );
    }

    return (
        <Container size="full">
            <div className="space-y-8">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
                    <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName}!</h1>
                    <p className="text-indigo-100 opacity-90">
                        You have <span className="font-bold text-white">{stats?.activeIssues} active tasks</span> waiting for you.
                        Let's have a productive day!
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Active Tasks"
                        value={stats?.activeIssues || 0}
                        icon={<CheckCircle className="w-5 h-5 text-blue-500" />}
                        description="Assigned to you"
                    />
                    <StatsCard
                        title="Completed (Week)"
                        value={stats?.completedThisWeek || 0}
                        icon={<Calendar className="w-5 h-5 text-green-500" />}
                        description="Stories finished"
                    />
                    <StatsCard
                        title="Velocity"
                        value={stats?.velocity || 0}
                        icon={<Zap className="w-5 h-5 text-yellow-500" />}
                        description="Total story points"
                    />
                    <StatsCard
                        title="Avg. Completion"
                        value={`${stats?.avgCompletionTime || '0'}h`}
                        icon={<Clock className="w-5 h-5 text-purple-500" />}
                        description="Hours per task"
                    />
                </div>

                {/* My Tasks - Simple List */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Current Tasks</h2>
                            <Link href="/employee/board" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center transition-colors">
                                Go to Board <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            {myIssues.slice(0, 5).map((issue) => (
                                <div key={issue.id} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0 mr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold
                                                    ${issue.type === 'BUG' ? 'bg-red-100 text-red-700' :
                                                        issue.type === 'FEATURE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {issue.type}
                                                </span>
                                                <span className="text-xs text-gray-500">{issue.key}</span>
                                            </div>
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{issue.title}</h4>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                ${issue.status === 'TODO' ? 'bg-gray-100 text-gray-700' :
                                                    issue.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                                        issue.status === 'IN_REVIEW' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-green-100 text-green-700'}`}>
                                                {issue.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {myIssues.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    No active tasks assigned to you.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity Widget */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                            <div className="space-y-6">
                                {stats?.recentActivity?.map((activity: any, index: number) => (
                                    <div key={index} className="flex gap-3 relative">
                                        {index !== (stats.recentActivity.length - 1) && (
                                            <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-gray-700" />
                                        )}
                                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 z-10">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-900 dark:text-white">
                                                <span className="font-medium">{activity.action}</span> on <span className="font-medium">{activity.resource}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {new Date(activity.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                                    <div className="text-center text-gray-500 py-4">No recent activity</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    );
}

function StatsCard({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {icon}
                </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{title}</p>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    );
}
