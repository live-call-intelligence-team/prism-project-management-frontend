'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { projectsApi } from '@/lib/api/endpoints';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';

export default function NewProjectPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        budget: '',
        visibility: 'private' as 'public' | 'private',
        status: 'active' as 'active' | 'on-hold' | 'completed' | 'archived',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setError('You must be logged in to create a project');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Generate project key from name (e.g., "My Project" -> "MP")
            const key = formData.name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .substring(0, 5)
                || formData.name.substring(0, 3).toUpperCase();

            // Prepare data for API
            const projectData: any = {
                name: formData.name,
                key: key.length < 2 ? key + 'P' : key, // Ensure at least 2 chars
                description: formData.description || undefined,
                visibility: formData.visibility,
                status: formData.status,
                leadId: user.id,
            };

            if (formData.startDate) {
                projectData.startDate = formData.startDate;
            }
            if (formData.endDate) {
                projectData.endDate = formData.endDate;
            }
            if (formData.budget) {
                projectData.budget = parseFloat(formData.budget);
            }

            await projectsApi.create(projectData);

            // Redirect to projects page
            router.push('/projects');
        } catch (err: any) {
            console.error('Error creating project:', err);
            setError(err.response?.data?.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Container size="lg">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <Link href="/projects">
                        <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Projects
                        </button>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Project</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Set up a new project to start tracking work
                    </p>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                        <CardDescription>Fill in the information below to create a new project</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Error Message */}
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Project Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Project Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="Enter project name"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="Describe the project goals and objectives"
                                />
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        id="startDate"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        id="endDate"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Budget and Visibility */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Budget ($)
                                    </label>
                                    <input
                                        type="number"
                                        id="budget"
                                        name="budget"
                                        min="0"
                                        step="0.01"
                                        value={formData.budget}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Visibility
                                    </label>
                                    <select
                                        id="visibility"
                                        name="visibility"
                                        value={formData.visibility}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="private">Private</option>
                                        <option value="public">Public</option>
                                    </select>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    <option value="active">Active</option>
                                    <option value="on-hold">On Hold</option>
                                    <option value="completed">Completed</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {loading ? 'Creating...' : 'Create Project'}
                                </button>
                                <Link href="/projects">
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
