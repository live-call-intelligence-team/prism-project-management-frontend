'use client';

import { useState, useEffect } from 'react';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import Container from '@/components/ui/Container';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { EmployeeKanbanBoard } from '@/components/employee/EmployeeKanbanBoard'; // New component
import { RefreshCw, Layout, Layers, Filter } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function EmployeeBoardPage() {
    const [myIssues, setMyIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupBy, setGroupBy] = useState<'NONE' | 'EPIC'>('NONE');
    const [search, setSearch] = useState('');

    const loadIssues = async () => {
        try {
            setLoading(true);
            const issuesData = await issuesApi.getMyIssues();
            setMyIssues(issuesData.issues || []);
        } catch (error) {
            console.error('Failed to load issues:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadIssues();
        const interval = setInterval(loadIssues, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredIssues = myIssues.filter(issue => {
        if (!search) return true;
        const term = search.toLowerCase();
        return issue.title.toLowerCase().includes(term) ||
            issue.key.toLowerCase().includes(term);
    });

    if (loading && myIssues.length === 0) {
        return (
            <Container>
                <div className="space-y-6">
                    <LoadingSkeleton count={1} className="h-16 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <LoadingSkeleton count={4} className="h-96" />
                    </div>
                </div>
            </Container>
        );
    }

    return (
        <Container size="full">
            <div className="space-y-6">
                {/* Header with Tools */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Layout className="w-6 h-6 text-primary-500" />
                            My Board
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {filteredIssues.length} tasks assigned to you
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search issues..."
                                className="pl-3 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 w-48 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* View Switcher/Group By */}
                        <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setGroupBy('NONE')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${groupBy === 'NONE'
                                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Columns
                            </button>
                            <button
                                onClick={() => setGroupBy('EPIC')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${groupBy === 'EPIC'
                                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Layers className="w-3 h-3" />
                                Swimlanes
                            </button>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadIssues}
                            leftIcon={<RefreshCw className="w-4 h-4" />}
                        >
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Kanban Board */}
                <EmployeeKanbanBoard
                    issues={filteredIssues}
                    onIssueUpdate={loadIssues}
                    groupBy={groupBy}
                />
            </div>
        </Container>
    );
}

