'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { issuesApi } from '@/lib/api/endpoints/issues';
import Container from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import {
    CheckCircle,
    Clock,
    Zap,
    Calendar,
    ArrowRight,
    FolderKanban,
    Users,
    LayoutDashboard,
    Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { Project } from '@/lib/api/endpoints/projects';

export default function ProjectManagerDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const loadDashboard = async () => {
        try {
            // Fetch all projects for this PM (backend filters by role)
            const projectsData = await projectsApi.getAll({ limit: 50 });
            const pmProjects = projectsData.projects || [];

            // Calculate stats
            const totalProjects = pmProjects.length;
            const activeProjects = pmProjects.filter(p => p.status === 'ACTIVE').length;
            const totalIssues = pmProjects.reduce((acc, p) => acc + (p.issueCount || 0), 0);
            const totalMembers = pmProjects.reduce((acc, p) => acc + (p.memberCount || 0), 0);

            setProjects(pmProjects);
            setStats({
                totalProjects,
                activeProjects,
                totalIssues,
                totalMembers
            });
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    if (loading) {
        return (
            <Container>
                <div className="space-y-6">
                    <LoadingSkeleton count={1} className="h-24 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <LoadingSkeleton count={4} className="h-32" />
                    </div>
                </div>
            </Container>
        );
    }

    return (
        <Container size="full">
            <div className="space-y-8">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-lg transition-all">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Hello, {user?.firstName}! 👋</h1>
                    <p className="text-blue-100 opacity-90 text-sm md:text-base">
                        You are managing <span className="font-bold text-white">{stats?.activeProjects} active projects</span>.
                        Keep up the great work!
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <StatsCard
                        title="Active Projects"
                        value={stats?.activeProjects || 0}
                        icon={<Briefcase className="w-5 h-5 text-blue-500" />}
                        description="Currently active"
                    />
                    <StatsCard
                        title="Total Issues"
                        value={stats?.totalIssues || 0}
                        icon={<CheckCircle className="w-5 h-5 text-green-500" />}
                        description="Across all projects"
                    />
                    <StatsCard
                        title="Team Members"
                        value={stats?.totalMembers || 0}
                        icon={<Users className="w-5 h-5 text-purple-500" />}
                        description="Total headcount"
                    />
                    <StatsCard
                        title="Avg. Velocity"
                        value="-"
                        icon={<Zap className="w-5 h-5 text-yellow-500" />}
                        description="Story points / sprint"
                    />
                </div>

                {/* Projects List */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Projects</h2>
                        <Link href="/projects" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center transition-colors">
                            Manage All <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </div>

                    {projects.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Projects Assigned</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">You haven't been assigned to any projects yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map(project => (
                                <Link href={`/projects/${project.id}`} key={project.id} className="block group">
                                    <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary-500">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg group-hover:text-primary-600 transition-colors">
                                                    {project.name}
                                                </CardTitle>
                                                <span className={`px-2 py-1 rounded text-xs font-semibold
                                                    ${project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                        project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'}`}>
                                                    {project.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                                {project.description || 'No description provided.'}
                                            </p>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Issues</span>
                                                    <span className="font-medium">{project.issueCount || 0}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">Members</span>
                                                    <div className="flex -space-x-2">
                                                        {[...Array(Math.min(3, project.memberCount || 0))].map((_, i) => (
                                                            <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px]">
                                                                <Users className="w-3 h-3 text-gray-500" />
                                                            </div>
                                                        ))}
                                                        {(project.memberCount || 0) > 3 && (
                                                            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px]">
                                                                +{(project.memberCount || 0) - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-primary-500 h-full w-1/3"></div> {/* Placeholder progress */}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Container>
    );
}

function StatsCard({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {icon}
                </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{title}</p>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    );
}
