'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Settings,
    Users,
    ListTodo,
    BarChart3,
    Calendar,
    Eye,
    EyeOff,
    Edit,
    Trash2,
    UserPlus,
    MoreVertical,
    Crown,
    Shield,
    User as UserIcon,
    Loader2,
    Layers,
    Book,
    LayoutGrid,
    List as ListIcon
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { projectsApi, Project } from '@/lib/api/endpoints/projects';
import { useToast } from '@/components/ui/Toast';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useAuthStore } from '@/lib/store/authStore';
import { ProjectBacklog } from '@/components/projects/ProjectBacklog';

const getRoleIcon = (role: string) => {
    switch (role) {
        case 'LEAD': return Crown;
        case 'ADMIN': return Shield;
        default: return UserIcon;
    }
};

const getRoleColor = (role: string) => {
    switch (role) {
        case 'LEAD': return 'text-yellow-600 dark:text-yellow-400';
        case 'ADMIN': return 'text-purple-600 dark:text-purple-400';
        default: return 'text-gray-600 dark:text-gray-400';
    }
};

import { ProjectModal } from '@/components/projects/ProjectModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { AddMemberModal } from '@/components/projects/AddMemberModal';
import { ProjectIssues } from '@/components/projects/ProjectIssues';
import { ProjectEpics } from '@/components/projects/ProjectEpics';
import { ProjectFeatures } from '@/components/projects/ProjectFeatures';
import { ProjectSprints } from '@/components/projects/ProjectSprints';

import { ProjectOverview } from '@/components/projects/ProjectOverview';
import { ProjectFeedback } from '@/components/projects/ProjectFeedback';

