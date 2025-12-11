'use client';

import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import { issuesApi } from '@/lib/api/endpoints/issues';
import { Issue } from '@/lib/api/endpoints/issues';
import { CommentSection } from '@/components/comments/CommentSection';
import { ActivityStream } from '@/components/issues/ActivityStream';
import { CreateSubtaskModal } from '@/components/issues/CreateSubtaskModal';
import { LinkIssueModal } from '@/components/issues/LinkIssueModal';
import { LogTimeModal } from '@/components/issues/LogTimeModal';
import { IssueLinks } from '@/components/issues/IssueLinks';
import { format, isPast, isToday, addDays, parseISO } from 'date-fns';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import {
    Calendar,
    Paperclip,
    CheckSquare,
    MessageSquare,
    Activity,
    Clock,
    Flag,
    AlignLeft,
    ChevronRight,
    Layers,
    Tag,
    Share2,
    Eye,
    Book,
    Bug,
    Zap,
    UserPlus,
    Pencil,
    X,
    Save,
    ArrowUpRight,
    ArrowLeft,
    Download,
    Trash2,
    ImageIcon,
    FileText
} from 'lucide-react';



import { cn } from '@/lib/utils';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface EmployeeIssueDetailModalProps {
    issueId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

const IssueTypeIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'STORY':
            return <Book className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />;
        case 'BUG':
            return <Bug className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />;
        case 'TASK':
            return <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />;
        case 'SUBTASK':
            return <Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-500" />;
        default:
            return <CheckSquare className="w-3.5 h-3.5 text-gray-500" />;
    }
};

