'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Filter, MoreVertical, Play, CheckCircle, Edit, Trash, Archive, AlertTriangle, Layers, Clock, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { sprintsApi, Sprint, projectsApi, Project } from '@/lib/api/endpoints';
import { cn } from '@/lib/utils';
import { SprintModal } from '@/components/sprints/SprintModal';
import { useToast } from '@/components/ui/Toast';
import { format, differenceInDays, isPast } from 'date-fns';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function SprintsPage() {
    const { success, error: toastError } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSprint, setEditingSprint] = useState<Sprint | undefined>(undefined);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Load projects on mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await projectsApi.getAll();
                setProjects(data.projects || []);
                // Auto-select first project
                if (data.projects?.length > 0 && !selectedProjectId) {
                    setSelectedProjectId(data.projects[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch projects:', err);
            }
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        const fetchSprints = async () => {
            if (!selectedProjectId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const data = await sprintsApi.getProjectSprints(selectedProjectId);
                setSprints(data);
            } catch (err) {
                console.error('Error fetching sprints:', err);
                setError('Failed to load sprints');
            } finally {
                setLoading(false);
            }
        };

        fetchSprints();
    }, [selectedProjectId, refreshTrigger]);

    // Formatters
    const formatDate = (dateStr: string) => format(new Date(dateStr), 'MMM d, yyyy');
    const getDuration = (start: string, end: string) => {
        const days = differenceInDays(new Date(end), new Date(start));
        return `${days} days`;
    };

    // Actions
    const handleCreate = () => {
        setEditingSprint(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (sprint: Sprint) => {
        setEditingSprint(sprint);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this sprint? This action cannot be undone.')) return;
        try {
            await sprintsApi.delete(id);
            success('Sprint deleted successfully');
            setRefreshTrigger(p => p + 1);
        } catch (err) {
            toastError('Failed to delete sprint');
        }
    };

    const handleStartSprint = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await sprintsApi.start(id);
            success('Sprint started successfully!');
            setRefreshTrigger(p => p + 1);
        } catch (err: any) {
            toastError(err.response?.data?.message || 'Failed to start sprint');
        }
    };

    const handleCompleteSprint = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Complete this sprint? Incomplete issues will be moved to backlog.')) return;
        try {
            await sprintsApi.complete(id);
            success('Sprint completed!');
            setRefreshTrigger(p => p + 1);
        } catch (err: any) {
            toastError(err.response?.data?.message || 'Failed to complete sprint');
        }
    };

    // One-time fix for duplicates
    const handleFixDuplicates = async () => {
        if (!window.confirm('Auto-rename all sprints sequentially by date? (SPRINT-1, SPRINT-2...)')) return;
        try {
            // Sort by date
            const sorted = [...sprints].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
            for (let i = 0; i < sorted.length; i++) {
                const newName = `Sprint ${i + 1}`;
                const newKey = `SPRINT-${i + 1}`;
                if (sorted[i].name !== newName || sorted[i].key !== newKey) {
                    await sprintsApi.update(sorted[i].id, { name: newName, key: newKey });
                }
            }
            success('Sprints renamed successfully');
            setRefreshTrigger(p => p + 1);
        } catch (err) {
            toastError('Failed to rename sprints');
        }
    };

    // Filter Logic
    const filteredSprints = sprints
        .filter(s => statusFilter === 'ALL' || s.status === statusFilter)
        .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()));

    const getSparklineData = (sprint: Sprint) => {
        // Mocking sparkline data based on progress for now as we don't have daily history endpoints yet
        // A real implementation would fetch burndown history
        const total = sprint.totalPoints || 0;
        const remaining = total - (sprint.completedPoints || 0);
        return [
            { day: 1, points: total },
            { day: 2, points: Math.max(total - 5, remaining + 5) },
            { day: 3, points: Math.max(total - 10, remaining + 2) },
            { day: 4, points: remaining }
        ];
    };

    return (
        <Container size="2xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sprints</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage and track all sprint cycles
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {/* Fix Data Button (Temporary) */}
                        <Button variant="outline" size="sm" onClick={handleFixDuplicates} className="text-orange-600 border-orange-200 hover:bg-orange-50">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Fix Names
                        </Button>
                        <Button onClick={handleCreate} leftIcon={<Plus className="w-4 h-4" />}>
                            Create Sprint
                        </Button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex gap-4 w-full md:w-auto">
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="" disabled>Select Project</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>

                        <div className="relative flex-1 md:w-64">
                            <Input
                                placeholder="Search sprints..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        {['ALL', 'PLANNED', 'ACTIVE', 'COMPLETED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                                    statusFilter === status
                                        ? "bg-primary-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                )}
                            >
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sprints Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <LoadingSkeleton variant="card" count={6} />
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-red-500">{error}</div>
                ) : filteredSprints.length === 0 ? (
                    <EmptyState
                        icon={Calendar}
                        title="No sprints found"
                        description="Try adjusting your filters or create a new sprint."
                        action={{ label: "Create Sprint", onClick: handleCreate }}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredSprints.map((sprint) => {
                            const totalPoints = sprint.totalPoints || sprint.issues?.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0) || 0;
                            const completedPoints = sprint.completedPoints || sprint.issues?.reduce((sum, issue) => sum + (issue.status === 'DONE' ? (issue.storyPoints || 0) : 0), 0) || 0;
                            const progress = totalPoints ? (completedPoints / totalPoints) * 100 : 0;
                            const daysRemaining = Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                            const isDelayed = sprint.status === 'ACTIVE' && daysRemaining < 0;

                            return (
                                <Card key={sprint.id} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary-500 relative overflow-hidden">
                                    {/* Top Status & Type Badges */}
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                            sprint.status === 'ACTIVE' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                                            sprint.status === 'PLANNED' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                                            sprint.status === 'COMPLETED' && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                        )}>
                                            {sprint.status}
                                        </span>
                                    </div>

                                    {/* Action Buttons (Top Right) */}
                                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-1">
                                        <button onClick={() => handleEdit(sprint)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Edit">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(sprint.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md" title="Delete">
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <CardContent className="pt-10 pb-4 px-5">
                                        {/* Header Info */}
                                        <div className="mb-4">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate" title={sprint.name}>
                                                {sprint.name}
                                            </h3>
                                            {sprint.project && (
                                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    <Layers className="w-3 h-3 mr-1" />
                                                    {sprint.project.name}
                                                </div>
                                            )}
                                        </div>

                                        {/* Avatars */}
                                        <div className="absolute top-12 right-5">
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {(sprint.sprintMembers || []).slice(0, 3).map((member) => (
                                                    <div key={member.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                                        {member.user?.avatar ? (
                                                            <img src={member.user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                                                        ) : (
                                                            (member.user?.firstName?.[0] || 'U')
                                                        )}
                                                    </div>
                                                ))}
                                                {(sprint.sprintMembers?.length || 0) > 3 && (
                                                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-500">
                                                        +{(sprint.sprintMembers?.length || 0) - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Metrics & Sparkline */}
                                        <div className="mt-4 mb-4">
                                            <div className="flex justify-between items-end mb-2">
                                                <div>
                                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                        {Math.round(progress)}%
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {completedPoints} / {totalPoints} pts
                                                    </div>
                                                </div>
                                                {/* Mini Sparkline */}
                                                <div className="h-10 w-24">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={getSparklineData(sprint)}>
                                                            <Line type="monotone" dataKey="points" stroke="#6366f1" strokeWidth={2} dot={false} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-primary-600 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>

                                        {/* Meta Data */}
                                        <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
                                            <div className="flex items-center gap-1.5" title="Duration">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                {getDuration(sprint.startDate, sprint.endDate)}
                                            </div>
                                            <div className="flex items-center gap-1.5 justify-end" title="Date Range">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                                            </div>

                                            {sprint.status === 'ACTIVE' && (
                                                <div className={cn("col-span-2 flex items-center gap-1.5 mt-1 font-medium", isDelayed ? "text-red-500" : "text-green-600")}>
                                                    <TrendingUp className="w-3.5 h-3.5" />
                                                    {daysRemaining > 0 ? `${daysRemaining} days remaining` : `${Math.abs(daysRemaining)} days overdue`}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons (Start/Complete) */}
                                        <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                            {sprint.status === 'PLANNED' && (
                                                <Button size="sm" onClick={(e) => handleStartSprint(sprint.id, e)} className="w-full flex justify-center py-1.5 h-auto text-xs">
                                                    <Play className="w-3 h-3 mr-1.5" /> Start Sprint
                                                </Button>
                                            )}
                                            {sprint.status === 'ACTIVE' && (
                                                <Button size="sm" variant="secondary" onClick={(e) => handleCompleteSprint(sprint.id, e)} className="w-full flex justify-center py-1.5 h-auto text-xs hover:bg-green-50 hover:text-green-700 hover:border-green-200">
                                                    <CheckCircle className="w-3 h-3 mr-1.5" /> Complete Sprint
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Create/Edit Modal */}
                <SprintModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    projectId={selectedProjectId}
                    onSubmit={() => setRefreshTrigger(p => p + 1)}
                    initialData={editingSprint}
                />
            </div>
        </Container>
    );
}
