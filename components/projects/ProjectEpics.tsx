'use client';

import { useState, useEffect, useMemo } from 'react';
import { epicsApi, Epic } from '@/lib/api/endpoints/epics';
import { CreateEpicModal } from './CreateEpicModal';
import { EpicCard } from './EpicCard';
import { Plus, Layers, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';

interface ProjectEpicsProps {
    projectId: string;
    hideHeader?: boolean;
    hideCreateButton?: boolean;
    headerLevel?: 'h2' | 'h3';
    hideFilters?: boolean;
}

type GroupByOption = 'none' | 'status' | 'priority';
type SortByOption = 'name' | 'priority' | 'progress' | 'createdAt';

const STATUS_ORDER: Record<string, number> = { OPEN: 0, IN_PROGRESS: 1, ON_HOLD: 2, CLOSED: 3 };
const PRIORITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const STATUS_COLORS: Record<string, string> = {
    OPEN: 'border-l-blue-500',
    IN_PROGRESS: 'border-l-amber-500',
    ON_HOLD: 'border-l-yellow-500',
    CLOSED: 'border-l-green-500',
};

export function ProjectEpics({
    projectId,
    hideHeader = false,
    hideCreateButton = false,
    headerLevel = 'h2',
    hideFilters = false
}: ProjectEpicsProps) {
    const [epics, setEpics] = useState<Epic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingEpic, setEditingEpic] = useState<Epic | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [groupBy, setGroupBy] = useState<GroupByOption>('status');
    const [sortBy, setSortBy] = useState<SortByOption>('priority');

    const user = useAuthStore(state => state.user);
    const canCreate = (user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && !hideCreateButton;

    const fetchEpics = async () => {
        setIsLoading(true);
        try {
            const data = await epicsApi.getAll(projectId, statusFilter || undefined, search || undefined);
            setEpics(data);
        } catch (error) {
            console.error('Failed to fetch epics', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEpics();
    }, [projectId, statusFilter, search]);

    const handleCreateEpic = async (data: any) => {
        if (editingEpic) {
            await epicsApi.update(editingEpic.id, data);
        } else {
            await epicsApi.create({ ...data, projectId });
        }
        setIsCreateModalOpen(false);
        setEditingEpic(undefined);
        fetchEpics();
    };

    const handleDeleteEpic = async (id: string) => {
        if (!confirm('Are you sure you want to delete this Epic? All children Features will be unlinked.')) return;
        try {
            await epicsApi.delete(id);
            fetchEpics();
        } catch (error) {
            console.error('Failed to delete epic', error);
        }
    };

    const openCreateModal = () => { setEditingEpic(undefined); setIsCreateModalOpen(true); };
    const openEditModal = (epic: Epic) => { setEditingEpic(epic); setIsCreateModalOpen(true); };

    // Sort epics
    const sortedEpics = useMemo(() => {
        return [...epics].sort((a, b) => {
            switch (sortBy) {
                case 'priority': return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
                case 'progress': return (b.stats?.progress || 0) - (a.stats?.progress || 0);
                case 'name': return a.name.localeCompare(b.name);
                default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });
    }, [epics, sortBy]);

    // Group epics
    const groupedEpics = useMemo(() => {
        if (groupBy === 'none') return { 'All Epics': sortedEpics };

        const groups: Record<string, Epic[]> = {};
        sortedEpics.forEach(epic => {
            const key = groupBy === 'status' ? epic.status : epic.priority;
            if (!groups[key]) groups[key] = [];
            groups[key].push(epic);
        });

        // Sort groups by logical order
        const order = groupBy === 'status' ? STATUS_ORDER : PRIORITY_ORDER;
        const sorted = Object.entries(groups).sort(([a], [b]) => (order[a] ?? 9) - (order[b] ?? 9));
        return Object.fromEntries(sorted);
    }, [sortedEpics, groupBy]);

    // Quick stats
    const stats = useMemo(() => ({
        total: epics.length,
        open: epics.filter(e => e.status === 'OPEN').length,
        inProgress: epics.filter(e => e.status === 'IN_PROGRESS').length,
        closed: epics.filter(e => e.status === 'CLOSED').length,
        avgProgress: epics.length > 0 ? Math.round(epics.reduce((sum, e) => sum + (e.stats?.progress || 0), 0) / epics.length) : 0,
    }), [epics]);

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading Epics...</div>;
    }

    return (
        <div className="space-y-6">
            {!hideHeader && (
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-4">
                        {headerLevel === 'h2' ? (
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Epics</h2>
                        ) : (
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Epics</h3>
                        )}
                    </div>
                    {canCreate && (
                        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
                            Create Epic
                        </Button>
                    )}
                </div>
            )}

            {/* Quick Stats Bar */}
            {epics.length > 0 && (
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 text-sm overflow-x-auto">
                    <div className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold">{stats.total}</span> <span className="text-gray-500">Epics</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <div className="flex gap-3">
                        <span className="text-blue-600 font-medium">{stats.open} Open</span>
                        <span className="text-amber-600 font-medium">{stats.inProgress} In Progress</span>
                        <span className="text-green-600 font-medium">{stats.closed} Closed</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-1.5">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${stats.avgProgress}%` }} />
                        </div>
                        <span className="text-xs font-medium">{stats.avgProgress}% avg</span>
                    </div>
                </div>
            )}

            {/* Filters & Controls */}
            {!hideFilters && (
                <div className="flex items-center gap-3 flex-wrap">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                        <option value="">All Statuses</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="CLOSED">Closed</option>
                    </select>

                    <select
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                        <option value="none">No Grouping</option>
                        <option value="status">Group by Status</option>
                        <option value="priority">Group by Priority</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortByOption)}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                        <option value="priority">Sort: Priority</option>
                        <option value="progress">Sort: Progress</option>
                        <option value="name">Sort: Name</option>
                        <option value="createdAt">Sort: Newest</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Search epics..."
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-8 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-48"
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            )}

            {epics.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Epics yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                        Epics break down large initiatives into manageable features and tasks.
                    </p>
                    {canCreate && <Button onClick={openCreateModal}>Start your first Epic</Button>}
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedEpics).map(([group, groupEpics]) => (
                        <div key={group}>
                            {groupBy !== 'none' && (
                                <div className="flex items-center gap-2 mb-3">
                                    <h4 className={cn(
                                        "text-sm font-bold uppercase tracking-wider px-2 py-1 rounded",
                                        group === 'OPEN' || group === 'LOW' ? 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300' :
                                            group === 'IN_PROGRESS' || group === 'MEDIUM' ? 'text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300' :
                                                group === 'ON_HOLD' || group === 'HIGH' ? 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300' :
                                                    group === 'CLOSED' ? 'text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300' :
                                                        group === 'CRITICAL' ? 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300' :
                                                            'text-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-300'
                                    )}>
                                        {group.replace('_', ' ')}
                                    </h4>
                                    <span className="text-xs text-gray-400">({groupEpics.length})</span>
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-4">
                                {groupEpics.map((epic) => (
                                    <EpicCard
                                        key={epic.id}
                                        epic={epic}
                                        onEdit={openEditModal}
                                        onDelete={handleDeleteEpic}
                                        canEdit={canCreate || false}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateEpicModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateEpic}
                projectId={projectId}
                initialData={editingEpic ? {
                    ...editingEpic,
                    tags: editingEpic.tags ? editingEpic.tags.join(', ') : undefined
                } : undefined}
            />
        </div>
    );
}
