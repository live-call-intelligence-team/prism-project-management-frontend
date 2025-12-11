'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/lib/store/authStore';
import { projectsApi } from '@/lib/api/endpoints/projects';
import {
    Calendar,
    Clock,
    Briefcase,
    MessageSquare,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { format } from 'date-fns';

interface ScheduleMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ScheduleMeetingModal({ isOpen, onClose }: ScheduleMeetingModalProps) {
    const { user } = useAuthStore();
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [submitting, setSubmitting] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        projectId: '',
        subject: '',
        date: '',
        time: '',
        message: ''
    });

    useEffect(() => {
        if (isOpen) {
            setStep('form');
            setFormData({
                projectId: '',
                subject: '',
                date: '',
                time: '',
                message: ''
            });

            // Fetch client projects
            const fetchProjects = async () => {
                setLoadingProjects(true);
                try {
                    const data = await projectsApi.getClientProjects({ limit: 50 });
                    if (data && data.projects) {
                        setProjects(data.projects);
                    }
                } catch (error) {
                    console.error("Failed to fetch projects", error);
                } finally {
                    setLoadingProjects(false);
                }
            };
            fetchProjects();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        // Mock API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Here we would call an API endpoint to schedule the meeting
        console.log('Meeting scheduled:', formData);

        setSubmitting(false);
        setStep('success');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Schedule a Meeting">
            <div className="w-full max-w-lg mx-auto p-1">
                {step === 'success' ? (
                    <div className="text-center py-12 space-y-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Request Sent!</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Your meeting request has been sent to the project team. You'll receive a confirmation email shortly.
                        </p>
                        <Button onClick={onClose} className="mt-6">
                            Done
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Project Selection */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Project
                            </label>
                            <select
                                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                required
                                disabled={loadingProjects}
                            >
                                <option value="">Select a project...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Subject */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" /> Topic
                            </label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="e.g., Sprint Review, Requirement Clarification"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                required
                            />
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Date
                                </label>
                                <input
                                    type="date"
                                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Time
                                </label>
                                <input
                                    type="time"
                                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Message */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Additional Details (Optional)
                            </label>
                            <textarea
                                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                                placeholder="Any specific agenda items or context..."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            />
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting || loadingProjects} isLoading={submitting}>
                                Schedule Meeting
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
}
