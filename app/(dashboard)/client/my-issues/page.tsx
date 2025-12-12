'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import Container from '@/components/ui/Container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { cn } from '@/lib/utils';
import {
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    MessageSquare,
    Filter,
    Search
} from 'lucide-react';
import Link from 'next/link';

type TabType = 'all' | 'pending' | 'approved' | 'rejected' | 'in-progress';

const statusColors: Record<string, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'APPROVED': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'REJECTED': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'CHANGES_REQUESTED': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'TODO': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    'IN_PROGRESS': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'IN_REVIEW': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'DONE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const statusIcons: Record<string, React.ReactNode> = {
    'PENDING': <Clock className="w-4 h-4" />,
    'APPROVED': <CheckCircle2 className="w-4 h-4" />,
    'REJECTED': <XCircle className="w-4 h-4" />,
    'CHANGES_REQUESTED': <AlertCircle className="w-4 h-4" />,
};

export default function MyIssuesPage() {
    const { user } = useAuthStore();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchMyIssues = async () => {
            try {
                setLoading(true);
                // Fetch issues created by this client
                const response = await issuesApi.getAll({ limit: 100 });
                // Filter to only issues reported by this user
                const myIssues = (response.issues || []).filter(
                    (issue: Issue) => issue.reporterId === user?.id
                );
                setIssues(myIssues);
            } catch (err) {
                console.error('Error fetching issues:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchMyIssues();
        }
    }, [user?.id]);

    // Filter issues based on active tab
    const filteredIssues = issues.filter(issue => {
        const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.key?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        switch (activeTab) {
            case 'pending':
                return issue.clientApprovalStatus === 'PENDING';
            case 'approved':
                return issue.clientApprovalStatus === 'APPROVED';
            case 'rejected':
                return issue.clientApprovalStatus === 'REJECTED' || issue.clientApprovalStatus === 'CHANGES_REQUESTED';
            case 'in-progress':
                return issue.status === 'IN_PROGRESS' || issue.status === 'IN_REVIEW';
            default:
                return true;
        }
    });

    // Calculate stats
    const stats = {
        total: issues.length,
        pending: issues.filter(i => i.clientApprovalStatus === 'PENDING').length,
        approved: issues.filter(i => i.clientApprovalStatus === 'APPROVED').length,
        rejected: issues.filter(i => i.clientApprovalStatus === 'REJECTED' || i.clientApprovalStatus === 'CHANGES_REQUESTED').length,
        inProgress: issues.filter(i => i.status === 'IN_PROGRESS' || i.status === 'IN_REVIEW').length,
    };

    const tabs = [
        { id: 'all', label: 'All Issues', count: stats.total },
        { id: 'pending', label: 'Pending Review', count: stats.pending },
        { id: 'approved', label: 'Approved', count: stats.approved },
        { id: 'in-progress', label: 'In Progress', count: stats.inProgress },
        { id: 'rejected', label: 'Rejected', count: stats.rejected },
    ];

    return (
        <Container size="2xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Issues</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Track issues you've raised and their approval status
                        </p>
                    </div>
                    <Link href="/client/projects">
                        <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                            + Raise New Issue via Project
                        </button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="text-center p-4">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Issues</p>
                    </Card>
                    <Card className="text-center p-4">
                        <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
                    </Card>
                    <Card className="text-center p-4">
                        <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                    </Card>
                    <Card className="text-center p-4">
                        <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                    </Card>
                    <Card className="text-center p-4">
                        <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                    </Card>
                </div>

                {/* Search and Tabs */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search issues..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Tabs */}
                            <div className="flex flex-wrap gap-2">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as TabType)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                            activeTab === tab.id
                                                ? "bg-primary-600 text-white"
                                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                        )}
                                    >
                                        {tab.label} ({tab.count})
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <LoadingSkeleton count={5} className="h-20" />
                        ) : filteredIssues.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="font-medium">No issues found</p>
                                <p className="text-sm mt-1">
                                    {activeTab === 'all'
                                        ? "You haven't raised any issues yet"
                                        : `No issues in "${tabs.find(t => t.id === activeTab)?.label}" status`}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredIssues.map(issue => (
                                    <IssueCard key={issue.id} issue={issue} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
}

function IssueCard({ issue }: { issue: Issue }) {
    const approvalStatus = issue.clientApprovalStatus || 'PENDING';
    const issueStatus = issue.status || 'TODO';

    return (
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-500">{issue.key}</span>
                        <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            statusColors[approvalStatus]
                        )}>
                            {statusIcons[approvalStatus]}
                            {approvalStatus.replace('_', ' ')}
                        </span>
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            statusColors[issueStatus]
                        )}>
                            {issueStatus.replace('_', ' ')}
                        </span>
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                        {issue.title}
                    </h3>
                    {issue.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {issue.description}
                        </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Created {new Date(issue.createdAt || '').toLocaleDateString()}</span>
                        {issue.project && <span>• {issue.project.name}</span>}
                        {issue.storyPoints && <span>• {issue.storyPoints} pts</span>}
                    </div>
                </div>
                <Link href={`/issues/${issue.id}`}>
                    <button className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        View Details
                    </button>
                </Link>
            </div>

            {/* Feedback section if rejected or changes requested */}
            {(approvalStatus === 'REJECTED' || approvalStatus === 'CHANGES_REQUESTED') && issue.clientFeedback && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-xs font-medium text-red-800 dark:text-red-300 mb-1">
                        <MessageSquare className="w-3 h-3 inline mr-1" />
                        Feedback:
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400">{issue.clientFeedback}</p>
                </div>
            )}
        </div>
    );
}
