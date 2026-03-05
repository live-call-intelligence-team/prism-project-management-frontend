'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface KanbanColumnProps {
    id: string;
    title: string;
    count: number;
    color: string;
    children: React.ReactNode;
    wipLimit?: number;
}

export function KanbanColumn({ id, title, count, color, children, wipLimit }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id });
    const isOverWip = wipLimit ? count > wipLimit : false;

    return (
        <div className="flex flex-col h-full">
            <div className={cn(
                'flex items-center justify-between px-4 py-3 rounded-t-lg',
                color
            )}>
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                        {title}
                    </h3>
                    {isOverWip && (
                        <span title={`WIP limit exceeded (${wipLimit})`}>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-bold",
                        isOverWip
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                    )}>
                        {count}
                    </span>
                    {wipLimit && (
                        <span className="text-[10px] text-gray-400">/{wipLimit}</span>
                    )}
                </div>
            </div>
            <div
                ref={setNodeRef}
                className={cn(
                    'flex-1 p-3 min-h-[400px] rounded-b-lg border-2 border-dashed transition-colors',
                    isOver ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                )}
            >
                {children}
            </div>
        </div>
    );
}
