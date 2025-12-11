'use client';

import { Download, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { getVelocityData, getBurndownData } from '@/lib/data/mockSprints';

export default function ReportsPage() {
    const velocityData = getVelocityData();
    const burndownData = getBurndownData('sprint-12');

    return (
        <Container size="2xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Sprint Reports
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Analyze team performance and sprint metrics
                        </p>
                    </div>
                    <Button variant="primary" leftIcon={<Download className="w-5 h-5" />}>
                        Export Report
                    </Button>
                </div>

                {/* Velocity Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Team Velocity</CardTitle>
                        <CardDescription>Story points completed over last sprints</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-end justify-between gap-4">
                            {velocityData.map((data) => {
                                const maxValue = Math.max(...velocityData.flatMap(d => [d.committed, d.completed]));
                                const committedHeight = (data.committed / maxValue) * 100;
                                const completedHeight = (data.completed / maxValue) * 100;

                                return (
                                    <div key={data.sprint} className="flex-1 flex flex-col items-center gap-2">
                                        <div className="w-full flex gap-2 items-end">
                                            <div className="flex-1 relative group">
                                                <div
                                                    className="w-full bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg transition-all hover:from-gray-500 hover:to-gray-400 cursor-pointer"
                                                    style={{ height: `${committedHeight}%` }}
                                                >
                                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2 py-1 rounded text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                        {data.committed} committed
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 relative group">
                                                <div
                                                    className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:from-green-700 hover:to-green-500 cursor-pointer"
                                                    style={{ height: `${completedHeight}%` }}
                                                >
                                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2 py-1 rounded text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                        {data.completed} done
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                            {data.sprint.replace('Sprint ', 'S')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-gray-400" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Committed</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-green-600" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Velocity Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Average Velocity</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">45 pts</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Trend</p>
                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">+8%</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Consistency</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">85%</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Burndown Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sprint Burndown</CardTitle>
                        <CardDescription>Remaining work over sprint duration</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80 relative">
                            <svg className="w-full h-full" viewBox="0 0 500 300">
                                {/* Grid lines */}
                                {[0, 25, 50, 75, 100].map((y) => (
                                    <line
                                        key={y}
                                        x1="50"
                                        y1={30 + (y * 2.4)}
                                        x2="480"
                                        y2={30 + (y * 2.4)}
                                        stroke="currentColor"
                                        strokeWidth="0.5"
                                        className="text-gray-300 dark:text-gray-700"
                                    />
                                ))}

                                {/* Ideal line */}
                                <polyline
                                    points={burndownData.map((d, i) => `${50 + (i * 30)},${30 + ((100 - d.ideal) * 2.4)}`).join(' ')}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                    className="text-gray-400 dark:text-gray-600"
                                />

                                {/* Actual line */}
                                <polyline
                                    points={burndownData.map((d, i) => `${50 + (i * 30)},${30 + ((100 - d.actual) * 2.4)}`).join(' ')}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    className="text-blue-600 dark:text-blue-400"
                                />

                                {/* Dots */}
                                {burndownData.map((d, i) => (
                                    <circle
                                        key={i}
                                        cx={50 + (i * 30)}
                                        cy={30 + ((100 - d.actual) * 2.4)}
                                        r="5"
                                        fill="currentColor"
                                        className="text-blue-600 dark:text-blue-400"
                                    />
                                ))}

                                {/* Labels */}
                                {burndownData.filter((_, i) => i % 2 === 0).map((d, i) => (
                                    <text
                                        key={i}
                                        x={50 + (i * 2 * 30)}
                                        y={280}
                                        className="text-xs fill-gray-600 dark:fill-gray-400"
                                        textAnchor="middle"
                                    >
                                        {d.day}
                                    </text>
                                ))}
                            </svg>
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-0.5 bg-gray-400 border-dashed border-t-2 border-gray-400" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Ideal Burndown</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-0.5 bg-blue-600" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Actual Burndown</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
}
