'use client';

import { useState, useEffect } from 'react';
import Container from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { Download, Activity, Database, TrendingUp, Users, FileText } from 'lucide-react';
import { analyticsApi } from '@/lib/api/endpoints/analytics';
import { useToast } from '@/components/ui/Toast';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

export default function AdminAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [systemHealth, setSystemHealth] = useState<any>(null);
    const [dbStats, setDbStats] = useState<any>(null);
    const [growthStats, setGrowthStats] = useState<any>(null);
    const [resolutionStats, setResolutionStats] = useState<any>(null);

    // Export State
    const [exportType, setExportType] = useState<'issues' | 'users' | 'audit'>('issues');
    const [isExporting, setIsExporting] = useState(false);
    const { success, error: toastError } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [health, db, growth, resolution] = await Promise.all([
                    analyticsApi.getSystemHealth(),
                    analyticsApi.getDatabaseStats(),
                    analyticsApi.getGrowthStats(),
                    analyticsApi.getResolutionRate()
                ]);

                setSystemHealth(health);
                setDbStats(db);
                setGrowthStats(growth);
                setResolutionStats(resolution);
            } catch (err) {
                console.error(err);
                toastError('Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const blob = await analyticsApi.exportReport(exportType);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${exportType}_report_${new Date().toISOString()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            success('Export downloaded successfully');
        } catch (err) {
            console.error(err);
            toastError('Failed to export report');
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) return <Container><LoadingSkeleton count={3} /></Container>;

    // Prepare chart data
    const growthData = growthStats?.userGrowth.map((u: any, i: number) => ({
        month: new Date(u.month).toLocaleDateString('default', { month: 'short' }),
        users: parseInt(u.count),
        projects: parseInt(growthStats.projectGrowth[i]?.count || 0)
    })) || [];

    const resolutionData = resolutionStats?.created.map((c: any, i: number) => ({
        month: new Date(c.month).toLocaleDateString('default', { month: 'short' }),
        created: parseInt(c.count),
        resolved: parseInt(resolutionStats.resolved.find((r: any) => r.month === c.month)?.count || 0)
    })) || [];

    return (
        <Container size="full">
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Analytics</h1>
                    <p className="text-gray-500 dark:text-gray-400">Monitor system health, growth trends, and export reports.</p>
                </div>

                {/* System Health Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase">CPU Usage</CardTitle>
                            <Activity className="w-4 h-4 text-primary-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{systemHealth?.cpuUsage}%</div>
                            <p className="text-xs text-gray-500">
                                {systemHealth?.loadAverage?.map((l: number) => l.toFixed(1)).join(', ')} (1/5/15 min)
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Memory Usage</CardTitle>
                            <Activity className="w-4 h-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{systemHealth?.memoryUsage}%</div>
                            <p className="text-xs text-gray-500">
                                Platform: {systemHealth?.platform} {systemHealth?.release}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Database Size</CardTitle>
                            <Database className="w-4 h-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dbStats?.size}</div>
                            <p className="text-xs text-gray-500">
                                {dbStats?.connections} active connections
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase">Cache Hit Ratio</CardTitle>
                            <TrendingUp className="w-4 h-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dbStats?.cacheHitRatio}%</div>
                            <p className="text-xs text-gray-500">
                                DB Performance Efficiency
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Growth Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-4">
                        <CardHeader>
                            <CardTitle>Growth Trends (6 Months)</CardTitle>
                        </CardHeader>
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthData}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="users" stroke="#8884d8" fillOpacity={1} fill="url(#colorUsers)" name="Users" />
                                    <Area type="monotone" dataKey="projects" stroke="#82ca9d" fillOpacity={1} fill="url(#colorProjects)" name="Projects" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <CardHeader>
                            <CardTitle>Resolution Rate</CardTitle>
                        </CardHeader>
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={resolutionData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="created" fill="#f87171" name="Created" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="resolved" fill="#4ade80" name="Resolved" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* Export Section */}
                <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <FileText className="w-5 h-5" />
                            Data Export
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="flex-1">
                                <p className="text-gray-300 text-sm mb-2">Select the type of data you want to export as CSV.</p>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="exportType"
                                            value="issues"
                                            checked={exportType === 'issues'}
                                            onChange={(e) => setExportType(e.target.value as any)}
                                            className="text-primary-500 focus:ring-primary-500"
                                        />
                                        All Issues
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="exportType"
                                            value="users"
                                            checked={exportType === 'users'}
                                            onChange={(e) => setExportType(e.target.value as any)}
                                            className="text-primary-500 focus:ring-primary-500"
                                        />
                                        User Directory
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="exportType"
                                            value="audit"
                                            checked={exportType === 'audit'}
                                            onChange={(e) => setExportType(e.target.value as any)}
                                            className="text-primary-500 focus:ring-primary-500"
                                        />
                                        Audit Logs
                                    </label>
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                className="w-full md:w-auto bg-white text-gray-900 hover:bg-gray-100"
                                onClick={handleExport}
                                disabled={isExporting}
                                leftIcon={<Download className="w-4 h-4" />}
                            >
                                {isExporting ? 'Exporting...' : 'Download CSV Report'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
}
