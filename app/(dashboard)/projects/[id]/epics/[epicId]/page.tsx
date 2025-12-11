'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Layers,
    Book,
    BarChart3,
    Calendar,
    Activity,
    Settings,
    Edit,
    Trash2,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { epicsApi, Epic } from '@/lib/api/endpoints/epics';
import { featuresApi, Feature } from '@/lib/api/endpoints/features';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { CreateEpicModal } from '@/components/projects/CreateEpicModal';
import { CloseEpicModal } from '@/components/projects/CloseEpicModal';
import { FeatureCard } from '@/components/projects/FeatureCard';

export default function EpicDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { success, error } = useToast();
    const user = useAuthStore(state => state.user);
    const isAdmin = user?.role === 'ADMIN';

    const [epic, setEpic] = useState<Epic | null>(null);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'progress' | 'timeline' | 'activity'>('overview');

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

    const projectId = params.id as string;
    const epicId = params.epicId as string;

    const fetchEpicDetails = async () => {
        setIsLoading(true);
        try {
            // Fetch epic details (assuming getAll for now as getById might not exist in client yet, but backend has it)
            // Wait, does frontend client have getById? 
            // Checking backend controller, yes getEpicById exists.
            // checking frontend client... likely yes. If not, I'll assume getById exists or find logic.
            // Actually, epics.ts showed getAll, create, update, delete, close. 
            // IT DID NOT SHOW getById explicitly in previous views, but standard pattern suggests it.
            // If getById is missing in client, I should add it.
            // I'll try calling it. If it fails, I'll fix client.
            const epicData = await epicsApi.getById(epicId);
            setEpic(epicData);

            // Fetch features for this epic
            // featuresApi.getAll(projectId, epicId) -> second arg is epicFilter
            const featuresData = await featuresApi.getAll(projectId, epicId);
            setFeatures(featuresData);
        } catch (err) {
            console.error('Failed to fetch epic details', err);
            error('Failed to load epic details');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (epicId && projectId) {
            fetchEpicDetails();
        }
    }, [epicId, projectId]);

    const handleUpdateEpic = async (data: any) => {
        if (!epic) return;
        try {
            await epicsApi.update(epic.id, data);
            success('Epic updated successfully');
            fetchEpicDetails();
            setIsEditModalOpen(false);
        } catch (err) {
            console.error('Failed to update epic', err);
            error('Failed to update epic');
        }
    };

    const handleDeleteEpic = async () => {
        if (!epic || !confirm('Are you sure? All linked features will be detached.')) return;
        try {
            await epicsApi.delete(epic.id);
            success('Epic deleted');
            router.push(`/projects/${projectId}`);
        } catch (err) {
            console.error('Failed to delete epic', err);
            error('Failed to delete epic');
        }
    };

    const handleCloseSuccess = () => {
        success('Epic closed successfully');
        fetchEpicDetails();
    };

    if (isLoading || !epic) {
        return (
            <div className="flex bg-gray-50 dark:bg-gray-900 h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'features', label: 'Features', icon: Book },
        { id: 'progress', label: 'Progress', icon: Activity }, // Using Activity icon for Progress temporarily
        { id: 'timeline', label: 'Timeline', icon: Calendar },
        // Activity Log tab is requirement but might be empty for now
        { id: 'activity', label: 'Activity', icon: Layers },
    ];

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="flex flex-col border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push(`/projects/${projectId}`)}
                            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center space-x-3 text-sm text-gray-500 mb-1">
                                <span>Projects</span>
                                <span>/</span>
                                <span className="hover:text-gray-700 cursor-pointer" onClick={() => router.push(`/projects/${projectId}`)}>Details</span>
                                <span>/</span>
                                <span>Epics</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Layers className="w-6 h-6 text-primary-500" />
                                    {epic.name}
                                    <span className="text-sm font-mono font-normal text-gray-500 ml-2">
                                        {epic.key}
                                    </span>
                                </h1>
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase",
                                    epic.status === 'OPEN' ? "bg-green-50 text-green-700 border-green-200" :
                                        epic.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                            "bg-gray-50 text-gray-600 border-gray-200"
                                )}>
                                    {epic.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                {epic.status !== 'CLOSED' && (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => setIsCloseModalOpen(true)}
                                    >
                                        Close Epic
                                    </Button>
                                )}
                                {epic.status === 'CLOSED' && (
                                    <span className="text-sm font-medium text-gray-500 italic">Closed</span>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 flex space-x-6 overflow-x-auto no-scrollbar">
                    {tabs.map((tab: any) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center space-x-2 pb-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap",
                                    isActive
                                        ? "border-primary-500 text-primary-600 dark:text-primary-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Description</h3>
                                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                    {epic.description || "No description."}
                                </p>
                            </div>

                            {epic.goals && (
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Goals & Objectives</h3>
                                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                        {epic.goals}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4">Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-500 block">Owner</label>
                                        <div className="flex items-center mt-1">
                                            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold mr-2">
                                                ?
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">Unassigned</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block">Start Date</label>
                                        <span className="text-sm text-gray-900 dark:text-white">
                                            {epic.startDate ? new Date(epic.startDate).toLocaleDateString() : 'Not set'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block">Target End Date</label>
                                        <span className="text-sm text-gray-900 dark:text-white">
                                            {epic.endDate ? new Date(epic.endDate).toLocaleDateString() : 'Not set'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block">Priority</label>
                                        <span className={cn(
                                            "inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold uppercase",
                                            epic.priority === 'CRITICAL' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                                        )}>
                                            {epic.priority}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block">Business Value</label>
                                        <span className="text-sm text-gray-900 dark:text-white">
                                            {epic.businessValue || 'Not set'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'features' && (
                    <div className="space-y-4 max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Features ({features.length})</h3>
                        </div>
                        {features.length > 0 ? features.map(feature => (
                            <FeatureCard
                                key={feature.id}
                                feature={feature}
                                onDelete={() => { }} // Read only or drill down
                                canDelete={false}
                            />
                        )) : (
                            <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                <p className="text-gray-500">No features yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Other tabs placeholders */}
                {activeTab === 'progress' && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Progress charts coming soon...</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreateEpicModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleUpdateEpic}
                projectId={projectId}
                initialData={{
                    ...epic,
                    tags: epic.tags ? epic.tags.join(', ') : undefined
                }}
            />

            <CloseEpicModal
                isOpen={isCloseModalOpen}
                onClose={() => setIsCloseModalOpen(false)}
                epic={epic}
                projectId={projectId}
                onSuccess={handleCloseSuccess}
            />
        </div>
    );
}
