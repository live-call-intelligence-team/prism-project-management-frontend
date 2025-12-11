
import { useState, useEffect } from 'react';
import { sprintsApi, Sprint } from '@/lib/api/endpoints/sprints';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import { SprintDashboard } from './SprintDashboard';
import Modal from '@/components/ui/Modal';
import { Loader2, Plus, Calendar, CheckCircle, Play, MoreVertical, Edit2, Trash2, BarChart2 } from 'lucide-react';
import { SprintModal } from './SprintModal';
import { Menu } from '@headlessui/react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/lib/store/authStore';
// ... rest imports

interface SprintPlanningViewProps {
    projectId: string;
}

export function SprintPlanningView({ projectId }: SprintPlanningViewProps) {
    const { success, error } = useToast(); // Hook usage
    const user = useAuthStore(state => state.user);
    const canManageSprints = user?.role === 'ADMIN' || user?.role === 'SCRUM_MASTER';
    const [isLoading, setIsLoading] = useState(true);
    const [activeSprint, setActiveSprint] = useState<any | null>(null); // Use any or specific type
    const [plannedSprints, setPlannedSprints] = useState<any[]>([]);
    const [completedSprints, setCompletedSprints] = useState<any[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingSprint, setEditingSprint] = useState<any | undefined>(undefined);
    const [dashboardSprintId, setDashboardSprintId] = useState<string | null>(null);

    // ... loadSprints etc

    useEffect(() => {
        loadSprints();
    }, [projectId]);

    const loadSprints = async () => {
        try {
            setIsLoading(true);
            const data = await sprintsApi.getProjectSprints(projectId);
            const allSprints: any[] = data; // API return type differs slightly in my edited file vs original usage. 
            // Original used 'data.data.sprints'. My endpoint helper returns 'response.data.data.sprints'.
            // So `data` is array.

            setActiveSprint(allSprints.find(s => s.status === 'ACTIVE') || null);
            setPlannedSprints(allSprints.filter(s => s.status === 'PLANNED'));
            setCompletedSprints(allSprints.filter(s => s.status === 'COMPLETED'));
        } catch (err) {
            console.error('Failed to load sprints', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartSprint = async (id: string) => {
        if (activeSprint) {
            error('There is already an active sprint. Complete it first.');
            return;
        }
        try {
            await sprintsApi.start(id);
            success('Sprint started successfully');
            loadSprints();
        } catch (err) {
            error('Failed to start sprint');
        }
    };

    const handleCompleteSprint = async (id: string) => {
        if (!confirm('Are you sure you want to complete this sprint? All incomplete issues will be moved to backlog.')) {
            return;
        }
        try {
            await sprintsApi.complete(id);
            success('Sprint completed successfully');
            loadSprints();
        } catch (err) {
            error('Failed to complete sprint');
        }
    };

    const handleDeleteSprint = async (id: string) => {
        if (!confirm('Are you sure? This will move all issues to backlog.')) return;
        try {
            await sprintsApi.delete(id);
            success('Sprint deleted');
            loadSprints();
        } catch (err) {
            error('Failed to delete sprint');
        }
    };

    const openEdit = (sprint: Sprint) => {
        setEditingSprint(sprint);
        setIsCreateModalOpen(true);
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Sprint Planning</h2>
                <button
                    onClick={() => { setEditingSprint(undefined); setIsCreateModalOpen(true); }}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Sprint
                </button>
            </div>

            {/* Active Sprint */}
            {activeSprint && (
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-green-600 flex items-center">
                        <Play className="w-5 h-5 mr-2" /> Active Sprint
                    </h3>
                    <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-900 rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-xl font-bold mb-1">{activeSprint.name}</h4>
                                <div className="flex items-center text-sm text-gray-500 space-x-4">
                                    <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {format(new Date(activeSprint.startDate), 'MMM d')} - {format(new Date(activeSprint.endDate), 'MMM d')}</span>
                                    <span>{activeSprint.goal ? `Goal: ${activeSprint.goal}` : 'No Goal Set'}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setDashboardSprintId(activeSprint.id)}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center"
                                >
                                    <BarChart2 className="w-4 h-4 mr-2" />
                                    Dashboard
                                </button>
                                {canManageSprints && (
                                    <>
                                        <button
                                            onClick={() => handleCompleteSprint(activeSprint.id)}
                                            className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-200 transition"
                                        >
                                            Complete Sprint
                                        </button>
                                        <button onClick={() => openEdit(activeSprint)} className="p-2 hover:bg-gray-100 rounded text-gray-500">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        {/* Progress Bar (Placeholder for now, can implement real calculation later) */}
                        <div className="mt-6">
                            <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{activeSprint.completedPoints || 0} / {activeSprint.totalPoints || 0} pts</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${activeSprint.totalPoints ? ((activeSprint.completedPoints || 0) / activeSprint.totalPoints) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Planned Sprints */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Planned Sprints</h3>
                <div className="space-y-4">
                    {plannedSprints.length === 0 ? (
                        <p className="text-gray-500 italic">No planned sprints. Create one to get started.</p>
                    ) : (
                        plannedSprints.map((sprint, index) => (
                            <div key={sprint.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 shadow-sm flex justify-between items-center group">
                                <div>
                                    <h4 className="font-bold">{sprint.name}</h4>
                                    <div className="text-sm text-gray-500 flex items-center space-x-3 mt-1">
                                        <span>{format(new Date(sprint.startDate), 'MMM d')} - {format(new Date(sprint.endDate), 'MMM d')}</span>
                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{sprint.issues?.length || 0} issues</span>
                                        <span>{sprint.goal}</span>
                                    </div>
                                </div>
                                {canManageSprints && (
                                    <div className="flex items-center space-x-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!activeSprint && index === 0 && (
                                            <button
                                                onClick={() => handleStartSprint(sprint.id)}
                                                className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-200"
                                            >
                                                START
                                            </button>
                                        )}
                                        <button onClick={() => openEdit(sprint)} className="p-2 hover:bg-gray-100 rounded text-gray-500">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteSprint(sprint.id)} className="p-2 hover:bg-red-50 rounded text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Completed Sprints (Collapsible or Bottom) */}
            {completedSprints.length > 0 && (
                <section className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-500">Completed Sprints</h3>
                    <div className="space-y-2">
                        {completedSprints.slice(0, 3).map(sprint => (
                            <div key={sprint.id} className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-lg p-3 flex justify-between items-center opacity-75">
                                <div>
                                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">{sprint.name}</h4>
                                    <span className="text-xs text-gray-500">Ended {format(new Date(sprint.endDate), 'MMM d, yyyy')}</span>
                                </div>
                                <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                    {sprint.completedPoints} pts done
                                </span>
                                <button
                                    onClick={() => setDashboardSprintId(sprint.id)}
                                    className="ml-4 p-1.5 hover:bg-gray-200 rounded text-gray-500"
                                    title="View Dashboard"
                                >
                                    <BarChart2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <SprintModal
                isOpen={isCreateModalOpen}
                onClose={() => { setIsCreateModalOpen(false); setEditingSprint(undefined); }}
                projectId={projectId}
                onSubmit={loadSprints}
                initialData={editingSprint}
            />

            <Modal
                isOpen={!!dashboardSprintId}
                onClose={() => setDashboardSprintId(null)}
                title="Sprint Dashboard"
                size="xl"
            >
                {dashboardSprintId && (
                    <SprintDashboard sprintId={dashboardSprintId} />
                )}
            </Modal>
        </div>
    );
}
