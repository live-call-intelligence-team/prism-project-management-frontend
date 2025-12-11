'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    MoreVertical,
    FolderKanban,
    Users,
    List,
    Layout,
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    AlertCircle
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Project } from '@/lib/api/endpoints/projects';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/authStore';

interface ProjectCardProps {
    project: Project;
    onEdit: (project: Project) => void;
    onArchive?: (project: Project) => void;
    onDelete?: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onArchive, onDelete }: ProjectCardProps) {
    const router = useRouter();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN';

    // Calculate progress based on features
    const totalFeatures = parseInt(String(project.totalFeatureCount || 0));
    const doneFeatures = parseInt(String(project.doneFeatureCount || 0));
    const progress = totalFeatures > 0 ? Math.round((doneFeatures / totalFeatures) * 100) : 0;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
            case 'ON_HOLD': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'ARCHIVED': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
            case 'COMPLETED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all cursor-pointer group relative flex flex-col h-full"
            onClick={() => router.push(`/projects/${project.id}`)}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center shadow-md">
                        <FolderKanban className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-lg">
                            {project.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{project.key}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', getStatusColor(project.status))}>
                        {project.status.replace('_', ' ')}
                    </span>

                    {/* Actions Menu */}
                    <div onClick={(e) => e.stopPropagation()}>
                        <Menu as="div" className="relative inline-block text-left">
                            <Menu.Button className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <MoreVertical className="w-5 h-5" />
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black ring-opacity-5 z-50 focus:outline-none">
                                    <div className="px-1 py-1">
                                        <Menu.Item>
                                            {({ active }: { active: boolean }) => (
                                                <button
                                                    onClick={() => onEdit(project)}
                                                    className={cn(
                                                        active ? 'bg-primary-500 text-white' : 'text-gray-900 dark:text-white',
                                                        'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                                                    )}
                                                >
                                                    Edit Project
                                                </button>
                                            )}
                                        </Menu.Item>
                                        {onArchive && (
                                            <Menu.Item>
                                                {({ active }: { active: boolean }) => (
                                                    <button
                                                        onClick={() => onArchive(project)}
                                                        className={cn(
                                                            active ? 'bg-primary-500 text-white' : 'text-gray-900 dark:text-white',
                                                            'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                                                        )}
                                                    >
                                                        {project.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        )}
                                        {isAdmin && onDelete && (
                                            <Menu.Item>
                                                {({ active }: { active: boolean }) => (
                                                    <button
                                                        onClick={() => onDelete(project)}
                                                        className={cn(
                                                            active ? 'bg-red-500 text-white' : 'text-red-600',
                                                            'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                                                        )}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        )}
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </div>
                </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-2 h-10">
                {project.description || 'No description provided.'}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex flex-col justify-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Progress</span>
                    <div className="flex items-center space-x-2">
                        <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{progress}%</span>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Epics</span>
                    <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(Number(project.activeEpicCount || 0), 3) }).map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${['bg-green-500', 'bg-blue-500', 'bg-purple-500'][i % 3]}`} />
                        ))}
                        <span className="text-sm font-bold text-gray-900 dark:text-white ml-1">{project.activeEpicCount || 0}</span>
                    </div>
                </div>
            </div>

            {/* Detailed Counts */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-6 px-1">
                <div className="flex items-center space-x-3" title="Features: Done / In Progress / To Do">
                    <span className="flex items-center text-green-600 dark:text-green-400 font-medium">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {project.doneFeatureCount || 0}
                    </span>
                    <span className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
                        <Clock className="w-3 h-3 mr-1" />
                        {project.inProgressFeatureCount || 0}
                    </span>
                    <span className="flex items-center text-gray-600 dark:text-gray-400 font-medium">
                        <Circle className="w-3 h-3 mr-1" />
                        {project.todoFeatureCount || 0}
                    </span>
                </div>
                <div className="flex items-center font-medium">
                    <List className="w-3 h-3 mr-1" />
                    {project.issueCount || 0} Issues
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex -space-x-2">
                    {/* Placeholder for avatars, assuming we don't have member details in list view usually */}
                    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                        {String(project.lead?.firstName || 'L')[0]}
                    </div>
                    {(project.memberCount || 0) > 1 && (
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-400">
                            +{Number(project.memberCount) - 1}
                        </div>
                    )}
                </div>
                <div className="text-[10px] text-gray-400">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                </div>
            </div>

            {/* Quick Actions (Hover) - Optional enhancement */}
            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.id}/board`); }}
                    className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-100 dark:border-gray-600"
                    title="View Board"
                >
                    <Layout className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.id}/backlog`); }}
                    className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-100 dark:border-gray-600"
                    title="View Backlog"
                >
                    <List className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
