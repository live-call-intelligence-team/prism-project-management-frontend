
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { issuesApi } from '@/lib/api/issues';
import { Issue } from '@/types';

const schema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    epicId: z.string().min(1, 'Epic is required'),
    storyPoints: z.number().min(0).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

type FormData = z.infer<typeof schema>;

interface CreateStoryModalProps {
    projectId: string;
    initialEpicId?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateStoryModal({ projectId, initialEpicId, isOpen, onClose, onSuccess }: CreateStoryModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [epics, setEpics] = useState<Issue[]>([]);

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            priority: 'MEDIUM',
            epicId: initialEpicId || ''
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (initialEpicId) {
                setValue('epicId', initialEpicId);
            }
            loadEpics();
        }
    }, [isOpen, initialEpicId]);

    const loadEpics = async () => {
        try {
            // Re-use hierarchy fetch to get Epics, or filters. 
            // For efficiency, we might want a specific 'getEpics' endpoint but hierarchy works.
            const data = await issuesApi.getHierarchy(projectId);
            setEpics(data.data.epics);
        } catch (error) {
            console.error('Failed to load epics', error);
        }
    };

    const onSubmit = async (data: FormData) => {
        try {
            setIsLoading(true);
            await issuesApi.createStory({
                ...data,
                projectId
            });
            reset();
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create story', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Create Story</h2>
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
                            placeholder="Story title"
                        />
                        {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Epic Link</label>
                        <select
                            {...register('epicId')}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="">Select Epic</option>
                            {epics.map(epic => (
                                <option key={epic.id} value={epic.id}>
                                    {epic.key} - {epic.title}
                                </option>
                            ))}
                        </select>
                        {errors.epicId && <p className="text-red-500 text-sm">{errors.epicId.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Points</label>
                            <input
                                type="number"
                                {...register('storyPoints', { valueAsNumber: true })}
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
                            Create Story
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
