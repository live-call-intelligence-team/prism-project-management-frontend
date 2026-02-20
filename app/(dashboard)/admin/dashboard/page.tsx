'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { Users, Folder, Shield, HardDrive, UserPlus, FolderPlus, BarChart3, Settings as SettingsIcon, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { projectsApi, usersApi, Project, User } from '@/lib/api/endpoints';
import { analyticsApi, DashboardOverview } from '@/lib/api/endpoints/analytics';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
    const user = useAuthStore((state) => state.user);
    const [stats, setStats] = useState<DashboardOverview | null>(null);
    const [recentProjects, setRecentProjects] = useState<Project[]>([]);
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch dashboard data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch stats and lists in parallel
                const [dashboardData, projectsData, usersData] = await Promise.all([
                    analyticsApi.getDashboard(),
                    projectsApi.getAll({ limit: 5 }), // Only fetch 5 recent
                    usersApi.getAll({ limit: 5 })      // Only fetch 5 recent
                ]);

                setStats(dashboardData);
                setRecentProjects(projectsData.projects);
                setRecentUsers(usersData.users);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Mock storage (would be a separate system stats API)
    const storageUsed = 0.8;
    const storageTotal = 100;
    const storagePercentage = (storageUsed / storageTotal) * 100;

    return (
        <Container size="2xl">
            <div className="space-y-8">
                {/* Welcome Section */}
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Welcome back, {user?.firstName || 'Admin'}! Here's your system overview.
                    </p>
                </div>

                {/* Overview Stats */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <LoadingSkeleton variant="stat" count={4} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Users Stats */}
                        <Link href="/admin/users">
                            <Card className="hover-lift cursor-pointer transition-all">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats?.overview.activeUsers || stats?.overview.totalUsers || 0}</p>
                                            <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center">
                                                Active Account
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Projects Stats */}
                        <Link href="/projects">
                            <Card className="hover-lift cursor-pointer transition-all">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</p>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats?.overview.projects || 0}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                In Organization
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                            <Folder className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Issues Stats */}
                        <Link href="/issues">
                            <Card className="hover-lift cursor-pointer transition-all">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Issues</p>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats?.overview.issues || 0}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Across all projects
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                            <Shield className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Active Sprints */}
                        <Link href="/sprints">
                            <Card className="hover-lift cursor-pointer transition-all">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sprints</p>
                                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                                                {stats?.overview.activeSprints || 0}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Currently running
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                            <HardDrive className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                )}

                {/* Projects and Users Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                    {/* Recent Projects */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Projects</CardTitle>
                            <CardDescription>Latest projects in the system</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <LoadingSkeleton variant="text" count={5} />
                            ) : recentProjects.length > 0 ? (
                                <div className="space-y-3">
                                    {recentProjects.map((project) => (
                                        <div
                                            key={project.id}
                                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-xs font-medium",
                                                        project.status === 'ACTIVE' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                                                        project.status === 'COMPLETED' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                                                        project.status === 'ON_HOLD' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
                                                        project.status === 'ARCHIVED' && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                                    )}>
                                                        {project.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                                                    {project.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                                    {project.description || 'No description'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <Link href="/projects">
                                        <button className="w-full mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                                            View All Projects →
                                        </button>
                                    </Link>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Folder}
                                    title="No projects yet"
                                    description="Create your first project to get started."
                                    action={{
                                        label: "Create Project",
                                        onClick: () => window.location.href = '/projects/new'
                                    }}
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Users */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Users</CardTitle>
                            <CardDescription>Newest team members</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <LoadingSkeleton variant="text" count={5} />
                            ) : recentUsers.length > 0 ? (
                                <div className="space-y-3">
                                    {recentUsers.map((u) => (
                                        <div
                                            key={u.id}
                                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                                                    {u.firstName?.[0]}{u.lastName?.[0]}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {u.firstName} {u.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {u.email} • {u.role}
                                                </p>
                                            </div>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                                u.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                            )}>
                                                {u.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    ))}
                                    <Link href="/admin/users">
                                        <button className="w-full mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                                            View All Users →
                                        </button>
                                    </Link>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Users}
                                    title="No users yet"
                                    description="Add team members to start collaborating."
                                    action={{
                                        label: "Add User",
                                        onClick: () => window.location.href = '/admin/users/new'
                                    }}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common admin tasks</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            <Link href="/admin/users">
                                <button className="w-full p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add User</span>
                                    </div>
                                </button>
                            </Link>

                            <button
                                onClick={() => window.location.href = '/projects/new'}
                                className="w-full p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <FolderPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Project</span>
                                </div>
                            </button>

                            <Link href="/admin/audit-logs">
                                <button className="w-full p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Work Logs</span>
                                    </div>
                                </button>
                            </Link>

                            <Link href="/admin/settings">
                                <button className="w-full p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-500 dark:hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Settings</span>
                                    </div>
                                </button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
}
