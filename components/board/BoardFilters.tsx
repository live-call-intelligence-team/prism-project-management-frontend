'use client';

import { Search, X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface BoardFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    assignee: string;
    onAssigneeChange: (value: string) => void;
    priority: string;
    onPriorityChange: (value: string) => void;
    label: string;
    onLabelChange: (value: string) => void;
    onClear: () => void;
}

export function BoardFilters({
    search,
    onSearchChange,
    assignee,
    onAssigneeChange,
    priority,
    onPriorityChange,
    label,
    onLabelChange,
    onClear
}: BoardFiltersProps) {
    const hasActiveFilters = search || assignee || priority || label;

    return (
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search board..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
            </div>

            <div className="flex w-full md:w-auto gap-3 overflow-x-auto pb-2 md:pb-0">
                <select
                    value={assignee}
                    onChange={(e) => onAssigneeChange(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Assignees</option>
                    <option value="me">Assigned to Me</option>
                    <option value="unassigned">Unassigned</option>
                </select>

                <select
                    value={priority}
                    onChange={(e) => onPriorityChange(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Priorities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                </select>

                <select
                    value={label}
                    onChange={(e) => onLabelChange(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Labels</option>
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                    <option value="design">Design</option>
                </select>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClear}
                        className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Clear
                    </Button>
                )}
            </div>
        </div>
    );
}
