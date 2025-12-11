'use client';

import { useState, useEffect } from 'react';
import { featuresApi, Feature } from '@/lib/api/endpoints/features';
import { epicsApi, Epic } from '@/lib/api/endpoints/epics'; // Import epicsApi
import { CreateFeatureModal } from './CreateFeatureModal';
import { FeatureCard } from './FeatureCard'; // Import FeatureCard
import { Plus, Book, LayoutGrid, List as ListIcon, Layers } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function ProjectFeatures({ projectId }: { projectId: string }) {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [epics, setEpics] = useState<Epic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grouped' | 'board'>('list');
    const [epicFilter, setEpicFilter] = useState('');

    const user = useAuthStore(state => state.user);
    // Strict RBAC: ADMIN, PM and SCRUM_MASTER can create Features
    const canCreate = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER' || user?.role === 'SCRUM_MASTER';

    const fetchFeatures = async () => {
        setIsLoading(true);
        try {
            const [featuresData, epicsData] = await Promise.all([
                featuresApi.getAll(projectId, epicFilter || undefined),
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

    useEffect(() => {
        fetchFeatures();
    }, [projectId, epicFilter]);

    const handleCreateFeature = async (data: any) => {
        await featuresApi.create({ ...data, projectId });
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

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading Features...</div>;
    }

    const featureStatuses = ['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'CLOSED'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Features</h2>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Epic Filter */}
                    <select
                        value={epicFilter}
                        onChange={(e) => setEpicFilter(e.target.value)}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">All Epics</option>
                        {epics.map(e => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                    </select>

                    {/* View Toggle */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                viewMode === 'list'
                                    ? "bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-primary-400"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            )}
                            title="List View"
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grouped')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                viewMode === 'grouped'
                                    ? "bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-primary-400"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            )}
                            title="Grouped by Epic"
                        >
                            <Layers className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                viewMode === 'board'
                                    ? "bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-primary-400"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            )}
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

            {features.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Features found</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                        {epicFilter ? "No features match the selected epic." : "Create features to organize your work."}
                    </p>
                    {canCreate && (
                        <Button onClick={() => setIsCreateModalOpen(true)}>Add your first Feature</Button>
                    )}
                </div>
            ) : (
                <>
                    {viewMode === 'list' ? (
                        // Flat List
                        <div className="grid grid-cols-1 gap-4">
                            {features.map((feature) => (
                                <FeatureCard
                                    key={feature.id}
                                    feature={feature}
                                    onDelete={handleDeleteFeature}
                                    canDelete={canCreate || false}
                                />
                            ))}
                        </div>
                    ) : viewMode === 'grouped' ? (
                        // Grouped by Epics
                        <div className="space-y-8">
                            {epics.map(epic => {
                                const epicFeatures = features.filter(f => f.epicId === epic.id);
                                if (epicFeatures.length === 0) return null;
                                return (
                                    <div key={epic.id} className="space-y-3">
                                        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                                            <Layers className="w-4 h-4 text-gray-500" />
                                            <h3 className="font-semibold text-gray-900 dark:text-white uppercase text-sm tracking-wide">
                                                {epic.name}
                                            </h3>
                                            {epic.key && <span className="text-xs text-gray-500">({epic.key})</span>}
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {epicFeatures.map((feature) => (
                                                <FeatureCard
                                                    key={feature.id}
                                                    feature={feature}
                                                    onDelete={handleDeleteFeature}
                                                    canDelete={canCreate || false}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Independent Features */}
                            {features.filter(f => !f.epicId).length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                                        <Book className="w-4 h-4 text-gray-500" />
                                        <h3 className="font-semibold text-gray-900 dark:text-white uppercase text-sm tracking-wide">
                                            Independent Features
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {features.filter(f => !f.epicId).map((feature) => (
                                            <FeatureCard
                                                key={feature.id}
                                                feature={feature}
                                                onDelete={handleDeleteFeature}
                                                canDelete={canCreate || false}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            {featureStatuses.map(status => {
                                const statusFeatures = features.filter(f => f.status === status);
                                return (
                                    <div key={status} className="flex-none w-80">
                                        <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-3 h-full">
                                            <div className="flex items-center justify-between mb-3 px-1">
                                                <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                                                    {status.replace('_', ' ')}
                                                </h3>
                                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full">
                                                    {statusFeatures.length}
                                                </span>
                                            </div>
                                            <div className="space-y-3">
                                                {statusFeatures.map(feature => (
                                                    <FeatureCard
                                                        key={feature.id}
                                                        feature={feature}
                                                        onDelete={handleDeleteFeature}
                                                        canDelete={canCreate || false}
                                                    />
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
        </div>
    );
}
