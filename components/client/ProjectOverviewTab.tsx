'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    Calendar,
    DollarSign,
    Clock,
    CheckCircle2,
    Users,
    Target
} from 'lucide-react';
import { format } from 'date-fns';

interface ProjectOverviewTabProps {
    project: any;
}

export function ProjectOverviewTab({ project }: ProjectOverviewTabProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getDaysRemaining = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysRemaining = project.endDate ? getDaysRemaining(project.endDate) : null;

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Progress Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Overall Progress
                            </CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{project.stats?.progress || 0}%</div>
                        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${project.stats?.progress || 0}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Tasks Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Tasks Completed
                            </CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {project.stats?.completedIssues || 0}
                            <span className="text-sm text-muted-foreground font-normal ml-1">
                                / {project.stats?.totalIssues || 0}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {project.stats?.pendingApprovals > 0 ? (
                                <span className="text-amber-600 font-medium">
                                    {project.stats.pendingApprovals} pending approvals
                                </span>
                            ) : (
                                'On track'
                            )}
                        </p>
                    </CardContent>
                </Card>

                {/* Timeline Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Timeline
                            </CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {project.endDate
                                ? format(new Date(project.endDate), 'MMM d')
                                : 'Ongoing'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {daysRemaining !== null && (
                                daysRemaining > 0
                                    ? `${daysRemaining} days remaining`
                                    : daysRemaining === 0
                                        ? 'Due today!'
                                        : `${Math.abs(daysRemaining)} days overdue`
                            )}
                        </p>
                    </CardContent>
                </Card>

                {/* Budget Card */}
                {project.budget && (
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Budget
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(project.budget)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Allocated budget
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Key Deliverables & Milestones */}
            {project.upcomingMilestones && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            Key Deliverables & Milestones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {project.upcomingMilestones.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed">
                                <p>No upcoming deliverables scheduled</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {project.upcomingMilestones.map((milestone: any) => {
                                    const progress = milestone.tasksTotal && milestone.tasksCompleted
                                        ? Math.round((milestone.tasksCompleted / milestone.tasksTotal) * 100)
                                        : 0;

                                    return (
                                        <div key={milestone.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-lg">{milestone.name}</h4>
                                                        {milestone.status === 'COMPLETED' && (
                                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                        )}
                                                    </div>
                                                    {milestone.description && (
                                                        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                                                            {milestone.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <Badge variant={
                                                        milestone.status === 'COMPLETED' ? 'default' :
                                                            milestone.status === 'IN_PROGRESS' ? 'secondary' :
                                                                'outline'
                                                    }>
                                                        {milestone.status.replace('_', ' ')}
                                                    </Badge>
                                                    {milestone.dueDate && (
                                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="text-muted-foreground">
                                                        {milestone.tasksCompleted || 0} / {milestone.tasksTotal || 0} tasks
                                                    </span>
                                                    <span>{progress}% Complete</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-700 ${milestone.status === 'COMPLETED' ? 'bg-green-500' : 'bg-primary'
                                                            }`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Project Manager Contact Card */}
                <div className="md:col-span-1">
                    <Card className="h-full bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 border-blue-100 dark:border-blue-900/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                                Project Manager
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-2xl font-bold mb-3 border-4 border-white dark:border-gray-800 shadow-sm">
                                    {project.lead?.firstName?.[0] || 'M'}
                                </div>
                                <h3 className="font-bold text-lg">{project.lead?.firstName} {project.lead?.lastName}</h3>
                                <p className="text-sm text-muted-foreground mb-4">Project Lead</p>

                                <div className="w-full space-y-2">
                                    <button
                                        className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border hover:bg-gray-50 dark:hover:bg-gray-700 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                                        onClick={() => window.location.href = `mailto:${project.lead?.email}`}
                                    >
                                        <Clock className="w-4 h-4" /> Schedule Call
                                    </button>
                                    <button
                                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                                        onClick={() => window.location.href = `mailto:${project.lead?.email}`}
                                    >
                                        <Users className="w-4 h-4" /> Email Manager
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Updates - Takes filtered space */}
                <div className="md:col-span-2">
                    {project.recentActivity && project.recentActivity.length > 0 ? (
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    Recent Updates
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-0">
                                    {project.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                                        <div key={index} className="flex gap-4 pb-4 border-l-2 border-l-gray-200 dark:border-l-gray-700 pl-4 relative last:pb-0">
                                            <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white dark:border-gray-900 ${activity.action?.includes('created') ? 'bg-blue-500' :
                                                activity.action?.includes('completed') ? 'bg-green-500' : 'bg-gray-400'
                                                }`} />
                                            <div className="flex-1 min-w-0 -mt-1">
                                                <p className="text-sm">
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">{activity.user}</span>
                                                    {' '}
                                                    <span className="text-muted-foreground">{activity.action}</span>
                                                    {' '}
                                                    <span className="font-medium text-primary">{activity.target}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {format(new Date(activity.timestamp || activity.time), 'MMM d, h:mm a')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="h-full flex items-center justify-center p-6 text-muted-foreground">
                            <p>No recent activity</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
