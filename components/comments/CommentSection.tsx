'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { commentsApi, Comment } from '@/lib/api/endpoints/comments';
import { cn } from '@/lib/utils';
import { MessageSquare, Send, Edit2, Trash2, User } from 'lucide-react';

import { projectsApi } from '@/lib/api/endpoints/projects';
import { ThumbsUp, Reply } from 'lucide-react';

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

    const [members, setMembers] = useState<any[]>([]);
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentions, setShowMentions] = useState(false);

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

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNewComment(val);

        const lastWord = val.split(' ').pop();
        if (lastWord?.startsWith('@') && lastWord.length > 1) {
            setMentionQuery(lastWord.slice(1));
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const insertMention = (user: any) => {
        const words = newComment.split(' ');
        words.pop(); // Remove the partial @mention
        const name = `${user.firstName} ${user.lastName}`;
        setNewComment([...words, `@${name}`].join(' ') + ' ');
        setShowMentions(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setSubmitting(true);
            const comment = await commentsApi.create(issueId, newComment.trim());
            setComments([...comments, comment]);
            setNewComment('');
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
            setComments(comments.map(c => c.id === commentId ? updated : c));
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
            case 'SCRUM_MASTER': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            case 'CLIENT': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-semibold">Comments ({comments.length})</h3>
            </div>

            {/* Comment List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
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
                                        {comment.content}
                                    </p>
                                )}

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

                                {/* Actions for others comments */}
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

            {/* Mention Dropdown */}
            {
                showMentions && (
                    <div className="absolute bottom-16 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto w-64 z-50">
                        {members
                            .filter(m =>
                                m.user.firstName.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                                m.user.lastName.toLowerCase().includes(mentionQuery.toLowerCase())
                            )
                            .map(m => (
                                <button
                                    key={m.user.id}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                    onClick={() => insertMention(m.user)}
                                >
                                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                                        {m.user.firstName[0]}
                                    </div>
                                    <span className="text-sm">{m.user.firstName} {m.user.lastName}</span>
                                </button>
                            ))}
                    </div>
                )
            }

            {/* New Comment Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={handleInput}
                    placeholder="Add a comment... (Type @ to mention)"
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={submitting}
                />
                <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className={cn(
                        "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                        "bg-primary-600 hover:bg-primary-700 text-white",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Sending...' : 'Send'}
                </button>
            </form>
        </div >
    );
}
