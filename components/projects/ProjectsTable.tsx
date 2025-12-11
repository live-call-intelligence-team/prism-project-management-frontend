'use client';

import {
    MoreVertical,
    FolderKanban,
    Edit,
    Trash2,
    Archive,
    Eye,
    EyeOff
} from 'lucide-react';
import { Project } from '@/lib/api/endpoints/projects';
import { cn } from '@/lib/utils';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface ProjectsTableProps {
    projects: Project[];
    onEdit: (project: Project) => void;
    onDelete: (project: Project) => void;
    onArchive: (project: Project) => void;
}

export function ProjectsTable({ projects, onEdit, onDelete, onArchive }: ProjectsTableProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
            case 'ON_HOLD': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'ARCHIVED': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Project
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Key
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Visibility
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Members
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Created
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {projects.map((project) => (
                            <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center mr-3">
                                            <FolderKanban className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">{project.name}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[200px]">{project.description}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                    {project.key}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn('px-2 py-1 rounded-md text-xs font-medium', getStatusColor(project.status))}>
                                        {project.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                                        {project.visibility === 'PUBLIC' ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                                        {project.visibility}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                    {(project as any).memberCount || 0}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(project.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Menu as="div" className="relative inline-block text-left">
                                        <Menu.Button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            <MoreVertical className="w-5 h-5 text-gray-400" />
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
                                            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 z-50 focus:outline-none">
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
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                    <Menu.Item>
                                                        {({ active }: { active: boolean }) => (
                                                            <button
                                                                onClick={() => onArchive(project)}
                                                                className={cn(
                                                                    active ? 'bg-primary-500 text-white' : 'text-gray-900 dark:text-white',
                                                                    'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                                                                )}
                                                            >
                                                                <Archive className="mr-2 h-4 w-4" />
                                                                {project.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                </div>
                                                <div className="px-1 py-1">
                                                    <Menu.Item>
                                                        {({ active }: { active: boolean }) => (
                                                            <button
                                                                onClick={() => onDelete(project)}
                                                                className={cn(
                                                                    active ? 'bg-red-500 text-white' : 'text-red-600',
                                                                    'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                                                                )}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                </div>
                                            </Menu.Items>
                                        </Transition>
                                    </Menu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
