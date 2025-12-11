'use client';

import { useState, useEffect } from 'react';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { Filter, Search, MoreHorizontal, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { IssueModal } from '@/components/issues/IssueModal';
import { projectsApi } from '@/lib/api/endpoints/projects';

export default function MyWorkPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>(''); // '' = all except done
    const [filterRole, setFilterRole] = useState<'assignee' | 'reporter'>('assignee');
    const { success, error: toastError } = useToast();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);

    const fetchIssues = async (status?: string, role?: 'assignee' | 'reporter') => {
        setLoading(true);
        try {
            const params = {
                status: status || filterStatus,
                role: role || filterRole
            };
            const data = await issuesApi.getMyIssues(params);
            setIssues(data.issues || []);
        } catch (error) {
            console.error(error);
            toastError('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };
    const fetchProjects = async () => {
        try {
            const data = await projectsApi.getAll();
            setProjects(data.projects || []);
        } catch (error) {
            console.error("Failed to fetch projects");
        }
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    useEffect(() => {
        if (isCreateModalOpen) {
            fetchProjects();
        }
    }, [isCreateModalOpen]);

    const handleCreateTask = () => {
        setIsCreateModalOpen(true);
    };

    const handleIssueCreated = () => {
        setIsCreateModalOpen(false);
        fetchIssues();
        success('Task created successfully');
    };

    const handleFilterChange = (status: string) => {
        setFilterStatus(status);
        fetchIssues(status, filterRole);
    };

    const handleRoleChange = (role: 'assignee' | 'reporter') => {
        setFilterRole(role);
        fetchIssues(filterStatus, role);
    };

    const handleStatusUpdate = async (issueId: string, newStatus: string) => {
        try {
            // Optimistic update
            setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus as any } : i));
            await issuesApi.updateStatus(issueId, newStatus);
            success('Status updated');
        } catch (e) {
            toastError('Failed to update status');
            fetchIssues(filterStatus, filterRole); // Revert
        }
    };

    return (
        <Container size="full">
            <div className="flex flex-col h-full gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Work</h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage your tasks and reported issues.</p>
                    </div>
                    <Button onClick={handleCreateTask} leftIcon={<Plus className="w-4 h-4" />}>
                        Create Task
                    </Button>
                </div>

                {/* Tabs & Filters */}
                <div className="space-y-4">
                    {/* Role Tabs */}
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
                        <button
                            onClick={() => handleRoleChange('assignee')}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                filterRole === 'assignee'
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            Assigned to Me
                        </button>
                        <button
                            onClick={() => handleRoleChange('reporter')}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                filterRole === 'reporter'
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            Created by Me
                        </button>
                    </div>

                    {/* Status Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <FilterPill
                            label="Active"
                            isActive={filterStatus === ''}
                            onClick={() => handleFilterChange('')}
                        />
                        <FilterPill
                            label="In Progress"
                            isActive={filterStatus === 'IN_PROGRESS'}
                            onClick={() => handleFilterChange('IN_PROGRESS')}
                        />
                        <FilterPill
                            label="To Do"
                            isActive={filterStatus === 'TODO'}
                            onClick={() => handleFilterChange('TODO')}
                        />
                        <FilterPill
                            label="Done"
                            isActive={filterStatus === 'DONE'}
                            onClick={() => handleFilterChange('DONE')}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="p-4 space-y-4">
                            <LoadingSkeleton count={5} className="h-16" />
                        </div>
                    ) : issues.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {issues.map((issue) => (
                                <TaskRow
                                    key={issue.id}
                                    issue={issue}
                                    onStatusUpdate={handleStatusUpdate}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-lg font-medium">No tasks found</p>
                            <p className="text-sm">
                                {filterRole === 'assignee'
                                    ? "You don't have any assigned tasks."
                                    : "You haven't created any issues yet."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <IssueModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleIssueCreated}
                projects={projects}
            />
        </Container>
    );
}

import { CheckCircle } from 'lucide-react';

function FilterPill({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            )}
        >
            {label}
        </button>
    );
}

function TaskRow({ issue, onStatusUpdate }: { issue: Issue, onStatusUpdate: (id: string, status: string) => void }) {
    return (
        <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-4 group">
            {/* Status Toggle (Simplified) */}
            <button
                onClick={() => onStatusUpdate(issue.id, issue.status === 'DONE' ? 'TODO' : 'DONE')}
                className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    issue.status === 'DONE'
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 dark:border-gray-600 hover:border-primary-500"
                )}
            >
                {issue.status === 'DONE' && <CheckCircle className="w-3.5 h-3.5" />}
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500 font-mono">{issue.key}</span>
                    <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                        issue.priority === 'CRITICAL' && "bg-red-100 text-red-800",
                        issue.priority === 'HIGH' && "bg-orange-100 text-orange-800",
                        issue.priority === 'MEDIUM' && "bg-yellow-100 text-yellow-800",
                        issue.priority === 'LOW' && "bg-gray-100 text-gray-800",
                    )}>
                        {issue.priority}
                    </span>
                    <span className="text-xs text-gray-400">• {issue.project?.name}</span>
                </div>
                <h3 className={cn(
                    "text-sm font-medium text-gray-900 dark:text-white truncate",
                    issue.status === 'DONE' && "line-through text-gray-500"
                )}>
                    {issue.title}
                </h3>
            </div>

            <div className="flex items-center gap-4">
                <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium uppercase",
                    issue.status === 'TODO' && "bg-gray-100 text-gray-700",
                    issue.status === 'IN_PROGRESS' && "bg-blue-100 text-blue-700",
                    issue.status === 'DONE' && "bg-green-100 text-green-700",
                )}>
                    {issue.status.replace('_', ' ')}
                </span>
                {issue.dueDate && (
                    <span className={cn(
                        "text-xs",
                        new Date(issue.dueDate) < new Date() && issue.status !== 'DONE' ? "text-red-600 font-bold" : "text-gray-500"
                    )}>
                        {new Date(issue.dueDate).toLocaleDateString()}
                    </span>
                )}
                {/* <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="w-4 h-4" />
                </Button> */}
            </div>
        </div>
    );
}
