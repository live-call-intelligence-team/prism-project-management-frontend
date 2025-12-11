'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Issue, issuesApi } from '@/lib/api/endpoints/issues';
import { useAuthStore } from '@/lib/store/authStore';
import {
    Clock,
    User as UserIcon,
    Paperclip,
    MessageSquare,
    CheckCircle2,
    XCircle,
    Download,
    Send,
    Upload,
    Loader2,
    AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';

interface ClientIssueModalProps {
    issue: Issue;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: (updatedIssue: Issue) => void;
}

export function ClientIssueModal({ issue: initialIssue, isOpen, onClose, onUpdate }: ClientIssueModalProps) {
    const [issue, setIssue] = useState<Issue>(initialIssue);
    const [newComment, setNewComment] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');
    // Feedback state for rejection
    const [showFeedbackInput, setShowFeedbackInput] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    const { user } = useAuthStore();

    // Reset internal state when issue prop changes
    if (initialIssue.id !== issue.id) {
        setIssue(initialIssue);
    }

    const handleApproval = async (status: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED') => {
        if (status === 'CHANGES_REQUESTED' && !showFeedbackInput) {
            setShowFeedbackInput(true);
            return;
        }

        if (status === 'CHANGES_REQUESTED' && !feedback.trim()) {
            // Require feedback for changes requested
            return;
        }

        setSubmittingFeedback(true);
        try {
            // Note: If backend expects feedback in the body, pass it.
            // Assuming issuesApi.clientApproval handles this:
            // clientApproval(id, { status, feedback })
            const updatedIssue = await issuesApi.clientApproval(issue.id, {
                status,
                feedback: status === 'CHANGES_REQUESTED' ? feedback : undefined
            });

            setIssue(updatedIssue);
            setShowFeedbackInput(false);
            setFeedback('');
            if (onUpdate) onUpdate(updatedIssue);
        } catch (error) {
            console.error("Failed to update approval status", error);
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        setSendingComment(true);
        try {
            const comment = await issuesApi.addComment(issue.id, newComment);
            // Optimistically update comments list
            const updatedComments = [...(issue.comments || []), {
                ...comment,
                user: {
                    id: user?.id || '',
                    firstName: user?.firstName || 'Me',
                    lastName: user?.lastName || '',
                    email: user?.email || '',
                }
            }];

            const updatedIssue = { ...issue, comments: updatedComments };
            setIssue(updatedIssue);
            setNewComment('');
            if (onUpdate) onUpdate(updatedIssue);
        } catch (error) {
            console.error("Failed to post comment", error);
        } finally {
            setSendingComment(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const attachment = await issuesApi.uploadAttachment(issue.id, file);

            // Optimistically update attachments
            const updatedAttachments = [...(issue.attachments || []), attachment];
            const updatedIssue = { ...issue, attachments: updatedAttachments };
            setIssue(updatedIssue);
            if (onUpdate) onUpdate(updatedIssue);
        } catch (error) {
            console.error("Failed to upload file", error);
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const getApprovalBadge = (status: string | null | undefined) => {
        switch (status) {
            case 'APPROVED':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>;
            case 'CHANGES_REQUESTED':
                return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">Changes Requested</Badge>;
            case 'REJECTED':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">Rejected</Badge>;
            case 'PENDING':
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">Approval Pending</Badge>;
            default:
                return null;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={issue.key}>
            <div className="flex flex-col h-[80vh] md:h-[600px] w-full max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col gap-4 border-b pb-4 mb-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{issue.title}</h2>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">{issue.status.replace('_', ' ')}</Badge>
                                {getApprovalBadge(issue.clientApprovalStatus)}
                            </div>
                        </div>
                        {issue.clientApprovalStatus === 'PENDING' && !showFeedbackInput && (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-900 dark:hover:bg-amber-900/30"
                                    onClick={() => handleApproval('CHANGES_REQUESTED')}
                                >
                                    <XCircle className="w-4 h-4 mr-2" /> Request Changes
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleApproval('APPROVED')}
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Feedback Input Area */}
                    {showFeedbackInput && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-200 dark:border-amber-800 animate-in fade-in slide-in-from-top-2">
                            <h4 className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-500 mb-2">
                                <AlertTriangle className="h-4 w-4" />
                                Please describe the changes required
                            </h4>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                className="w-full text-sm p-3 border rounded-md focus:ring-2 focus:ring-amber-500 mb-2 dark:bg-gray-800 dark:border-gray-700"
                                rows={3}
                                placeholder="E.g., The color scheme needs to match our brand guidelines..."
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setShowFeedbackInput(false);
                                        setFeedback('');
                                    }}
                                    disabled={submittingFeedback}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                    onClick={() => handleApproval('CHANGES_REQUESTED')}
                                    isLoading={submittingFeedback}
                                    disabled={!feedback.trim()}
                                >
                                    Submit Request
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Tabs */}
                <div className="flex md:hidden border-b mb-4">
                    <button
                        className={`flex-1 py-2 text-sm font-medium ${activeTab === 'details' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Details
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium ${activeTab === 'comments' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('comments')}
                    >
                        Comments ({issue.comments?.length || 0})
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden gap-6">
                    {/* Main Content (Left Column) */}
                    <div className={`flex-1 overflow-y-auto pr-2 ${activeTab === 'comments' ? 'hidden md:block' : ''}`}>
                        <div className="prose dark:prose-invert max-w-none">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                                {issue.description || 'No description provided.'}
                            </div>
                        </div>

                        {/* Attachments */}
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Paperclip className="w-4 h-4" /> Attachments
                                </h3>
                                <div>
                                    <input
                                        type="file"
                                        id="modal-file-upload"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                    <label htmlFor="modal-file-upload">
                                        <Button
                                            as="span"
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 px-2 text-xs hover:text-primary cursor-pointer"
                                            disabled={uploading}
                                        >
                                            {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                                            Add File
                                        </Button>
                                    </label>
                                </div>
                            </div>

                            {(!issue.attachments || issue.attachments.length === 0) ? (
                                <p className="text-sm text-muted-foreground italic">No attachments.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {issue.attachments.map((att) => (
                                        <div key={att.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <div className="flex items-center gap-2 truncate">
                                                <div className="p-1 bg-indigo-100 rounded text-indigo-600">
                                                    <FileIcon filename={att.filename} />
                                                </div>
                                                <div className="flex flex-col truncate">
                                                    <span className="text-sm truncate max-w-[120px] font-medium">{att.originalName}</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {formatSize(att.size)}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Meta Info (Mobile only) */}
                        <div className="mt-6 md:hidden space-y-3 border-t pt-4">
                            <MetaRow icon={UserIcon} label="Assignee" value={issue.assignee ? `${issue.assignee.firstName} ${issue.assignee.lastName}` : 'Unassigned'} />
                            <MetaRow icon={Clock} label="Due Date" value={issue.dueDate ? format(new Date(issue.dueDate), 'PPP') : 'No due date'} />
                        </div>
                    </div>

                    {/* Sidebar / Comments (Right Column) */}
                    <div className={`w-full md:w-80 flex flex-col border-l pl-6 ${activeTab === 'details' ? 'hidden md:flex' : 'flex'}`}>

                        {/* Meta Info (Desktop) */}
                        <div className="hidden md:block space-y-4 mb-6">
                            <MetaItem label="Assignee" value={issue.assignee ? `${issue.assignee.firstName} ${issue.assignee.lastName}` : 'Unassigned'} />
                            <MetaItem label="Due Date" value={issue.dueDate ? format(new Date(issue.dueDate), 'PPP') : 'No due date'} />
                            <MetaItem label="Created" value={format(new Date(issue.createdAt), 'PPP')} />
                        </div>

                        {/* Comments Section */}
                        <div className="flex flex-col flex-1 min-h-0">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" /> Discussion
                            </h3>

                            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                                {(!issue.comments || issue.comments.length === 0) ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Start the discussion!</p>
                                ) : (
                                    issue.comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-2 text-sm bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                                                {comment.user?.firstName?.[0] || '?'}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Unknown User'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="flex gap-2 mt-auto pt-2 border-t">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 text-sm p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-10 min-h-[40px] resize-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handlePostComment();
                                        }
                                    }}
                                />
                                <Button
                                    size="sm"
                                    onClick={handlePostComment}
                                    disabled={!newComment.trim() || sendingComment}
                                    className="px-3"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

// Helper Components
function MetaItem({ label, value }: { label: string, value: string }) {
    return (
        <div>
            <span className="text-xs text-muted-foreground block mb-0.5">{label}</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}

function MetaRow({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="w-4 h-4" />
                <span>{label}</span>
            </div>
            <span className="font-medium">{value}</span>
        </div>
    );
}

function formatSize(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function FileIcon({ filename }: { filename: string }) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <span className="font-bold text-xs">IMG</span>;
    if (['pdf'].includes(ext || '')) return <span className="font-bold text-xs">PDF</span>;
    if (['doc', 'docx'].includes(ext || '')) return <span className="font-bold text-xs">DOC</span>;
    return <Paperclip className="w-3 h-3" />;
}
