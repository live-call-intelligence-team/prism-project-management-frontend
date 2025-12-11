'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Issue, issuesApi } from '@/lib/api/endpoints/issues';
import { useToast } from '@/components/ui/Toast';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { IssueDetailModal } from '../issues/IssueDetailModal';

type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

interface KanbanBoardProps {
    issues: Issue[];
    onIssueUpdate?: () => void;
}

const COLUMNS: { id: IssueStatus; title: string; color: string }[] = [
    { id: 'TODO', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/20' },
    { id: 'IN_REVIEW', title: 'In Review', color: 'bg-purple-100 dark:bg-purple-900/20' },
    { id: 'DONE', title: 'Done', color: 'bg-green-100 dark:bg-green-900/20' },
];

export function KanbanBoard({ issues, onIssueUpdate }: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
    const [groupedIssues, setGroupedIssues] = useState<Record<IssueStatus, Issue[]>>({
        TODO: [],
        IN_PROGRESS: [],
        IN_REVIEW: [],
        DONE: [],
    });
    const { success, error } = useToast();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        // Group issues by status
        const grouped: Record<IssueStatus, Issue[]> = {
            TODO: [],
            IN_PROGRESS: [],
            IN_REVIEW: [],
            DONE: [],
        };

        issues.forEach((issue) => {
            const status = issue.status as IssueStatus;
            if (grouped[status]) {
                grouped[status].push(issue);
            }
        });

        setGroupedIssues(grouped);
    }, [issues]);

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeIssue = issues.find((i) => i.id === active.id);
        const overColumn = COLUMNS.find((col) => col.id === over.id);

        if (!activeIssue || !overColumn) {
            setActiveId(null);
            return;
        }

        // If dropped in same column, do nothing
        if (activeIssue.status === overColumn.id) {
            setActiveId(null);
            return;
        }

        try {
            // Update issue status via API
            await issuesApi.update(activeIssue.id, {
                status: overColumn.id,
            });

            success(`Task moved to ${overColumn.title}`);
            onIssueUpdate?.();
        } catch (err) {
            console.error('Failed to update issue:', err);
            error('Failed to update task status');
        } finally {
            setActiveId(null);
        }
    };

    const activeIssue = issues.find((i) => i.id === activeId);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {COLUMNS.map((column) => (
                    <KanbanColumn
                        key={column.id}
                        id={column.id}
                        title={column.title}
                        count={groupedIssues[column.id].length}
                        color={column.color}
                    >
                        <SortableContext
                            items={groupedIssues[column.id].map((i) => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-3">
                                {groupedIssues[column.id].map((issue) => (
                                    <KanbanCard
                                        key={issue.id}
                                        issue={issue}
                                        onClick={() => setSelectedIssueId(issue.id)}
                                    />
                                ))}
                                {groupedIssues[column.id].length === 0 && (
                                    <div className="text-center text-sm text-gray-400 py-8">
                                        No tasks
                                    </div>
                                )}
                            </div>
                        </SortableContext>
                    </KanbanColumn>
                ))}
            </div>

            <DragOverlay>
                {activeIssue ? (
                    <div className="opacity-50">
                        <KanbanCard issue={activeIssue} />
                    </div>
                ) : null}
            </DragOverlay>

            <IssueDetailModal
                issueId={selectedIssueId}
                isOpen={!!selectedIssueId}
                onClose={() => setSelectedIssueId(null)}
                onUpdate={onIssueUpdate}
            />
        </DndContext>
    );
}
