import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Issue } from '@/lib/api/endpoints/issues';
import { GripVertical, AlertCircle, Clock, MessageSquare, Paperclip, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
    issue: Issue;
    onClick?: (issue: Issue) => void;
}

export function KanbanCard({ issue, onClick }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: issue.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const priorityConfig: Record<string, { color: string; dotColor: string }> = {
        CRITICAL: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dotColor: 'bg-red-500' },
        HIGHEST: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dotColor: 'bg-red-500' },
        HIGH: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dotColor: 'bg-orange-500' },
        MEDIUM: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dotColor: 'bg-yellow-500' },
        LOW: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dotColor: 'bg-blue-500' },
        LOWEST: { color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dotColor: 'bg-gray-400' },
    };

    const typeIcons: Record<string, { emoji: string; bg: string }> = {
        BUG: { emoji: '🐛', bg: 'bg-red-50 dark:bg-red-950/30' },
        FEATURE: { emoji: '✨', bg: 'bg-green-50 dark:bg-green-950/30' },
        STORY: { emoji: '📖', bg: 'bg-blue-50 dark:bg-blue-950/30' },
        TASK: { emoji: '✅', bg: 'bg-purple-50 dark:bg-purple-950/30' },
        EPIC: { emoji: '🏔️', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
        SUB_TASK: { emoji: '📋', bg: 'bg-gray-50 dark:bg-gray-800/50' },
    };

    const commentCount = issue.comments?.length || 0;
    const attachmentCount = issue.attachments?.length || 0;
    const assignee = (issue as any).assignee;
    const storyPoints = (issue as any).storyPoints;
    const prio = priorityConfig[issue.priority] || priorityConfig.MEDIUM;
    const typeInfo = typeIcons[issue.type] || typeIcons.TASK;

    // Due date urgency
    const isOverdue = issue.dueDate && new Date(issue.dueDate) < new Date();
    const isDueSoon = issue.dueDate && !isOverdue &&
        (new Date(issue.dueDate).getTime() - Date.now()) < 2 * 24 * 60 * 60 * 1000; // 2 days

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            onClick={() => onClick?.(issue)}
            className={cn(
                'bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group',
                isDragging && 'opacity-50 shadow-lg ring-2 ring-primary-500',
                isOverdue && 'border-l-2 border-l-red-500',
                isDueSoon && !isOverdue && 'border-l-2 border-l-amber-500'
            )}
        >
            {/* Row 1: Type + Priority */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div {...listeners} className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                        <GripVertical className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <span className={cn("text-sm", typeInfo.bg, "px-1.5 py-0.5 rounded")}>
                        {typeInfo.emoji}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 truncate">{issue.key}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {storyPoints != null && storyPoints > 0 && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-bold">
                            <Zap className="w-2.5 h-2.5" />{storyPoints}
                        </span>
                    )}
                    <span className={cn(
                        'w-2 h-2 rounded-full flex-shrink-0',
                        prio.dotColor
                    )} title={issue.priority} />
                </div>
            </div>

            {/* Title */}
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2.5 line-clamp-2 group-hover:text-primary-600 transition-colors">
                {issue.title}
            </h4>

            {/* Row 3: Footer */}
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                    {(commentCount > 0 || attachmentCount > 0) && (
                        <div className="flex items-center gap-1.5 text-gray-400">
                            {commentCount > 0 && (
                                <div className="flex items-center gap-0.5">
                                    <MessageSquare className="w-3 h-3" />
                                    <span>{commentCount}</span>
                                </div>
                            )}
                            {attachmentCount > 0 && (
                                <div className="flex items-center gap-0.5">
                                    <Paperclip className="w-3 h-3" />
                                    <span>{attachmentCount}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {issue.dueDate && (
                        <div className={cn(
                            "flex items-center gap-1 text-[10px]",
                            isOverdue ? "text-red-500 font-medium" : isDueSoon ? "text-amber-500" : "text-gray-400"
                        )}>
                            <Clock className="w-3 h-3" />
                            {new Date(issue.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                    )}
                    {/* Assignee Avatar */}
                    {assignee ? (
                        <div
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                            title={`${assignee.firstName} ${assignee.lastName}`}
                        >
                            {assignee.firstName?.[0]}{assignee.lastName?.[0]}
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[9px] text-gray-400 flex-shrink-0">
                            ?
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
