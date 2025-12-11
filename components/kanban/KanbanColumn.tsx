'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
    id: string;
    title: string;
    count: number;
    color: string;
    children: React.ReactNode;
}

export function KanbanColumn({ id, title, count, color, children }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div className="flex flex-col h-full">
            <div className={cn(
                'flex items-center justify-between px-4 py-3 rounded-t-lg',
                color
            )}>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                    {title}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-900 text-xs font-bold text-gray-700 dark:text-gray-300">
                    {count}
                </span>
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
