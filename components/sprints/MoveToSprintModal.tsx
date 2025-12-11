
import { useState, useEffect } from 'react';
import { sprintsApi } from '@/lib/api/sprints';
import { issuesApi } from '@/lib/api/issues';
import { Sprint } from '@/types';
import { Loader2, X, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface MoveToSprintModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    issueId: string | null; // Single issue move for now
    currentSprintId?: string | null;
    onSuccess: () => void;
}

export function MoveToSprintModal({ isOpen, onClose, projectId, issueId, currentSprintId, onSuccess }: MoveToSprintModalProps) {
    const { success, error } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [selectedSprintId, setSelectedSprintId] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            loadSprints();
        }
    }, [isOpen]);

    const loadSprints = async () => {
        try {
            const data = await sprintsApi.getByProject(projectId);
            // Filter only planned or active sprints
            const available = data.data.sprints.filter((s: Sprint) =>
                (s.status === 'PLANNED' || s.status === 'ACTIVE') && s.id !== currentSprintId
            );
            setSprints(available);
        } catch (err) {
            console.error('Failed to load sprints', err);
        }
    };

    const handleMove = async () => {
        if (!issueId) return;

        try {
            setIsLoading(true);
            const targetSprintId = selectedSprintId === 'backlog' ? null : selectedSprintId;

            await issuesApi.moveToSprint(issueId, targetSprintId);

            success('Issue moved successfully');
            onSuccess();
            onClose();
        } catch (err) {
            error('Failed to move issue');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Move to Sprint</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-gray-500">Select a destination sprint for this issue.</p>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        <button
                            onClick={() => setSelectedSprintId('backlog')}
                            className={`w-full text-left p-3 rounded-lg border text-sm flex justify-between items-center ${selectedSprintId === 'backlog' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                        >
                            <span>Backlog (No Sprint)</span>
                            {selectedSprintId === 'backlog' && <CheckCircle className="w-4 h-4 text-primary-500" />}
                        </button>

                        {sprints.map(sprint => (
                            <button
                                key={sprint.id}
                                onClick={() => setSelectedSprintId(sprint.id)}
                                className={`w-full text-left p-3 rounded-lg border text-sm flex justify-between items-center ${selectedSprintId === sprint.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                            >
                                <div>
                                    <span className="font-medium block">{sprint.name}</span>
                                    <span className="text-xs text-gray-400">{sprint.status}</span>
                                </div>
                                {selectedSprintId === sprint.id && <ArrowRight className="w-4 h-4 text-primary-500" />}
                            </button>
                        ))}

                        {sprints.length === 0 && (
                            <div className="text-center py-4 text-sm text-gray-500 italic">
                                No active or planned sprints available.
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            disabled={!selectedSprintId}
                            onClick={handleMove}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Move Issue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    )
}
