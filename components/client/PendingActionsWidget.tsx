'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { AlertCircle, Clock, CheckCircle2, MessageSquare, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ScheduleMeetingModal } from './ScheduleMeetingModal';

interface PendingAction {
    id: string;
    key: string;
    title: string;
    type: 'approval' | 'feedback' | 'review';
    project?: {
        name: string;
    };
    dueDate?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

interface PendingActionsWidgetProps {
    actions: PendingAction[];
    loading?: boolean;
}

export function PendingActionsWidget({ actions, loading }: PendingActionsWidgetProps) {
    const [showMeetingModal, setShowMeetingModal] = useState(false);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        Action Required
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'URGENT':
                return 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300';
            case 'HIGH':
                return 'bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300';
            case 'MEDIUM':
                return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300';
            default:
                return 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300';
        }
    };

    const getActionTypeIcon = (type: string) => {
        switch (type) {
            case 'feedback':
                return <MessageSquare className="h-4 w-4 text-purple-500" />;
            case 'review':
                return <FileText className="h-4 w-4 text-orange-500" />;
            default: // approval
                return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
        }
    };

    const getActionTypeText = (type: string) => {
        switch (type) {
            case 'feedback': return 'Feedback Requested';
            case 'review': return 'Document Review';
            default: return 'Approval Required';
        }
    };

    const getDaysUntilDue = (dueDate?: string) => {
        if (!dueDate) return null;
        const due = new Date(dueDate);
        const now = new Date();
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        Action Required
                        {actions.length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {actions.length}
                            </Badge>
                        )}
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => setShowMeetingModal(true)} className="hidden sm:flex">
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Meeting
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {actions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                        <p className="text-sm font-medium">All caught up!</p>
                        <p className="text-xs mt-1">No pending actions at the moment</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {actions.slice(0, 5).map((action) => {
                            const daysUntil = getDaysUntilDue(action.dueDate);
                            const isOverdue = daysUntil !== null && daysUntil < 0;
                            const isDueSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 2;

                            return (
                                <div
                                    key={action.id}
                                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge
                                                    variant="outline"
                                                    className="bg-white dark:bg-gray-800 text-xs font-medium flex items-center gap-1.5"
                                                >
                                                    {getActionTypeIcon(action.type)}
                                                    {getActionTypeText(action.type)}
                                                </Badge>
                                                {action.priority && (
                                                    <Badge className={`text-xs ${getPriorityColor(action.priority)}`}>
                                                        {action.priority}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                                {action.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <span>{action.project?.name || 'Unknown Project'}</span>
                                                {daysUntil !== null && (
                                                    <>
                                                        <span>•</span>
                                                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : isDueSoon ? 'text-amber-600 font-semibold' : ''}`}>
                                                            <Clock className="h-3 w-3" />
                                                            {isOverdue
                                                                ? `Overdue by ${Math.abs(daysUntil)} days`
                                                                : daysUntil === 0
                                                                    ? 'Due today'
                                                                    : daysUntil === 1
                                                                        ? 'Due tomorrow'
                                                                        : `Due in ${daysUntil} days`}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <Link href={`/client/tasks/${action.id}`}>
                                            <Button size="sm" variant="outline" className="shrink-0">
                                                {action.type === 'feedback' ? 'Respond' : action.type === 'review' ? 'View' : 'Review'}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                        {actions.length > 5 && (
                            <Link
                                href="/client/approvals"
                                className="block text-center text-sm text-primary hover:underline pt-2"
                            >
                                View all {actions.length} pending items →
                            </Link>
                        )}
                    </div>
                )}
            </CardContent>
            <ScheduleMeetingModal isOpen={showMeetingModal} onClose={() => setShowMeetingModal(false)} />
        </Card>
    );
}
