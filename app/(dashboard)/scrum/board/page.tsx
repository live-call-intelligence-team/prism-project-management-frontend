'use client';

import { useState, useEffect, useCallback } from 'react';
import { sprintsApi, Sprint } from '@/lib/api/endpoints/sprints';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import { projectsApi } from '@/lib/api/endpoints/projects';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragEndEvent,
    DragStartEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

// --- Board Components ---

const StatusColumns = {
    'TODO': 'To Do',
    'IN_PROGRESS': 'In Progress',
    'IN_REVIEW': 'In Review',
    'DONE': 'Done'
};

function BoardCard({ issue, onEdit }: { issue: Issue; onEdit?: (issue: Issue) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: issue.id,
        data: { issue },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const typeIcons = {
        BUG: "🐛",
        FEATURE: "✨",
        STORY: "⭐",
        TASK: "✅",
    };

    const priorityColor = {
        CRITICAL: "border-l-4 border-red-500",
        HIGH: "border-l-4 border-orange-500",
        MEDIUM: "border-l-4 border-yellow-500",
        LOW: "border-l-4 border-gray-400",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "relative p-3 bg-white dark:bg-gray-800 border-y border-r border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing group transition-all",
                priorityColor[issue.priority as keyof typeof priorityColor] || "border-l-4 border-gray-200",
                isDragging && "opacity-50 rotate-2 scale-105 z-50"
            )}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    <span title={issue.type} className="text-sm" role="img">{typeIcons[issue.type as keyof typeof typeIcons] || "📋"}</span>
                    <span className="text-xs text-gray-500 font-mono hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); onEdit?.(issue); }}>
                        {issue.key}
                    </span>
                </div>

                {/* Quick Edit (Hover) */}
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit?.(issue); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-opacity"
                >
                    <Edit className="w-3.5 h-3.5" />
                </button>
            </div>

            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-3 leading-snug">
                {issue.title}
            </p>

            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-2">
                    {/* Assignee Avatar */}
                    <div
                        title={issue.assignee ? `${issue.assignee.firstName} ${issue.assignee.lastName}` : "Unassigned"}
                        className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white dark:ring-gray-800",
                            issue.assignee
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                                : "bg-gray-100 text-gray-400 dark:bg-gray-700"
                        )}
                    >
                        {issue.assignee?.avatar ? (
                            <img src={issue.assignee.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            issue.assignee?.firstName?.[0] || "?"
                        )}
                    </div>
                </div>

                {/* Story Points */}
                {issue.storyPoints !== undefined && (
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                        {issue.storyPoints}
                    </span>
                )}
            </div>
        </div>
    );
}

function BoardColumn({
    id,
    title,
    issues,
    onEditIssue,
    onCreateIssue
}: {
    id: string;
    title: string;
    issues: Issue[]
    onEditIssue?: (issue: Issue) => void;
    onCreateIssue?: (status: string) => void;
}) {
    const { setNodeRef } = useSortable({
        id,
        data: { type: 'Column' },
    });

    const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 min-w-[300px] border border-gray-200 dark:border-gray-800 shadow-sm">
            {/* Header */}
            <div className="mb-3 px-1">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        {title}
                    </h3>
                    <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400">
                        {issues.length}
                    </span>
                </div>
                {totalPoints > 0 && (
                    <div className="text-xs text-gray-400 font-mono">
                        {totalPoints} pts
                    </div>
                )}
            </div>

            {/* List */}
            <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div ref={setNodeRef} className="flex-1 space-y-3 min-h-[100px] pb-2">
                    {issues.length === 0 ? (
                        <div className="h-24 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-400 italic">
                            No issues
                        </div>
                    ) : (
                        issues.map(issue => (
                            <BoardCard key={issue.id} issue={issue} onEdit={onEditIssue} />
                        ))
                    )}
                </div>
            </SortableContext>

            {/* Quick Add */}
            <button
                onClick={() => onCreateIssue?.(id)}
                className="mt-2 w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
            >
                <Plus className="w-4 h-4" />
                Add Issue
            </button>
        </div>
    );
}

// --- Main Page ---

// ... (imports)
// StatusColumns is already defined above

// ... BoardCard & BoardColumn (keep existing but potentially updated if needed) ...
import { BoardFilters } from '@/components/board/BoardFilters';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { IssueModal } from '@/components/issues/IssueModal';
import { Edit, Plus } from 'lucide-react';

