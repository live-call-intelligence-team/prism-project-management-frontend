'use client';

import { motion } from 'framer-motion';
import {
    FolderKanban,
    ListTodo,
    Timer,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color: 'blue' | 'purple' | 'green' | 'orange';
}

const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
};

function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
        >
            <div className="flex items-center justify-between mb-4">
                <div className={cn(
                    'w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center',
                    `${colorClasses[color]}`
                )}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                {trend && (
                    <div className={cn(
                        'flex items-center text-sm font-medium',
                        trend.isPositive ? 'text-green-600' : 'text-red-600'
                    )}>
                        <TrendingUp className={cn(
                            'w-4 h-4 mr-1',
                            !trend.isPositive && 'rotate-180'
                        )} />
                        {trend.value}%
                    </div>
                )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        </motion.div>
    );
}

interface ActivityItem {
    id: string;
    type: 'issue' | 'project' | 'sprint';
    title: string;
    description: string;
    time: string;
    user: string;
}

const recentActivity: ActivityItem[] = [
    {
        id: '1',
        type: 'issue',
        title: 'PROJ-123',
        description: 'Fixed login authentication bug',
        time: '5 minutes ago',
        user: 'John Doe',
    },
    {
        id: '2',
        type: 'project',
        title: 'New Project Created',
        description: 'Mobile App Redesign project started',
        time: '1 hour ago',
        user: 'Jane Smith',
    },
    {
        id: '3',
        type: 'sprint',
        title: 'Sprint Completed',
        description: 'Sprint 12 completed with 95% completion rate',
        time: '2 hours ago',
        user: 'System',
    },
];

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Welcome section */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Welcome back! 👋
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Here's what's happening with your projects today.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Projects"
                    value={12}
                    icon={FolderKanban}
                    trend={{ value: 12, isPositive: true }}
                    color="blue"
                />
                <StatCard
                    title="Open Issues"
                    value={48}
                    icon={ListTodo}
                    trend={{ value: 8, isPositive: false }}
                    color="purple"
                />
                <StatCard
                    title="Active Sprints"
                    value={3}
                    icon={Timer}
                    color="green"
                />
                <StatCard
                    title="Team Members"
                    value={24}
                    icon={Users}
                    trend={{ value: 15, isPositive: true }}
                    color="orange"
                />
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Recent Activity
                        </h2>
                        <div className="space-y-4">
                            {recentActivity.map((activity, index) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className={cn(
                                        'w-10 h-10 rounded-lg flex items-center justify-center',
                                        activity.type === 'issue' && 'bg-blue-100 dark:bg-blue-900/20',
                                        activity.type === 'project' && 'bg-purple-100 dark:bg-purple-900/20',
                                        activity.type === 'sprint' && 'bg-green-100 dark:bg-green-900/20'
                                    )}>
                                        {activity.type === 'issue' && <ListTodo className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                                        {activity.type === 'project' && <FolderKanban className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                                        {activity.type === 'sprint' && <Timer className="w-5 h-5 text-green-600 dark:text-green-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {activity.title}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {activity.description}
                                        </p>
                                        <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-500">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {activity.time} • {activity.user}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-6">
                    {/* Today's Tasks */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Today's Tasks
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Completed</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">8</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">In Progress</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">5</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <AlertCircle className="w-4 h-4 text-orange-600" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Pending</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">12</span>
                            </div>
                        </div>
                    </div>

                    {/* Sprint Progress */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Current Sprint
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Sprint 13</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">75%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '75%' }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="h-full bg-gradient-to-r from-primary-500 to-accent-purple"
                                    />
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                <p>5 days remaining</p>
                                <p className="mt-1">18 of 24 issues completed</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
