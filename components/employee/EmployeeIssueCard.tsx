import { Issue } from '@/lib/api/endpoints/issues';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Paperclip, MessageSquare, CheckCircle, Flag, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this utility exists

interface EmployeeIssueCardProps {
    issue: Issue;
    onClick: (issue: Issue) => void;
    groupByEpic?: boolean;
}

export function EmployeeIssueCard({ issue, onClick, groupByEpic }: EmployeeIssueCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: issue.id, data: { ...issue } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // Epic color fallback
    const epicColor = issue.epic?.color || '#e5e7eb'; // default gray-200

    // Priority handling
    const isHighPriority = issue.priority === 'HIGH' || issue.priority === 'CRITICAL';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            onClick={() => onClick(issue)}
            className={cn(
                "group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 cursor-pointer overflow-hidden select-none",
                isDragging && "opacity-50 ring-2 ring-primary-500 z-50 rotate-2"
            )}
        >
            {/* Epic Color Strip */}
            <div
                className="h-1.5 w-full"
                style={{ backgroundColor: epicColor }}
                title={issue.epic?.name || 'No Epic'}
            />

            <div className="p-3">
                {/* Header: Key & Menu */}
                <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-mono text-gray-500">{issue.key}</span>
                    <button className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4" /> {/* Or 3 dots */}
                    </button>
                    {/* Drag Handle implicitly entire card, but listeners can be specific if needed. Using card for now. */}
                </div>

                {/* Title */}
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 leading-snug line-clamp-2">
                    {issue.title}
                </h4>

                {/* Parent Feature Link */}
                {issue.parent && (
                    <div className="mb-3 text-xs text-gray-500 hover:text-primary-600 truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                        {issue.parent.title}
                    </div>
                )}

                {/* Footer Stats */}
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">

                    {/* Icons Left */}
                    <div className="flex items-center gap-3">
                        {(issue.attachments?.length ?? 0) > 0 && (
                            <div className="flex items-center gap-0.5" title="Attachments">
                                <Paperclip className="w-3 h-3" />
                                <span>{issue.attachments?.length}</span>
                            </div>
                        )}
                        {(issue.comments?.length ?? 0) > 0 && (
                            <div className="flex items-center gap-0.5" title="Comments">
                                <MessageSquare className="w-3 h-3" />
                                <span>{issue.comments?.length}</span>
                            </div>
                        )}
                        {/* Subtasks logic would go here if available in issue object */}
                    </div>

                    {/* Right Side: Avatar, SP, Priority */}
                    <div className="flex items-center gap-2">
                        {/* Priority Flag */}
                        {isHighPriority && (
                            <Flag className="w-4 h-4 text-red-500 fill-red-100 dark:fill-red-900/30" />
                        )}

                        {/* Story Points */}
                        {issue.storyPoints !== undefined && (
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] font-bold">
                                {issue.storyPoints}
                            </div>
                        )}

                        {/* Assignee Avatar */}
                        {issue.assignee ? (
                            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold ring-1 ring-white dark:ring-gray-800">
                                {issue.assignee.firstName?.[0]}{issue.assignee.lastName?.[0]}
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                ?
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Drag Handle Overlay for touch/specific use if needed, but card click handles modal. 
                We might need to separate drag handle from click? 
                Kanban usually implies drag anywhere. Click usually opens modal.
                We can add listeners to the whole div, and prevent default on click if dragging occurred.
                dnd-kit handles this usually.
            */}
            <div {...listeners} className="absolute inset-x-0 top-0 h-4 cursor-grab active:cursor-grabbing z-10" />
        </div>
    );
}
