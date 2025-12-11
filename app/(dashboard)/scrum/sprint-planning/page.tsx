'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { projectsApi, sprintsApi, Project } from '@/lib/api/endpoints';
import Link from 'next/link';

export default function SprintPlanningPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        goal: '',
        projectId: '',
        startDate: '',
        endDate: '',
    });

    // Load projects
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoadingData(true);
                const data = await projectsApi.getAll({ limit: 100 });
                setProjects(data.projects);
            } catch (err) {
                console.error('Error fetching projects:', err);
                setError('Failed to load projects. Please try again.');
            } finally {
                setLoadingData(false);
            }
        };
        fetchProjects();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.projectId) {
            setError('Please select a project');
            return;
        }

        if (!formData.startDate) {
            setError('Please select a start date');
            return;
        }

        if (!formData.endDate) {
            setError('Please select an end date');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await sprintsApi.create({
                projectId: formData.projectId,
                name: formData.name,
                goal: formData.goal,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
            });

            // Redirect to sprints page
            router.push('/sprints');
        } catch (err: any) {
            console.error('Error creating sprint:', err);
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create sprint';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Calculate duration in days for display
    const durationDetails = formData.startDate && formData.endDate
        ? Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <Container size="lg">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <Link href="/sprints">
                        <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Sprints
                        </button>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Plan Sprint</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Create and configure a new sprint cycle
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Sprint Details</CardTitle>
                        <CardDescription>Define the scope and timeline for your sprint</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Project Selection */}
                            <div>
                                <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Project <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="projectId"
                                    name="projectId"
                                    required
                                    value={formData.projectId}
                                    onChange={handleChange}
                                    disabled={loadingData}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                                >
                                    <option value="">Select a project</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sprint Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Sprint Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="e.g. Sprint 1, Q4 Release Cycle"
                                />
                            </div>

                            {/* Goal */}
                            <div>
                                <label htmlFor="goal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Sprint Goal
                                </label>
                                <textarea
                                    id="goal"
                                    name="goal"
                                    rows={3}
                                    value={formData.goal}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="What do you want to achieve in this sprint?"
                                />
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Start Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        id="startDate"
                                        name="startDate"
                                        required
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        End Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        id="endDate"
                                        name="endDate"
                                        required
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {durationDetails !== null && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                    <Calendar className="w-4 h-4" />
                                    <span>Sprint Duration: <strong>{durationDetails} days</strong></span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || loadingData || projects.length === 0}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {loading ? 'Creating...' : 'Create Sprint'}
                                </button>
                                <Link href="/sprints">
                                    <button
                                        type="button"
                                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
}
