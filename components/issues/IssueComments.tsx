'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { issuesApi, IssueComment } from '@/lib/api/endpoints/issues';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/lib/store/authStore';
import { MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface IssueCommentsProps {
    issueId: string;
    initialComments?: IssueComment[];
}

export default function IssueComments({ issueId, initialComments = [] }: IssueCommentsProps) {
    const [comments, setComments] = useState<IssueComment[]>(initialComments);
    const { user } = useAuthStore();
    const { register, handleSubmit, reset } = useForm<{ content: string }>();
    const { success, error: toastError } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (data: { content: string }) => {
        if (!data.content.trim()) return;
        setIsSubmitting(true);
        try {
            const newComment = await issuesApi.addComment(issueId, data.content);
            setComments(prev => [...prev, newComment]);
            reset();
            success('Comment added');
        } catch (error) {
            console.error(error);
            toastError('Failed to add comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInitials = (firstName: string = '', lastName: string = '') => {
        return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Comments
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                        {comments.length}
                    </span>
                </h3>
            </div>

            <div className="p-6 space-y-6">
                {/* Comment List */}
                <div className="space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {comments.length === 0 ? (
                        <p className="text-center text-gray-500 py-4 italic">No comments yet. Start the conversation!</p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="flex gap-4 group">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                        {getInitials(comment.user?.firstName, comment.user?.lastName)}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-baseline justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                {comment.user?.firstName} {comment.user?.lastName}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(comment.createdAt).toLocaleString(undefined, {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg rounded-tl-none border border-gray-100 dark:border-gray-700/50">
                                        {comment.content}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Comment Input */}
                <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-bold text-xs">
                            {getInitials(user?.firstName, user?.lastName)}
                        </div>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex gap-3">
                        <input
                            {...register('content')}
                            type="text"
                            placeholder="Write a comment..."
                            className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            disabled={isSubmitting}
                            autoComplete="off"
                        />
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className={isSubmitting ? 'opacity-70' : ''}
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
