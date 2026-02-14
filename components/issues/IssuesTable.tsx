'use client';

import { useState, useEffect } from 'react';
import {
    MoreVertical,
    Edit,
    Trash2,
    Bug,
    ListTodo,
    Lightbulb,
    Zap,
    AlertCircle,
    ArrowUp,
    ArrowDown,
    Minus
} from 'lucide-react';
import { Issue } from '@/lib/api/endpoints/issues';
import { cn } from '@/lib/utils';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { motion } from 'framer-motion';

interface IssuesTableProps {
    issues: Issue[];
    onEdit: (issue: Issue) => void;
    onDelete: (issue: Issue) => void;
    selectedIssues: string[];
    onSelectionChange: (ids: string[]) => void;
}

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'BUG': return Bug;
        case 'TASK': return ListTodo;
        case 'STORY': return Lightbulb;
        case 'EPIC': return Zap;
        default: return ListTodo;
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case 'BUG': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
        case 'TASK': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
        case 'STORY': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
        case 'EPIC': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20';
        default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
};

const getPriorityIcon = (priority: string) => {
    switch (priority) {
        case 'CRITICAL': return AlertCircle;
        case 'HIGH': return ArrowUp;
        case 'MEDIUM': return Minus;
        case 'LOW': return ArrowDown;
        default: return Minus;
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'CRITICAL': return 'text-red-600 dark:text-red-400';
        case 'HIGH': return 'text-orange-600 dark:text-orange-400';
        case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400';
        case 'LOW': return 'text-green-600 dark:text-green-400';
        default: return 'text-gray-600 dark:text-gray-400';
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'TODO': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
        case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
        case 'DONE': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
        default: return 'bg-gray-100 text-gray-700';
    }
};

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export function IssuesTable({ issues, onEdit, onDelete, selectedIssues, onSelectionChange }: IssuesTableProps) {
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            onSelectionChange(issues.map(i => i.id));
        } else {
            onSelectionChange([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedIssues, id]);
        } else {
            onSelectionChange(selectedIssues.filter(i => i !== id));
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left w-10">
                                <input
                                    type="checkbox"
                                    checked={issues.length > 0 && selectedIssues.length === issues.length}
                                    onChange={handleSelectAll}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Key
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Priority
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Assignee
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {issues.map((issue, index) => {
                            const TypeIcon = getTypeIcon(issue.type);
                            const PriorityIcon = getPriorityIcon(issue.priority);
                            const isSelected = selectedIssues.includes(issue.id);

                            return (
                                <motion.tr
                                    key={issue.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={cn(
                                        "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                                        isSelected && "bg-primary-50 dark:bg-primary-900/10"
                                    )}
                                >
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => handleSelectOne(issue.id, e.target.checked)}
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-primary-600 dark:text-primary-400">
                                        {issue.key}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', getTypeColor(issue.type))}>
                                            <TypeIcon className="w-3 h-3 mr-1" />
                                            {issue.type}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium max-w-[300px] truncate" title={issue.title}>
                                        {issue.title}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <PriorityIcon className={cn('w-4 h-4 mr-1', getPriorityColor(issue.priority))} />
                                            <span className={cn('text-sm font-medium', getPriorityColor(issue.priority))}>
                                                {issue.priority}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn('px-2 py-1 rounded-md text-xs font-medium', getStatusColor(issue.status))}>
                                            {issue.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {issue.assignee ? (
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white text-xs font-medium mr-2">
                                                    {getInitials(issue.assignee!.firstName + ' ' + issue.assignee!.lastName)}
                                                </div>
                                                <span className="text-sm text-gray-900 dark:text-white truncate max-w-[120px]">
                                                    {issue.assignee!.firstName} {issue.assignee!.lastName}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">Unassigned</span>
                                        )}
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
                                                <Menu.Items
                                                    anchor="bottom end"
                                                    className="w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 z-50 focus:outline-none"
                                                >
                                                    <div className="px-1 py-1">
                                                        <Menu.Item>
                                                            {({ active }: { active: boolean }) => (
                                                                <button
                                                                    onClick={() => onEdit(issue)}
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
                                                                    onClick={() => onDelete(issue)}
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
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                {issues.map((issue, index) => {
                    const TypeIcon = getTypeIcon(issue.type);
                    const PriorityIcon = getPriorityIcon(issue.priority);
                    const isSelected = selectedIssues.includes(issue.id);

                    return (
                        <div
                            key={issue.id}
                            className={cn(
                                "p-4 space-y-3",
                                isSelected && "bg-primary-50 dark:bg-primary-900/10"
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => handleSelectOne(issue.id, e.target.checked)}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-1"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">
                                                {issue.key}
                                            </span>
                                            <div className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium', getTypeColor(issue.type))}>
                                                <TypeIcon className="w-3 h-3 mr-1" />
                                                {issue.type}
                                            </div>
                                        </div>
                                        <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                                            {issue.title}
                                        </h3>
                                    </div>
                                </div>
                                <Menu as="div" className="relative inline-block text-left">
                                    <Menu.Button className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
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
                                                        <button onClick={() => onEdit(issue)} className={cn(active ? 'bg-primary-500 text-white' : 'text-gray-900 dark:text-white', 'group flex w-full items-center rounded-md px-2 py-2 text-sm')}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </button>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }: { active: boolean }) => (
                                                        <button onClick={() => onDelete(issue)} className={cn(active ? 'bg-red-500 text-white' : 'text-red-600', 'group flex w-full items-center rounded-md px-2 py-2 text-sm')}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </button>
                                                    )}
                                                </Menu.Item>
                                            </div>
                                        </Menu.Items>
                                    </Transition>
                                </Menu>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center" title="Priority">
                                        <PriorityIcon className={cn('w-4 h-4 mr-1', getPriorityColor(issue.priority))} />
                                        <span className={cn('text-xs font-medium', getPriorityColor(issue.priority))}>
                                            {issue.priority}
                                        </span>
                                    </div>
                                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', getStatusColor(issue.status))}>
                                        {issue.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div>
                                    {issue.assignee ? (
                                        <div className="flex items-center" title={`Assigned to ${issue.assignee.firstName}`}>
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white text-[10px] font-medium">
                                                {getInitials(issue.assignee.firstName + ' ' + issue.assignee.lastName)}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400">Unassigned</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
