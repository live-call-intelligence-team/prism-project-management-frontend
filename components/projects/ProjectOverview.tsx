import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { analyticsApi } from '@/lib/api/endpoints/analytics';
import { Loader2, AlertCircle, CheckCircle2, Clock, AlertTriangle, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadialBarChart, RadialBar } from 'recharts';

interface ProjectOverviewProps {
    projectId: string;
}

export function ProjectOverview({ projectId }: ProjectOverviewProps) {
    const [healthData, setHealthData] = useState<any>(null);
    const [velocityData, setVelocityData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [health, velocity] = await Promise.all([
                    analyticsApi.getProjectHealth(projectId),
                    analyticsApi.getVelocityChart(projectId)
                ]);
                setHealthData(health);
                setVelocityData(velocity?.velocityData || []);
            } catch (error) {
                console.error('Failed to fetch project overview data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (projectId) {
            fetchData();
        }
    }, [projectId]);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!healthData) {
        return (
            <div className="p-6 text-center text-gray-500">
                Failed to load project overview.
            </div>
        );
    }

    const { metrics, sprintProgress, healthScore, healthStatus } = healthData;

    const getHealthColor = (status: string) => {
        switch (status) {
            case 'HEALTHY': return '#22c55e'; // green-500
            case 'WARNING': return '#eab308'; // yellow-500
            case 'CRITICAL': return '#ef4444'; // red-500
            default: return '#3b82f6'; // blue-500
        }
    };

    const healthChartData = [
        { name: 'Health', value: healthScore, fill: getHealthColor(healthStatus) }
    ];

    return (
        <div className="space-y-6 pt-2">
            {/* Header Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalIssues}</div>
                        <p className="text-xs text-muted-foreground">Across all states</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                        <Clock className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.overdueIssues}</div>
                        <p className="text-xs text-muted-foreground">Past due date</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Blocked</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{metrics.blockedIssues}</div>
                        <p className="text-xs text-muted-foreground">Issues blocked</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critical</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{metrics.criticalIssues}</div>
                        <p className="text-xs text-muted-foreground">High priority issues</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Velocity Chart */}
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
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
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

                {/* Project Health & Active Sprint */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Project Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center space-y-6">
                            <div className="relative h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart
                                        innerRadius="60%"
                                        outerRadius="100%"
                                        data={healthChartData}
                                        startAngle={180}
                                        endAngle={0}
                                    >
                                        <RadialBar
                                            label={{ fill: getHealthColor(healthStatus), position: 'center', fontSize: 24, fontWeight: 'bold', formatter: (val: any) => `${val}%` }}
                                            background
                                            dataKey="value"
                                            cornerRadius={10}
                                        />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                                <div className="absolute bottom-0 left-0 right-0 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${healthStatus === 'HEALTHY' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                        healthStatus === 'WARNING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                            'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                        }`}>
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
                                        <div
                                            className="h-full bg-primary transition-all duration-300 ease-in-out"
                                            style={{ width: `${sprintProgress.progress}%` }}
                                        />
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
        </div>
    );
}
