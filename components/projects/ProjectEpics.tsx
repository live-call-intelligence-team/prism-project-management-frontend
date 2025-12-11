'use client';

import { useState, useEffect } from 'react';
import { epicsApi, Epic } from '@/lib/api/endpoints/epics';
import { CreateEpicModal } from './CreateEpicModal';
import { EpicCard } from './EpicCard';
import { Plus, Layers } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/lib/store/authStore';

interface ProjectEpicsProps {
    projectId: string;
    hideHeader?: boolean;
    hideCreateButton?: boolean;
    headerLevel?: 'h2' | 'h3';
    hideFilters?: boolean;
}

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

    const user = useAuthStore(state => state.user);
    // Strict RBAC: Only ADMIN can create Epics
    // Strict RBAC: Only ADMIN and PM can create Epics
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

    const openCreateModal = () => {
        setEditingEpic(undefined);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (epic: Epic) => {
        setEditingEpic(epic);
        setIsCreateModalOpen(true);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading Epics...</div>;
    }

    return (
        <div className="space-y-6">
            {!hideHeader && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {headerLevel === 'h2' ? (
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Epics</h2>
                        ) : (
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Epics</h3>
                        )}
                        {!hideFilters && (
                            <div className="flex items-center space-x-3">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="OPEN">Open</option>
                                    <option value="ON_HOLD">On Hold</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search epics..."
                                        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-8 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-primary-500 focus:border-primary-500 w-48"
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {canCreate && (
                        <Button
                            onClick={openCreateModal}
                            leftIcon={<Plus className="w-4 h-4" />}
                        >
                            Create Epic
                        </Button>
                    )}
                </div>
            )}

            {epics.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Epics yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                        Epics break down large initiatives into manageable features and tasks.
                    </p>
                    {canCreate && (
                        <Button onClick={openCreateModal}>Start your first Epic</Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {epics.map((epic) => (
                        <EpicCard
                            key={epic.id}
                            epic={epic}
                            onEdit={openEditModal}
                            onDelete={handleDeleteEpic}
                            canEdit={canCreate || false}
                        />
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
