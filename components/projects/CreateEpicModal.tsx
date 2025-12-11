'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Save, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const epicSchema = z.object({
    name: z.string().min(2, 'Epic name must be at least 2 characters'),
    description: z.string().optional(),
    key: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    businessValue: z.string().optional(), // We'll handle conversion to number in submit
    isVisibleToClient: z.boolean().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    color: z.string().optional(),
    tags: z.string().optional(), // Comma separated
    goals: z.string().optional(),
});

type EpicFormData = z.infer<typeof epicSchema>;

interface CreateEpicModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: EpicFormData) => Promise<void>;
    projectId: string;
    initialData?: Partial<EpicFormData> & { id?: string };
}

export function CreateEpicModal({ isOpen, onClose, onSubmit, initialData }: CreateEpicModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<EpicFormData>({
        resolver: zodResolver(epicSchema),
        defaultValues: {
            priority: 'MEDIUM',
            ...initialData
        }
    });

    useEffect(() => {
        if (isOpen) {
            reset({
                priority: 'MEDIUM',
                name: '',
                description: '',
                startDate: '',
                endDate: '',
                goals: '',
                ...initialData
            });
        }
    }, [isOpen, initialData, reset]);

    // Reset form when opening/closing or changing initialData
    // We import useEffect from 'react' at the top already
    // Need to make sure we use it.

    // Actually, I can't add imports with replace_file_content mid-file usually.
    // But I can use the existing imports.
    // Let's check imports. `useEffect` was NOT imported in original file.
    // I need to update imports too.

    // Since I need to adding imports, better use multi_replace or check if I can add import.
    // The previous view_file showed `import { useState } from 'react';`

    // I will use multi_replace to add import and update component.


    const handleFormSubmit = async (data: EpicFormData) => {
        setIsLoading(true);
        try {
            const formattedData: any = { ...data };
            if (data.tags) {
                formattedData.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
            }
            // Sanitize dates
            if (!formattedData.startDate) formattedData.startDate = null;
            if (!formattedData.endDate) formattedData.endDate = null;

            // Convert Business Value to Integer
            if (data.businessValue) {
                const map: any = { 'LOW': 10, 'MEDIUM': 50, 'HIGH': 90, 'CRITICAL': 100 };
                formattedData.businessValue = map[data.businessValue] || 50;
            }

            await onSubmit(formattedData);
            onClose();
            reset();
        } catch (error) {
            console.error('Error creating epic:', error);
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
                                    {initialData ? 'Edit Epic' : 'Create New Epic'}
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
                                    label="Epic Name *"
                                    placeholder="e.g., Q1 Marketing Campaign"
                                    leftIcon={<Layers className="w-5 h-5" />}
                                    error={errors.name?.message}
                                    {...register('name')}
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        {...register('description')}
                                        rows={3}
                                        placeholder="Describe the high-level goal..."
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Goals / Objectives
                                    </label>
                                    <textarea
                                        {...register('goals')}
                                        rows={3}
                                        placeholder="Secure user access, Support multiple login methods..."
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

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Epic Key (Optional)"
                                        placeholder="e.g., PROJ-EP-1"
                                        error={errors.key?.message}
                                        {...register('key')}
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Epic Color
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="color"
                                                {...register('color')}
                                                className="p-1 h-10 w-14 block bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none"
                                                title="Choose your color"
                                            />
                                            <input
                                                type="text"
                                                {...register('color')}
                                                placeholder="#000000"
                                                className="flex-1 px-4 py-2 rounded-lg border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Priority
                                        </label>
                                        <select
                                            {...register('priority')}
                                            className="w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none text-gray-900 dark:text-white"
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="CRITICAL">Critical</option>
                                        </select>
                                    </div>
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
                                            Target End Date
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Business Value
                                        </label>
                                        <select
                                            {...register('businessValue')}
                                            className="w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none text-gray-900 dark:text-white"
                                        >
                                            <option value="">Select Value...</option>
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="CRITICAL">Critical</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center h-full pt-8">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                {...register('isVisibleToClient')}
                                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 select-none">Visible to Client</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <Input
                                        label="Tags"
                                        placeholder="e.g., quarterly-goal, marketing (comma separated)"
                                        {...register('tags')}
                                    />
                                </div>

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
                                        {initialData ? 'Save Changes' : 'Create Epic'}
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
