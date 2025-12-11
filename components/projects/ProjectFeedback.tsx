'use client';

import { useState, useEffect } from 'react';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import { IssueModal } from '@/components/issues/IssueModal';
import { MessageSquarePlus, MessageSquare } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/lib/store/authStore';

interface ProjectFeedbackProps {
    projectId: string;
}

export function ProjectFeedback({ projectId }: ProjectFeedbackProps) {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const user = useAuthStore(state => state.user);

    const fetchIssues = async () => {
        setIsLoading(true);
        try {
            // For now, fetch all issues. Ideally, we might filter by 'FEEDBACK' type or label.
            const data = await issuesApi.getAll({ projectId });
            setIssues(data.issues || []);
        } catch (error) {
            console.error('Failed to fetch feedback', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, [projectId]);

    const handleCreateFeedback = async (data: any) => {
        await issuesApi.create({
            ...data,
            projectId,
            title: `[Feedback] ${data.title}`, // Prefix to distinguish
            type: 'TASK', // Defaulting to TASK as separate Feedback type might not exist yet
            description: `Client Feedback from ${user?.firstName}:\n\n${data.description}`
        });
        fetchIssues();
        setIsModalOpen(false);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading Feedback...</div>;
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Project Feedback</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Share your thoughts, report issues, or suggest improvements.
                    </p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    leftIcon={<MessageSquarePlus className="w-4 h-4" />}
                >
                    Add Feedback
                </Button>
            </div>

            {issues.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No feedback yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                        Be the first to share your feedback for this project.
                    </p>
                    <Button onClick={() => setIsModalOpen(true)}>Add Feedback</Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {issues.map((issue) => (
                        <div key={issue.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-1">{issue.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">{issue.description}</p>
                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                                <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                                    {issue.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <IssueModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateFeedback}
                projectId={projectId}
            // We might want to customize the modal title to say "Submit Feedback"
            />
        </div>
    );
}
