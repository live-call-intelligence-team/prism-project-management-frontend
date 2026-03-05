'use client';

import { useState, useEffect } from 'react';
import Container from '@/components/ui/Container';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import AdvancedDailyUpdate from '@/components/projects/AdvancedDailyUpdate';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { Clock, FolderKanban } from 'lucide-react';

interface ProjectSummary { id: string; name: string; key: string; }

export default function EmployeeDailyUpdatePage() {
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const data = await projectsApi.getAll();
            const list = (data.projects || data || []) as ProjectSummary[];
            setProjects(list);
            if (list.length > 0 && !selectedProjectId) {
                setSelectedProjectId(list[0].id);
            }
        } catch (e) {
            console.error('Failed to load projects:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Container>
                <div className="space-y-6">
                    <LoadingSkeleton count={1} className="h-16 w-full" />
                    <LoadingSkeleton count={3} className="h-32 w-full" />
                </div>
            </Container>
        );
    }

    if (projects.length === 0) {
        return (
            <Container>
                <div className="text-center py-20">
                    <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Projects Assigned</h2>
                    <p className="text-gray-500 mt-1">You are not assigned to any projects yet. Contact your project manager.</p>
                </div>
            </Container>
        );
    }

    return (
        <Container size="full">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-6 h-6 text-primary-500" />
                            Daily Update
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">Smart time-based daily work tracking</p>
                    </div>

                    {projects.length > 1 && (
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-primary-500"
                        >
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Advanced Daily Update Component */}
                {selectedProjectId && (
                    <AdvancedDailyUpdate key={selectedProjectId} projectId={selectedProjectId} />
                )}
            </div>
        </Container>
    );
}
