'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import { useAuthStore } from '@/lib/store/authStore';
import {
    Loader2,
    MessageSquare,
    Paperclip,
    CheckCircle2,
    Circle,
    Clock,
    Search,
    AlertCircle,
    CheckSquare,
    ChevronDown,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ClientIssueModal } from './ClientIssueModal';

interface ClientIssueListProps {
    projectId: string;
}

export function ClientIssueList({ projectId }: ClientIssueListProps) {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [expandedSections, setExpandedSections] = useState({
        review: true,
        active: true,
        completed: false
    });

    // Fetch issues
    useEffect(() => {
        const fetchIssues = async () => {
            try {
                // Backend automatically filters by isClientVisible for Client role
                const data = await issuesApi.getAll({ projectId, status: 'ALL' });
                if (data && data.issues) {
                    setIssues(data.issues);
                }
            } catch (error) {
                console.error("Failed to fetch issues", error);
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchIssues();
        }
    }, [projectId]);

    const toggleSection = (section: 'review' | 'active' | 'completed') => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DONE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'IN_REVIEW': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const filteredIssues = issues.filter(issue =>
    (issue.title.toLowerCase().includes(search.toLowerCase()) ||
        issue.key.toLowerCase().includes(search.toLowerCase()))
    );

    const pendingReview = filteredIssues.filter(i => i.clientApprovalStatus === 'PENDING');
    const inProgress = filteredIssues.filter(i => i.status !== 'DONE' && i.clientApprovalStatus !== 'PENDING');
    const completed = filteredIssues.filter(i => i.status === 'DONE');

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (issues.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center">
                    <CheckCircle2 className="w-16 h-16 mb-4 text-green-500/20" />
                    <p className="font-medium text-lg">No visible tasks</p>
                    <p className="text-sm mt-2">There are no tasks currently visible to you in this project.</p>
                </CardContent>
            </Card>
        );
    }

    const IssueCard = ({ issue, isUrgent = false }: { issue: Issue, isUrgent?: boolean }) => (
        <Card
            key={issue.id}
            className={`hover:shadow-md transition-shadow cursor-pointer ${isUrgent ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
            onClick={() => setSelectedIssue(issue)}
        >
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{issue.key}</span>
                        {issue.sprint && (
                            <Badge variant="outline" className="text-xs font-normal border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                {issue.sprint.name}
                            </Badge>
                        )}
                        <Badge className={getStatusColor(issue.status)}>
                            {issue.status.replace('_', ' ')}
                        </Badge>
                        {issue.clientApprovalStatus === 'PENDING' && (
                            <Badge variant="destructive" className="animate-pulse">
                                Approval Needed
                            </Badge>
                        )}
                        {issue.priority === 'CRITICAL' && !isUrgent && (
                            <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                        )}
                    </div>
                    <h3 className="font-medium text-base hover:text-primary transition-colors">
                        {issue.title}
                    </h3>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
                        </span>
                        {issue.assignee && (
                            <span className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                    {issue.assignee.firstName?.[0]}
                                </div>
                                {issue.assignee.firstName} {issue.assignee.lastName}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white dark:bg-gray-800 border">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{issue.comments?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white dark:bg-gray-800 border">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>{issue.attachments?.length || 0}</span>
                    </div>

                    <Button variant={isUrgent ? "primary" : "outline"} size="sm" className="ml-2 gap-1">
                        {isUrgent ? 'Review' : 'Details'}
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search tasks by name or ID..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Modal */}
            {selectedIssue && (
                <ClientIssueModal
                    issue={selectedIssue}
                    isOpen={!!selectedIssue}
                    onClose={() => setSelectedIssue(null)}
                    onUpdate={(updated) => {
                        setIssues(issues.map(i => i.id === updated.id ? updated : i));
                    }}
                />
            )}

            {/* Requires Attention Section */}
            {pendingReview.length > 0 && (
                <div className="space-y-3">
                    <button
                        onClick={() => toggleSection('review')}
                        className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-500 w-full text-left"
                    >
                        {expandedSections.review ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        Requires Your Attention ({pendingReview.length})
                    </button>

                    {expandedSections.review && (
                        <div className="space-y-3 pl-1">
                            {pendingReview.map(issue => (
                                <IssueCard key={issue.id} issue={issue} isUrgent={true} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Active Tasks Section */}
            <div className="space-y-3">
                <button
                    onClick={() => toggleSection('active')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 w-full text-left"
                >
                    {expandedSections.active ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    In Progress & Planned ({inProgress.length})
                </button>

                {expandedSections.active && (
                    <div className="space-y-3 pl-1">
                        {inProgress.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic pl-6">No active tasks found matching your search.</p>
                        ) : (
                            inProgress.map(issue => (
                                <IssueCard key={issue.id} issue={issue} />
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Completed Section - Collapsed by default unless searched */}
            <div className="space-y-3">
                <button
                    onClick={() => toggleSection('completed')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 w-full text-left"
                >
                    {expandedSections.completed ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Completed ({completed.length})
                </button>

                {expandedSections.completed && (
                    <div className="space-y-3 pl-1">
                        {completed.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic pl-6">No completed tasks found.</p>
                        ) : (
                            completed.map(issue => (
                                <IssueCard key={issue.id} issue={issue} />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
