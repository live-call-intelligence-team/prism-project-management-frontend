'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Briefcase,
    Calendar,
    ArrowRight,
    Users,
    TrendingUp,
    DollarSign,
    Target
} from 'lucide-react';
import Link from 'next/link';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { issuesApi } from '@/lib/api/endpoints/issues';
import { PendingActionsWidget } from '@/components/client/PendingActionsWidget';
import { UpcomingMilestonesWidget } from '@/components/client/UpcomingMilestonesWidget';
import { RecentActivityFeed } from '@/components/client/RecentActivityFeed';
import { DashboardStats } from '@/components/client/DashboardStats';

export default function ClientDashboardPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [upcomingMilestones, setUpcomingMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Client');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get user info from localStorage or auth context
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    setUserName(user.firstName || 'Client');
                }

                // Fetch projects from client endpoint
                const projectsData = await projectsApi.getClientProjects({ limit: 10 });

                if (projectsData && projectsData.projects) {
                    setProjects(projectsData.projects);

                    // Fetch milestones for all projects
                    const allMilestones: any[] = [];
                    for (const project of projectsData.projects.slice(0, 4)) {
                        try {
                            const milestones = await projectsApi.getClientProjectMilestones(project.id);
                            allMilestones.push(...milestones.map((m: any) => ({ ...m, project })));
                        } catch (err) {
                            console.error('Error fetching milestones for project', project.id);
                        }
                    }

                    // Sort by due date and filter upcoming/in-progress
                    const sorted = allMilestones
                        .filter((m: any) => m.status === 'UPCOMING' || m.status === 'IN_PROGRESS')
                        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
                    setUpcomingMilestones(sorted.slice(0, 5));

                    // Fetch activity for first few projects
                    const allActivity: any[] = [];
                    for (const project of projectsData.projects.slice(0, 3)) {
                        try {
                            const activity = await projectsApi.getClientProjectActivity(project.id, 10);
                            allActivity.push(...activity.map((a: any) => ({
                                ...a,
                                projectName: project.name
                            })));
                        } catch (err) {
                            console.error('Error fetching activity for project', project.id, err);
                            // Continue even if one project fails
                        }
                    }

                    // Sort by timestamp
                    const sortedActivity = allActivity.sort((a: any, b: any) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    );
                    setRecentActivity(sortedActivity.slice(0, 10));
                }

                // Fetch pending actions (Approvals, Feedback, Reviews)
                const pendingActions = await projectsApi.getPendingActions(10);
                setPendingApprovals(pendingActions);

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8 max-w-7xl">
            {/* 1. Hero Section */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Welcome back, {userName}! 👋
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Here's what's happening with your projects
                </p>
            </div>

            {/* 2. Stats Cards */}
            <DashboardStats projects={projects} pendingActionsCount={pendingApprovals.length} />

            {/* 3. My Projects */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        My Projects
                    </h2>
                    <Link
                        href="/projects"
                        className="text-sm font-medium text-primary hover:underline flex items-center"
                    >
                        View All <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </div>

                {projects.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center text-muted-foreground">
                            <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium">No active projects found</p>
                            <Button className="mt-4" onClick={() => window.location.href = 'mailto:manager@example.com'}>
                                Contact Manager
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.slice(0, 3).map((project) => (
                            <Link href={`/projects/${project.id}`} key={project.id}>
                                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer h-full group hover:-translate-y-1">
                                    <CardHeader className="pb-3 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
                                                {project.name}
                                            </h3>
                                            <Badge
                                                variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}
                                                className="uppercase text-[10px] font-bold"
                                            >
                                                {project.status === 'ACTIVE' ? 'ACTIVE' : 'ON HOLD'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {project.description || "No description provided"}
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Progress */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span>Progress</span>
                                                <span>{project.progress || 0}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-500"
                                                    style={{ width: `${project.progress || 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Stats Row */}
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Target className="h-4 w-4" />
                                                <span>
                                                    {project.stats?.totalIssues || 0} Issues
                                                    <span className="text-xs ml-1 opacity-70">
                                                        ({project.stats?.openIssues || 0} Open)
                                                    </span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Footer Row: Team & Time */}
                                        <div className="pt-4 border-t flex justify-between items-end gap-2">
                                            <div className="flex -space-x-2">
                                                {/* Lead */}
                                                {project.lead && (
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-bold text-primary" title={`Lead: ${project.lead.firstName}`}>
                                                        {project.lead.firstName[0]}
                                                    </div>
                                                )}
                                                {/* Members */}
                                                {project.members?.slice(0, 3).map((m: any) => (
                                                    <div key={m.id} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300" title={`${m.firstName} ${m.lastName}`}>
                                                        {m.firstName[0]}
                                                    </div>
                                                ))}
                                                {/* Overflow */}
                                                {project.members?.length > 3 && (
                                                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs text-muted-foreground">
                                                        +{project.members.length - 3}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'Just now'}
                                            </div>
                                        </div>

                                        <div className="pt-2 text-center">
                                            <span className="text-sm font-medium text-primary group-hover:underline">
                                                View Details →
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* 4. Split View: Activity & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                {/* Left Panel (60%) */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Recent Activity
                        </h2>
                    </div>
                    <RecentActivityFeed activities={recentActivity} loading={false} />
                    <div className="text-center">
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                            View All Activity
                        </Button>
                    </div>
                </div>

                {/* Right Panel (40%) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            ⚠️ Action Required
                            {pendingApprovals.length > 0 && (
                                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                                    {pendingApprovals.length}
                                </span>
                            )}
                        </h2>
                    </div>
                    {/* Reuse PendingItemsWidget but configured for "Action Required" style if needed. 
                        For now, usage of existing widget is fine as it lists actions. 
                        We can wrap it to match the "If No Actions" style. */}
                    {pendingApprovals.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                    <Target className="h-8 w-8" />
                                    {/* Or CheckCircle */}
                                </div>
                                <h3 className="font-bold text-lg">All caught up!</h3>
                                <p className="text-muted-foreground">No pending actions at the moment</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <PendingActionsWidget actions={pendingApprovals} loading={false} />
                    )}

                    {/* Upcoming Milestones (Optional as per spec) */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            Upcoming Milestones
                        </h2>
                        <UpcomingMilestonesWidget milestones={upcomingMilestones} loading={false} />
                    </div>
                </div>
            </div>
        </div>
    );
}