// ...

export default function BoardPage() {
    const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
    const [allIssues, setAllIssues] = useState<Issue[]>([]); // Store all issues
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [filteredIssues, setFilteredIssues] = useState<Record<string, Issue[]>>({
        'TODO': [],
        'IN_PROGRESS': [],
        'IN_REVIEW': [],
        'DONE': []
    });

    // Filter State
    const [search, setSearch] = useState('');
    const [assignee, setAssignee] = useState('');
    const [priority, setPriority] = useState('');
    const [label, setLabel] = useState('');

    const [loading, setLoading] = useState(true);
    const [activeDragItem, setActiveDragItem] = useState<Issue | null>(null);

    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [createStatus, setCreateStatus] = useState<string>('TODO');
    const [editingIssue, setEditingIssue] = useState<Issue | undefined>(undefined);

    const { success, error: toastError } = useToast();

    // ... (fetch logic)

    const handleCompleteSprint = async () => {
        if (!activeSprint) return;
        try {
            await sprintsApi.complete(activeSprint.id);
            success('Sprint completed successfully!');
            // Redirect to backlog or refresh
            window.location.href = '/scrum/backlog';
        } catch (e) {
            toastError('Failed to complete sprint');
        }
    };

    // Fetch Board Data
    const fetchBoard = useCallback(async () => {
        try {
            // If projects not loaded, fetch them first
            let currentProjects = projects;
            if (currentProjects.length === 0) {
                const data = await projectsApi.getAll();
                currentProjects = data.projects || [];
                setProjects(currentProjects);
            }

            const projectId = currentProjects[0]?.id;

            if (!projectId) {
                setLoading(false);
                return;
            }

            // Get active sprint for this project
            const sprints = await sprintsApi.getProjectSprints(projectId, 'ACTIVE');
            const active = sprints[0];

            if (active) {
                setActiveSprint(active);
                if (active.issues) {
                    setAllIssues(active.issues);
                }
            }
        } catch (e) {
            console.error(e);
            toastError('Failed to load board');
        } finally {
            setLoading(false);
        }
    }, [projects, toastError]);

    useEffect(() => {
        fetchBoard();
    }, [fetchBoard]);

    // Apply Filters
    useEffect(() => {
        if (!activeSprint) return;

        let result = allIssues;

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(i =>
                i.title.toLowerCase().includes(q) ||
                i.key.toLowerCase().includes(q)
            );
        }

        if (priority) {
            result = result.filter(i => i.priority === priority);
        }

        // Mock assignee filtering for now as auth/assignee logic varies
        if (assignee === 'me') {
            // result = result.filter(i => i.assigneeId === currentUser.id);
        } else if (assignee === 'unassigned') {
            result = result.filter(i => !i.assigneeId);
        }

        // Group by status
        const grouped: Record<string, Issue[]> = {
            'TODO': [],
            'IN_PROGRESS': [],
            'IN_REVIEW': [],
            'DONE': []
        };
        result.forEach(issue => {
            const statusKey = issue.status === 'IN_REVIEW' ? 'IN_REVIEW' : issue.status; // Changed 'IN_PROGRESS' to 'IN_REVIEW'
            if (grouped[statusKey]) {
                grouped[statusKey].push(issue);
            } else {
                if (statusKey === 'BLOCKED') grouped['TODO'].push(issue);
                // Fallback for new statuses
                if (statusKey === 'IN_REVIEW' && !grouped['IN_REVIEW']) grouped['IN_PROGRESS'].push(issue);
            }
        });

        setFilteredIssues(grouped);

    }, [allIssues, activeSprint, search, priority, assignee, label]);


    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragItem(event.active.data.current?.issue as Issue);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Determine source and destination columns
        let sourceStatus = '';
        let destStatus = '';

        // Helper to find status of an issue ID in current filtered view
        const findStatus = (id: string) => {
            for (const [status, list] of Object.entries(filteredIssues)) {
                if (list.find(i => i.id === id)) return status;
            }
            return null;
        };

        sourceStatus = findStatus(activeId) || '';

        if (StatusColumns[overId as keyof typeof StatusColumns]) {
            destStatus = overId;
        } else {
            destStatus = findStatus(overId) || '';
        }

        if (!sourceStatus || !destStatus || sourceStatus === destStatus) return;

        // UI Update (Optimistic on All Issues)
        const issueToMove = allIssues.find(i => i.id === activeId);
        if (!issueToMove) return;

        const updatedIssue = { ...issueToMove, status: destStatus as any };

        setAllIssues(prev => prev.map(i => i.id === activeId ? updatedIssue : i));

        // API Update
        try {
            await issuesApi.updateStatus(activeId, destStatus);
        } catch (e) {
            toastError('Failed to update status');
            // Revert
            setAllIssues(prev => prev.map(i => i.id === activeId ? issueToMove : i));
        }
    };

    const handleEditIssue = (issue: Issue) => {
        setEditingIssue(issue);
        setIsCreateModalOpen(true);
    };

    // Calculate progress
    const totalPoints = allIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    const donePoints = allIssues.filter(i => i.status === 'DONE').reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    const progress = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

    if (loading) return <Container><LoadingSkeleton count={3} /></Container>;

    if (!activeSprint) {
        return (
            <Container>
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Active Sprint</h2>
                    <p className="text-gray-500 mb-4">You need to start a sprint in the Backlog to see the board.</p>
                    <Button onClick={() => window.location.href = '/scrum/backlog'}>
                        Go to Backlog
                    </Button>
                </div>
            </Container>
        );
    }

    return (
        <Container size="full">
            <div className="h-full flex flex-col gap-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{activeSprint.name}</h1>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase">Active</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center">
                                <span className={cn("w-2 h-2 rounded-full mr-2", progress >= 100 ? "bg-green-500" : "bg-blue-500")}></span>
                                {new Date(activeSprint.startDate).toLocaleDateString()} - {new Date(activeSprint.endDate).toLocaleDateString()}
                            </span>
                            {/* Progress Bar */}
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: `${progress}%` }}></div>
                                </div>
                                <span className="text-xs font-medium">{donePoints}/{totalPoints} pts</span>
                            </div>
                            {activeSprint.goal && (
                                <span className="italic border-l border-gray-300 pl-3">Goal: {activeSprint.goal}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => { setEditingIssue(undefined); setIsCreateModalOpen(true); }} leftIcon={<Plus className="w-4 h-4" />}>
                            Create Issue
                        </Button>
                        <Button variant="primary" onClick={() => setIsCompleteModalOpen(true)}>
                            Complete Sprint
                        </Button>
                    </div>
                </div>

                <BoardFilters
                    search={search}
                    onSearchChange={setSearch}
                    assignee={assignee}
                    onAssigneeChange={setAssignee}
                    priority={priority}
                    onPriorityChange={setPriority}
                    label={label}
                    onLabelChange={setLabel}
                    onClear={() => {
                        setSearch('');
                        setAssignee('');
                        setPriority('');
                        setLabel('');
                    }}
                />

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-x-auto pb-4">
                        {Object.entries(StatusColumns).map(([id, title]) => (
                            <BoardColumn
                                key={id}
                                id={id}
                                title={title}
                                issues={filteredIssues[id]}
                                onEditIssue={handleEditIssue}
                                onCreateIssue={(status) => {
                                    setCreateStatus(status);
                                    setEditingIssue(undefined);
                                    setIsCreateModalOpen(true);
                                }}
                            />
                        ))}
                    </div>
                    <DragOverlay>
                        {activeDragItem ? <BoardCard issue={activeDragItem} /> : null}
                    </DragOverlay>
                </DndContext>

                <ConfirmationModal
                    isOpen={isCompleteModalOpen}
                    onClose={() => setIsCompleteModalOpen(false)}
                    onConfirm={handleCompleteSprint}
                    title="Complete Sprint"
                    message={`Are you sure you want to complete "${activeSprint.name}"? This action cannot be undone.`}
                    confirmText="Complete Sprint"
                    variant="primary"
                />

                <IssueModal
                    isOpen={isCreateModalOpen}
                    onClose={() => { setIsCreateModalOpen(false); setEditingIssue(undefined); setCreateStatus('TODO'); }}
                    projectId={activeSprint.projectId}
                    projects={projects}
                    defaultStatus={createStatus}
                    sprintId={activeSprint.id}
                    onSubmit={() => {
                        setIsCreateModalOpen(false);
                        setEditingIssue(undefined);
                        setCreateStatus('TODO');
                        fetchBoard();
                    }}
                    initialData={editingIssue}
                />
            </div>
        </Container>
    );
}
