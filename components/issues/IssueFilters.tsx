'use client';

import { Search, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface IssueFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    currentFilters: {
        type: string;
        priority: string;
        status: string;
        assigneeId: string;
    };
    onFilterChange: (key: string, value: string) => void;
    onClearFilters: () => void;
}

export function IssueFilters({
    searchQuery,
    onSearchChange,
    currentFilters,
    onFilterChange,
    onClearFilters
}: IssueFiltersProps) {
    const hasActiveFilters =
        currentFilters.type !== 'all' ||
        currentFilters.priority !== 'all' ||
        currentFilters.status !== 'all' ||
        currentFilters.assigneeId !== 'all';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="flex-1 w-full md:w-auto relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search issues by title or key..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className={cn(
                            'w-full pl-10 pr-4 py-2 rounded-lg border',
                            'bg-gray-50 dark:bg-gray-900',
                            'border-gray-300 dark:border-gray-600',
                            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                            'text-gray-900 dark:text-white',
                            'placeholder:text-gray-400'
                        )}
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row flex-wrap gap-3 w-full md:w-auto">
                    <select
                        value={currentFilters.type}
                        onChange={(e) => onFilterChange('type', e.target.value)}
                        className="w-full md:w-auto px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option value="all">All Types</option>
                        <option value="BUG">Bug</option>
                        <option value="TASK">Task</option>
                        <option value="STORY">Story</option>
                        <option value="EPIC">Epic</option>
                    </select>

                    <select
                        value={currentFilters.priority}
                        onChange={(e) => onFilterChange('priority', e.target.value)}
                        className="w-full md:w-auto px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option value="all">All Priorities</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>

                    <select
                        value={currentFilters.status}
                        onChange={(e) => onFilterChange('status', e.target.value)}
                        className="w-full md:w-auto px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option value="all">All Statuses</option>
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="DONE">Done</option>
                    </select>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearFilters}
                            leftIcon={<X className="w-4 h-4" />}
                            className="w-full md:w-auto"
                        >
                            Clear
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