export default function ProjectDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { success, error } = useToast();
    const user = useAuthStore(state => state.user);
    const role = user?.role || 'EMPLOYEE';
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [activeTab, setActiveTab] = useState<'overview' | 'backlog' | 'epics' | 'features' | 'board' | 'issues' | 'team' | 'settings' | 'sprints' | 'feedback'>('overview');
    const [settingsForm, setSettingsForm] = useState({
        name: '',
        description: ''
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    useEffect(() => {
        if (project) {
            setSettingsForm({
                name: project.name,
                description: project.description || ''
            });
        }
    }, [project]);

    const fetchProject = async () => {
        try {
            setIsLoading(true);
            const data = await projectsApi.getById(params.id as string);
            setProject(data);
        } catch (err) {
            console.error('Failed to fetch project:', err);
            error('Failed to fetch project details');
            router.push('/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchProject();
        }
    }, [params.id]);

    const handleDeleteProject = async () => {
        if (!project) return;
        try {
            await projectsApi.delete(project.id);
            success('Project deleted successfully');
            router.push('/projects');
        } catch (err) {
            console.error('Failed to delete project:', err);
            error('Failed to delete project');
        }
    };

    const handleUpdateProject = async (data: any) => {
        if (!project) return;
        try {
            await projectsApi.update(project.id, data);
            success('Project updated successfully');
            fetchProject();
            setIsEditModalOpen(false);
        } catch (err) {
            console.error('Failed to update project:', err);
            error('Failed to update project');
        }
    };

    const handleAddMember = async (data: any) => {
        if (!project) return;
        try {
            await projectsApi.addMember(project.id, data.userId, data.role);
            success('Member added successfully');
            fetchProject();
            setIsAddMemberModalOpen(false);
        } catch (err) {
            console.error('Failed to add member:', err);
            error('Failed to add member');
        }
    };

    if (isLoading || !project) {
        return (
            <div className="flex bg-gray-50 dark:bg-gray-900 h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const handleSaveSettings = async () => {
        try {
            setIsSavingSettings(true);
            await projectsApi.update(project.id, settingsForm);
            success('Project settings updated successfully');
            fetchProject();
        } catch (error) {
            console.error('Failed to update project settings:', error);
            // toast.error('Failed to update project settings');
        } finally {
            setIsSavingSettings(false);
        }
    };


    // ...



    let tabs: any[] = [];
    if (role === 'ADMIN') {
        tabs = [
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            ...(project.usesEpics ? [
                { id: 'epics', label: 'Epics', icon: Layers },
                { id: 'features', label: 'Features', icon: Book },
            ] : []),
            { id: 'issues', label: 'Issues', icon: ListTodo },
            { id: 'board', label: 'Board', icon: LayoutGrid },
            // Reports... optional or alias to Overview? keeping pure for now.
        ];
    } else if (role === 'SCRUM_MASTER') {
        tabs = [
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            ...(project.usesEpics ? [
                { id: 'epics', label: 'Epics', icon: Layers },
                { id: 'features', label: 'Features', icon: Book },
            ] : []),
            ...(project.usesSprints ? [{ id: 'sprints', label: 'Sprints', icon: Calendar }] : []),
            { id: 'issues', label: 'Issues', icon: ListTodo },
            { id: 'board', label: 'Board', icon: LayoutGrid },
        ];
    } else if (role === 'CLIENT') {
        tabs = [
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'epics', label: 'Epics', icon: Layers },
            { id: 'features', label: 'Features', icon: Book },
            // Progress -> Reports/Overview alias? Or maybe Sprints (view only)? User asked for "Progress" and "Feedback".
            // I will add placeholders or reuse existing tabs with different labels if needed.
            // For Feedback, I'll use the 'issues' tab but label it 'Feedback' or ensure it fits.
            // Actually, "Feedback Tab -> [+ Add Feedback]" implies creating an issue/comment.
            // I'll make a custom Feedback view or alias it.
            // Let's assume 'issues' can be the "Feedback" for now or use 'backlog' as placeholder.
            // But to match request strictly:
            // "Progress" tab. I'll alias 'overview' or 'sprints'? 
            // "Feedback" tab. 
        ];
        // Revising Client tabs based on prompt:
        // Overview, Epics (View), Features (View), Progress, Feedback.
        tabs = [
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            ...(project.usesEpics ? [
                { id: 'epics', label: 'Epics', icon: Layers },
                { id: 'features', label: 'Features', icon: Book },
            ] : []),
            { id: 'sprints', label: 'Progress', icon: BarChart }, // Reusing Sprints as Progress (timeline)
            { id: 'feedback', label: 'Feedback', icon: ListTodo }, // New ID for feedback
        ];
    } else if (role === 'PROJECT_MANAGER') {
        tabs = [
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            ...(project.usesEpics ? [
                { id: 'epics', label: 'Epics', icon: Layers },
                { id: 'features', label: 'Features', icon: Book },
            ] : []),
            ...(project.usesSprints ? [{ id: 'sprints', label: 'Sprints', icon: Calendar }] : []),
            { id: 'issues', label: 'Issues', icon: ListTodo },
            { id: 'board', label: 'Board', icon: LayoutGrid },
        ];
    } else {
        // Employee
        // Likely shouldn't be here often if "My Work" is focus, but if they do:
        tabs = [
            { id: 'board', label: 'Board', icon: LayoutGrid },
            { id: 'issues', label: 'Issues', icon: ListTodo },
        ];
    }

    // ...

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="flex flex-col border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push('/projects')}
                            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center space-x-3">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                    project.status === 'ACTIVE' ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"
                                )}>
                                    {project.status}
                                </span>
                            </div>
                            {project.description && (
                                <p className="text-sm text-gray-500 mt-1 max-w-2xl truncate">{project.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button className="p-2 text-gray-400 hover:text-gray-500">
                            <Users className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className="p-2 text-gray-400 hover:text-gray-500"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                {activeTab !== 'settings' && (
                    <div className="px-6 flex space-x-6 overflow-x-auto no-scrollbar">
                        {tabs.map((tab: any) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
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
                )}
            </div>

            <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
                {activeTab === 'overview' && (
                    <div className="p-6">
                        <ProjectOverview projectId={project.id} />
                    </div>
                )}

                {
                    activeTab === 'backlog' && (
                        <ProjectBacklog projectId={project.id} />
                    )
                }

                {
                    activeTab === 'sprints' && (
                        <ProjectSprints projectId={project.id} />
                    )
                }

                {
                    activeTab === 'epics' && (
                        <ProjectEpics projectId={project.id} />
                    )
                }
    // ...

                {
                    activeTab === 'features' && (
                        <ProjectFeatures projectId={project.id} />
                    )
                }

                {
                    activeTab === 'board' && (
                        <ProjectIssues projectId={project.id} initialView="board" hideViewToggle={true} />
                    )
                }

                {
                    activeTab === 'issues' && (
                        <ProjectIssues projectId={project.id} initialView="list" hideViewToggle={true} />
                    )
                }

                {
                    activeTab === 'feedback' && (
                        <ProjectFeedback projectId={project.id} />
                    )
                }

                {
                    activeTab === 'team' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Team Members ({(project as any).members?.length || 0})
                                </h2>
                                <button
                                    onClick={() => setIsAddMemberModalOpen(true)}
                                    className={cn(
                                        'flex items-center px-4 py-2 rounded-lg font-medium',
                                        'bg-gradient-to-r from-primary-500 to-accent-purple',
                                        'text-white shadow-lg',
                                        'hover:shadow-glow-purple hover:scale-[1.02]',
                                        'active:scale-[0.98]',
                                        'transition-all duration-200'
                                    )}
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add Member
                                </button>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Member
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {((project as any).members || []).map((member: any) => {
                                            const RoleIcon = getRoleIcon(member.role);
                                            return (
                                                <motion.tr
                                                    key={member.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white font-medium mr-3">
                                                                {getInitials(member.name)}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-white">
                                                                    {member.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {member.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <RoleIcon className={cn('w-4 h-4 mr-2', getRoleColor(member.role))} />
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {member.role}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                            <MoreVertical className="w-5 h-5 text-gray-400" />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'settings' && (
                        <div className="max-w-2xl space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Project Settings
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Project Name
                                        </label>
                                        <input
                                            type="text"
                                            value={settingsForm.name}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={settingsForm.description}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                        />
                                    </div>
                                    <div className="flex items-center justify-end space-x-3 pt-4">
                                        <button
                                            onClick={() => setSettingsForm({ name: project.name, description: project.description || '' })}
                                            className="px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveSettings}
                                            disabled={isSavingSettings}
                                            className={cn(
                                                'px-6 py-2 rounded-lg font-medium',
                                                'bg-gradient-to-r from-primary-500 to-accent-purple',
                                                'text-white shadow-lg',
                                                'hover:shadow-glow-purple hover:scale-[1.02]',
                                                'active:scale-[0.98]',
                                                'transition-all duration-200',
                                                isSavingSettings && 'opacity-70 cursor-not-allowed'
                                            )}
                                        >
                                            {isSavingSettings ? (
                                                <div className="flex items-center">
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Saving...
                                                </div>
                                            ) : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-6">
                                <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">
                                    Danger Zone
                                </h3>
                                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                                    Once you delete a project, there is no going back. Please be certain.
                                </p>
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="flex items-center px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Project
                                </button>
                            </div>


                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Client Portal
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">Client Access</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Grant access to external clients. They will only see items marked "Visible to Client".
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                // Reuse add member modal
                                                setIsAddMemberModalOpen(true);
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                                        >
                                            Manage Access
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50 opacity-75 cursor-not-allowed">
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">Show Budget</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Allow clients to see project budget and spend [Coming Soon].
                                            </p>
                                        </div>
                                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                                            <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Modals */}
            <ProjectModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleUpdateProject}
                initialData={project || undefined}
            />

            {
                project && (
                    <ConfirmationModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onConfirm={handleDeleteProject}
                        title="Delete Project"
                        message={`Are you sure you want to delete "${project.name}"? This action cannot be undone and will delete all associated issues and sprints.`}
                        confirmText="Delete Project"
                        variant="danger"
                    />
                )
            }

            {
                project && (
                    <AddMemberModal
                        isOpen={isAddMemberModalOpen}
                        onClose={() => setIsAddMemberModalOpen(false)}
                        onSubmit={handleAddMember}
                        projectId={project.id}
                    />
                )
            }
        </div>
    );
}
