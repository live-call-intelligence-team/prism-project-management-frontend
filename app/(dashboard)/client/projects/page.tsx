'use client';

import { useState, useEffect } from 'react';
import { projectsApi, Project } from '@/lib/api/endpoints/projects';
import Container from '@/components/ui/Container';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { Calendar, DollarSign, BarChart, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function ClientProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await projectsApi.getClientProjects();
                setProjects(data.projects || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    return (
        <Container size="full">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Project Portfolio</h1>
                    <p className="text-gray-500 dark:text-gray-400">Overview of all initiatives currently under management.</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {loading ? (
                        <LoadingSkeleton count={3} className="h-40" />
                    ) : projects.length > 0 ? (
                        projects.map((project) => (
                            <div key={project.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h2>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase
                                                ${project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {project.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-sm max-w-2xl">{project.description || 'No description provided.'}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500 mb-1">Budget Utilization</div>
                                        <div className="text-xl font-bold text-gray-900 dark:text-white">{(project as any).progress}%</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase">Timeline</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {project.startDate && project.endDate
                                                    ? `${new Date(project.startDate).toLocaleDateString()} - ${new Date(project.endDate).toLocaleDateString()}`
                                                    : 'Not set'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                                            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase">Budget</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {project.budget ? `$${parseInt(project.budget as any).toLocaleString()}` : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="sm:col-span-1 flex flex-col justify-center">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-500 font-medium">Completion</span>
                                            <span className="text-gray-900 dark:text-white font-bold">{(project as any).progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                                style={{ width: `${(project as any).progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* View Details Button */}
                                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                    <Link href={`/client/projects/${project.id}`}>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors">
                                            <ExternalLink className="w-4 h-4" />
                                            View Details
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No projects found for your organization.
                        </div>
                    )}
                </div>
            </div>
        </Container>
    );
}
