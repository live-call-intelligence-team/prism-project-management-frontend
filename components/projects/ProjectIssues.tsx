
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { LayoutGrid, List as ListIcon, Loader2, Plus, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Layers, Target, AlertTriangle, Link2 } from 'lucide-react';
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
    const [viewMode, setViewMode] = useState<'list' | 'board' | 'hierarchy'>(initialView as any);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [hierarchyData, setHierarchyData] = useState<{ epics: Issue[]; unassigned: Issue[] } | null>(null);
    const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
    const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
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
    type GroupBy = 'none' | 'assignee' | 'epic' | 'priority' | 'type';
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
            // Also fetch hierarchy for the hierarchy view
            try {
                const hData = await issuesApi.getHierarchy(projectId);
                setHierarchyData(hData);
            } catch (_) { }
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
            if (groupBy === 'type') key = issue.type || 'TASK';

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
                            {(['list', 'hierarchy', 'board'] as const).map(v => (
                                <button key={v} onClick={() => setViewMode(v)}
                                    className={cn("p-2 rounded-md transition-all flex items-center text-sm font-medium",
                                        viewMode === v ? "bg-white dark:bg-gray-700 text-primary-600 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900"
                                    )}>
                                    {v === 'list' && <><ListIcon className="w-4 h-4 mr-1.5" />List</>}
                                    {v === 'hierarchy' && <><Layers className="w-4 h-4 mr-1.5" />Hierarchy</>}
                                    {v === 'board' && <><LayoutGrid className="w-4 h-4 mr-1.5" />Board</>}
                                </button>
                            ))}
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
                            <option value="type">Type</option>
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
            ) : viewMode === 'hierarchy' ? (
                <HierarchyView
                    hierarchyData={hierarchyData}
                    unassigned={hierarchyData?.unassigned || issues.filter(i => !i.epicId)}
                    expandedEpics={expandedEpics}
                    expandedFeatures={expandedFeatures}
                    toggleEpic={(id) => { const s = new Set(expandedEpics); s.has(id) ? s.delete(id) : s.add(id); setExpandedEpics(s); }}
                    toggleFeature={(id) => { const s = new Set(expandedFeatures); s.has(id) ? s.delete(id) : s.add(id); setExpandedFeatures(s); }}
                    onEdit={handleEditIssue}
                />
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
    const typeEmojis: Record<string, string> = {
        BUG: '🐛', FEATURE: '✨', STORY: '📖', TASK: '✅',
        EPIC: '🏔️', SUB_TASK: '📋', IMPROVEMENT: '📈'
    };

    const dueDate = issue.dueDate ? new Date(issue.dueDate) : null;
    const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    const isOverdue = daysUntilDue != null && daysUntilDue < 0 && issue.status !== 'DONE';
    const isDueSoon = daysUntilDue != null && daysUntilDue >= 0 && daysUntilDue <= 2 && issue.status !== 'DONE';

    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-white dark:bg-gray-800 p-3.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer",
                isOverdue && "border-l-4 border-l-red-500",
                isDueSoon && !isOverdue && "border-l-4 border-l-amber-500"
            )}
        >
            {/* Header: Key + Type + Priority */}
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm">{typeEmojis[issue.type || 'TASK'] || '📌'}</span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{issue.key}</span>
                </div>
                <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium",
                    issue.priority === 'CRITICAL' ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" :
                        issue.priority === 'HIGH' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" :
                            issue.priority === 'MEDIUM' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
                                "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                )}>
                    {issue.priority}
                </span>
            </div>

            {/* Hierarchy badges */}
            <div className="flex flex-wrap gap-1 mb-2">
                {issue.epic && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        🎯 {issue.epic.name}
                    </span>
                )}
                {issue.feature && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                        📦 {issue.feature.name}
                    </span>
                )}
            </div>

            {/* Title */}
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 line-clamp-2">
                {issue.title}
            </h4>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {issue.assignee ? (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[9px] text-white font-medium">
                            {issue.assignee.firstName?.[0]}{issue.assignee.lastName?.[0]}
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] text-gray-500">?</div>
                    )}
                    {(issue as any).storyPoints > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 font-medium">
                            ⚡ {(issue as any).storyPoints}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    {isOverdue && (
                        <span className="text-[9px] text-red-500 font-medium">{Math.abs(daysUntilDue!)}d late</span>
                    )}
                    {isDueSoon && !isOverdue && (
                        <span className="text-[9px] text-amber-500 font-medium">{daysUntilDue}d left</span>
                    )}
                    <span className="text-[10px] text-gray-400">
                        {new Date(issue.updatedAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>
    );
}

// Hierarchy View Component
function HierarchyView({ hierarchyData, unassigned, expandedEpics, expandedFeatures, toggleEpic, toggleFeature, onEdit }: {
    hierarchyData: { epics: Issue[]; unassigned: Issue[] } | null;
    unassigned: Issue[];
    expandedEpics: Set<string>;
    expandedFeatures: Set<string>;
    toggleEpic: (id: string) => void;
    toggleFeature: (id: string) => void;
    onEdit: (issue: Issue) => void;
}) {
    if (!hierarchyData && unassigned.length === 0) return <div className="text-center py-12 text-gray-400">No hierarchy data. Try List view.</div>;
    const epics = hierarchyData?.epics || [];
    const statusEmoji: Record<string, string> = { TODO: '⚪', IN_PROGRESS: '🟡', IN_REVIEW: '🔵', DONE: '🟢', BLOCKED: '🔴', CANCELLED: '⛔' };
    const prioColors: Record<string, string> = { CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400', MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' };

    const IRow = ({ issue, indent = 0 }: { issue: Issue; indent?: number }) => {
        const dd = issue.dueDate ? new Date(issue.dueDate) : null;
        const dl = dd ? Math.ceil((dd.getTime() - Date.now()) / 86400000) : null;
        const ov = dl != null && dl < 0 && issue.status !== 'DONE';
        return (
            <div onClick={() => onEdit(issue)} style={{ paddingLeft: `${indent * 20 + 12}px` }}
                className={cn("flex items-center gap-2 py-2 px-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer text-sm", issue.status === 'BLOCKED' && 'bg-red-50/30 dark:bg-red-900/5')}>
                <span className="w-4 text-center">{statusEmoji[issue.status] || '⚪'}</span>
                <span className="text-[9px] font-mono text-gray-400 w-20 flex-shrink-0">{issue.key}</span>
                <span className="flex-1 min-w-0 truncate text-gray-900 dark:text-white font-medium text-xs">{issue.title}</span>
                {issue.status === 'BLOCKED' && <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-bold flex-shrink-0">BLOCKED</span>}
                {issue.links && issue.links.length > 0 && <Link2 className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium flex-shrink-0", prioColors[issue.priority] || prioColors.LOW)}>{issue.priority}</span>
                {issue.assignee ? <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[7px] text-white font-bold flex-shrink-0">{issue.assignee.firstName?.[0]}{issue.assignee.lastName?.[0]}</div> : <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[7px] text-gray-500 flex-shrink-0">?</div>}
                {issue.storyPoints ? <span className="text-[9px] px-1 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 font-medium flex-shrink-0">⚡{issue.storyPoints}</span> : null}
                {dd && <span className={cn("text-[9px] flex-shrink-0", ov ? 'text-red-500 font-bold' : dl != null && dl <= 5 ? 'text-amber-500' : 'text-gray-400')}>{ov ? `${Math.abs(dl!)}d late` : dd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
            </div>
        );
    };

    return (
        <div className="space-y-3">
            {epics.map(epic => {
                const isExp = expandedEpics.has(epic.id);
                const ch = epic.childIssues || [];
                const dn = ch.filter(c => c.status === 'DONE').length;
                const pct = ch.length > 0 ? Math.round((dn / ch.length) * 100) : 0;
                const blk = ch.filter(c => c.status === 'BLOCKED').length;
                const byF: Record<string, Issue[]> = {}; const noF: Issue[] = [];
                ch.forEach(c => { if (c.feature) { const k = c.feature.id; if (!byF[k]) byF[k] = []; byF[k].push(c); } else noF.push(c); });
                return (
                    <div key={epic.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <button onClick={() => toggleEpic(epic.id)} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
                            {isExp ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                            <span>🎯</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2"><h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">{epic.title}</h3><span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 font-medium">{ch.length} issues</span>{blk > 0 && <span className="text-[9px] text-red-500 font-bold">🔴{blk}</span>}</div>
                                <div className="flex items-center gap-2 mt-1"><div className="flex-1 max-w-[200px] h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"><div className={cn("h-1.5 rounded-full", pct >= 80 ? 'bg-green-500' : pct >= 40 ? 'bg-blue-500' : 'bg-amber-500')} style={{ width: `${pct}%` }} /></div><span className="text-[10px] text-gray-500">{dn}/{ch.length} ({pct}%)</span></div>
                            </div>
                        </button>
                        {isExp && (
                            <div className="border-t border-gray-200 dark:border-gray-700">
                                {Object.entries(byF).map(([fId, fi]) => {
                                    const fExp = expandedFeatures.has(fId);
                                    const fDn = fi.filter(i => i.status === 'DONE').length;
                                    const fPct = fi.length > 0 ? Math.round((fDn / fi.length) * 100) : 0;
                                    return (
                                        <div key={fId}>
                                            <button onClick={(e) => { e.stopPropagation(); toggleFeature(fId); }} className="w-full flex items-center gap-2 py-2 px-3 pl-8 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 text-left">
                                                {fExp ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                                                <span className="text-xs">📦</span><span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex-1 truncate">{fi[0]?.feature?.name || 'Feature'}</span>
                                                <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"><div className={cn("h-1 rounded-full", fPct >= 80 ? 'bg-green-500' : 'bg-blue-500')} style={{ width: `${fPct}%` }} /></div>
                                                <span className="text-[9px] text-gray-400">{fDn}/{fi.length}</span>
                                            </button>
                                            {fExp && fi.map(issue => <IRow key={issue.id} issue={issue} indent={3} />)}
                                        </div>
                                    );
                                })}
                                {noF.map(issue => <IRow key={issue.id} issue={issue} indent={1} />)}
                            </div>
                        )}
                    </div>
                );
            })}
            {unassigned.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700"><h3 className="font-bold text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" />Unassigned to Epic <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">{unassigned.length}</span></h3></div>
                    {unassigned.slice(0, 20).map(issue => <IRow key={issue.id} issue={issue} indent={0} />)}
                    {unassigned.length > 20 && <div className="p-2 text-center text-xs text-gray-400">+ {unassigned.length - 20} more</div>}
                </div>
            )}
        </div>
    );
}
