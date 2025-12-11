'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Target, Calendar, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Milestone {
    id: string;
    name: string;
    dueDate: string;
    status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
    progress?: number;
    tasksTotal?: number;
    tasksCompleted?: number;
    projectId?: string;
    project?: {
        name: string;
    };
}

interface UpcomingMilestonesWidgetProps {
    milestones: Milestone[];
    loading?: boolean;
}

export function UpcomingMilestonesWidget({ milestones, loading }: UpcomingMilestonesWidgetProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Upcoming Milestones
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'IN_PROGRESS':
                return <TrendingUp className="h-4 w-4 text-blue-500" />;
            case 'DELAYED':
                return <AlertTriangle className="h-4 w-4 text-red-500" />;
            default:
                return <Calendar className="h-4 w-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300';
            case 'IN_PROGRESS':
                return 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300';
            case 'DELAYED':
                return 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: 'Overdue', color: 'text-red-600', urgent: true };
        if (diffDays === 0) return { text: 'Today', color: 'text-amber-600', urgent: true };
        if (diffDays === 1) return { text: 'Tomorrow', color: 'text-amber-600', urgent: true };
        if (diffDays <= 7) return { text: `${diffDays} days`, color: 'text-orange-600', urgent: false };

        return {
            text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            color: 'text-muted-foreground',
            urgent: false
        };
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Upcoming Milestones
                </CardTitle>
            </CardHeader>
            <CardContent>
                {milestones.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No upcoming milestones</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {milestones.slice(0, 5).map((milestone) => {
                            const dateInfo = formatDate(milestone.dueDate);
                            const progress = milestone.progress ||
                                (milestone.tasksTotal && milestone.tasksCompleted
                                    ? Math.round((milestone.tasksCompleted / milestone.tasksTotal) * 100)
                                    : 0);

                            return (
                                <div
                                    key={milestone.id}
                                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                            <div className="mt-0.5">
                                                {getStatusIcon(milestone.status)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm truncate">
                                                    {milestone.name}
                                                </h4>
                                                {milestone.project && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {milestone.project.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <Badge className={`text-xs ${getStatusColor(milestone.status)}`}>
                                                {milestone.status.replace('_', ' ')}
                                            </Badge>
                                            <span className={`text-xs font-medium ${dateInfo.color}`}>
                                                {dateInfo.urgent && <span className="mr-1">⚠️</span>}
                                                {dateInfo.text}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                {milestone.tasksCompleted || 0} of {milestone.tasksTotal || 0} tasks
                                            </span>
                                            <span className="font-medium">{progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${milestone.status === 'COMPLETED'
                                                        ? 'bg-green-500'
                                                        : milestone.status === 'DELAYED'
                                                            ? 'bg-red-500'
                                                            : 'bg-blue-500'
                                                    }`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
