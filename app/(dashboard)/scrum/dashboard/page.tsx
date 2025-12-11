'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { Zap, TrendingUp, Calendar, Users as UsersIcon, CheckCircle2, AlertCircle, Clock, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { sprintsApi, usersApi, issuesApi, projectsApi, Sprint, User, Issue, Project } from '@/lib/api/endpoints';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ScrumDashboardPage() {
    const user = useAuthStore((state) => state.user);
    const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
    const [allSprints, setAllSprints] = useState<Sprint[]>([]);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [allIssues, setAllIssues] = useState<Issue[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const [sprintsData, usersData, issuesData, projectsData] = await Promise.all([
                    sprintsApi.getAll({ limit: 100 }).catch(() => []),
                    usersApi.getAll({ limit: 100 }), // Fetch all users, filter on frontend
                    issuesApi.getAll({ limit: 100 }),
                    projectsApi.getAll({ limit: 100 })
                ]);

                console.log('Raw API Responses:', {
                    sprintsData,
                    usersData,
                    issuesData,
                    projectsData
                });

                const sprintsList = Array.isArray(sprintsData) ? sprintsData : [];
                const active = sprintsList.find((s: Sprint) => s.status === 'ACTIVE') || null;

                setAllSprints(sprintsList);
                setActiveSprint(active);
                // Filter to only employees and scrum masters
                const filteredUsers = (usersData.users || []).filter(
                    (u: User) => u.role === 'EMPLOYEE' || u.role === 'SCRUM_MASTER'
                );
                setTeamMembers(filteredUsers);
                setAllIssues(issuesData.issues || []);
                setProjects(projectsData.projects || []);

                // Debug logging
                console.log('Scrum Dashboard Data:', {
                    sprints: sprintsList.length,
                    activeSprint: active?.name,
                    teamMembers: usersData.users?.length,
                    issues: issuesData.issues?.length,
                    projects: projectsData.projects?.length,
                    statsCalculated: {
                        total: issuesData.issues?.length || 0,
                        todo: issuesData.issues?.filter((i: Issue) => i.status === 'TODO').length || 0,
                        inProgress: issuesData.issues?.filter((i: Issue) => i.status === 'IN_PROGRESS').length || 0,
                        done: issuesData.issues?.filter((i: Issue) => i.status === 'DONE').length || 0
                    }
                });
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculate stats
    const stats = {
        totalIssues: allIssues.length,
        todoIssues: allIssues.filter(i => i.status === 'TODO').length,
        inProgressIssues: allIssues.filter(i => i.status === 'IN_PROGRESS').length,
        doneIssues: allIssues.filter(i => i.status === 'DONE').length,
        blockedIssues: allIssues.filter(i => i.status === 'BLOCKED').length,
        activeTeamMembers: teamMembers.filter(m => m.isActive).length,
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
        completionRate: allIssues.length > 0
            ? Math.round((allIssues.filter(i => i.status === 'DONE').length / allIssues.length) * 100)
            : 0
    };

    const sprintProgress = activeSprint
        ? ((activeSprint.completedPoints || 0) / (activeSprint.totalPoints || 1)) * 100
        : 0;

    const daysRemaining = activeSprint
        ? Math.max(0, Math.ceil((new Date(activeSprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    return (
        <Container size="full">
            <div className="space-y-6">
                {/* Error Display */}
                {!loading && (stats.totalIssues === 0 && allIssues.length === 0) && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                            ⚠️ No data loaded - Check browser console for API errors
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            Expected: {allIssues.length} issues, {teamMembers.length} team members, {projects.length} projects
                        </p>
                    </div>
                )}

                {/* Welcome Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
                    <h1 className="text-3xl font-bold mb-2">Scrum Master Dashboard</h1>
                    <p className="text-indigo-100 opacity-90">
                        Welcome back, {user?.firstName}! Here's your team overview and sprint progress.
                    </p>
                </div>

                {/* Key Metrics - 4 Cards */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <LoadingSkeleton count={4} className="h-32" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Active Sprint */}
                        <Card className="hover-lift">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                        <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold",
                                        activeSprint ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                    )}>
                                        {activeSprint ? 'Active' : 'None'}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sprint</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 truncate">
                                    {activeSprint?.name || 'No Active Sprint'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {activeSprint ? `${daysRemaining} days left` : 'Start a new sprint'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Total Issues */}
                        <Card className="hover-lift">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-xs text-gray-500">{stats.doneIssues} done</span>
                                </div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Issues</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalIssues}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {stats.completionRate}% completion rate
                                </p>
                            </CardContent>
                        </Card>

                        {/* Team Size */}
                        <Card className="hover-lift">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <UsersIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-xs text-green-600 font-medium">{stats.activeTeamMembers} active</span>
                                </div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Team Members</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{teamMembers.length}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Across {stats.activeProjects} projects
                                </p>
                            </CardContent>
                        </Card>

                        {/* Sprint Progress */}
                        <Card className="hover-lift">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {activeSprint?.completedPoints || 0}/{activeSprint?.totalPoints || 0} pts
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sprint Progress</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {Math.round(sprintProgress)}%
                                </p>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-orange-600 dark:bg-orange-400 h-2 rounded-full transition-all"
                                        style={{ width: `${sprintProgress}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Issue Status Breakdown & Team */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Issue Status */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Issue Status Overview</CardTitle>
                            <CardDescription>Current status of all issues</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <LoadingSkeleton count={4} className="h-16" />
                            ) : stats.totalIssues === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="text-sm">No issues found</p>
                                    <p className="text-xs mt-2">Create issues to see status breakdown</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <StatusBar label="To Do" count={stats.todoIssues} total={stats.totalIssues} color="gray" />
                                    <StatusBar label="In Progress" count={stats.inProgressIssues} total={stats.totalIssues} color="blue" />
                                    <StatusBar label="Done" count={stats.doneIssues} total={stats.totalIssues} color="green" />
                                    {stats.blockedIssues > 0 && (
                                        <StatusBar label="Blocked" count={stats.blockedIssues} total={stats.totalIssues} color="red" />
                                    )}
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                            <span>Total Issues:</span>
                                            <span className="font-bold">{stats.totalIssues}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Common tasks</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href="/scrum/sprint-planning">
                                <button className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors text-sm">
                                    Plan New Sprint
                                </button>
                            </Link>
                            <Link href="/scrum/board">
                                <button className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors text-sm">
                                    View Sprint Board
                                </button>
                            </Link>
                            <Link href="/backlog">
                                <button className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors text-sm">
                                    Manage Backlog
                                </button>
                            </Link>
                            <Link href="/users">
                                <button className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors text-sm">
                                    Team Management
                                </button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Issues & Team Members */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Issues */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Recent Issues</CardTitle>
                                    <CardDescription>Latest updates</CardDescription>
                                </div>
                                <Link href="/scrum/board" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                    View All →
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <LoadingSkeleton count={5} className="h-16" />
                            ) : allIssues.length > 0 ? (
                                <div className="space-y-3">
                                    {allIssues.slice(0, 5).map((issue) => (
                                        <div
                                            key={issue.id}
                                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-mono text-gray-500">{issue.key}</span>
                                                    <StatusBadge status={issue.status} />
                                                    {issue.storyPoints && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                                            {issue.storyPoints} pts
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                                                    {issue.title}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No issues yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Team Members */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Team Members</CardTitle>
                                    <CardDescription>{stats.activeTeamMembers} active members</CardDescription>
                                </div>
                                <Link href="/users" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                    Manage →
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <LoadingSkeleton count={5} className="h-14" />
                            ) : teamMembers.length > 0 ? (
                                <div className="space-y-3">
                                    {teamMembers.slice(0, 5).map((member) => (
                                        <div key={member.id} className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-semibold text-white">
                                                    {member.firstName?.[0]}{member.lastName?.[0]}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {member.firstName} {member.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {member.role}
                                                </p>
                                            </div>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                                member.isActive
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                            )}>
                                                {member.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    ))}
                                    {teamMembers.length > 5 && (
                                        <p className="text-sm text-gray-500 text-center pt-2">
                                            +{teamMembers.length - 5} more members
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No team members</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Container>
    );
}

// Helper Components
function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    const colorClasses = {
        gray: 'bg-gray-500',
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        red: 'bg-red-500'
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                    className={cn('h-2 rounded-full transition-all', colorClasses[color as keyof typeof colorClasses])}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors = {
        'TODO': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        'IN_PROGRESS': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        'IN_REVIEW': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        'DONE': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        'BLOCKED': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };

    const labels = {
        'TODO': 'To Do',
        'IN_PROGRESS': 'In Progress',
        'IN_REVIEW': 'Review',
        'DONE': 'Done',
        'BLOCKED': 'Blocked',
    };

    return (
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', colors[status as keyof typeof colors] || colors.TODO)}>
            {labels[status as keyof typeof labels] || status}
        </span>
    );
}