export function EmployeeIssueDetailModal({ issueId, isOpen, onClose, onUpdate }: EmployeeIssueDetailModalProps) {
    const [issue, setIssue] = useState<Issue | null>(null);
    const [loading, setLoading] = useState(false);
    const [isCreateSubtaskOpen, setIsCreateSubtaskOpen] = useState(false);
    const [isLinkIssueOpen, setIsLinkIssueOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'worklog'>('comments');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [descriptionText, setDescriptionText] = useState('');
    const [isLogTimeOpen, setIsLogTimeOpen] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            setDescriptionText(data.description || '');
        } catch (error) {
            console.error('Failed to fetch issue details:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: any = {
            'DONE': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'IN_PROGRESS': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'IN_REVIEW': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            'TODO': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
        };
        return (
            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase", colors[status] || colors['TODO'])}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    const PriorityBadge = ({ priority }: { priority: string }) => {
        const colors: any = {
            'CRITICAL': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200',
            'HIGH': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200',
            'MEDIUM': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200',
            'LOW': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200',
            'LOWEST': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200',
        };
        // Simplified icons logic (using Flag/Signal/etc if available, or just colors)
        return (
            <span className={cn("px-2 py-0.5 rounded border text-[10px] font-bold uppercase flex items-center gap-1", colors[priority] || colors['LOW'])}>
                <Flag className="w-3 h-3 fill-current" />
                {priority}
            </span>
        );
    };

    const handleToggleSubtask = async (subtaskId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
            await issuesApi.updateStatus(subtaskId, newStatus);
            // Refresh parent issue to reflect changes
            if (issueId) fetchIssueDetails(issueId);
        } catch (error) {
            console.error('Failed to toggle subtask status', error);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !issue) return;

        try {
            await issuesApi.uploadAttachment(issue.id, file);
            // Refresh details
            fetchIssueDetails(issue.id);
        } catch (error) {
            console.error('Failed to upload attachment', error);
        } finally {
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleUnlink = async (linkId: string) => {
        if (!issue) return;
        try {
            await issuesApi.removeLink(issue.id, linkId);
            fetchIssueDetails(issue.id);
        } catch (error) {
            console.error('Failed to unlink issue', error);
        }
    };

    // Tabs content
    const renderTabContent = () => {
        if (!issue) return null;
        switch (activeTab) {
            case 'comments':
                return <CommentSection issueId={issue.id} projectId={issue.projectId} />;
            case 'activity':
                return (
                    <div className="h-full pr-2">
                        <ActivityStream issueId={issue.id} />
                    </div>
                );
            case 'worklog':
                return (
                    <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Total Time Logged</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">3h 45m</p>
                            </div>
                            <Button size="sm" variant="outline">+ Log Work</Button>
                        </div>
                        <div className="text-center py-6 text-gray-400">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Work logs list coming soon...</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl" // Wider 
        // Custom header within content
        >
            {loading ? (
                <div className="space-y-4 p-4">
                    <LoadingSkeleton className="h-8 w-3/4" />
                    <LoadingSkeleton className="h-96 w-full" />
                </div>
            ) : issue ? (
                <div className="flex flex-col h-[80vh] overflow-hidden -m-6"> {/* Full height style */}

                    {/* Header Section */}
                    {/* Added relative here for absolute positioning of badge */}
                    <div className="relative px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-start pt-10">
                        {/* Back Button (New) */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 left-6 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                            <ArrowLeft className="w-3 h-3" /> Back to Board
                        </button>

                        {issue.epic && (
                            <div
                                className="absolute top-0 left-0 right-0 h-6 flex items-center justify-between px-6 text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity z-10"
                                style={{ backgroundColor: issue.epic.color || '#a855f7' }}
                                onClick={() => console.log('Navigate to Epic', issue.epic?.id)}
                                title={`View Epic: ${issue.epic.name}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Layers className="w-3 h-3 text-white/90" />
                                    {issue.epic.name}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 pt-6">
                            {/* Parent/Feature Link (Critical) */}
                            <div className="flex items-center gap-2 mb-3 text-sm">
                                <span className="text-gray-500 font-medium">Part of:</span>
                                {issue.feature ? (
                                    <div
                                        className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 hover:underline cursor-pointer font-medium bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded border border-primary-100 dark:border-primary-800 transition-colors"
                                        title={`View Feature: ${issue.feature.name}`}
                                    >
                                        <Layers className="w-3.5 h-3.5" />
                                        <span>{issue.feature.name}</span>
                                        <span className="text-primary-400 dark:text-primary-500 text-xs">({issue.feature.key})</span>
                                    </div>
                                ) : issue.parent ? (
                                    <button
                                        className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 hover:underline cursor-pointer font-medium bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded border border-primary-100 dark:border-primary-800 transition-colors"
                                        onClick={() => fetchIssueDetails(issue.parent!.id)}
                                        title={`View Parent: ${issue.parent.title}`}
                                    >
                                        <CheckSquare className="w-3.5 h-3.5" />
                                        <span>{issue.parent.title}</span>
                                        <span className="text-primary-400 dark:text-primary-500 text-xs">({issue.parent.key})</span>
                                    </button>
                                ) : (
                                    <span className="text-gray-400 italic flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded text-xs border border-gray-100 dark:border-gray-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                        Standalone Issue
                                    </span>
                                )}
                            </div>

                            {/* Breadcrumb / ID Line */}
                            <div className="flex items-center text-xs text-gray-500 mb-1 font-mono gap-1.5">
                                <IssueTypeIcon type={issue.type} />
                                <span className="text-gray-600 dark:text-gray-400 font-semibold">{issue.key}</span>
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                {issue.title}
                            </h2>
                        </div>

                        <div className="flex items-center gap-2 ml-4 mt-2">
                            {/* Status Dropdown */}
                            <StatusBadge status={issue.status} />
                            {/* Actions Menu */}
                            <div className="relative">
                                <button
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 transition-colors"
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                >
                                    <div className="flex gap-0.5 rotate-90">
                                        <span className="w-1 h-1 bg-current rounded-full" />
                                        <span className="w-1 h-1 bg-current rounded-full" />
                                        <span className="w-1 h-1 bg-current rounded-full" />
                                    </div>
                                </button>

                                {isMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1 text-sm">
                                            <button
                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(issue.key);
                                                    setIsMenuOpen(false);
                                                }}
                                            >
                                                Copy Issue Key
                                            </button>
                                            <button
                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                                onClick={() => {
                                                    console.log('Clone Issue');
                                                    setIsMenuOpen(false);
                                                }}
                                            >
                                                Clone Issue
                                            </button>
                                            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                                            <button
                                                className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to delete this issue?')) {
                                                        console.log('Delete issue', issue.id);
                                                        // Call delete API here
                                                    }
                                                    setIsMenuOpen(false);
                                                }}
                                            >
                                                Delete Issue
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-6 md:flex gap-6 bg-gray-50/30 dark:bg-gray-900/10">
                        {/* LEFT COLUMN: Description, Attachments, Subtasks */}
                        <div className="flex-1 space-y-6">

                            {/* Description */}
                            <section>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        <AlignLeft className="w-4 h-4" /> Description
                                    </div>
                                    {!isEditingDescription && (
                                        <button
                                            onClick={() => setIsEditingDescription(true)}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-primary-600 transition-colors"
                                            title="Edit Description"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {isEditingDescription ? (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <textarea
                                            value={descriptionText}
                                            onChange={(e) => setDescriptionText(e.target.value)}
                                            className="w-full h-40 p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-y focus:outline-none text-sm"
                                            placeholder="Add a more detailed description..."
                                        />
                                        <div className="flex justify-end gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setIsEditingDescription(false);
                                                    setDescriptionText(issue.description || '');
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={async () => {
                                                    try {
                                                        const updated = await issuesApi.update(issue.id, { description: descriptionText });
                                                        setIssue(updated);
                                                        setIsEditingDescription(false);
                                                        onUpdate?.();
                                                    } catch (e) {
                                                        console.error('Failed to save description', e);
                                                    }
                                                }}
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm whitespace-pre-wrap cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors group"
                                        onClick={() => setIsEditingDescription(true)}
                                    >
                                        {issue.description ? (
                                            <div dangerouslySetInnerHTML={{ __html: issue.description }} />
                                        ) : (
                                            <span className="text-gray-400 italic flex items-center gap-1 group-hover:text-gray-500">
                                                Click to add more details...
                                            </span>
                                        )}
                                    </div>
                                )}
                            </section>

                            {/* Attachments (Enhanced) */}
                            <section>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        <Paperclip className="w-4 h-4" /> Attachments
                                    </div>
                                    <button
                                        className="text-xs text-primary-600 hover:underline"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        + Add
                                    </button>
                                </div>

                                {issue.attachments && issue.attachments.length > 0 ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                        {issue.attachments.map(att => {
                                            const isImage = att.mimetype.startsWith('image/');
                                            return (
                                                <div key={att.id} className="group relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                                                    {/* Preview */}
                                                    <div className="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                                                        {isImage ? (
                                                            <img src={att.fileUrl} alt={att.originalName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <FileText className="w-8 h-8 text-gray-400" />
                                                        )}
                                                    </div>
                                                    {/* Info */}
                                                    <div className="p-2">
                                                        <div className="text-xs font-medium truncate mb-1" title={att.originalName}>{att.originalName}</div>
                                                        <div className="text-[10px] text-gray-400 flex justify-between">
                                                            <span>{(att.size / 1024).toFixed(1)} KB</span>
                                                            {/* Actions */}
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <a href={att.fileUrl} download className="hover:text-primary-600"><Download className="w-3 h-3" /></a>
                                                                <button onClick={() => console.log('Delete attachment', att.id)} className="hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg text-center text-xs text-gray-500 border border-dashed border-gray-300 dark:border-gray-700">
                                        No attachments. Drag & drop or click + Add.
                                    </div>
                                )}
                            </section>

                            {/* Subtasks */}
                            <section>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        <CheckSquare className="w-4 h-4" />
                                        Sub-tasks {issue.subtasks?.length ? `(${issue.subtasks.length})` : ''}
                                    </div>
                                    <button
                                        onClick={() => setIsCreateSubtaskOpen(true)}
                                        className="text-xs text-primary-600 hover:underline font-medium"
                                    >
                                        + Create subtask
                                    </button>
                                </div>

                                {/* Progress Stats */}
                                {(() => {
                                    const subtasks = issue.subtasks || [];
                                    const total = subtasks.length;
                                    const done = subtasks.filter(st => st.status === 'DONE').length;
                                    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

                                    return (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Progress: {done}/{total} completed ({percent}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-green-500 h-full rounded-full transition-all duration-300"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Subtask List */}
                                <div className="space-y-2">
                                    {issue.subtasks && issue.subtasks.map(st => (
                                        <div
                                            key={st.id}
                                            className="group p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all shadow-sm cursor-pointer"
                                            onClick={() => fetchIssueDetails(st.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Checkbox */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleSubtask(st.id, st.status);
                                                    }}
                                                    className={cn(
                                                        "mt-0.5 w-5 h-5 flex-shrink-0 rounded border flex items-center justify-center transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-primary-500",
                                                        st.status === 'DONE'
                                                            ? "bg-green-500 border-green-500 text-white"
                                                            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-primary-400"
                                                    )}
                                                    title={st.status === 'DONE' ? "Mark as Todo" : "Mark as Done"}
                                                >
                                                    {st.status === 'DONE' && <CheckSquare className="w-3.5 h-3.5" />}
                                                </button>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    {/* Top Row: Key, Title, Status */}
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className={cn(
                                                            "text-sm font-medium truncate mr-2",
                                                            st.status === 'DONE' ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"
                                                        )}>
                                                            <span className="text-gray-500 font-mono text-xs mr-1">{st.key}:</span>
                                                            {st.title}
                                                        </span>
                                                        <StatusBadge status={st.status} />
                                                    </div>

                                                    {/* Bottom Row: Assignee, PTS, Open Button */}
                                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                                        <div className="flex items-center gap-3">
                                                            {st.assignee ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-4 h-4 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold">
                                                                        {st.assignee.firstName[0]}
                                                                    </div>
                                                                    <span>{st.assignee.firstName} {st.assignee.lastName}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="italic text-gray-400">Unassigned</span>
                                                            )}

                                                            {st.storyPoints !== undefined && (
                                                                <>
                                                                    <span className="text-gray-300">•</span>
                                                                    <span>{st.storyPoints} pts</span>
                                                                </>
                                                            )}
                                                        </div>

                                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                                            Open <ArrowUpRight className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {(!issue.subtasks || issue.subtasks.length === 0) && (
                                        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                            <p className="text-xs text-gray-500 mb-1">No subtasks yet.</p>
                                            <button
                                                onClick={() => setIsCreateSubtaskOpen(true)}
                                                className="text-sm text-primary-600 font-medium hover:underline"
                                            >
                                                Create one now
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Linked Issues Section */}
                            <section>
                                <IssueLinks
                                    links={issue.links || []}
                                    onAddLink={() => setIsLinkIssueOpen(true)}
                                    onUnlink={handleUnlink}
                                />
                            </section>

                        </div>

                        {/* RIGHT COLUMN: Meta, Tabs */}
                        <div className="w-full md:w-80 space-y-6">

                            {/* Status Workflow (New) */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <label className="text-xs text-gray-500 uppercase font-semibold block mb-3">Current Status</label>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex flex-col">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">{issue.status.replace('_', ' ')}</span>
                                        <span className="text-[10px] text-gray-400">Step {
                                            issue.status === 'TODO' ? '1/4' :
                                                issue.status === 'IN_PROGRESS' ? '2/4' :
                                                    issue.status === 'IN_REVIEW' ? '3/4' : '4/4'
                                        } of workflow</span>
                                    </div>
                                    <StatusBadge status={issue.status} />
                                </div>

                                <div className="space-y-2">
                                    {(() => {
                                        const transitions: Record<string, { label: string, next: string, color: string }[]> = {
                                            'TODO': [
                                                { label: 'Start Progress', next: 'IN_PROGRESS', color: 'bg-blue-600 hover:bg-blue-700 text-white' }
                                            ],
                                            'IN_PROGRESS': [
                                                { label: 'Submit for Review', next: 'IN_REVIEW', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
                                                { label: 'Stop Progress', next: 'TODO', color: 'bg-gray-100 hover:bg-gray-200 text-gray-700' }
                                            ],
                                            'IN_REVIEW': [
                                                { label: 'Move to Done', next: 'DONE', color: 'bg-green-600 hover:bg-green-700 text-white' },
                                                { label: 'Back to Progress', next: 'IN_PROGRESS', color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700' }
                                            ],
                                            'DONE': [
                                                { label: 'Reopen Issue', next: 'IN_PROGRESS', color: 'bg-gray-100 hover:bg-gray-200 text-gray-700' }
                                            ]
                                        };

                                        // Fallback for others
                                        const options = transitions[issue.status] || [];

                                        if (options.length === 0) return <div className="text-xs text-gray-400 italic text-center">No transitions available</div>;

                                        return options.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                className={cn("w-full py-2 px-3 rounded text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2", opt.color)}
                                                onClick={async () => {
                                                    try {
                                                        const updated = await issuesApi.updateStatus(issue.id, opt.next);
                                                        setIssue(updated);
                                                        onUpdate?.();
                                                    } catch (e) {
                                                        console.error('Failed to update status', e);
                                                    }
                                                }}
                                            >
                                                <span>{opt.label}</span>
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Meta Group: Hierarchy (New) */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3 text-sm">
                                <label className="text-xs text-gray-500 uppercase font-semibold">Hierarchy</label>

                                {issue.epic ? (
                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-400">Epic</span>
                                        <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-100 dark:border-purple-800">
                                            <div className="w-1 h-8 rounded-full bg-purple-500" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-purple-900 dark:text-purple-100 truncate">{issue.epic.name}</div>
                                                <div className="text-[10px] text-purple-600 dark:text-purple-400 flex justify-between">
                                                    <span>{issue.epic.key}</span>
                                                    <a href="#" className="hover:underline">View Epic →</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : <div className="text-xs text-gray-400 italic">No Epic assigned</div>}

                                {issue.feature ? (
                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-400">Feature</span>
                                        <div className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-100 dark:border-indigo-800">
                                            <Layers className="w-4 h-4 text-indigo-500" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-indigo-900 dark:text-indigo-100 truncate">{issue.feature.name}</div>
                                                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 flex justify-between">
                                                    <span>{issue.feature.key}</span>
                                                    <a href="#" className="hover:underline">View Feature →</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Meta Group 1: People */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4 text-sm">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Assignee</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                                            {issue.assignee?.firstName?.[0] || 'U'}
                                        </div>
                                        <span>{issue.assignee ? `${issue.assignee.firstName} ${issue.assignee.lastName}` : 'Unassigned'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Reporter</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        {/* Mock Reporter if missing in object, or ensure backend sends it. Using reporterId logic if available or generic */}
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {issue.assignee?.firstName?.[0] || 'R'}
                                        </div>
                                        <span>{issue.assignee ? `${issue.assignee.firstName} ${issue.assignee.lastName}` : 'Reporter'}</span>
                                    </div>
                                </div>
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs text-gray-500 uppercase font-semibold">Watchers</label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-1">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 border-2 border-white dark:border-gray-800" />
                                                <div className="w-5 h-5 rounded-full bg-green-100 border-2 border-white dark:border-gray-800" />
                                            </div>
                                            <button className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Meta Group 2: Context */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4 text-sm">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Details</label>
                                    <div className="grid grid-cols-2 gap-y-3 mt-2">
                                        <div className="text-gray-500 text-xs self-center">Priority</div>
                                        <div className="text-right flex justify-end">
                                            <PriorityBadge priority={issue.priority} />
                                        </div>

                                        <div className="text-gray-500 text-xs self-center">Story Points</div>
                                        <div className="text-right font-medium">{issue.storyPoints ?? '-'}</div>

                                        <div className="text-gray-500 text-xs self-center">Due Date</div>
                                        <div className="text-right">
                                            <input
                                                type="date"
                                                className="text-xs text-right bg-transparent border-none focus:ring-0 p-0 text-gray-700 dark:text-gray-200 cursor-pointer"
                                                value={issue.dueDate ? format(new Date(issue.dueDate), 'yyyy-MM-dd') : ''}
                                                onChange={async (e) => {
                                                    try {
                                                        const date = e.target.value; // YYYY-MM-DD
                                                        const updated = await issuesApi.update(issue.id, { dueDate: date });
                                                        setIssue(updated);
                                                        onUpdate?.();
                                                    } catch (err) {
                                                        console.error('Failed to update due date', err);
                                                    }
                                                }}
                                            />
                                            {issue.dueDate && (() => {
                                                const date = new Date(issue.dueDate);
                                                const overdue = isPast(date) && !isToday(date);
                                                const near = !overdue && date <= addDays(new Date(), 2);

                                                if (overdue) return <div className="text-[10px] text-red-600 font-bold">⚠️ Overdue</div>;
                                                if (near) return <div className="text-[10px] text-orange-600 font-bold">Due soon</div>;
                                                return null;
                                            })()}
                                        </div>

                                        {/* Fix Version (New) */}
                                        <div className="text-gray-500 text-xs self-center">Fix Version</div>
                                        <div className="text-right">
                                            <input
                                                type="text"
                                                className="text-xs text-right bg-transparent border-none focus:ring-0 p-0 text-gray-700 dark:text-gray-200 placeholder-gray-300 w-24"
                                                placeholder="v1.0.0"
                                                value={issue.fixVersion || ''}
                                                onChange={(e) => {
                                                    setIssue({ ...issue, fixVersion: e.target.value });
                                                }}
                                                onBlur={async () => {
                                                    try {
                                                        // Save on blur
                                                        // Note: We might want to track 'original' value to avoid no-op saves, 
                                                        // but for now we ensure the input works.
                                                        const updated = await issuesApi.update(issue.id, { fixVersion: issue.fixVersion });
                                                        setIssue(updated);
                                                    } catch (err) {
                                                        console.error('Failed to update fix version', err);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Labels Section */}
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                                    <label className="text-xs text-gray-500 uppercase font-semibold block mb-2">Labels</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {issue.labels?.map((label) => (
                                            <span key={label} className="inline-flex items-center px-2 py-0.5 rounded textxs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                                {label}
                                                <button
                                                    onClick={async () => {
                                                        const newLabels = issue.labels?.filter(l => l !== label);
                                                        const updated = await issuesApi.update(issue.id, { labels: newLabels });
                                                        setIssue(updated);
                                                    }}
                                                    className="ml-1 text-gray-400 hover:text-gray-600"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                className="text-xs border-none bg-transparent focus:ring-0 p-0 w-20 placeholder-gray-400"
                                                placeholder="+ Add label"
                                                value={newLabel}
                                                onChange={(e) => setNewLabel(e.target.value)}
                                                onKeyDown={async (e) => {
                                                    if (e.key === 'Enter' && newLabel.trim()) {
                                                        e.preventDefault();
                                                        const current = issue.labels || [];
                                                        if (!current.includes(newLabel.trim())) {
                                                            const updated = await issuesApi.update(issue.id, { labels: [...current, newLabel.trim()] });
                                                            setIssue(updated);
                                                        }
                                                        setNewLabel('');
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {issue.sprint && (
                                    <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                                        <label className="text-xs text-gray-500 uppercase font-semibold">Sprint</label>
                                        <div className="flex items-center justify-between mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                                            <span className="font-medium text-blue-700 dark:text-blue-300">{issue.sprint.name}</span>
                                            <span className="text-[10px] uppercase font-bold text-blue-600 bg-white dark:bg-blue-900 px-1.5 py-0.5 rounded">Active</span>
                                        </div>
                                    </div>
                                )}

                                {/* Created/Updated Metadata (New) */}
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 text-[10px] text-gray-400 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Created</span>
                                        <span>{issue.createdAt ? format(new Date(issue.createdAt), 'MMM d, yyyy') : '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Updated</span>
                                        <span>{issue.updatedAt ? format(new Date(issue.updatedAt), 'MMM d, yyyy HH:mm') : '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Meta Group 3: Time Tracking (Enhanced) */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3 text-sm">
                                <label className="text-xs text-gray-500 uppercase font-semibold flex items-center justify-between">
                                    Time Tracking
                                    <Clock className="w-3 h-3" />
                                </label>
                                {(() => {
                                    const estimated = issue.estimatedHours || 0;
                                    const actual = issue.actualHours || 0;
                                    const percent = estimated > 0 ? Math.min((actual / estimated) * 100, 100) : 0;
                                    return (
                                        <div className="space-y-2">
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden relative">
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-500", percent > 100 ? "bg-red-500" : "bg-blue-500")}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[11px] text-gray-500 font-mono">
                                                <span>{actual}h logged</span>
                                                <span>{estimated > 0 ? `${estimated}h estimate` : 'No estimate'}</span>
                                            </div>

                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={() => setIsLogTimeOpen(true)}
                                                    className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors"
                                                >
                                                    Log Time
                                                </button>
                                                {/* Start Timer placeholder - functional in future */}
                                                <button className="flex-1 py-1.5 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors">
                                                    Start Timer
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Tabs Container */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[400px]">
                                <div className="flex border-b border-gray-200 dark:border-gray-700">
                                    {(['comments', 'activity', 'worklog'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={cn(
                                                "flex-1 py-2 text-xs font-medium uppercase tracking-wider border-b-2 transition-colors",
                                                activeTab === tab
                                                    ? "border-primary-500 text-primary-600 bg-primary-50/50"
                                                    : "border-transparent text-gray-500 hover:bg-gray-50"
                                            )}
                                        >
                                            {tab === 'worklog' ? 'Work Log' : tab}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-4 flex-1 overflow-y-auto">
                                    {renderTabContent()}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-12 text-center text-gray-500">Issue not found</div>
            )
            }

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* Create Subtask Modal */}
            {issue && (
                <CreateSubtaskModal
                    isOpen={isCreateSubtaskOpen}
                    onClose={() => setIsCreateSubtaskOpen(false)}
                    parentStoryId={issue.id}
                    parentStoryTitle={issue.title}
                    onSuccess={() => {
                        fetchIssueDetails(issue.id);
                        onUpdate?.();
                    }}
                />
            )}

            {issue && (
                <LinkIssueModal
                    isOpen={isLinkIssueOpen}
                    onClose={() => setIsLinkIssueOpen(false)}
                    sourceIssueId={issue.id}
                    projectId={issue.projectId}
                    onSuccess={() => {
                        fetchIssueDetails(issue.id);
                        onUpdate?.();
                    }}
                />
            )}

            {issue && (
                <LogTimeModal
                    isOpen={isLogTimeOpen}
                    onClose={() => setIsLogTimeOpen(false)}
                    issueId={issue.id}
                    onSuccess={() => {
                        fetchIssueDetails(issue.id);
                        onUpdate?.();
                    }}
                />
            )}
        </Modal >
    );
}
