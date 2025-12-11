'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { issuesApi } from '@/lib/api/issues';
import { Issue } from '@/types';
import { CommentSection } from '@/components/comments/CommentSection';
import { CreateSubtaskModal } from '@/components/issues/CreateSubtaskModal';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { Badge } from '@/components/ui/Badge';
import {
    Calendar,
    Paperclip,
    CheckSquare,
    AlignLeft,
    User as UserIcon,
    AlertCircle,
    Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface IssueDetailModalProps {
    issueId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

export function IssueDetailModal({ issueId, isOpen, onClose, onUpdate }: IssueDetailModalProps) {
    const [issue, setIssue] = useState<Issue | null>(null);
    const [loading, setLoading] = useState(false);
    const [isCreateSubtaskOpen, setIsCreateSubtaskOpen] = useState(false);

    useEffect(() => {
        if (issueId && isOpen) {
            fetchIssueDetails(issueId);
        } else {
            setIssue(null);
        }
    }, [issueId, isOpen]);

    const fetchIssueDetails = async (id: string) => {
        try {
            setLoading(true);
            const data = await issuesApi.getById(id);
            setIssue(data);
        } catch (error) {
            console.error('Failed to fetch issue details:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'CRITICAL': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'HIGH': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'LOW': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DONE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'IN_REVIEW': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'TODO': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            title={issue ? `${issue.key}: ${issue.title}` : 'Issue Details'}
        >
            {loading ? (
                <div className="space-y-4">
                    <LoadingSkeleton className="h-8 w-3/4" />
                    <LoadingSkeleton className="h-32 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                        <LoadingSkeleton className="h-20" />
                        <LoadingSkeleton className="h-20" />
                    </div>
                </div>
            ) : issue ? (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main Content */}
                    <div className="flex-1 space-y-6">
                        {/* Status & Priority Badges */}
                        <div className="flex flex-wrap gap-2">
                            {issue.status && (
                                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase", getStatusColor(issue.status))}>
                                    {issue.status.replace('_', ' ')}
                                </span>
                            )}
                            {issue.priority && (
                                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase", getPriorityColor(issue.priority))}>
                                    {issue.priority}
                                </span>
                            )}
                            {issue.type && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 uppercase">
                                    {issue.type}
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <AlignLeft className="w-5 h-5 text-gray-500" />
                                <h3 className="font-semibold text-gray-900 dark:text-white">Description</h3>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {issue.description || 'No description provided.'}
                            </div>
                        </div>

                        {/* Hierarchy: Parent */}
                        {issue.parent && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-1">Parent Issue</h4>
                                <div
                                    className="flex items-center gap-2 cursor-pointer hover:underline"
                                    onClick={() => fetchIssueDetails(issue.parentId!)}
                                >
                                    <span className="font-medium text-blue-800 dark:text-blue-300">
                                        {issue.parent.key}: {issue.parent.title}
                                    </span>
                                </div>
                            </div>
                        )}
                        {issue.epic && !issue.parent && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
                                <h4 className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase mb-1">Epic</h4>
                                <div
                                    className="flex items-center gap-2"
                                >
                                    <span className="font-medium text-purple-800 dark:text-purple-300">
                                        {issue.epic.key}: {issue.epic.name}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Hierarchy: Children (Stories or Subtasks) */}
                        {(issue.type === 'EPIC' || issue.type === 'STORY') && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <CheckSquare className="w-5 h-5 text-gray-500" />
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {issue.type === 'EPIC' ? 'Stories' : 'Sub-tasks'}
                                        </h3>
                                    </div>
                                    {issue.type === 'STORY' && (
                                        <button
                                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                            onClick={() => setIsCreateSubtaskOpen(true)}
                                        >
                                            + Create Sub-task
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {(issue.childIssues || issue.subtasks || []).map(child => (
                                        <div
                                            key={child.id}
                                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-300"
                                            onClick={() => fetchIssueDetails(child.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={cn("w-2 h-2 rounded-full", child.status === 'DONE' ? 'bg-green-500' : 'bg-gray-300')}></span>
                                                <span className={cn("text-sm", child.status === 'DONE' && 'line-through text-gray-500')}>
                                                    <span className="font-mono text-xs text-gray-400 mr-2">{child.key}</span>
                                                    {child.title}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500">{child.status}</span>
                                        </div>
                                    ))}
                                    {(issue.childIssues || issue.subtasks || []).length === 0 && (
                                        <p className="text-sm text-gray-400 italic">No {issue.type === 'EPIC' ? 'stories' : 'sub-tasks'} yet.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Attachments */}
                        {issue.attachments && issue.attachments.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Paperclip className="w-5 h-5 text-gray-500" />
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Attachments</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {issue.attachments.map(att => (
                                        <a
                                            key={att.id}
                                            href={att.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 max-w-xs truncate"
                                        >
                                            <Paperclip className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm truncate">{att.originalName}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Activity / Comments */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Activity</h3>
                            </div>
                            <CommentSection issueId={issue.id} projectId={issue.projectId} />
                        </div>
                    </div>

                    {/* Sidebar Details */}
                    <div className="w-full lg:w-72 space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Assignee</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                                        {issue.assignee?.firstName?.[0] || 'U'}
                                    </div>
                                    <span className="text-sm font-medium">
                                        {issue.assignee ? `${issue.assignee.firstName} ${issue.assignee.lastName}` : 'Unassigned'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Reporter</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700">
                                        {issue.reporterId ? 'R' : 'S'}
                                    </div>
                                    <span className="text-sm font-medium">
                                        {issue.reporterId ? 'Reporter' : 'System'}
                                        {/* Ideally fetch reporter name if available in Issue object */}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                <label className="text-xs font-medium text-gray-500 uppercase">Start Date</label>
                                <div className="flex items-center gap-2 mt-1 text-sm">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>{issue.sprint?.startDate ? new Date(issue.sprint.startDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Due Date</label>
                                <div className="flex items-center gap-2 mt-1 text-sm">
                                    <Flag className="w-4 h-4 text-gray-400" />
                                    <span>{issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : 'No due date'}</span>
                                </div>
                            </div>

                            {issue.storyPoints !== undefined && (
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">Story Points</label>
                                    <div className="mt-1 text-sm font-medium">{issue.storyPoints}</div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Project</label>
                                <div className="mt-1 text-sm">
                                    {issue.project ? (
                                        <Link href={`/client/projects/${issue.projectId}`} className="text-primary-600 hover:underline">
                                            {issue.project.name}
                                        </Link>
                                    ) : (
                                        <span className="text-gray-500">N/A</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">Issue not found</div>
            )}

            {issue && issue.type === 'STORY' && (
                <CreateSubtaskModal
                    isOpen={isCreateSubtaskOpen}
                    onClose={() => setIsCreateSubtaskOpen(false)}
                    onSuccess={() => {
                        fetchIssueDetails(issue.id);
                        if (onUpdate) onUpdate();
                    }}
                    parentStoryId={issue.id}
                    parentStoryTitle={issue.title}
                />
            )}
        </Modal>
    );
}
