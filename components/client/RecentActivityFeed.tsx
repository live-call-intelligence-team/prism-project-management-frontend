'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    Clock,
    CheckCircle2,
    FileText,
    MessageSquare,
    Plus,
    Edit,
    Upload,
    User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
    id: string;
    type: 'issue_created' | 'issue_updated' | 'comment' | 'file_uploaded' | 'milestone_completed';
    user: string;
    action: string;
    target?: string;
    timestamp: string;
    issueKey?: string;
    issueTitle?: string;
    projectName?: string;
}

interface RecentActivityFeedProps {
    activities: Activity[];
    loading?: boolean;
}

export function RecentActivityFeed({ activities, loading }: RecentActivityFeedProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex gap-3">
                                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'issue_created':
                return <Plus className="h-4 w-4" />;
            case 'issue_updated':
                return <Edit className="h-4 w-4" />;
            case 'comment':
                return <MessageSquare className="h-4 w-4" />;
            case 'file_uploaded':
                return <Upload className="h-4 w-4" />;
            case 'milestone_completed':
                return <CheckCircle2 className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'issue_created':
                return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'issue_updated':
                return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
            case 'comment':
                return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            case 'file_uploaded':
                return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
            case 'milestone_completed':
                return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
            default:
                return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const formatActivityText = (activity: Activity) => {
        switch (activity.type) {
            case 'issue_created':
                return `created ${activity.issueKey || 'a task'}`;
            case 'issue_updated':
                return `updated ${activity.issueKey || 'a task'}`;
            case 'comment':
                return `commented on ${activity.issueKey || 'a task'}`;
            case 'file_uploaded':
                return 'uploaded a file';
            case 'milestone_completed':
                return 'completed a milestone';
            default:
                return activity.action || 'performed an action';
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {activities.length === 0 ? (
                    <div className="text-center py-12 px-4 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No recent activity</p>
                    </div>
                ) : (
                    <div className="divide-y max-h-[500px] overflow-y-auto">
                        {activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                <div className="flex gap-3 items-start">
                                    {/* Icon */}
                                    <div className={`p-2 rounded-full shrink-0 ${getActivityColor(activity.type)}`}>
                                        {getActivityIcon(activity.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                {/* Meta - Top line (Project Name) */}
                                                {activity.projectName && (
                                                    <div className="text-xs font-semibold text-primary mb-0.5">
                                                        {activity.projectName}
                                                    </div>
                                                )}

                                                {/* Main Action Line */}
                                                <p className="text-sm text-foreground">
                                                    {activity.target ? (
                                                        <>
                                                            <span className="font-medium">{activity.target}</span>
                                                            <span className="text-muted-foreground mx-1">
                                                                {activity.action || 'updated'}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="font-medium text-foreground">
                                                            {formatActivityText(activity)}
                                                        </span>
                                                    )}
                                                </p>

                                                {/* User & Time - Bottom Line */}
                                                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                                    <span>by {activity.user}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
