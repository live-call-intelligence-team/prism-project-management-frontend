'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
    Clock,
    CheckCircle2,
    FileText,
    MessageSquare,
    Plus,
    Edit,
    Upload,
    Filter,
    Calendar
} from 'lucide-react';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { formatDistanceToNow, subDays, isAfter, format } from 'date-fns';

interface ProjectActivityTabProps {
    projectId: string;
}

export function ProjectActivityTab({ projectId }: ProjectActivityTabProps) {
    const [activity, setActivity] = useState<any[]>([]);
    const [filteredActivity, setFilteredActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const data = await projectsApi.getClientProjectActivity(projectId, 50);
                setActivity(data);
                setFilteredActivity(data);
            } catch (error) {
                console.error('Failed to fetch activity', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [projectId]);

    // Apply filters when they change
    useEffect(() => {
        let filtered = [...activity];

        // Date filter
        if (dateFilter !== 'all') {
            const cutoffDate = dateFilter === '7days' ? subDays(new Date(), 7)
                : dateFilter === '30days' ? subDays(new Date(), 30)
                    : subDays(new Date(), 90);

            filtered = filtered.filter(item =>
                isAfter(new Date(item.timestamp), cutoffDate)
            );
        }

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(item => item.type === typeFilter);
        }

        setFilteredActivity(filtered);
    }, [activity, dateFilter, typeFilter]);

    // Group activity by date
    const groupedActivity = filteredActivity.reduce((acc: any, item) => {
        const dateKey = format(new Date(item.timestamp), 'MMM d, yyyy');
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
    }, {});

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'issue_created':
                return <Plus className="h-4 w-4" />;
            case 'issue_updated':
                return <Edit className="h-4 w-4" />;
            case 'comment':
                return <MessageSquare className="h-4 w-4" />;
            case 'file_uploaded':
                return <Upload className="h-4 w-4" />;
            case 'milestone_completed':
                return <CheckCircle2 className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'issue_created':
                return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'issue_updated':
                return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
            case 'comment':
                return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            case 'file_uploaded':
                return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
            case 'milestone_completed':
                return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
            default:
                return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-8">
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-3">
                                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="border-b pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Project Activity Timeline
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                            {filteredActivity.length} events
                        </span>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mt-4">
                    {/* Date Range Filter */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        {[
                            { value: 'all', label: 'All Time' },
                            { value: '7days', label: '7 Days' },
                            { value: '30days', label: '30 Days' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setDateFilter(option.value as any)}
                                className={`
                                    px-3 py-1 text-xs font-medium rounded-md transition-all
                                    ${dateFilter === option.value
                                        ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'}
                                `}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {/* Type Filter */}
                    <div className="flex flex-wrap bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        {[
                            { value: 'all', label: 'All Types' },
                            { value: 'issue_created', label: 'Created' },
                            { value: 'issue_updated', label: 'Updated' },
                            { value: 'comment', label: 'Comments' },
                            { value: 'file_uploaded', label: 'Files' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setTypeFilter(option.value)}
                                className={`
                                    px-3 py-1 text-xs font-medium rounded-md transition-all
                                    ${typeFilter === option.value
                                        ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'}
                                `}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {filteredActivity.length === 0 ? (
                    <div className="text-center py-12 px-4 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No activity matches your filters</p>
                        <Button
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={() => {
                                setDateFilter('all');
                                setTypeFilter('all');
                            }}
                        >
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[700px] overflow-y-auto">
                        {Object.keys(groupedActivity).map((date) => (
                            <div key={date}>
                                <div className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 py-2 border-b border-t flex items-center gap-2">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {date}
                                    </span>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {groupedActivity[date].map((item: any, index: number) => (
                                        <div
                                            key={index}
                                            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                            <div className="flex gap-3 items-start">
                                                <div className={`p-2 rounded-full shrink-0 ${getActivityColor(item.type)}`}>
                                                    {getActivityIcon(item.type)}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="text-sm">
                                                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                                    {item.user}
                                                                </span>
                                                                {' '}
                                                                <span className="text-muted-foreground">
                                                                    {item.type === 'issue_created' && 'created'}
                                                                    {item.type === 'issue_updated' && 'updated'}
                                                                    {item.type === 'comment' && 'commented on'}
                                                                    {item.type === 'file_uploaded' && 'uploaded a file to'}
                                                                    {item.type === 'milestone_completed' && 'completed milestone in'}
                                                                </span>
                                                            </p>
                                                            {item.issueKey && (
                                                                <p className="text-sm font-medium mt-1 flex items-center gap-2">
                                                                    <Badge variant="outline" className="font-mono text-xs bg-white dark:bg-gray-800">
                                                                        {item.issueKey}
                                                                    </Badge>
                                                                    {item.issueTitle && (
                                                                        <span className="truncate">{item.issueTitle}</span>
                                                                    )}
                                                                </p>
                                                            )}
                                                            {item.target && !item.issueKey && (
                                                                <p className="text-sm text-muted-foreground mt-1 bg-gray-50 dark:bg-gray-800 p-1.5 rounded border inline-block max-w-full truncate">
                                                                    {item.target.replace(/"/g, '')}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                            {format(new Date(item.timestamp), 'h:mm a')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
