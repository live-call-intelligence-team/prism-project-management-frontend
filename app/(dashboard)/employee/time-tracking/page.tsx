'use client';

import { useState } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { mockTimeEntries, getTotalHoursToday, getTotalHoursThisWeek, getTotalHoursThisMonth } from '@/lib/data/mockTimeEntries';
import { cn } from '@/lib/utils';

export default function TimeTrackingPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0); // seconds

    const hoursToday = getTotalHoursToday();
    const hoursWeek = getTotalHoursThisWeek();
    const hoursMonth = getTotalHoursThisMonth();

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        setIsRunning(true);
        setIsPaused(false);
    };

    const handlePause = () => {
        setIsPaused(true);
    };

    const handleResume = () => {
        setIsPaused(false);
    };

    const handleStop = () => {
        setIsRunning(false);
        setIsPaused(false);
        setElapsedTime(0);
    };

    return (
        <Container size="2xl">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Time Tracking
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Track your work time
                    </p>
                </div>

                {/* Timer Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Active Timer</CardTitle>
                        <CardDescription>Track time for your current task</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center py-8">
                            <div className={cn(
                                "text-6xl font-mono font-bold mb-8",
                                isRunning && !isPaused ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
                            )}>
                                {formatTime(elapsedTime)}
                            </div>

                            <div className="flex gap-3">
                                {!isRunning ? (
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        leftIcon={<Play className="w-5 h-5" />}
                                        onClick={handleStart}
                                    >
                                        Start Timer
                                    </Button>
                                ) : (
                                    <>
                                        {!isPaused ? (
                                            <Button
                                                variant="secondary"
                                                size="lg"
                                                leftIcon={<Pause className="w-5 h-5" />}
                                                onClick={handlePause}
                                            >
                                                Pause
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                leftIcon={<Play className="w-5 h-5" />}
                                                onClick={handleResume}
                                            >
                                                Resume
                                            </Button>
                                        )}
                                        <Button
                                            variant="danger"
                                            size="lg"
                                            leftIcon={<Square className="w-5 h-5" />}
                                            onClick={handleStop}
                                        >
                                            Stop
                                        </Button>
                                    </>
                                )}
                            </div>

                            {isRunning && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                                    Tracking: MAR-116 - Implement kanban board
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{hoursToday.toFixed(1)}h</p>
                                </div>
                                <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{hoursWeek.toFixed(0)}h</p>
                                </div>
                                <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{hoursMonth.toFixed(0)}h</p>
                                </div>
                                <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Time Log */}
                <Card>
                    <CardHeader>
                        <CardTitle>Time Log</CardTitle>
                        <CardDescription>Your recent time entries</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Task</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Duration</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {mockTimeEntries.slice(0, 10).map((entry) => (
                                        <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                {entry.date.toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm">
                                                    <span className="font-mono text-gray-500 dark:text-gray-400">{entry.taskKey}</span>
                                                    <p className="text-gray-900 dark:text-white line-clamp-1">{entry.taskTitle}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                                {(entry.duration / 60).toFixed(1)}h
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                                {entry.description}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
}
