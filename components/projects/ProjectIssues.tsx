
'use client';

import { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, List as ListIcon, Loader2, Plus, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { IssuesTable } from '@/components/issues/IssuesTable';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { IssueModal } from '@/components/issues/IssueModal';
import { useToast } from '@/components/ui/Toast';
import { Menu } from '@headlessui/react';

interface ProjectIssuesProps {
    projectId: string;
    initialView?: 'list' | 'board';
    hideViewToggle?: boolean;
}

export function ProjectIssues({ projectId, initialView = 'list', hideViewToggle = false }: ProjectIssuesProps) {
    const [viewMode, setViewMode] = useState<'list' | 'board'>(initialView);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [members, setMembers] = useState<any[]>([]); // Store project members
    const [isLoading, setIsLoading] = useState(true);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [editingIssue, setEditingIssue] = useState<Issue | undefined>(undefined);
    const { success, error } = useToast();

    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [priorityFilter, setPriorityFilter] = useState<string>('');
    const [assigneeFilter, setAssigneeFilter] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 20;

    // Board State
    type GroupBy = 'none' | 'assignee' | 'epic' | 'priority';
    const [groupBy, setGroupBy] = useState<GroupBy>('none');

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [issuesData, membersData] = await Promise.all([
                issuesApi.getAll({
                    projectId,
                    limit: LIMIT,
                    page,
                    search: searchQuery,
                    status: statusFilter || undefined,
                    priority: priorityFilter || undefined,
                    assigneeId: assigneeFilter || undefined,
                    sortBy,
                    sortOrder
                }),
                projectsApi.getMembers(projectId)
            ]);

            setIssues(issuesData.issues);
            setTotalPages(issuesData.pagination.totalPages);
            setMembers(membersData);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [projectId, page, searchQuery, statusFilter, priorityFilter, assigneeFilter, sortBy, sortOrder]);

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const handleIssueSubmit = async (issue: Issue) => {
        setIsIssueModalOpen(false);
        fetchData();
        success(`Issue ${editingIssue ? 'updated' : 'created'} successfully`);
    };

    const handleEditIssue = (issue: Issue) => {
        setEditingIssue(issue);
        setIsIssueModalOpen(true);
    };

    const handleDeleteIssue = async (issue: Issue) => {
        if (confirm('Are you sure you want to delete this issue?')) {
            try {
                await issuesApi.delete(issue.id);
                success('Issue deleted');
                fetchData();
            } catch (e) {
                error('Failed to delete issue');
            }
        }
    };

    const getGroupedIssues = () => {
        if (groupBy === 'none') return { 'All Issues': issues };

        const groups: { [key: string]: Issue[] } = {};
        issues.forEach(issue => {
            let key = 'Unassigned';
            if (groupBy === 'assignee') key = issue.assignee ? issue.assignee.firstName + ' ' + issue.assignee.lastName : 'Unassigned';
            if (groupBy === 'epic') key = issue.epic ? issue.epic.name : 'No Epic';
            if (groupBy === 'priority') key = issue.priority;

            if (!groups[key]) groups[key] = [];
            groups[key].push(issue);
        });
        return groups;
    };

    const groupedData = getGroupedIssues();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4 flex-1">
                    {!hideViewToggle && (
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "p-2 rounded-md transition-all flex items-center text-sm font-medium",
                                    viewMode === 'list'
                                        ? "bg-white dark:bg-gray-700 text-primary-600 shadow-sm"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900"
                                )}
                            >
                                <ListIcon className="w-4 h-4 mr-2" />
                                List
                            </button>
                            <button
                                onClick={() => setViewMode('board')}
                                className={cn(
                                    "p-2 rounded-md transition-all flex items-center text-sm font-medium",
                                    viewMode === 'board'
                                        ? "bg-white dark:bg-gray-700 text-primary-600 shadow-sm"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900"
                                )}
                            >
                                <LayoutGrid className="w-4 h-4 mr-2" />
                                Board
                            </button>
                        </div>
                    )}

                    <div className="flex-1 max-w-md">
                        <Input
                            placeholder="Search issues..."
                            leftIcon={<Search className="w-4 h-4" />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <select
                        className="text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="DONE">Done</option>
                    </select>

                    <select
                        className="text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                        <option value="">All Priorities</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                    </select>

                    <select
                        className="text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500"
                        value={assigneeFilter}
                        onChange={(e) => setAssigneeFilter(e.target.value)}
                    >
                        <option value="">All Assignees</option>
                        {members.map(member => (
                            <option key={member.id || member.user?.id} value={member.id || member.user?.id}>
                                {member.firstName ? `${member.firstName} ${member.lastName}` : (member.user?.firstName + ' ' + member.user?.lastName)}
                            </option>
                        ))}
                    </select>

                    <Button
                        onClick={() => { setEditingIssue(undefined); setIsIssueModalOpen(true); }}
                        leftIcon={<Plus className="w-4 h-4" />}
                    >
                        Create
                    </Button>
                </div>
            </div>

            {/* Sort and Group Options */}
            <div className="flex items-center justify-between text-sm text-gray-500 border-b border-gray-200 dark:border-gray-700 pb-3">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span>Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent border-none text-gray-900 dark:text-gray-200 font-medium focus:ring-0 p-0"
                        >
                            <option value="createdAt">Created Date</option>
                            <option value="updatedAt">Updated Date</option>
                            <option value="dueDate">Due Date</option>
                            <option value="priority">Priority</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        >
                            <ArrowUpDown className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {viewMode === 'board' && (
                    <div className="flex items-center space-x-2">
                        <span>Group By:</span>
                        <select
                            className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-1 focus:ring-primary-500 focus:border-primary-500"
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                        >
                            <option value="none">None</option>
                            <option value="assignee">Assignee</option>
                            <option value="priority">Priority</option>
                            <option value="epic">Epic</option>
                        </select>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : viewMode === 'list' ? (
                <>
                    <IssuesTable
                        issues={issues}
                        onEdit={handleEditIssue}
                        onDelete={handleDeleteIssue}
                        selectedIssues={[]}
                        onSelectionChange={() => { }}
                    />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                            <span className="text-sm text-gray-500">
                                Page {page} of {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                                >
                                    Prev
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    rightIcon={<ChevronRight className="w-4 h-4" />}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-8 pb-4">
                    {/* If empty, show message? No, empty board is fine. */}
                    {Object.keys(groupedData).length === 0 && (
                        <div className="text-center py-10 text-gray-500">No issues found.</div>
                    )}

                    {Object.entries(groupedData).map(([groupName, groupIssues]) => {
                        const groupColumns: { [key: string]: Issue[] } = {
                            'TODO': [],
                            'IN_PROGRESS': [],
                            'IN_REVIEW': [],
                            'DONE': [],
                            'CANCELLED': [] // Handle if status matches backend enum 
                        };

                        groupIssues.forEach((issue) => {
                            // Assuming issue.status matches keys. If backend uses 'TO DO', map it.
                            // The backend enum is TO DO, IN PROGRESS, DONE.
                            // The frontend keys are TODO, IN_PROGRESS, DONE.
                            // We should normalize.
                            // We should normalize.
                            let statusKey = issue.status; // Default


                            if (groupColumns[statusKey]) {
                                groupColumns[statusKey].push(issue);
                            } else if (groupColumns[issue.status]) {
                                groupColumns[issue.status].push(issue);
                            }
                        });


                        return (
                            <div key={groupName} className="space-y-3">
                                {groupBy !== 'none' && (
                                    <h3 className="flex items-center font-semibold text-gray-700 dark:text-gray-300">
                                        <span className={cn("w-2 h-2 rounded-full mr-2",
                                            groupBy === 'priority' && groupName === 'CRITICAL' ? 'bg-red-500' :
                                                groupBy === 'priority' && groupName === 'HIGH' ? 'bg-orange-500' : 'bg-gray-400'
                                        )}></span>
                                        {groupName}
                                        <span className="ml-2 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{groupIssues.length}</span>
                                    </h3>
                                )}

                                <div className="flex overflow-x-auto pb-4 gap-4 snap-x snap-mandatory md:snap-none">
                                    {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map(status => (
                                        <div key={status} className="flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-3 w-[85vw] md:w-[300px] snap-center">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-xs font-semibold text-gray-500 uppercase">{status.replace('_', ' ')}</h4>
                                                <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 rounded text-gray-600 dark:text-gray-300">
                                                    {groupColumns[status]?.length || 0}
                                                </span>
                                            </div>
                                            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1 custom-scrollbar">
                                                {groupColumns[status]?.map(issue => (
                                                    <IssueCard key={issue.id} issue={issue} onClick={() => handleEditIssue(issue)} />
                                                ))}
                                                {(!groupColumns[status] || groupColumns[status].length === 0) && (
                                                    <div className="h-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-400">
                                                        No issues
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <IssueModal
                isOpen={isIssueModalOpen}
                onClose={() => setIsIssueModalOpen(false)}
                onSubmit={handleIssueSubmit}
                initialData={editingIssue}
                projectId={projectId}
            />
        </div>
    );
}

function IssueCard({ issue, onClick }: { issue: Issue; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{issue.key}</span>
                <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium",
                    issue.priority === 'CRITICAL' ? "bg-red-100 text-red-700" :
                        issue.priority === 'HIGH' ? "bg-orange-100 text-orange-700" :
                            "bg-gray-100 text-gray-700"
                )}>
                    {issue.priority}
                </span>
            </div>
            {issue.feature && (
                <div className="mb-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 flex items-center w-fit">
                        Feature: {issue.feature.name}
                    </span>
                </div>
            )}
            {issue.epic && !issue.feature && (
                <div className="mb-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 flex items-center w-fit">
                        Epic: {issue.epic.name}
                    </span>
                </div>
            )}
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 line-clamp-2">
                {issue.title}
            </h4>
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                    {issue.assignee ? (
                        <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-[10px] text-primary-700">
                            {issue.assignee.firstName[0]}{issue.assignee.lastName[0]}
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">?</div>
                    )}
                </div>
                <span className="text-[10px] text-gray-500">
                    {new Date(issue.updatedAt).toLocaleDateString()}
                </span>
            </div>
        </div>
    )
}
