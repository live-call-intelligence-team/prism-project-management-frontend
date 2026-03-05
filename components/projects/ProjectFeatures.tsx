'use client';

import { useState, useEffect, useMemo } from 'react';
import { featuresApi, Feature } from '@/lib/api/endpoints/features';
import { epicsApi, Epic } from '@/lib/api/endpoints/epics';
import { CreateFeatureModal } from './CreateFeatureModal';
import { EditFeatureModal } from './EditFeatureModal';
import { FeatureCard } from './FeatureCard';
import { Plus, Book, LayoutGrid, List as ListIcon, Layers, Search, TrendingUp, Target, CheckCircle, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function ProjectFeatures({ projectId }: { projectId: string }) {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [epics, setEpics] = useState<Epic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grouped' | 'board'>('list');
    const [epicFilter, setEpicFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const user = useAuthStore(state => state.user);
    const canCreate = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER' || user?.role === 'SCRUM_MASTER';

    const fetchFeatures = async () => {
        setIsLoading(true);
        try {
            const [featuresData, epicsData] = await Promise.all([
                featuresApi.getAll(projectId, epicFilter || undefined, statusFilter || undefined),
                epicsApi.getAll(projectId)
            ]);
            setFeatures(featuresData);
            setEpics(epicsData);
        } catch (error) {
            console.error('Failed to fetch features', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchFeatures(); }, [projectId, epicFilter, statusFilter]);

    const handleCreateFeature = async (data: any) => {
        await featuresApi.create({ ...data, projectId });
        fetchFeatures();
    };

    const handleEditFeature = (feature: Feature) => {
        setSelectedFeature(feature);
        setIsEditModalOpen(true);
    };

    const handleUpdateFeature = async (id: string, data: Partial<Feature>) => {
        await featuresApi.update(id, data);
        fetchFeatures();
    };

    const handleDeleteFeature = async (id: string) => {
        if (!confirm('Are you sure you want to delete this Feature? All linked issues will be unlinked.')) return;
        try {
            await featuresApi.delete(id);
            fetchFeatures();
        } catch (error) {
            console.error('Failed to delete feature', error);
        }
    };

    // Filtered features by search
    const filteredFeatures = useMemo(() => {
        if (!searchQuery) return features;
        const q = searchQuery.toLowerCase();
        return features.filter(f => f.name.toLowerCase().includes(q) || f.key.toLowerCase().includes(q));
    }, [features, searchQuery]);

    // Summary stats
    const stats = useMemo(() => {
        const total = features.length;
        const done = features.filter(f => f.status === 'CLOSED').length;
        const inProgress = features.filter(f => f.status === 'IN_PROGRESS').length;
        const totalSP = features.reduce((s, f) => s + (f.storyPoints || 0), 0);
        const avgProgress = total > 0 ? Math.round(features.reduce((s, f) => s + (f.stats?.progress || 0), 0) / total) : 0;
        return { total, done, inProgress, totalSP, avgProgress };
    }, [features]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    const featureStatuses = ['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'CLOSED'];

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <Book className="w-3 h-3 text-blue-500" />
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Done</span>
                    </div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.done}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Active</span>
                    </div>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.inProgress}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                            <TrendingUp className="w-3 h-3 text-purple-500" />
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Story Pts</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalSP}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                            <Target className="w-3 h-3 text-indigo-500" />
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.avgProgress}%</p>
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                            <div className="h-2 bg-indigo-500 rounded-full transition-all" style={{ width: `${stats.avgProgress}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search features..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Epic Filter */}
                    <select
                        value={epicFilter}
                        onChange={(e) => setEpicFilter(e.target.value)}
                        className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">All Epics</option>
                        {epics.map(e => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="TO_DO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="CLOSED">Done</option>
                    </select>

                    {/* View Toggle */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-primary-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}
                            title="List View"
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grouped')}
                            className={cn("p-1.5 rounded-md transition-all", viewMode === 'grouped' ? "bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-primary-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}
                            title="Grouped by Epic"
                        >
                            <Layers className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={cn("p-1.5 rounded-md transition-all", viewMode === 'board' ? "bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-primary-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}
                            title="Board View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>

                    {canCreate && (
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            leftIcon={<Plus className="w-4 h-4" />}
                        >
                            New Feature
                        </Button>
                    )}
                </div>
            </div>

            {filteredFeatures.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Features found</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                        {epicFilter || statusFilter || searchQuery ? "No features match the current filters." : "Create features to organize your work."}
                    </p>
                    {canCreate && (
                        <Button onClick={() => setIsCreateModalOpen(true)}>Add your first Feature</Button>
                    )}
                </div>
            ) : (
                <>
                    {viewMode === 'list' ? (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredFeatures.map((feature) => (
                                <FeatureCard
                                    key={feature.id}
                                    feature={feature}
                                    onDelete={handleDeleteFeature}
                                    onEdit={handleEditFeature}
                                    canDelete={canCreate || false}
                                    canEdit={canCreate || false}
                                />
                            ))}
                        </div>
                    ) : viewMode === 'grouped' ? (
                        <div className="space-y-8">
                            {epics.map(epic => {
                                const epicFeatures = filteredFeatures.filter(f => f.epicId === epic.id);
                                if (epicFeatures.length === 0) return null;
                                const epicDone = epicFeatures.filter(f => f.status === 'CLOSED').length;
                                const epicProgress = epicFeatures.length > 0 ? Math.round((epicDone / epicFeatures.length) * 100) : 0;
                                return (
                                    <div key={epic.id} className="space-y-3">
                                        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                            <Layers className="w-4 h-4 text-purple-500" />
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm tracking-wide flex-1">
                                                {epic.name}
                                            </h3>
                                            {epic.key && <span className="text-xs text-gray-400 font-mono">{epic.key}</span>}
                                            <span className="text-xs text-gray-500">{epicFeatures.length} features</span>
                                            <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                <div className="h-1.5 bg-purple-500 rounded-full transition-all" style={{ width: `${epicProgress}%` }} />
                                            </div>
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{epicProgress}%</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {epicFeatures.map((feature) => (
                                                <FeatureCard key={feature.id} feature={feature} onDelete={handleDeleteFeature} onEdit={handleEditFeature} canDelete={canCreate || false} canEdit={canCreate || false} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Independent Features */}
                            {filteredFeatures.filter(f => !f.epicId).length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                                        <Book className="w-4 h-4 text-gray-500" />
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm tracking-wide">
                                            Independent Features
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {filteredFeatures.filter(f => !f.epicId).map((feature) => (
                                            <FeatureCard key={feature.id} feature={feature} onDelete={handleDeleteFeature} onEdit={handleEditFeature} canDelete={canCreate || false} canEdit={canCreate || false} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            {featureStatuses.map(status => {
                                const statusFeatures = filteredFeatures.filter(f => f.status === status);
                                const statusLabels: Record<string, string> = { 'TO_DO': 'To Do', 'IN_PROGRESS': 'In Progress', 'IN_REVIEW': 'In Review', 'CLOSED': 'Done' };
                                return (
                                    <div key={status} className="flex-none w-80">
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-3 h-full">
                                            <div className="flex items-center justify-between mb-3 px-1">
                                                <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                                                    {statusLabels[status] || status}
                                                </h3>
                                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full">
                                                    {statusFeatures.length}
                                                </span>
                                            </div>
                                            <div className="space-y-3">
                                                {statusFeatures.map(feature => (
                                                    <FeatureCard key={feature.id} feature={feature} onDelete={handleDeleteFeature} onEdit={handleEditFeature} canDelete={canCreate || false} canEdit={canCreate || false} />
                                                ))}
                                                {statusFeatures.length === 0 && (
                                                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                                        No features
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            <CreateFeatureModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateFeature}
                projectId={projectId}
            />

            <EditFeatureModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setSelectedFeature(null); }}
                onSubmit={handleUpdateFeature}
                projectId={projectId}
                feature={selectedFeature}
            />
        </div>
    );
}
