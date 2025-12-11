'use client';

import { useState, useEffect } from 'react';
import { sprintsApi, SprintStatistics, Sprint } from '@/lib/api/endpoints/sprints';
import { Card } from '@/components/ui/Card'; // Assuming a Card component exists, or I use div
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Loader2, TrendingDown, CheckCircle, Target } from 'lucide-react';
import { format } from 'date-fns';

interface SprintDashboardProps {
    sprintId: string;
    onClose?: () => void;
}

export function SprintDashboard({ sprintId, onClose }: SprintDashboardProps) {
    const [stats, setStats] = useState<SprintStatistics | null>(null);
    const [sprint, setSprint] = useState<any>(null); // Ideally fetch sprint details too if not passed
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch stats
                const statsData = await sprintsApi.getStatistics(sprintId);
                setStats(statsData);

                // We might need sprint details for context (name, goal) if not provided.
                // Assuming we can get it or passed in. 
                // For now, sticking to stats.
            } catch (error) {
                console.error("Failed to fetch sprint stats", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (sprintId) {
            fetchData();
        }
    }, [sprintId]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!stats) {
        return <div className="text-center p-4">Failed to load statistics.</div>;
    }

    const { totalPoints, completedPoints, burnDown } = stats;
    const progress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sprint Dashboard</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Scope</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalPoints} <span className="text-sm font-normal text-gray-400">pts</span></p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedPoints} <span className="text-sm font-normal text-gray-400">pts</span></p>
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Remaining</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalPoints - completedPoints} <span className="text-sm font-normal text-gray-400">pts</span></p>
                </div>
            </div>

            {/* Burn-down Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Burn-down Chart</h3>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={burnDown}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(str) => format(new Date(str), 'MMM d')}
                                stroke="#9ca3af"
                                fontSize={12}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                fontSize={12}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="ideal"
                                stroke="#94a3b8"
                                strokeDasharray="5 5"
                                name="Ideal Guideline"
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="actual"
                                stroke="#6366f1"
                                strokeWidth={2}
                                name="Actual Remaining"
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
