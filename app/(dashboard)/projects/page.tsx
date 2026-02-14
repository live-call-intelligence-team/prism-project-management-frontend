'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Plus,
    Search,
    Grid3x3,
    List,
    FolderKanban,
    Users,
    Eye,
    EyeOff,
    MoreVertical,
    Loader2
} from 'lucide-react';
// import { CreateProjectModal } from '@/components/projects/CreateProjectModal'; // Deprecated
import { ProjectModal } from '@/components/projects/ProjectModal';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { cn } from '@/lib/utils';
import { projectsApi, Project } from '@/lib/api/endpoints/projects';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/lib/store/authStore';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function ProjectsPage() {
    const router = useRouter();
    const { success, error } = useToast();
    const { user } = useAuthStore();

    // Data State
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // UI State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);

    // Delete Confirmation
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);

    const fetchProjects = async () => {
        try {
            setIsLoading(true);
            const response = await projectsApi.getAll();
            setProjects(response.projects);
        } catch (err) {
            console.error('Failed to fetch projects:', err);
            error('Failed to load projects');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    // Create / Update Handler
    const handleProjectSubmit = async (data: any) => {
        try {
            if (editingProject) {
                const updated = await projectsApi.update(editingProject.id, data);
                setProjects(projects.map(p => p.id === updated.id ? updated : p));
                success('Project updated successfully');
            } else {
                const newProject = await projectsApi.create(data);
                setProjects([newProject, ...projects]);
                success('Project created successfully');
            }
            setIsProjectModalOpen(false);
        } catch (err) {
            console.error('Failed to save project:', err);
            error('Failed to save project');
        }
    };

    // Delete Handler
    const handleDeleteConfirm = async () => {
        if (!projectToDelete) return;
        setIsDeleteLoading(true);
        try {
            await projectsApi.delete(projectToDelete.id);
            setProjects(projects.filter(p => p.id !== projectToDelete.id));
            success('Project deleted successfully');
            setProjectToDelete(null);
        } catch (err) {
            console.error('Failed to delete project:', err);
            error('Failed to delete project');
        } finally {
            setIsDeleteLoading(false);
        }
    };

    // Archive Handler
    const handleArchiveProject = async (project: Project) => {
        try {
            const newStatus = project.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED';
            const updated = await projectsApi.update(project.id, { status: newStatus as any });
            setProjects(projects.map(p => p.id === updated.id ? updated : p));
            success(`Project ${newStatus === 'ARCHIVED' ? 'archived' : 'unarchived'}`);
        } catch (err) {
            console.error('Failed to archive project:', err);
            error('Failed to update project status');
        }
    };

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.key.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
            case 'ON_HOLD': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'ARCHIVED': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const openCreateModal = () => {
        setEditingProject(undefined);
        setIsProjectModalOpen(true);
    };

    const openEditModal = (project: Project) => {
        setEditingProject(project);
        setIsProjectModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        Projects
                        {isLoading && <Loader2 className="w-6 h-6 animate-spin text-primary-500" />}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage and track all your projects
                    </p>
                </div>
                {user?.role?.toUpperCase() === 'ADMIN' && (
                    <button
                        onClick={openCreateModal}
                        className={cn(
                            'flex items-center justify-center px-4 py-2 rounded-lg font-medium w-full md:w-auto',
                            'bg-gradient-to-r from-primary-500 to-accent-purple',
                            'text-white shadow-lg',
                            'hover:shadow-glow-purple hover:scale-[1.02]',
                            'active:scale-[0.98]',
                            'transition-all duration-200'
                        )}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        New Project
                    </button>
                )}
            </div>

            {/* Filters and View Toggle */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Search */}
                <div className="flex-1 max-w-full md:max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                'w-full pl-10 pr-4 py-2 rounded-lg border',
                                'bg-white dark:bg-gray-800',
                                'border-gray-300 dark:border-gray-600',
                                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                                'text-gray-900 dark:text-white',
                                'placeholder:text-gray-400'
                            )}
                        />
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center justify-end space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg self-end md:self-auto">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            'p-2 rounded-md transition-colors',
                            viewMode === 'grid'
                                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        )}
                    >
                        <Grid3x3 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                            'p-2 rounded-md transition-colors',
                            viewMode === 'list'
                                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        )}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Projects Grid/List */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project, index) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onEdit={openEditModal}
                            onDelete={setProjectToDelete}
                            onArchive={handleArchiveProject}
                        />
                    ))}
                </div>
            ) : (
                <ProjectsTable
                    projects={filteredProjects}
                    onEdit={openEditModal}
                    onDelete={setProjectToDelete}
                    onArchive={handleArchiveProject}
                />
            )}

            {/* Empty State */}
            {filteredProjects.length === 0 && (
                <div className="text-center py-12">
                    <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No projects found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first project'}
                    </p>
                    {!searchQuery && user?.role === 'ADMIN' && (
                        <button
                            onClick={openCreateModal}
                            className={cn(
                                'inline-flex items-center px-4 py-2 rounded-lg font-medium',
                                'bg-gradient-to-r from-primary-500 to-accent-purple',
                                'text-white shadow-lg',
                                'hover:shadow-glow-purple hover:scale-[1.02]',
                                'active:scale-[0.98]',
                                'transition-all duration-200'
                            )}
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Project
                        </button>
                    )}
                </div>
            )}

            {/* Modals */}
            <ProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                onSubmit={handleProjectSubmit}
                initialData={editingProject}
            />

            <ConfirmationModal
                isOpen={!!projectToDelete}
                onClose={() => setProjectToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Project"
                message={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone and will delete all associated issues and sprints.`}
                confirmText="Delete Project"
                variant="danger"
                isLoading={isDeleteLoading}
            />
        </div>
    );
}
