import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Issue } from '@/lib/api/endpoints/issues';
import { GripVertical, AlertCircle, Clock, MessageSquare, Paperclip } from 'lucide-react';
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

    const priorityColors = {
        CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        LOW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };

    const typeColors = {
        BUG: 'bg-red-100 text-red-700',
        FEATURE: 'bg-green-100 text-green-700',
        STORY: 'bg-blue-100 text-blue-700',
        TASK: 'bg-purple-100 text-purple-700',
        EPIC: 'bg-indigo-100 text-indigo-700',
    };

    const commentCount = issue.comments?.length || 0;
    const attachmentCount = issue.attachments?.length || 0;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            onClick={() => onClick?.(issue)}
            className={cn(
                'bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group',
                isDragging && 'opacity-50 shadow-lg ring-2 ring-primary-500'
            )}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div {...listeners} className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] uppercase font-bold truncate',
                        typeColors[issue.type as keyof typeof typeColors] || 'bg-gray-100 text-gray-700'
                    )}>
                        {issue.type}
                    </span>
                </div>
                {issue.priority && (
                    <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold',
                        priorityColors[issue.priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-700'
                    )}>
                        {issue.priority}
                    </span>
                )}
            </div>

            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
                {issue.title}
            </h4>

            <div className="flex items-center justify-between text-xs mt-auto">
                <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-gray-400 font-mono">
                        {issue.key}
                    </span>
                    {(commentCount > 0 || attachmentCount > 0) && (
                        <div className="flex items-center gap-2 text-gray-400">
                            {commentCount > 0 && (
                                <div className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" />
                                    <span>{commentCount}</span>
                                </div>
                            )}
                            {attachmentCount > 0 && (
                                <div className="flex items-center gap-1">
                                    <Paperclip className="w-3 h-3" />
                                    <span>{attachmentCount}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {issue.dueDate && (
                    <div className={cn(
                        "flex items-center gap-1",
                        new Date(issue.dueDate) < new Date() ? "text-red-500" : "text-gray-500"
                    )}>
                        <Clock className="w-3 h-3" />
                        <span>{new Date(issue.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
