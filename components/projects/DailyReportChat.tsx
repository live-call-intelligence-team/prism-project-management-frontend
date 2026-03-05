'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { dailyReportsApi, DailyReportComment } from '@/lib/api/endpoints/dailyReports';
import { cn } from '@/lib/utils';
import {
    Send, MessageSquare, Pin, Edit2, Trash2, Reply, Smile,
    HelpCircle, Megaphone, CheckSquare, ChevronDown, ChevronUp, X,
    AtSign, Hash, Zap, MessageCircle, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

interface TeamMember {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    role?: string;
    avatar?: string;
}

interface DailyReportChatProps {
    reportId: string;
    comments: DailyReportComment[];
    currentUserId: string;
    teamMembers: TeamMember[];
    onCommentAdded: (comment: DailyReportComment) => void;
    onCommentDeleted: (commentId: string) => void;
    onCommentUpdated: (comment: DailyReportComment) => void;
    className?: string;
}

const EMOJI_OPTIONS = ['👍', '❤️', '🔥', '🚀', '😂', '👏', '🎯', '💡'];

const AVATAR_GRADIENTS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-500',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
    'from-fuchsia-500 to-pink-500',
    'from-sky-500 to-blue-500',
];

const getAvatarGradient = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

const MESSAGE_TYPE_CONFIG = {
    comment: {
        label: 'Comment', icon: MessageCircle,
        bg: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm',
        border: 'border-gray-200/60 dark:border-gray-700/60',
        color: 'text-gray-600 dark:text-gray-400',
        badge: 'bg-gray-100/80 text-gray-600 dark:bg-gray-700/80 dark:text-gray-400',
        accent: 'bg-gray-500',
    },
    question: {
        label: 'Question', icon: HelpCircle,
        bg: 'bg-gradient-to-br from-blue-50/90 to-indigo-50/60 dark:from-blue-900/20 dark:to-indigo-900/15 backdrop-blur-sm',
        border: 'border-blue-200/60 dark:border-blue-700/40',
        color: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 ring-1 ring-blue-500/20',
        accent: 'bg-blue-500',
    },
    announcement: {
        label: 'Announcement', icon: Megaphone,
        bg: 'bg-gradient-to-br from-rose-50/90 to-orange-50/60 dark:from-rose-900/20 dark:to-orange-900/15 backdrop-blur-sm',
        border: 'border-rose-200/60 dark:border-rose-700/40',
        color: 'text-rose-600 dark:text-rose-400',
        badge: 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 ring-1 ring-rose-500/20',
        accent: 'bg-rose-500',
    },
    action_item: {
        label: 'Action Item', icon: Zap,
        bg: 'bg-gradient-to-br from-amber-50/90 to-yellow-50/60 dark:from-amber-900/20 dark:to-yellow-900/15 backdrop-blur-sm',
        border: 'border-amber-200/60 dark:border-amber-700/40',
        color: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 ring-1 ring-amber-500/20',
        accent: 'bg-amber-500',
    },
};

// ═══════════════════════════════════════════════════════════
// Single Message Component
// ═══════════════════════════════════════════════════════════

