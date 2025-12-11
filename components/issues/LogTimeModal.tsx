import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import { issuesApi } from '@/lib/api/endpoints/issues';
import { Loader2 } from 'lucide-react';

interface LogTimeModalProps {
    isOpen: boolean;
    onClose: () => void;
    issueId: string;
    onSuccess: () => void;
}

interface FormData {
    hours: number;
    description: string;
}

export function LogTimeModal({ isOpen, onClose, issueId, onSuccess }: LogTimeModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

    const onSubmit = async (data: FormData) => {
        try {
            setIsLoading(true);
            await issuesApi.addWorkLog(issueId, { timeSpent: data.hours, description: data.description });
            reset();
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to log time', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Log Time">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Spent (Hours)</label>
                    <input
                        type="number"
                        step="0.1"
                        {...register('hours', { required: 'Time is required', min: 0.1, valueAsNumber: true })}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g. 1.5"
                    />
                    {errors.hours && <p className="text-red-500 text-xs mt-1">{errors.hours.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        {...register('description')}
                        rows={3}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500"
                        placeholder="What did you work on?"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Log Time
                    </button>
                </div>
            </form>
        </Modal>
    );
}
