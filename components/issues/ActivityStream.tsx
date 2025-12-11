import { useEffect, useState } from 'react';
import { issuesApi } from '@/lib/api/endpoints/issues';
import { format, parseISO, isSameDay } from 'date-fns';
import { Loader2, MessageSquare, ArrowRight, Circle, CheckCircle2, History, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming utils exists, if not I'll handle standard classes

interface AuditLog {
    id: string;
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    details: any; // { action: 'status_change', old: 'TODO', new: 'IN_PROGRESS' } etc
    createdAt: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    };
}

interface ActivityStreamProps {
    issueId: string;
}

export function ActivityStream({ issueId }: ActivityStreamProps) {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, [issueId]);

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            const history = await issuesApi.getHistory(issueId);
            setLogs(history);
        } catch (error) {
            console.error('Failed to load history', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;
    }

    if (logs.length === 0) {
        return <div className="p-8 text-center text-gray-500 italic">No activity yet.</div>;
    }

    // Groug logs by date
    const groupedLogs = logs.reduce((groups, log) => {
        const date = log.createdAt.split('T')[0];
        if (!groups[date]) groups[date] = [];
        groups[date].push(log);
        return groups;
    }, {} as Record<string, AuditLog[]>);

    // Sort dates descending
    const sortedDates = Object.keys(groupedLogs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
        <div className="space-y-6 pl-2">
            {sortedDates.map(date => (
                <div key={date} className="relative">
                    <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 py-2 mb-4 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {format(parseISO(date), 'MMMM d, yyyy')}
                        </span>
                    </div>

                    <div className="space-y-6 relative border-l-2 border-gray-100 dark:border-gray-700 ml-2">
                        {groupedLogs[date].map((log) => (
                            <div key={log.id} className="relative pl-6">
                                {/* Dot on timeline */}
                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 box-content" />

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                        <div className="font-medium text-gray-900 dark:text-gray-200 flex items-center gap-1">
                                            {/* Avatar or Icon */}
                                            <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-[10px]">
                                                {log.user?.firstName?.[0] || 'U'}
                                            </div>
                                            {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                                        </div>
                                        <span>&bull;</span>
                                        <span>{format(parseISO(log.createdAt), 'h:mm a')}</span>
                                    </div>

                                    <div className="text-sm">
                                        <LogContent log={log} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function LogContent({ log }: { log: AuditLog }) {
    const { details } = log;

    console.log(details)

    // Handle stringified details if necessary (though sequelize usually parses JSON)
    const data = typeof details === 'string' ? JSON.parse(details) : details;
    const action = data.action || log.action; // Fallback to main action if details empty

    switch (action) {
        case 'status_change':
            return (
                <div className="flex items-center gap-2">
                    <span className="text-gray-600">changed status</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs line-through text-gray-500">{data.old?.replace?.('_', ' ') || 'Unknown'}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{data.new?.replace?.('_', ' ')}</span>
                </div>
            );

        case 'add_comment':
            return (
                <div>
                    <span className="text-gray-600">commented:</span>
                    <p className="mt-1 text-gray-800 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-900/50 p-2 rounded border-l-2 border-gray-300 text-xs">
                        "{data.content || '...'}"
                    </p>
                </div>
            );

        case 'add_link':
            return (
                <div className="flex items-center gap-1">
                    <span className="text-gray-600">linked issue</span>
                    <span className="font-medium text-blue-600">{data.type}</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{data.targetIssueId?.slice(0, 8)}...</span>
                </div>
            );

        case 'remove_link':
            return (
                <div className="flex items-center gap-1">
                    <span className="text-gray-600">removed link</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{data.linkId?.slice(0, 8)}...</span>
                </div>
            );

        case 'priority_change':
            return (
                <div className="flex items-center gap-2">
                    <span className="text-gray-600">changed priority</span>
                    <span className="text-gray-500 line-through">{data.old}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className="font-medium text-orange-600">{data.new}</span>
                </div>
            );

        case 'update_field':
            return (
                <div>
                    <span className="text-gray-600">updated </span>
                    <span className="font-medium">{data.field}</span>
                </div>
            );

        case 'create_subtask':
            return (
                <div>
                    <span className="text-gray-600">created subtask </span>
                    <span className="font-medium">{data.subtaskKey || 'new task'}</span>
                </div>
            );

        case 'client_approval':
            return (
                <div className="flex flex-col gap-1">
                    <div>
                        <span className="text-gray-600">client approval update: </span>
                        <span className={cn(
                            "font-bold px-2 py-0.5 rounded text-xs",
                            data.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                data.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                        )}>
                            {data.status}
                        </span>
                    </div>
                    {data.feedback && (
                        <p className="text-xs text-gray-500 italic">"{data.feedback}"</p>
                    )}
                </div>
            );

        default:
            return (
                <div className="text-gray-500">
                    performed action: <span className="font-mono text-xs">{action}</span>
                    {/* Debug view for unknown types */}
                    {/* <pre className="text-[10px] mt-1 bg-gray-100 p-1 rounded">{JSON.stringify(data, null, 2)}</pre> */}
                </div>
            );
    }
}
