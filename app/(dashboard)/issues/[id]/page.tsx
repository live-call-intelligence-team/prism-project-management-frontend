'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { issuesApi, Issue, IssueComment } from '@/lib/api/endpoints/issues';
import Container from '@/components/ui/Container';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import IssueComments from '@/components/issues/IssueComments';
import IssueAttachments from '@/components/issues/IssueAttachments';
import { ArrowLeft, Calendar, User, Tag, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/authStore';

export default function IssueDetailPage() {
    const { id } = useParams();
    const [issue, setIssue] = useState<Issue | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIssue = async () => {
            try {
                const data = await issuesApi.getById(id as string);
                setIssue(data);
            } catch (error) {
                console.error('Failed to load issue:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchIssue();
        }
    }, [id]);

    if (loading) {
        return (
            <Container>
                <LoadingSkeleton count={1} className="h-8 w-1/3 mb-4" />
                <LoadingSkeleton count={3} className="h-32 mb-4" />
            </Container>
        );
    }

    if (!issue) {
        return (
            <Container>
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Issue not found</h2>
                    <Link href="/issues" className="text-primary-600 hover:underline mt-2 inline-block">
                        Back to Issues
                    </Link>
                </div>
            </Container>
        );
    }

    return (
        <Container size="full">
            <div className="mb-6">
                <Link href="/issues" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Issues
                </Link>

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-mono text-gray-500">{issue.key}</span>
                            <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-bold uppercase",
                                issue.status === 'DONE' ? 'bg-green-100 text-green-800' :
                                    issue.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            )}>
                                {issue.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                            {issue.title}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description</h3>
                        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                            {issue.description ? (
                                <p className="whitespace-pre-wrap">{issue.description}</p>
                            ) : (
                                <p className="italic text-gray-400">No description provided.</p>
                            )}
                        </div>
                    </div>

                    {/* Comments */}
                    <IssueComments
                        issueId={issue.id}
                        initialComments={(issue as any).comments || []}
                    />
                </div>

                {/* Sidebar Details */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Attachments */}
                    <IssueAttachments
                        issueId={issue.id}
                        initialAttachments={(issue as any).attachments || []}
                    />

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                            Details
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-medium">Assignee</label>
                                <div className="flex items-center mt-1 gap-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                        {(issue as any).assignee?.firstName?.[0] || 'Un'}
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {(issue as any).assignee?.firstName ? `${(issue as any).assignee.firstName} ${(issue as any).assignee.lastName}` : 'Unassigned'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-medium">Reporter</label>
                                <div className="flex items-center mt-1 gap-2">
                                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600">
                                        {(issue as any).reporter?.firstName?.[0] || 'Un'}
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {(issue as any).reporter?.firstName} {(issue as any).reporter?.lastName}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-medium">Priority</label>
                                    <div className="flex items-center mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                        <Tag className="w-3 h-3 mr-1.5 text-gray-400" />
                                        {issue.priority}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-medium">Type</label>
                                    <div className="flex items-center mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                        <Tag className="w-3 h-3 mr-1.5 text-gray-400" />
                                        {issue.type}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-medium">Sprint</label>
                                <div className="flex items-center mt-1 text-sm text-gray-900 dark:text-white">
                                    <Clock className="w-3 h-3 mr-1.5 text-gray-400" />
                                    {(issue as any).sprint?.name || 'Backlog'}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-medium">Due Date</label>
                                <div className="flex items-center mt-1 text-sm text-gray-900 dark:text-white">
                                    <Calendar className="w-3 h-3 mr-1.5 text-gray-400" />
                                    {issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : 'None'}
                                </div>
                            </div>

                            {/* Project */}
                            {(issue as any).project && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-medium">Project</label>
                                    <div className="flex items-center mt-1 text-sm text-gray-900 dark:text-white">
                                        <Link href={`/projects/${(issue as any).project.id}`} className="text-primary-600 hover:underline">
                                            {(issue as any).project.name}
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Story Points */}
                            {issue.storyPoints && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-medium">Story Points</label>
                                    <div className="flex items-center mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                        {issue.storyPoints} pts
                                    </div>
                                </div>
                            )}

                            {/* Client Approval Status */}
                            {issue.clientApprovalStatus && (
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <label className="text-xs text-gray-500 uppercase font-medium">Client Approval</label>
                                    <div className={cn(
                                        "inline-flex items-center mt-1 px-2 py-1 rounded-full text-xs font-medium",
                                        issue.clientApprovalStatus === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                            issue.clientApprovalStatus === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                issue.clientApprovalStatus === 'CHANGES_REQUESTED' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    )}>
                                        {issue.clientApprovalStatus.replace('_', ' ')}
                                    </div>
                                    {issue.clientFeedback && (
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                                            "{issue.clientFeedback}"
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    );
}
