'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
    CheckCircle2,
    XCircle,
    MessageSquare,
    AlertCircle,
    Clock,
    User,
    Calendar,
    Tag
} from 'lucide-react';
import { issuesApi } from '@/lib/api/endpoints/issues';

interface TaskApprovalModalProps {
    task: any;
    onApprovalComplete?: (status: string) => void;
    onClose?: () => void;
}

export function TaskApprovalModal({ task, onApprovalComplete, onClose }: TaskApprovalModalProps) {
    const [approvalStatus, setApprovalStatus] = useState<'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | null>(null);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);

    const handleApprovalDecision = (status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED') => {
        setApprovalStatus(status);

        // For approval, can submit immediately or let user add optional feedback
        if (status === 'APPROVED') {
            setShowFeedbackForm(true);
        } else {
            // For reject or changes, feedback is more important
            setShowFeedbackForm(true);
        }
    };

    const handleSubmit = async () => {
        if (!approvalStatus) return;

        // Require feedback for rejection and change requests
        if ((approvalStatus === 'REJECTED' || approvalStatus === 'CHANGES_REQUESTED') && !feedback.trim()) {
            alert('Please provide feedback explaining your decision');
            return;
        }

        setSubmitting(true);

        try {
            await issuesApi.clientApproval(task.id, {
                status: approvalStatus,
                feedback: feedback.trim() || undefined
            });

            // Success feedback
            if (onApprovalComplete) {
                onApprovalComplete(approvalStatus);
            }
        } catch (error: any) {
            console.error('Failed to submit approval', error);
            alert(error.response?.data?.message || 'Failed to submit approval. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuickApprove = async () => {
        setSubmitting(true);
        try {
            await issuesApi.clientApproval(task.id, {
                status: 'APPROVED'
            });

            if (onApprovalComplete) {
                onApprovalComplete('APPROVED');
            }
        } catch (error: any) {
            console.error('Failed to approve', error);
            alert(error.response?.data?.message || 'Failed to approve. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'HIGH':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
            case 'MEDIUM':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            default:
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        }
    };

    if (showFeedbackForm && approvalStatus) {
        return (
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {approvalStatus === 'APPROVED' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        {approvalStatus === 'REJECTED' && <XCircle className="h-5 w-5 text-red-600" />}
                        {approvalStatus === 'CHANGES_REQUESTED' && <AlertCircle className="h-5 w-5 text-amber-600" />}
                        {approvalStatus === 'APPROVED' && 'Approve Task'}
                        {approvalStatus === 'REJECTED' && 'Reject Task'}
                        {approvalStatus === 'CHANGES_REQUESTED' && 'Request Changes'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono">
                                {task.key}
                            </Badge>
                            <span className="font-medium">{task.title}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {approvalStatus === 'APPROVED'
                                ? 'Feedback (Optional)'
                                : 'Feedback (Required)'}
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder={
                                approvalStatus === 'APPROVED'
                                    ? 'Add any comments or suggestions...'
                                    : approvalStatus === 'REJECTED'
                                        ? 'Please explain why you are rejecting this task...'
                                        : 'Please specify what changes are needed...'
                            }
                            className="w-full min-h-[120px] p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                            disabled={submitting}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {approvalStatus === 'APPROVED'
                                ? 'Share any positive feedback or minor suggestions'
                                : 'Be specific to help the team address your concerns'}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1"
                            variant={
                                approvalStatus === 'APPROVED' ? 'primary' :
                                    approvalStatus === 'REJECTED' ? 'danger' :
                                        'secondary'
                            }
                        >
                            {submitting ? 'Submitting...' : 'Confirm ' + (
                                approvalStatus === 'APPROVED' ? 'Approval' :
                                    approvalStatus === 'REJECTED' ? 'Rejection' :
                                        'Change Request'
                            )}
                        </Button>
                        <Button
                            onClick={() => {
                                setShowFeedbackForm(false);
                                setApprovalStatus(null);
                                setFeedback('');
                            }}
                            variant="outline"
                            disabled={submitting}
                        >
                            Back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Task Review & Approval
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Task Details */}
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono">
                                {task.key}
                            </Badge>
                            {task.priority && (
                                <Badge className={getPriorityColor(task.priority)}>
                                    {task.priority}
                                </Badge>
                            )}
                            <Badge variant="secondary">
                                {task.status?.replace('_', ' ')}
                            </Badge>
                        </div>
                        <h3 className="text-xl font-semibold">{task.title}</h3>
                    </div>

                    {task.description && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {task.description}
                            </p>
                        </div>
                    )}

                    {/* Meta Information */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {task.assignee && (
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <div className="text-xs text-muted-foreground">Assignee</div>
                                    <div className="font-medium">
                                        {task.assignee.firstName} {task.assignee.lastName}
                                    </div>
                                </div>
                            </div>
                        )}
                        {task.dueDate && (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <div className="text-xs text-muted-foreground">Due Date</div>
                                    <div className="font-medium">
                                        {new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Current Approval Status */}
                    {task.clientApprovalStatus && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border- blue-200 dark:border-blue-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Current Status:</span>
                                <Badge variant="outline">
                                    {task.clientApprovalStatus.replace('_', ' ')}
                                </Badge>
                            </div>
                            {task.clientFeedback && (
                                <p className="text-sm text-muted-foreground mt-2 ml-6">
                                    "{task.clientFeedback}"
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Approval Actions */}
                <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">
                        What would you like to do?
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Button
                            onClick={handleQuickApprove}
                            disabled={submitting}
                            className="flex flex-col items-center gap-2 py-6 bg-green-500 hover:bg-green-600 text-white"
                        >
                            <CheckCircle2 className="h-6 w-6" />
                            <div>
                                <div className="font-semibold">Approve</div>
                                <div className="text-xs opacity-90">Task completed well</div>
                            </div>
                        </Button>

                        <Button
                            onClick={() => handleApprovalDecision('CHANGES_REQUESTED')}
                            disabled={submitting}
                            variant="secondary"
                            className="flex flex-col items-center gap-2 py-6"
                        >
                            <MessageSquare className="h-6 w-6" />
                            <div>
                                <div className="font-semibold">Request Changes</div>
                                <div className="text-xs opacity-75">Needs modifications</div>
                            </div>
                        </Button>

                        <Button
                            onClick={() => handleApprovalDecision('REJECTED')}
                            disabled={submitting}
                            variant="danger"
                            className="flex flex-col items-center gap-2 py-6"
                        >
                            <XCircle className="h-6 w-6" />
                            <div>
                                <div className="font-semibold">Reject</div>
                                <div className="text-xs opacity-90">Does not meet requirements</div>
                            </div>
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        Your decision will notify the project team immediately
                    </p>
                </div>

                {onClose && (
                    <div className="pt-4 border-t">
                        <Button onClick={onClose} variant="outline" className="w-full">
                            Cancel
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
