import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { analyticsApi } from '@/lib/api/endpoints/analytics';
import { epicsApi, Epic } from '@/lib/api/endpoints/epics';
import { projectsApi } from '@/lib/api/endpoints/projects';
import {
    Loader2, AlertCircle, CheckCircle2, Clock, AlertTriangle, Activity,
    Target, Users, TrendingUp, TrendingDown, Zap, Calendar,
    Shield, AlertOctagon, ArrowRight, BarChart3, Layers
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadialBarChart, RadialBar } from 'recharts';
import { cn } from '@/lib/utils';

interface ProjectOverviewProps {
    projectId: string;
}

export function ProjectOverview({ projectId }: ProjectOverviewProps) {
    const [healthData, setHealthData] = useState<any>(null);
    const [velocityData, setVelocityData] = useState<any>(null);
    const [epics, setEpics] = useState<Epic[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [health, velocity, epicsData, projectData] = await Promise.all([
                    analyticsApi.getProjectHealth(projectId).catch(() => null),
                    analyticsApi.getVelocityChart(projectId).catch(() => null),
                    epicsApi.getAll(projectId).catch(() => []),
                    projectsApi.getById(projectId).catch(() => null),
                ]);
                setHealthData(health);
                setVelocityData(velocity?.velocityData || []);
                setEpics(Array.isArray(epicsData) ? epicsData : (epicsData as any)?.epics || []);
                setMembers((projectData as any)?.members || []);
            } catch (error) {
                console.error('Failed to fetch project overview data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (projectId) fetchData();
    }, [projectId]);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const metrics = healthData?.metrics || {};
    const sprintProgress = healthData?.sprintProgress;
    const healthScore = healthData?.healthScore || 0;
    const healthStatus = healthData?.healthStatus || 'UNKNOWN';

    // Derived metrics
    const totalIssues = metrics.totalIssues || 0;
    const doneIssues = metrics.doneIssues || 0;
    const completionPct = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0;
    const overduePct = totalIssues > 0 ? Math.round(((metrics.overdueIssues || 0) / totalIssues) * 100) : 0;
    const blockedPct = totalIssues > 0 ? Math.round(((metrics.blockedIssues || 0) / totalIssues) * 100) : 0;

    const getHealthColor = (status: string) => {
        switch (status) {
            case 'HEALTHY': return '#22c55e';
            case 'WARNING': return '#eab308';
            case 'CRITICAL': return '#ef4444';
            default: return '#3b82f6';
        }
    };

    const getHealthLabel = (status: string) => {
        switch (status) {
            case 'HEALTHY': return { label: '🟢 ON TRACK', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' };
            case 'WARNING': return { label: '🟡 AT RISK', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' };
            case 'CRITICAL': return { label: '🔴 CRITICAL', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' };
            default: return { label: '⚪ UNKNOWN', color: 'text-gray-600 bg-gray-50 dark:bg-gray-800' };
        }
    };

    const healthLabel = getHealthLabel(healthStatus);

    // Calculate epic stats
    const totalEpics = epics.length;
    const doneEpics = epics.filter(e => e.status === 'CLOSED').length;
    const atRiskEpics = epics.filter(e => {
        const progress = e.stats?.progress || 0;
        return progress < 50 && e.status !== 'CLOSED' && e.status !== 'OPEN';
    }).length;
    const unassignedEpics = epics.filter(e => !e.owner).length;

    // Build alerts
    const alerts: { type: 'critical' | 'warning' | 'info'; title: string; desc: string; action: string }[] = [];

    if ((metrics.overdueIssues || 0) > 0)
        alerts.push({ type: 'critical', title: `${metrics.overdueIssues} Overdue Issue(s)`, desc: 'Past their due date and need immediate attention', action: 'Review overdue issues' });
    if ((metrics.blockedIssues || 0) > 0)
        alerts.push({ type: 'warning', title: `${metrics.blockedIssues} Blocked Issue(s)`, desc: 'Issues blocked and cannot progress', action: 'Resolve blockers' });
    if (unassignedEpics > 0)
        alerts.push({ type: 'warning', title: `${unassignedEpics} Epic(s) without owner`, desc: 'Unassigned epics need an owner to track progress', action: 'Assign owners' });
    if ((metrics.criticalIssues || 0) > 2)
        alerts.push({ type: 'critical', title: `${metrics.criticalIssues} Critical Issues`, desc: 'High severity issues that need priority attention', action: 'Triage critical issues' });

    const healthChartData = [{ name: 'Health', value: healthScore, fill: getHealthColor(healthStatus) }];

    return (
        <div className="space-y-6 pt-2">
            {/* Section 1: Executive Summary */}
            <Card className="border-l-4 border-l-primary-500">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Project Summary</h2>
                                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold", healthLabel.color)}>
                                    {healthLabel.label}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">
                                {completionPct}% Complete &bull; Health: {healthScore}% &bull; {totalEpics} Epics &bull; {members.length} Team Members
                            </p>
                        </div>
                        {sprintProgress && (
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-500">Sprint:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{sprintProgress.sprintName}</span>
                                <span className="text-gray-400">({Math.round(sprintProgress.progress)}%)</span>
                            </div>
                        )}
                    </div>

                    {/* Timeline Progress Bar */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Overall Progress</span>
                            <span className="font-medium">{completionPct}%</span>
                        </div>
                        <div className="h-3 w-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    completionPct >= 75 ? "bg-gradient-to-r from-green-400 to-green-500" :
                                        completionPct >= 40 ? "bg-gradient-to-r from-blue-400 to-blue-500" :
                                            "bg-gradient-to-r from-amber-400 to-amber-500"
                                )}
                                style={{ width: `${completionPct}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section 2: Quick Metrics (8 cards, 2 rows) */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {/* Row 1: Issue Metrics */}
                <MetricCard icon={Activity} label="Total Issues" value={totalIssues} sub={`${completionPct}% done`} color="blue" />
                <MetricCard icon={Clock} label="Overdue" value={metrics.overdueIssues || 0} sub={overduePct > 0 ? `${overduePct}% of total` : 'None'} color={metrics.overdueIssues > 0 ? 'red' : 'green'} />
                <MetricCard icon={AlertCircle} label="Blocked" value={metrics.blockedIssues || 0} sub={blockedPct > 0 ? `${blockedPct}% of total` : 'None'} color={metrics.blockedIssues > 0 ? 'orange' : 'green'} />
                <MetricCard icon={AlertTriangle} label="Critical" value={metrics.criticalIssues || 0} sub={`${totalIssues > 0 ? Math.round(((metrics.criticalIssues || 0) / totalIssues) * 100) : 0}% of total`} color={metrics.criticalIssues > 0 ? 'rose' : 'green'} />

                {/* Row 2: Epic & Team Metrics */}
                <MetricCard icon={Layers} label="Total Epics" value={totalEpics} sub={`${doneEpics} completed`} color="indigo" />
                <MetricCard icon={CheckCircle2} label="Done Epics" value={doneEpics} sub={`${totalEpics > 0 ? Math.round((doneEpics / totalEpics) * 100) : 0}% complete`} color="green" />
                <MetricCard icon={Shield} label="At Risk" value={atRiskEpics} sub={atRiskEpics > 0 ? 'Needs attention' : 'All good'} color={atRiskEpics > 0 ? 'amber' : 'green'} />
                <MetricCard icon={Users} label="Unassigned" value={unassignedEpics} sub={unassignedEpics > 0 ? 'Need owner' : 'All assigned'} color={unassignedEpics > 0 ? 'amber' : 'green'} />
            </div>

            {/* Completion Breakdown */}
            {totalIssues > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Completion Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-4 w-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                            {[
                                { key: 'done', count: metrics.doneIssues || 0, color: 'bg-green-500', label: 'Done' },
                                { key: 'inReview', count: metrics.reviewIssues || 0, color: 'bg-purple-500', label: 'In Review' },
                                { key: 'inProgress', count: metrics.inProgressIssues || 0, color: 'bg-blue-500', label: 'In Progress' },
                                { key: 'todo', count: metrics.todoIssues || 0, color: 'bg-gray-400', label: 'To Do' },
                            ].filter(s => s.count > 0).map(s => (
                                <div
                                    key={s.key}
                                    className={`${s.color} transition-all`}
                                    style={{ width: `${(s.count / totalIssues) * 100}%` }}
                                    title={`${s.label}: ${s.count} (${Math.round((s.count / totalIssues) * 100)}%)`}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
                            {[
                                { color: 'bg-green-500', label: 'Done', count: metrics.doneIssues || 0 },
                                { color: 'bg-purple-500', label: 'Review', count: metrics.reviewIssues || 0 },
                                { color: 'bg-blue-500', label: 'In Progress', count: metrics.inProgressIssues || 0 },
                                { color: 'bg-gray-400', label: 'To Do', count: metrics.todoIssues || 0 },
                            ].filter(s => s.count > 0).map(s => (
                                <div key={s.label} className="flex items-center gap-1.5">
                                    <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                                    <span>{s.label}: <span className="font-medium">{s.count}</span></span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Section 3: Epic Progress Breakdown */}
            {epics.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary-500" />
                            Epic Progress Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-5">
                            {epics.map(epic => {
                                const totalFeaturesInEpic = epic.stats?.totalFeatures || 0;
                                const completedFeaturesInEpic = epic.stats?.completedFeatures || 0;
                                const epicProgress = epic.stats?.progress || 0;
                                const epicStatus = epic.status === 'CLOSED'
                                    ? 'done' : epicProgress >= 50 ? 'ontrack' : epicProgress > 0 ? 'atrisk' : 'planning';
                                const statusEmoji = epicStatus === 'done' ? '✅' : epicStatus === 'ontrack' ? '🟢' : epicStatus === 'atrisk' ? '🟡' : '⚪';
                                const statusLabel = epicStatus === 'done' ? 'DONE' : epicStatus === 'ontrack' ? 'ON TRACK' : epicStatus === 'atrisk' ? 'AT RISK' : 'PLANNING';

                                return (
                                    <div key={epic.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                        <div className="flex items-start md:items-center justify-between mb-2 flex-col md:flex-row gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">🎯</span>
                                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{epic.name}</h4>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                                    epicStatus === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                        epicStatus === 'ontrack' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                            epicStatus === 'atrisk' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                                'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                )}>
                                                    {statusEmoji} {statusLabel}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                {epic.owner && (
                                                    <span className="flex items-center gap-1">
                                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[8px] font-bold text-white">
                                                            {(epic.owner as any).firstName?.[0]}{(epic.owner as any).lastName?.[0]}
                                                        </div>
                                                        {(epic.owner as any).firstName} {(epic.owner as any).lastName}
                                                    </span>
                                                )}
                                                {!epic.owner && <span className="text-amber-500 font-medium">⚠️ No Owner</span>}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all",
                                                        epicStatus === 'done' ? 'bg-green-500' :
                                                            epicStatus === 'ontrack' ? 'bg-blue-500' :
                                                                epicStatus === 'atrisk' ? 'bg-yellow-500' :
                                                                    'bg-gray-400'
                                                    )}
                                                    style={{ width: `${epicProgress}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-10 text-right">{epicProgress}%</span>
                                        </div>

                                        {/* Stats row */}
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                            <span>Features: <span className="font-medium text-gray-700 dark:text-gray-300">{completedFeaturesInEpic}/{totalFeaturesInEpic}</span></span>
                                            {epic.priority && (
                                                <span>Priority: <span className="font-medium text-gray-700 dark:text-gray-300">{epic.priority}</span></span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Section 4: Velocity + Health Side by Side */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Sprint Velocity</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            {velocityData && velocityData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={velocityData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                                        <XAxis dataKey="sprintName" className="text-xs" />
                                        <YAxis className="text-xs" />
                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend />
                                        <Bar name="Velocity" dataKey="velocity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        <Bar name="Capacity" dataKey="capacity" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                    No completed sprints data available
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Project Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center space-y-6">
                            <div className="relative h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart innerRadius="60%" outerRadius="100%" data={healthChartData} startAngle={180} endAngle={0}>
                                        <RadialBar
                                            label={{ fill: getHealthColor(healthStatus), position: 'center', fontSize: 24, fontWeight: 'bold', formatter: (val: any) => `${val}%` }}
                                            background
                                            dataKey="value"
                                            cornerRadius={10}
                                        />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                                <div className="absolute bottom-0 left-0 right-0 text-center">
                                    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", healthLabel.color)}>
                                        {healthStatus}
                                    </span>
                                </div>
                            </div>

                            {sprintProgress && (
                                <div className="w-full space-y-2 border-t pt-4 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Active Sprint: {sprintProgress.sprintName}</span>
                                        <span className="text-sm text-muted-foreground">{Math.round(sprintProgress.progress)}%</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                        <div className="h-full bg-primary transition-all duration-300 ease-in-out" style={{ width: `${sprintProgress.progress}%` }} />
                                    </div>
                                    <p className="text-xs text-muted-foreground text-right">
                                        {sprintProgress.completedPoints} / {sprintProgress.totalPoints} Points
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Section 5: Risks & Alerts */}
            {alerts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertOctagon className="w-5 h-5 text-amber-500" />
                            Risks & Alerts ({alerts.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {alerts.map((alert, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-lg border",
                                        alert.type === 'critical'
                                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                            : alert.type === 'warning'
                                                ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                                                : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                                    )}
                                >
                                    {alert.type === 'critical' ? (
                                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    ) : alert.type === 'warning' ? (
                                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <Activity className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className={cn(
                                            "text-sm font-semibold",
                                            alert.type === 'critical' ? 'text-red-800 dark:text-red-300' :
                                                alert.type === 'warning' ? 'text-amber-800 dark:text-amber-300' :
                                                    'text-blue-800 dark:text-blue-300'
                                        )}>
                                            {alert.title}
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{alert.desc}</p>
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-medium px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0",
                                        alert.type === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                                            'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                                    )}>
                                        {alert.action}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Section 6: Team Workload */}
            {members.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary-500" />
                            Team Members ({members.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {members.slice(0, 6).map((member: any) => (
                                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                        {member.name?.[0] || '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{member.name}</p>
                                        <p className="text-[10px] text-gray-500">{member.role?.replace(/_/g, ' ')}</p>
                                    </div>
                                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300 font-medium flex-shrink-0">
                                        Active
                                    </span>
                                </div>
                            ))}
                        </div>
                        {members.length > 6 && (
                            <p className="text-xs text-center text-gray-400 mt-3">+ {members.length - 6} more members</p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Reusable Metric Card Component
function MetricCard({ icon: Icon, label, value, sub, color }: {
    icon: any; label: string; value: number | string; sub: string;
    color: 'blue' | 'red' | 'green' | 'orange' | 'rose' | 'indigo' | 'amber';
}) {
    const colorMap = {
        blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
        red: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
        green: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
        orange: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400',
        rose: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400',
        indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400',
        amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
    };

    return (
        <Card className="relative overflow-hidden">
            <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500 truncate">{label}</span>
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", colorMap[color])}>
                        <Icon className="w-3.5 h-3.5" />
                    </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
                <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>
            </CardContent>
        </Card>
    );
}
