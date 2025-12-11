
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { issuesApi } from '@/lib/api/issues';

const schema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    assigneeId: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

type FormData = z.infer<typeof schema>;

interface CreateSubtaskModalProps {
    parentStoryId: string;
    parentStoryTitle?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateSubtaskModal({ parentStoryId, parentStoryTitle, isOpen, onClose, onSuccess }: CreateSubtaskModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            priority: 'MEDIUM'
        }
    });

    const onSubmit = async (data: FormData) => {
        try {
            setIsLoading(true);
            await issuesApi.createSubtask({
                ...data,
                parentId: parentStoryId
            });
            reset();
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create subtask', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold">Create Sub-task</h2>
                        {parentStoryTitle && (
                            <p className="text-sm text-gray-500 mt-1">Parent: {parentStoryTitle}</p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                            {...register('title')}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            placeholder="Sub-task title"
                        />
                        {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Priority</label>
                        <select
                            {...register('priority')}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                        </select>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Sub-task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
