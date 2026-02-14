'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Calendar, Flag, Book, List } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { epicsApi, Epic } from '@/lib/api/endpoints/epics';
import { projectsApi } from '@/lib/api/endpoints/projects';

interface TeamMember {
    id: string;
    userId: string;
    role: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar?: string;
    };
}

const featureSchema = z.object({
    name: z.string().min(2, 'Feature name must be at least 2 characters'),
    description: z.string().optional(),
    epicId: z.string().optional().or(z.literal('')),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    storyPoints: z.number().min(0).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    tags: z.string().optional(), // Comma separated string for input
    acceptanceCriteria: z.string().optional(),
    assignedTo: z.string().optional(),
    status: z.enum(['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CLOSED']).optional(),
});

type FeatureFormData = z.infer<typeof featureSchema>;

interface CreateFeatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FeatureFormData) => Promise<void>;
    projectId: string;
}

export function CreateFeatureModal({ isOpen, onClose, onSubmit, projectId }: CreateFeatureModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [epics, setEpics] = useState<Epic[]>([]);
    const [members, setMembers] = useState<TeamMember[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<FeatureFormData>({
        resolver: zodResolver(featureSchema),
        defaultValues: {
            priority: 'MEDIUM',
            storyPoints: 0,
            status: 'TO_DO'
        }
    });

    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                try {
                    const [epicsData, membersData] = await Promise.all([
                        epicsApi.getAll(projectId),
                        projectsApi.getMembers(projectId)
                    ]);
                    // Filter: Only OPEN or IN_PROGRESS epics can have features added
                    setEpics(epicsData.filter(e => e.status === 'OPEN' || e.status === 'IN_PROGRESS'));
                    setMembers(membersData);
                } catch (err) {
                    console.error('Failed to load data', err);
                }
            };
            loadData();
        }
    }, [isOpen, projectId]);

    const handleFormSubmit = async (data: FeatureFormData) => {
        setIsLoading(true);
        try {
            const formattedData: any = { ...data };
            if (data.assignedTo) {
                formattedData.ownerId = data.assignedTo;
            }
            if (data.tags) {
                formattedData.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
            }
            await onSubmit(formattedData);
            onClose();
            reset();
        } catch (error) {
            console.error('Error creating feature:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Create New Feature
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6 overflow-y-auto flex-1">
                                <Input
                                    label="Feature Name *"
                                    placeholder="e.g., User Authentication Flow"
                                    leftIcon={<Book className="w-5 h-5" />}
                                    error={errors.name?.message}
                                    {...register('name')}
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Parent Epic
                                    </label>
                                    <div className="relative">
                                        <List className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <select
                                            {...register('epicId')}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none text-gray-900 dark:text-white appearance-none"
                                        >
                                            <option value="">No Epic (Independent)</option>
                                            {epics.map(epic => (
                                                <option key={epic.id} value={epic.id}>
                                                    {epic.key} - {epic.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        {...register('description')}
                                        rows={3}
                                        placeholder="Describe the feature requirements..."
                                        className={cn(
                                            'w-full px-4 py-2.5 rounded-lg border',
                                            'bg-white dark:bg-gray-900',
                                            'border-gray-300 dark:border-gray-600',
                                            'focus:outline-none focus:ring-2 focus:ring-primary-500',
                                            'text-gray-900 dark:text-white',
                                            'resize-none'
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Priority
                                        </label>
                                        <div className="relative">
                                            <Flag className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <select
                                                {...register('priority')}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none text-gray-900 dark:text-white appearance-none"
                                            >
                                                <option value="LOW">Low</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="HIGH">High</option>
                                                <option value="CRITICAL">Critical</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Input
                                        label="Story Points"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        {...register('storyPoints', { valueAsNumber: true })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Start Date
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <input
                                                type="date"
                                                {...register('startDate')}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            End Date
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <input
                                                type="date"
                                                {...register('endDate')}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Assigned To
                                        </label>
                                        <select
                                            {...register('assignedTo')}
                                            className="w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none text-gray-900 dark:text-white appearance-none"
                                        >
                                            <option value="">Unassigned</option>
                                            {members.map(member => (
                                                <option key={member.userId} value={member.userId}>
                                                    {member.user.firstName} {member.user.lastName} ({member.role})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Status
                                        </label>
                                        <select
                                            {...register('status')}
                                            className="w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none text-gray-900 dark:text-white appearance-none"
                                        >
                                            <option value="TO_DO">Todo</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="IN_REVIEW">In Review</option>
                                            <option value="DONE">Done</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Acceptance Criteria
                                    </label>
                                    <textarea
                                        {...register('acceptanceCriteria')}
                                        rows={4}
                                        placeholder="- Email validation works&#10;- Password hidden..."
                                        className={cn(
                                            'w-full px-4 py-2.5 rounded-lg border',
                                            'bg-white dark:bg-gray-900',
                                            'border-gray-300 dark:border-gray-600',
                                            'focus:outline-none focus:ring-2 focus:ring-primary-500',
                                            'text-gray-900 dark:text-white',
                                            'resize-none font-mono text-sm'
                                        )}
                                    />
                                </div>

                                <Input
                                    label="Tags"
                                    placeholder="e.g., frontend, ui, release-v1 (comma separated)"
                                    {...register('tags')}
                                />

                                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Button type="button" variant="secondary" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        isLoading={isLoading}
                                        leftIcon={<Save className="w-4 h-4" />}
                                    >
                                        Create Feature
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
