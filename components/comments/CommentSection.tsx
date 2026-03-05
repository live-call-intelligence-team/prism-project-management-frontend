'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { commentsApi, Comment, CommentAttachment } from '@/lib/api/endpoints/comments';
import { cn } from '@/lib/utils';
import {
    MessageSquare, Send, Edit2, Trash2, User, Paperclip,
    X, FileText, Image, Film, Download, Reply, ThumbsUp
} from 'lucide-react';
import { projectsApi } from '@/lib/api/endpoints/projects';

interface CommentSectionProps {
    issueId: string;
    projectId: string;
    className?: string;
}

export function CommentSection({ issueId, projectId, className }: CommentSectionProps) {
    const { user } = useAuthStore();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    // Members & mentions
    const [members, setMembers] = useState<any[]>([]);
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [selectedMentions, setSelectedMentions] = useState<{ id: string; name: string }[]>([]);
    const [mentionIndex, setMentionIndex] = useState(0);

    // File uploads
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const mentionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [commentsData, membersData] = await Promise.all([
                    commentsApi.getIssueComments(issueId),
                    projectsApi.getMembers(projectId)
                ]);
                setComments(commentsData);
                setMembers(membersData);
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (issueId && projectId) {
            fetchData();
        }
    }, [issueId, projectId]);

    // Close mention dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (mentionRef.current && !mentionRef.current.contains(e.target as Node)) {
                setShowMentions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredMembers = members.filter(m =>
        m.user &&
        (m.user.firstName?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
            m.user.lastName?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
            m.user.email?.toLowerCase().includes(mentionQuery.toLowerCase()))
    );

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNewComment(val);

        const cursorPos = e.target.selectionStart || val.length;
        const textBeforeCursor = val.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex >= 0) {
            const charBefore = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
            if (charBefore === ' ' || charBefore === '\n' || lastAtIndex === 0) {
                const query = textBeforeCursor.substring(lastAtIndex + 1);
                if (!query.includes(' ')) {
                    setMentionQuery(query);
                    setShowMentions(true);
                    setMentionIndex(0);
                    return;
                }
            }
        }
        setShowMentions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showMentions || filteredMembers.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setMentionIndex((prev) => (prev + 1) % filteredMembers.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setMentionIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (showMentions) {
                e.preventDefault();
                insertMention(filteredMembers[mentionIndex]?.user);
            }
        } else if (e.key === 'Escape') {
            setShowMentions(false);
        }
    };

    const insertMention = (memberUser: any) => {
        if (!memberUser) return;
        const cursorPos = inputRef.current?.selectionStart || newComment.length;
        const textBeforeCursor = newComment.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');
        const textAfterCursor = newComment.substring(cursorPos);

        const name = `${memberUser.firstName} ${memberUser.lastName}`;
        const newText = textBeforeCursor.substring(0, lastAtIndex) + `@${name} ` + textAfterCursor;
        setNewComment(newText);
        setShowMentions(false);

        // Track this mention
        if (!selectedMentions.find(m => m.id === memberUser.id)) {
            setSelectedMentions([...selectedMentions, { id: memberUser.id, name }]);
        }

        // Refocus input
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    // File handling
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 5));
        }
        // Reset input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        setSelectedFiles(prev => [...prev, ...droppedFiles].slice(0, 5));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() && selectedFiles.length === 0) return;

        try {
            setSubmitting(true);
            const mentionIds = selectedMentions.map(m => m.id);
            const comment = await commentsApi.create(
                issueId,
                newComment.trim(),
                mentionIds.length > 0 ? mentionIds : undefined,
                selectedFiles.length > 0 ? selectedFiles : undefined
            );
            setComments([...comments, comment]);
            setNewComment('');
            setSelectedFiles([]);
            setSelectedMentions([]);
        } catch (err) {
            console.error('Error creating comment:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async (commentId: string) => {
        if (!editContent.trim()) return;

        try {
            const updated = await commentsApi.update(commentId, editContent.trim());
            setComments(comments.map(c => c.id === commentId ? { ...c, ...updated } : c));
            setEditingId(null);
            setEditContent('');
        } catch (err) {
            console.error('Error updating comment:', err);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;

        try {
            await commentsApi.delete(commentId);
            setComments(comments.filter(c => c.id !== commentId));
        } catch (err) {
            console.error('Error deleting comment:', err);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            case 'PROJECT_MANAGER': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            case 'SCRUM_MASTER': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            case 'CLIENT': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'EMPLOYEE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const getFileIcon = (mimetype: string) => {
        if (mimetype.startsWith('image/')) return <Image className="w-4 h-4 text-green-500" />;
        if (mimetype.startsWith('video/')) return <Film className="w-4 h-4 text-purple-500" />;
        return <FileText className="w-4 h-4 text-blue-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Render comment content with highlighted @mentions
    const renderContent = (content: string) => {
        const parts = content.split(/(@\w+(?:\s\w+)?)/g);
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                return (
                    <span key={i} className="text-primary-600 dark:text-primary-400 font-medium bg-primary-50 dark:bg-primary-900/20 px-1 rounded">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    const renderAttachments = (attachments?: CommentAttachment[]) => {
        if (!attachments || attachments.length === 0) return null;

        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5006';

        return (
            <div className="mt-2 flex flex-wrap gap-2">
                {attachments.map((att) => {
                    const fullUrl = att.fileUrl.startsWith('http') ? att.fileUrl : `${apiBase}${att.fileUrl}`;
                    const isImage = att.mimetype.startsWith('image/');
                    const isVideo = att.mimetype.startsWith('video/');

                    if (isImage) {
                        return (
                            <a key={att.id} href={fullUrl} target="_blank" rel="noopener noreferrer"
                                className="block rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-primary-400 transition-colors max-w-[200px]">
                                <img src={fullUrl} alt={att.originalName}
                                    className="w-full h-auto max-h-32 object-cover" />
                                <div className="px-2 py-1 text-xs text-gray-500 truncate">{att.originalName}</div>
                            </a>
                        );
                    }

                    if (isVideo) {
                        return (
                            <div key={att.id} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-w-[280px]">
                                <video src={fullUrl} controls className="w-full max-h-40" />
                                <div className="px-2 py-1 text-xs text-gray-500 truncate">{att.originalName}</div>
                            </div>
                        );
                    }

                    return (
                        <a key={att.id} href={fullUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            {getFileIcon(att.mimetype)}
                            <div className="min-w-0">
                                <div className="text-xs font-medium truncate max-w-[150px]">{att.originalName}</div>
                                <div className="text-xs text-gray-400">{formatFileSize(att.size)}</div>
                            </div>
                            <Download className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        </a>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            className={cn("space-y-4 relative", className)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-primary-50/80 dark:bg-primary-900/30 border-2 border-dashed border-primary-400 rounded-lg flex items-center justify-center">
                    <div className="text-primary-600 dark:text-primary-400 font-medium flex items-center gap-2">
                        <Paperclip className="w-5 h-5" />
                        Drop files here to attach
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-semibold">Comments ({comments.length})</h3>
            </div>

            {/* Comment List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {loading ? (
                    <div className="text-center py-4 text-gray-500">Loading comments...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No comments yet. Be the first to comment!</p>
                    </div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                {comment.user ? (
                                    <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                                        {comment.user.firstName?.[0]}{comment.user.lastName?.[0]}
                                    </span>
                                ) : (
                                    <User className="w-4 h-4 text-primary-600" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                                        {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Unknown'}
                                    </span>
                                    {comment.user?.role && (
                                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getRoleBadgeColor(comment.user.role))}>
                                            {comment.user.role.replace('_', ' ')}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-500">
                                        {new Date(comment.createdAt).toLocaleString()}
                                    </span>
                                </div>

                                {editingId === comment.id ? (
                                    <div className="mt-2 flex gap-2">
                                        <input
                                            type="text"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="flex-1 px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleEdit(comment.id)}
                                            className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-3 py-1.5 text-xs bg-gray-300 dark:bg-gray-700 rounded"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {renderContent(comment.content)}
                                    </p>
                                )}

                                {/* Inline attachments */}
                                {renderAttachments(comment.attachments)}

                                {/* Actions for own comments */}
                                {comment.userId === user?.id && editingId !== comment.id && (
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => {
                                                setEditingId(comment.id);
                                                setEditContent(comment.content);
                                            }}
                                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                        >
                                            <Edit2 className="w-3 h-3" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                    </div>
                                )}

                                {/* Actions for others' comments */}
                                {comment.userId !== user?.id && (
                                    <div className="flex gap-3 mt-2">
                                        <button
                                            onClick={() => setNewComment(`@${comment.user?.firstName} ${comment.user?.lastName} `)}
                                            className="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
                                        >
                                            <Reply className="w-3 h-3" /> Reply
                                        </button>
                                        <button
                                            className="text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1 transition-colors"
                                            title="Like feature coming soon"
                                        >
                                            <ThumbsUp className="w-3 h-3" /> Like
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs">
                            {getFileIcon(file.type)}
                            <span className="truncate max-w-[120px]">{file.name}</span>
                            <span className="text-gray-400">{formatFileSize(file.size)}</span>
                            <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Mention tags preview */}
            {selectedMentions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {selectedMentions.map(m => (
                        <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs">
                            @{m.name}
                            <button onClick={() => setSelectedMentions(prev => prev.filter(x => x.id !== m.id))} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Mention Dropdown */}
            {showMentions && filteredMembers.length > 0 && (
                <div ref={mentionRef} className="absolute bottom-20 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-56 overflow-y-auto w-72 z-50">
                    <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100 dark:border-gray-700 font-medium">
                        Project Members
                    </div>
                    {filteredMembers.map((m, idx) => (
                        <button
                            key={m.user.id}
                            className={cn(
                                "w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors",
                                idx === mentionIndex
                                    ? "bg-primary-50 dark:bg-primary-900/30"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            )}
                            onClick={() => insertMention(m.user)}
                            onMouseEnter={() => setMentionIndex(idx)}
                        >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {m.user.firstName?.[0]}{m.user.lastName?.[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {m.user.firstName} {m.user.lastName}
                                </div>
                                <div className="text-xs text-gray-500 truncate">{m.user.email}</div>
                            </div>
                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", getRoleBadgeColor(m.user.role || m.role))}>
                                {(m.user.role || m.role || '').replace('_', ' ')}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* New Comment Form */}
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                <div className="flex-1 relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newComment}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Add a comment... (Type @ to mention, drag files to attach)"
                        className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        disabled={submitting}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors"
                        title="Attach files"
                    >
                        <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
                <button
                    type="submit"
                    disabled={submitting || (!newComment.trim() && selectedFiles.length === 0)}
                    className={cn(
                        "px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 text-sm",
                        "bg-primary-600 hover:bg-primary-700 text-white shadow-sm",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Sending...' : 'Send'}
                </button>
            </form>
        </div>
    );
}
