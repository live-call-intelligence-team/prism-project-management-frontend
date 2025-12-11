'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { sprintsApi, Sprint } from '@/lib/api/endpoints/sprints';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import { IssueModal } from '@/components/issues/IssueModal';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { Plus, MoreVertical, Calendar, Edit, Trash2 } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SprintModal } from '@/components/sprints/SprintModal';
import { Fragment } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
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
import { projectsApi, Project } from '@/lib/api/endpoints/projects';

// --- Components ---

function SortableIssueItem({ issue, onEdit, onDelete }: { issue: Issue; onEdit?: (issue: Issue) => void; onDelete?: (issue: Issue) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: issue.id,
        data: {
            type: 'Issue',
            issue,
        },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const priorityColors = {
        CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
        HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
        MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
        LOW: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    };

    const typeIcons = {
        BUG: "🐛",
        FEATURE: "✨",
        STORY: "📖",
        TASK: "✅",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "group flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-grab active:cursor-grabbing",
                isDragging && "opacity-50 bg-gray-50 dark:bg-gray-700 ring-2 ring-primary-500 z-50 rounded-lg shadow-xl"
            )}
        >
            {/* Type & Key */}
            <div className="flex items-center gap-2 min-w-[100px]">
                <span title={issue.type} className="text-lg" role="img" aria-label={issue.type}>
                    {typeIcons[issue.type as keyof typeof typeIcons] || "📋"}
                </span>
                <span className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400">
                    {issue.key}
                </span>
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {issue.title}
                </p>
                {/* Mobile only sub-details could go here */}
            </div>

            {/* Meta Items (Hidden on small screens if needed, but flex wrap handles it) */}
            <div className="flex items-center gap-3 shrink-0">
                {/* Priority */}
                <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    priorityColors[issue.priority as keyof typeof priorityColors] || priorityColors.LOW
                )}>
                    {issue.priority}
                </span>

                {/* Story Points */}
                {issue.storyPoints !== undefined && (
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                        {issue.storyPoints} pts
                    </span>
                )}

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

                {/* Actions (Hover only) */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEdit?.(issue);
                        }}
                    >
                        <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete?.(issue);
                        }}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function SprintContainer({
    sprint,
    issues,
    onStartSprint,
    onCompleteSprint,
    onEdit,
    onDelete,
    onEditIssue,
    onDeleteIssue
}: {
    sprint: Sprint;
    issues: Issue[];
    onStartSprint: (id: string) => void;
    onCompleteSprint: (id: string) => void;
    onEdit: (sprint: Sprint) => void;
    onDelete: (sprint: Sprint) => void;
    onEditIssue?: (issue: Issue) => void;
    onDeleteIssue?: (issue: Issue) => void;
}) {
    const { setNodeRef } = useSortable({
        id: sprint.id,
        data: {
            type: 'Sprint',
            sprint,
        },
    });

    return (
        <div ref={setNodeRef} className="mb-6 bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{sprint.name}</h3>
                        <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                        </div>
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium uppercase",
                            sprint.status === 'ACTIVE' && "bg-blue-100 text-blue-700",
                            sprint.status === 'PLANNED' && "bg-gray-200 text-gray-700",
                            sprint.status === 'COMPLETED' && "bg-green-100 text-green-700"
                        )}>
                            {sprint.status}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        {sprint.status === 'PLANNED' && (
                            <Button size="sm" variant="secondary" onClick={() => onStartSprint(sprint.id)}>
                                Start Sprint
                            </Button>
                        )}
                        {sprint.status === 'ACTIVE' && (
                            <Button size="sm" variant="primary" onClick={() => onCompleteSprint(sprint.id)}>
                                Complete Sprint
                            </Button>
                        )}

                        <Menu as="div" className="relative inline-block text-left">
                            <Menu.Button as={Button} size="sm" variant="ghost" className="p-1">
                                <MoreVertical className="w-4 h-4" />
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 z-50 focus:outline-none">
                                    <div className="px-1 py-1">
                                        <Menu.Item>
                                            {({ active }: { active: boolean }) => (
                                                <button
                                                    onClick={() => onEdit(sprint)}
                                                    className={cn(
                                                        active ? 'bg-primary-500 text-white' : 'text-gray-900 dark:text-white',
                                                        'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                                                    )}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit Sprint
                                                </button>
                                            )}
                                        </Menu.Item>
                                        <Menu.Item>
                                            {({ active }: { active: boolean }) => (
                                                <button
                                                    onClick={() => onDelete(sprint)}
                                                    className={cn(
                                                        active ? 'bg-red-500 text-white' : 'text-red-600',
                                                        'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                                                    )}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete Sprint
                                                </button>
                                            )}
                                        </Menu.Item>
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </div>
                </div>

                {/* Metrics Row */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                        Total Issues: {issues.length}
                    </span>
                    <span className="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                        Planned: {issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0)} pts
                    </span>
                    {sprint.capacity && (
                        <>
                            <span className="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                                Capacity: {sprint.capacity} pts
                            </span>
                        </>
                    )}
                    {sprint.goal && (
                        <>
                            <span className="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>
                            <span className="italic truncate max-w-[300px]">
                                Goal: <span className="font-normal text-gray-600 dark:text-gray-300">{sprint.goal}</span>
                            </span>
                        </>
                    )}
                </div>
            </div>

            <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div className="min-h-[50px] space-y-2">
                    {issues.length > 0 ? (
                        issues.map((issue) => (
                            <SortableIssueItem key={issue.id} issue={issue} onEdit={onEditIssue} onDelete={onDeleteIssue} />
                        ))
                    ) : (
                        <div className="text-sm text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                            Drag issues here to plan this sprint
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

function BacklogContainer({ issues, onEditIssue, onDeleteIssue }: { issues: Issue[]; onEditIssue?: (issue: Issue) => void; onDeleteIssue?: (issue: Issue) => void }) {
    const { setNodeRef } = useSortable({
        id: 'backlog',
        data: {
            type: 'Backlog',
        },
    });

    return (
        <div ref={setNodeRef} className="rounded-xl border-none">
            {/* Header removed as it is in parent */}

            <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div className="min-h-[100px] space-y-2">
                    {issues.length > 0 ? (
                        issues.map((issue) => (
                            <SortableIssueItem key={issue.id} issue={issue} onEdit={onEditIssue} onDelete={onDeleteIssue} />
                        ))
                    ) : (
                        <div className="text-sm text-gray-400 text-center py-8">
                            Your backlog is empty.
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

// --- Main Page ---

export default function BacklogPage() {
    const { success, error: toastError } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');

    // Data State
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [backlogIssues, setBacklogIssues] = useState<Issue[]>([]);
    // Issues map: sprintId -> Issue[]
    const [sprintIssues, setSprintIssues] = useState<Record<string, Issue[]>>({});

    const [loading, setLoading] = useState(true);
    const [activeDragItem, setActiveDragItem] = useState<Issue | null>(null);

    // Filter State
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Sprint Modals
    const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
    const [editingSprint, setEditingSprint] = useState<Sprint | undefined>(undefined);
    const [sprintToDelete, setSprintToDelete] = useState<Sprint | null>(null);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [editingIssue, setEditingIssue] = useState<Issue | undefined>(undefined);
    const [issueToDelete, setIssueToDelete] = useState<Issue | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (selectedProjectId) fetchBacklogOnly();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, filterType, filterPriority, selectedProjectId]); // Re-fetch on filter change

    const fetchBacklogOnly = async () => {
        if (!selectedProjectId) return;
        try {
            // Pass filters to API
            const params: { search?: string; type?: string; priority?: string } = {};
            if (search) params.search = search;
            if (filterType) params.type = filterType;
            if (filterPriority) params.priority = filterPriority;

            const backlogData = await issuesApi.getBacklog(selectedProjectId, params);
            setBacklogIssues(backlogData.issues || []);
        } catch (err) {
            console.error('Failed to filter backlog', err);
        }
    };

    // Initial Load & Project Switch
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // 1. Fetch Projects
                const projectsData = await projectsApi.getAll();
                setProjects(projectsData.projects || []);

                // 2. Determine default project
                let pid = selectedProjectId;
                if (!pid && projectsData.projects?.length > 0) {
                    pid = projectsData.projects[0].id;
                    setSelectedProjectId(pid);
                }

                if (!pid) {
                    setLoading(false);
                    return;
                }

                // 3. Fetch Sprints & Backlog for this project
                const [sprintsData, backlogData] = await Promise.all([
                    sprintsApi.getProjectSprints(pid),
                    issuesApi.getBacklog(pid)
                ]);

                setSprints(sprintsData);
                setBacklogIssues(backlogData.issues || []);

                // Map sprint issues
                const sprintListMap: Record<string, Issue[]> = {};
                sprintsData.forEach(s => {
                    sprintListMap[s.id] = s.issues || [];
                });
                setSprintIssues(sprintListMap);

            } catch (err) {
                console.error(err);
                toastError('Failed to load backlog data');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [selectedProjectId]); // Re-run when project changes (or on mount)


    // Drag Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { opacity: 0.1, distance: 3 } // Prevent accidental drags
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const issue = active.data.current?.issue as Issue;
        if (issue) setActiveDragItem(issue);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        let sourceContainerId: string | null = null;
        let destContainerId: string | null = null;

        // Find source
        if (backlogIssues.find(i => i.id === activeId)) sourceContainerId = 'backlog';
        else {
            for (const sId of Object.keys(sprintIssues)) {
                if (sprintIssues[sId].find(i => i.id === activeId)) {
                    sourceContainerId = sId;
                    break;
                }
            }
        }

        // Find destination
        if (overId === 'backlog') destContainerId = 'backlog';
        else if (sprints.find(s => s.id === overId)) destContainerId = overId as string;
        else {
            // Dropped on an item
            if (backlogIssues.find(i => i.id === overId)) destContainerId = 'backlog';
            else {
                for (const sId of Object.keys(sprintIssues)) {
                    if (sprintIssues[sId].find(i => i.id === overId)) {
                        destContainerId = sId;
                        break;
                    }
                }
            }
        }

        if (!sourceContainerId || !destContainerId || sourceContainerId === destContainerId) {
            return;
        }

        const issueId = activeId as string;
        let movedIssue: Issue;

        // Remove from source (Optimistic)
        if (sourceContainerId === 'backlog') {
            const index = backlogIssues.findIndex(i => i.id === issueId);
            movedIssue = backlogIssues[index];
            setBacklogIssues(prev => prev.filter(i => i.id !== issueId));
        } else {
            const index = sprintIssues[sourceContainerId!].findIndex(i => i.id === issueId);
            movedIssue = sprintIssues[sourceContainerId!][index];
            setSprintIssues(prev => ({
                ...prev,
                [sourceContainerId!]: prev[sourceContainerId!].filter(i => i.id !== issueId)
            }));
        }

        // Add to dest (Optimistic)
        if (destContainerId === 'backlog') {
            setBacklogIssues(prev => [movedIssue, ...prev]);
            await issuesApi.assignSprint(null, [issueId]);
        } else {
            setSprintIssues(prev => ({
                ...prev,
                [destContainerId!]: [movedIssue, ...prev[destContainerId!]]
            }));
            await issuesApi.assignSprint(destContainerId, [issueId]);
        }

        success('Issue moved');
    };

    // Handlers
    const handleStartSprint = async (sprintId: string) => {
        try {
            await sprintsApi.start(sprintId);
            success('Sprint started!');
            setSprints(prev => prev.map(s => s.id === sprintId ? { ...s, status: 'ACTIVE' } : s));
        } catch (e) {
            toastError('Failed to start sprint');
        }
    };

    const handleCompleteSprint = async (sprintId: string) => {
        try {
            await sprintsApi.complete(sprintId);
            success('Sprint completed!');
            setSprints(prev => prev.map(s => s.id === sprintId ? { ...s, status: 'COMPLETED' } : s));
        } catch (e) {
            toastError('Failed to complete sprint');
        }
    };

    const handleCreateSprint = () => {
        setEditingSprint(undefined);
        setIsSprintModalOpen(true);
    };

    const handleEditSprint = (sprint: Sprint) => {
        setEditingSprint(sprint);
        setIsSprintModalOpen(true);
    };

    const handleDeleteSprint = async () => {
        if (!sprintToDelete) return;
        setIsDeleteLoading(true);
        try {
            await sprintsApi.delete(sprintToDelete.id);
            setSprints(prev => prev.filter(s => s.id !== sprintToDelete.id));

            // Move issues to backlog locally
            const deletedSprintIssues = sprintIssues[sprintToDelete.id] || [];
            if (deletedSprintIssues.length > 0) {
                setBacklogIssues(prev => [...deletedSprintIssues, ...prev]);
                const newMap = { ...sprintIssues };
                delete newMap[sprintToDelete.id];
                setSprintIssues(newMap);
            }

            success('Sprint deleted');
            setSprintToDelete(null);
        } catch (e) {
            toastError('Failed to delete sprint');
        } finally {
            setIsDeleteLoading(false);
        }
    };

    const handleEditIssue = (issue: Issue) => {
        setEditingIssue(issue);
        setIsCreateModalOpen(true);
    };

    const handleDeleteIssue = (issue: Issue) => {
        // We can reuse the sprint delete confirmation structure or create a new state
        // To be clean, I will use a window.confirm or add a new state.
        // User asked for "make delete button also...". 
        // Let's use a simple confirm for now to be quick, or reuse sprintToDelete if generic.
        // Better: generic Confirmation State.
        setIssueToDelete(issue);
    };

    const confirmDeleteIssue = async () => {
        if (!issueToDelete) return;
        try {
            await issuesApi.delete(issueToDelete.id);
            success('Issue deleted');
            // Optimistic update
            setBacklogIssues(prev => prev.filter(i => i.id !== issueToDelete.id));
            setSprintIssues(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(key => {
                    next[key] = next[key].filter(i => i.id !== issueToDelete.id);
                });
                return next;
            });
            setIssueToDelete(null);
        } catch (e) {
            toastError('Failed to delete issue');
        }
    };

    const fetchSprintsReorder = async () => {
        if (!selectedProjectId) return;
        try {
            const data = await sprintsApi.getProjectSprints(selectedProjectId);
            setSprints(data);
        } catch (e) {
            console.error('Failed to refresh sprints');
        }
    };

    if (loading && projects.length === 0) return <Container><LoadingSkeleton count={3} /></Container>;

    return (
        <Container size="full">
            <div className="flex flex-col h-full gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Backlog</h1>
                    <p className="text-gray-500 dark:text-gray-400">Plan your sprints and manage your backlog.</p>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10 flex-wrap">
                    <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto flex-wrap">
                        <div className="relative">
                            {/* Project Filter (CRITICAL) */}
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="w-full md:w-48 pl-3 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
                            >
                                <option value="" disabled>Select Project</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <input
                            type="text"
                            placeholder="Search issues..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="min-w-[200px] px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        />

                        <div className="flex gap-2 flex-wrap">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm outline-none"
                            >
                                <option value="">All Types</option>
                                <option value="STORY">Story</option>
                                <option value="BUG">Bug</option>
                                <option value="TASK">Task</option>
                                <option value="FEATURE">Feature</option>
                            </select>
                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm outline-none"
                            >
                                <option value="">All Priorities</option>
                                <option value="CRITICAL">Critical</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full xl:w-auto justify-end">
                        <Button variant="secondary" onClick={handleCreateSprint} className="whitespace-nowrap">
                            Create Sprint
                        </Button>
                        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setEditingIssue(undefined); setIsCreateModalOpen(true); }} className="whitespace-nowrap">
                            Create Issue
                        </Button>
                    </div>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="space-y-8">
                        {/* 1. PRODUCT BACKLOG (MOVED TO TOP) */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-0 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wide">📦 Product Backlog</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300">
                                        {backlogIssues.length} items
                                    </span>
                                </div>
                            </div>

                            <div className="p-2 bg-white dark:bg-gray-800">
                                <BacklogContainer issues={backlogIssues} onEditIssue={handleEditIssue} onDeleteIssue={handleDeleteIssue} />
                            </div>
                        </div>

                        {/* 2. SPRINTS SECTION */}
                        <div className="space-y-6">
                            {sprints.map(sprint => (
                                <SprintContainer
                                    key={sprint.id}
                                    sprint={sprint}
                                    issues={sprintIssues[sprint.id] || []}
                                    onStartSprint={handleStartSprint}
                                    onCompleteSprint={handleCompleteSprint}
                                    onEdit={handleEditSprint}
                                    onDelete={setSprintToDelete}
                                    onEditIssue={handleEditIssue}
                                    onDeleteIssue={handleDeleteIssue}
                                />
                            ))}
                        </div>
                    </div>

                    <DragOverlay>
                        {activeDragItem ? (
                            <div className="opacity-90 rotate-2 scale-105">
                                <SortableIssueItem issue={activeDragItem} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>

                <IssueModal
                    isOpen={isCreateModalOpen}
                    onClose={() => { setIsCreateModalOpen(false); setEditingIssue(undefined); }}
                    projectId={selectedProjectId}
                    projects={projects}
                    onSubmit={() => fetchBacklogOnly()}
                    initialData={editingIssue}
                />

                <SprintModal
                    isOpen={isSprintModalOpen}
                    onClose={() => setIsSprintModalOpen(false)}
                    projectId={selectedProjectId}
                    onSubmit={fetchSprintsReorder}
                    initialData={editingSprint}
                />
            </div>

            <ConfirmationModal
                isOpen={!!sprintToDelete}
                onClose={() => setSprintToDelete(null)}
                onConfirm={handleDeleteSprint}
                title="Delete Sprint"
                message={`Are you sure you want to delete "${sprintToDelete?.name}"?`}
                confirmText="Delete Sprint"
                variant="danger"
                isLoading={isDeleteLoading}
            />

            <ConfirmationModal
                isOpen={!!issueToDelete}
                onClose={() => setIssueToDelete(null)}
                onConfirm={confirmDeleteIssue}
                title="Delete Issue"
                message={`Are you sure you want to delete "${issueToDelete?.key}: ${issueToDelete?.title}"?`}
                confirmText="Delete Issue"
                variant="danger"
            />
        </Container>
    );
}
