'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { issuesApi, projectsApi, usersApi, Project, User } from '@/lib/api/endpoints';
import Link from 'next/link';

export default function NewIssuePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'task' as 'bug' | 'feature' | 'task' | 'story',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
        projectId: '',
        assigneeId: '',
        storyPoints: '',
        dueDate: '',
    });

    // Load projects and users
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingData(true);
                const [projectsData, usersData] = await Promise.all([
                    projectsApi.getAll({ limit: 100 }),
                    usersApi.getAll({ limit: 100 })
                ]);
                setProjects(projectsData.projects);
                setUsers(usersData.users);
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.projectId) {
            setError('Please select a project');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Prepare data for API
            const issueData: any = {
                title: formData.title,
                description: formData.description || undefined,
                type: formData.type.toUpperCase(),
                priority: formData.priority.toUpperCase(),
                projectId: formData.projectId,
                status: 'TODO',
            };

            if (formData.assigneeId) {
                issueData.assigneeId = formData.assigneeId;
            }
            if (formData.storyPoints) {
                issueData.storyPoints = parseInt(formData.storyPoints);
            }
            if (formData.dueDate) {
                issueData.dueDate = formData.dueDate;
            }

            await issuesApi.create(issueData);

            // Redirect to issues page
            router.push('/issues');
        } catch (err: any) {
            console.error('Error creating issue:', err);
            setError(err.response?.data?.error || 'Failed to create issue');
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
                    <Link href="/issues">
                        <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Issues
                        </button>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Issue</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Create a new task, bug, feature, or story
                    </p>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Issue Details</CardTitle>
                        <CardDescription>Fill in the information below to create a new issue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Error Message */}
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="Enter issue title"
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
                                    placeholder="Describe the issue in detail"
                                />
                            </div>

                            {/* Type and Priority */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="type"
                                        name="type"
                                        required
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="task">Task</option>
                                        <option value="bug">Bug</option>
                                        <option value="feature">Feature</option>
                                        <option value="story">Story</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Priority <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="priority"
                                        name="priority"
                                        required
                                        value={formData.priority}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            {/* Project and Assignee */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    {projects.length === 0 && !loadingData && (
                                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                            No projects available. Create a project first.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Assignee
                                    </label>
                                    <select
                                        id="assigneeId"
                                        name="assigneeId"
                                        value={formData.assigneeId}
                                        onChange={handleChange}
                                        disabled={loadingData}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                                    >
                                        <option value="">Unassigned</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.firstName} {user.lastName} ({user.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Story Points and Due Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="storyPoints" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Story Points
                                    </label>
                                    <input
                                        type="number"
                                        id="storyPoints"
                                        name="storyPoints"
                                        min="0"
                                        step="1"
                                        value={formData.storyPoints}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        id="dueDate"
                                        name="dueDate"
                                        value={formData.dueDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || loadingData || projects.length === 0}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {loading ? 'Creating...' : 'Create Issue'}
                                </button>
                                <Link href="/issues">
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