function ChatMessage({
    comment, currentUserId, teamMembers,
    onReply, onReact, onPin, onEdit, onDelete,
    depth = 0,
}: {
    comment: DailyReportComment; currentUserId: string; teamMembers: TeamMember[];
    onReply: (commentId: string) => void; onReact: (commentId: string, emoji: string) => void;
    onPin: (commentId: string) => void; onEdit: (commentId: string, content: string) => void;
    onDelete: (commentId: string) => void; depth?: number;
}) {
    const [showActions, setShowActions] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [showReplies, setShowReplies] = useState(true);

    const isOwn = comment.userId === currentUserId;
    const config = MESSAGE_TYPE_CONFIG[comment.messageType] || MESSAGE_TYPE_CONFIG.comment;
    const TypeIcon = config.icon;
    const hasReplies = (comment.replies || []).length > 0;
    const canEdit = isOwn && (Date.now() - new Date(comment.createdAt).getTime()) < 5 * 60 * 1000;
    const userName = `${comment.user?.firstName || ''} ${comment.user?.lastName || ''}`.trim();
    const avatarGradient = getAvatarGradient(userName);

    const handleSaveEdit = () => {
        if (editContent.trim() && editContent !== comment.content) {
            onEdit(comment.id, editContent.trim());
        }
        setIsEditing(false);
    };

    const renderContent = (text: string) => {
        const parts = text.split(/(@\w+(?:\s\w+)?)/g);
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                return (
                    <span key={i} className="inline-flex items-center gap-0.5 text-primary-600 dark:text-primary-400 font-semibold bg-primary-500/10 px-1.5 py-0.5 rounded-md text-[13px]">
                        <AtSign className="w-3 h-3" />{part.slice(1)}
                    </span>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn("group relative", depth > 0 && "ml-10")}
        >
            {/* Thread connector line */}
            {depth > 0 && (
                <div className="absolute -left-5 top-0 bottom-0 w-px bg-gradient-to-b from-primary-300/40 to-transparent dark:from-primary-600/30" />
            )}
            {depth > 0 && (
                <div className="absolute -left-5 top-5 w-5 h-px bg-primary-300/40 dark:bg-primary-600/30" />
            )}

            <div
                className={cn(
                    "relative rounded-2xl p-4 transition-all duration-300 hover:shadow-lg",
                    comment.isPinned && "ring-2 ring-amber-400/60 dark:ring-amber-500/40 shadow-amber-100/30 dark:shadow-amber-900/10",
                    config.bg, `border ${config.border}`,
                    isOwn && "border-primary-200/40 dark:border-primary-700/30",
                )}
                onMouseEnter={() => setShowActions(true)}
                onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false); }}
            >
                {/* Accent Strip */}
                {comment.messageType !== 'comment' && (
                    <div className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-full", config.accent)} />
                )}

                {/* Header */}
                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0 text-white shadow-lg bg-gradient-to-br transition-transform group-hover:scale-105",
                        avatarGradient
                    )}>
                        {comment.user?.firstName?.[0]}{comment.user?.lastName?.[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{userName}</span>
                            {isOwn && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/20">You</span>
                            )}
                            {comment.messageType !== 'comment' && (
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1", config.badge)}>
                                    <TypeIcon className="w-3 h-3" />
                                    {config.label}
                                </span>
                            )}
                            {comment.isPinned && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 flex items-center gap-0.5">
                                    <Pin className="w-2.5 h-2.5 fill-amber-500" />Pinned
                                </span>
                            )}
                            {comment.isEdited && <span className="text-[10px] text-gray-400 italic">(edited)</span>}
                        </div>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">{timeAgo(comment.createdAt)}</span>
                    </div>

                    {/* Floating Actions */}
                    <AnimatePresence>
                        {showActions && !isEditing && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="absolute -top-2 right-2 flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-xl shadow-black/5 dark:shadow-black/20 p-1 z-20 backdrop-blur-xl"
                            >
                                {[
                                    { onClick: () => setShowEmojiPicker(!showEmojiPicker), icon: <Smile className="w-3.5 h-3.5" />, title: 'React', show: true },
                                    { onClick: () => onReply(comment.id), icon: <Reply className="w-3.5 h-3.5" />, title: 'Reply', show: depth < 2 },
                                    { onClick: () => onPin(comment.id), icon: <Pin className={cn("w-3.5 h-3.5", comment.isPinned && "fill-amber-500 text-amber-500")} />, title: comment.isPinned ? 'Unpin' : 'Pin', show: true },
                                    { onClick: () => { setIsEditing(true); setEditContent(comment.content); }, icon: <Edit2 className="w-3.5 h-3.5" />, title: 'Edit', show: canEdit },
                                    { onClick: () => onDelete(comment.id), icon: <Trash2 className="w-3.5 h-3.5 text-red-400" />, title: 'Delete', show: isOwn, className: 'hover:bg-red-50 dark:hover:bg-red-900/20' },
                                ].filter(a => a.show).map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={action.onClick}
                                        className={cn("p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all text-gray-500 hover:text-gray-700 dark:hover:text-gray-300", action.className)}
                                        title={action.title}
                                    >
                                        {action.icon}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Content */}
                <div className="mt-2 ml-12">
                    {isEditing ? (
                        <div className="space-y-2.5">
                            <textarea
                                value={editContent}
                                onChange={e => setEditContent(e.target.value)}
                                className="w-full text-sm px-3.5 py-2.5 rounded-xl border-2 border-primary-300 dark:border-primary-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
                                rows={3}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button onClick={handleSaveEdit} className="px-4 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs rounded-lg font-bold hover:from-primary-600 hover:to-primary-700 shadow-md shadow-primary-500/20 transition-all">Save Changes</button>
                                <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[13.5px] text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{renderContent(comment.content)}</p>
                    )}
                </div>

                {/* Emoji Picker */}
                <AnimatePresence>
                    {showEmojiPicker && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 4 }}
                            className="absolute top-full right-2 mt-2 z-30 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xl shadow-black/10 dark:shadow-black/30 p-2.5 flex gap-1 backdrop-blur-xl"
                        >
                            {EMOJI_OPTIONS.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => { onReact(comment.id, emoji); setShowEmojiPicker(false); }}
                                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-lg transition-all hover:scale-125 active:scale-95"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Reactions */}
                {Object.keys(comment.reactions || {}).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 ml-12">
                        {Object.entries(comment.reactions).map(([emoji, userIds]) => (
                            <motion.button
                                key={emoji}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onReact(comment.id, emoji)}
                                className={cn(
                                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-all shadow-sm",
                                    userIds.includes(currentUserId)
                                        ? "bg-primary-50 dark:bg-primary-900/25 border-primary-300/60 dark:border-primary-700/40 text-primary-700 dark:text-primary-400 shadow-primary-500/10"
                                        : "bg-gray-50 dark:bg-gray-800 border-gray-200/60 dark:border-gray-700/60 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                )}
                            >
                                <span className="text-sm">{emoji}</span>
                                <span className="font-bold">{userIds.length}</span>
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>

            {/* Thread Replies */}
            {hasReplies && (
                <div className="mt-2">
                    <button
                        onClick={() => setShowReplies(!showReplies)}
                        className="flex items-center gap-1.5 text-[11px] text-primary-600 dark:text-primary-400 font-bold hover:text-primary-700 dark:hover:text-primary-300 ml-12 mb-2 group/thread"
                    >
                        <div className="w-4 h-4 rounded-full bg-primary-500/10 flex items-center justify-center group-hover/thread:bg-primary-500/20 transition-colors">
                            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </div>
                        {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                    </button>
                    <AnimatePresence>
                        {showReplies && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-2 overflow-hidden"
                            >
                                {comment.replies!.map(reply => (
                                    <ChatMessage key={reply.id} comment={reply} currentUserId={currentUserId} teamMembers={teamMembers}
                                        onReply={onReply} onReact={onReact} onPin={onPin} onEdit={onEdit} onDelete={onDelete} depth={depth + 1}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════
// Main Chat Component
// ═══════════════════════════════════════════════════════════

export function DailyReportChat({
    reportId, comments, currentUserId, teamMembers,
    onCommentAdded, onCommentDeleted, onCommentUpdated, className,
}: DailyReportChatProps) {
    const [messageText, setMessageText] = useState('');
    const [messageType, setMessageType] = useState<DailyReportComment['messageType']>('comment');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState('');
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const pinnedMessages = useMemo(() => comments.filter(c => c.isPinned), [comments]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments.length]);

    const handleInputChange = (value: string) => {
        setMessageText(value);
        const lastAtIndex = value.lastIndexOf('@');
        if (lastAtIndex >= 0) {
            const afterAt = value.substring(lastAtIndex + 1);
            if (!afterAt.includes(' ') || afterAt.split(' ').length <= 2) {
                setShowMentions(true);
                setMentionFilter(afterAt.toLowerCase());
            } else {
                setShowMentions(false);
            }
        } else {
            setShowMentions(false);
        }
    };

    const insertMention = (member: TeamMember) => {
        const lastAtIndex = messageText.lastIndexOf('@');
        const before = messageText.substring(0, lastAtIndex);
        const mention = `@${member.firstName} ${member.lastName} `;
        setMessageText(before + mention);
        setShowMentions(false);
        inputRef.current?.focus();
    };

    const extractMentionIds = (text: string): string[] => {
        const ids: string[] = [];
        teamMembers.forEach(m => {
            if (text.includes(`@${m.firstName} ${m.lastName}`)) ids.push(m.id);
        });
        return ids;
    };

    const filteredMembers = useMemo(() => {
        if (!mentionFilter) return teamMembers;
        return teamMembers.filter(m =>
            `${m.firstName} ${m.lastName}`.toLowerCase().includes(mentionFilter) ||
            m.email?.toLowerCase().includes(mentionFilter)
        );
    }, [teamMembers, mentionFilter]);

    const handleSend = async () => {
        if (!messageText.trim() || sending) return;
        setSending(true);
        try {
            const mentions = extractMentionIds(messageText);
            const { comment } = await dailyReportsApi.addComment(reportId, {
                content: messageText.trim(), mentions, messageType,
                parentId: replyingTo || undefined,
            });
            onCommentAdded(comment);
            setMessageText('');
            setMessageType('comment');
            setReplyingTo(null);
        } catch (err) {
            console.error('Failed to send comment:', err);
        } finally {
            setSending(false);
        }
    };

    const handleReact = async (commentId: string, emoji: string) => {
        try {
            const { reactions } = await dailyReportsApi.reactToComment(commentId, emoji);
            const updatedComment = comments.find(c => c.id === commentId);
            if (updatedComment) onCommentUpdated({ ...updatedComment, reactions });
            comments.forEach(c => {
                const reply = c.replies?.find(r => r.id === commentId);
                if (reply) onCommentUpdated({ ...c, replies: c.replies!.map(r => r.id === commentId ? { ...r, reactions } : r) });
            });
        } catch (err) { console.error('Failed to react:', err); }
    };

    const handlePin = async (commentId: string) => {
        try {
            const { isPinned } = await dailyReportsApi.pinComment(commentId);
            const updatedComment = comments.find(c => c.id === commentId);
            if (updatedComment) onCommentUpdated({ ...updatedComment, isPinned });
        } catch (err) { console.error('Failed to pin:', err); }
    };

    const handleEdit = async (commentId: string, content: string) => {
        try {
            const { comment } = await dailyReportsApi.editComment(commentId, content);
            onCommentUpdated(comment);
        } catch (err) { console.error('Failed to edit:', err); }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Delete this message?')) return;
        try {
            await dailyReportsApi.deleteComment(commentId);
            onCommentDeleted(commentId);
        } catch (err) { console.error('Failed to delete:', err); }
    };

    const replyingToComment = replyingTo ? comments.find(c => c.id === replyingTo) : null;
    const typeConfig = MESSAGE_TYPE_CONFIG[messageType];

    return (
        <div className={cn("flex flex-col h-full bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-800/50", className)}>
            {/* ═══ Header ═══ */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Team Conversation</h3>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{comments.length} messages · {teamMembers.length} participants</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {pinnedMessages.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 flex items-center gap-1">
                            <Pin className="w-3 h-3 fill-amber-500" />{pinnedMessages.length} pinned
                        </span>
                    )}
                </div>
            </div>

            {/* ═══ Pinned Messages ═══ */}
            <AnimatePresence>
                {pinnedMessages.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/40 dark:from-amber-900/15 dark:to-orange-900/10 border-b border-amber-200/40 dark:border-amber-800/30 px-5 py-2.5">
                            <div className="flex items-center gap-2 mb-1">
                                <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pinned Messages</span>
                            </div>
                            <div className="space-y-1">
                                {pinnedMessages.slice(0, 2).map(pm => (
                                    <div key={pm.id} className="text-xs text-amber-800 dark:text-amber-300 truncate flex items-center gap-1.5">
                                        <span className="font-bold">{pm.user?.firstName}:</span>
                                        <span className="opacity-80">{pm.content.substring(0, 60)}{pm.content.length > 60 ? '...' : ''}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ Messages Area ═══ */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[200px] max-h-[500px] scroll-smooth">
                {comments.length > 0 ? (
                    comments.map(comment => (
                        <ChatMessage key={comment.id} comment={comment} currentUserId={currentUserId} teamMembers={teamMembers}
                            onReply={setReplyingTo} onReact={handleReact} onPin={handlePin} onEdit={handleEdit} onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mb-4 shadow-inner">
                            <MessageSquare className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">No messages yet</p>
                        <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">Be the first to start a conversation</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ═══ Reply Indicator ═══ */}
            <AnimatePresence>
                {replyingToComment && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mx-4 mb-1 px-3.5 py-2.5 bg-primary-50/50 dark:bg-primary-900/15 rounded-t-xl border border-b-0 border-primary-200/40 dark:border-primary-700/30 flex items-center gap-2">
                            <Reply className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                            <span className="text-xs text-primary-700 dark:text-primary-400 flex-1 truncate">
                                Replying to <span className="font-bold">{replyingToComment.user?.firstName} {replyingToComment.user?.lastName}</span>
                            </span>
                            <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-primary-100 dark:hover:bg-primary-800/30 rounded-lg transition-colors">
                                <X className="w-3.5 h-3.5 text-primary-500" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ Input Area ═══ */}
            <div className="border-t border-gray-200/60 dark:border-gray-700/60 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-4">
                {/* Type Selector Row */}
                <div className="flex items-center gap-2 mb-3">
                    {(Object.entries(MESSAGE_TYPE_CONFIG) as [DailyReportComment['messageType'], typeof MESSAGE_TYPE_CONFIG['comment']][]).map(([type, cfg]) => (
                        <button
                            key={type}
                            onClick={() => setMessageType(type)}
                            className={cn(
                                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                messageType === type
                                    ? cn("shadow-md scale-105", cfg.badge)
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                        >
                            <cfg.icon className="w-3 h-3" />
                            {cfg.label}
                        </button>
                    ))}
                </div>

                {/* @ Mention Dropdown */}
                <div className="relative">
                    <AnimatePresence>
                        {showMentions && filteredMembers.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xl shadow-black/10 max-h-48 overflow-y-auto z-30 backdrop-blur-xl"
                            >
                                <div className="p-1.5">
                                    {filteredMembers.map(m => {
                                        const gradient = getAvatarGradient(`${m.firstName} ${m.lastName}`);
                                        return (
                                            <button
                                                key={m.id}
                                                onClick={() => insertMention(m)}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all text-left"
                                            >
                                                <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-br text-[9px] font-bold flex items-center justify-center flex-shrink-0 text-white shadow-md", gradient)}>
                                                    {m.firstName?.[0]}{m.lastName?.[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{m.firstName} {m.lastName}</p>
                                                    <p className="text-[10px] text-gray-400 truncate">{m.role || m.email}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-end gap-2.5">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={messageText}
                                onChange={e => handleInputChange(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(); }}
                                placeholder={replyingTo ? "Write a reply..." : "Type a message... Use @ to mention · ⌘+Enter to send"}
                                rows={2}
                                className="w-full text-sm px-4 py-3 bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-700/60 rounded-2xl text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 dark:focus:border-primary-600 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                            />
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSend}
                            disabled={!messageText.trim() || sending}
                            className={cn(
                                "p-3 rounded-2xl transition-all flex-shrink-0 shadow-lg",
                                messageText.trim()
                                    ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-primary-500/25"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed shadow-none"
                            )}
                        >
                            <Send className={cn("w-4 h-4", sending && "animate-pulse")} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}
