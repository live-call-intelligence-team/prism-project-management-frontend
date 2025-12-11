import { useState } from 'react';
import { Link, X, AlertCircle } from 'lucide-react';
import { Issue } from '@/lib/api/endpoints/issues';
import { cn } from '@/lib/utils';

interface IssueLinksProps {
    links: NonNullable<Issue['links']>;
    onUnlink?: (linkId: string) => void;
    onAddLink?: () => void;
}

export function IssueLinks({ links, onUnlink, onAddLink }: IssueLinksProps) {
    const [isHovered, setIsHovered] = useState<string | null>(null);

    const getLinkColor = (type: string) => {
        switch (type) {
            case 'BLOCKS': return 'text-red-600 bg-red-50 border-red-200';
            case 'IS_BLOCKED_BY': return 'text-red-600 bg-red-50 border-red-200'; // Jira uses red for blocked
            case 'DUPLICATES': return 'text-gray-600 bg-gray-50 border-gray-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    const getLinkIcon = (type: string) => {
        if (type === 'IS_BLOCKED_BY' || type === 'BLOCKS') return AlertCircle;
        return Link;
    };

    // Group by type
    const grouped = links.reduce((acc, link) => {
        if (!acc[link.type]) acc[link.type] = [];
        acc[link.type].push(link);
        return acc;
    }, {} as Record<string, typeof links>);

    const typeLabels: Record<string, string> = {
        'BLOCKS': 'Blocks',
        'IS_BLOCKED_BY': 'Blocked by',
        'RELATES_TO': 'Relates to',
        'DUPLICATES': 'Duplicates'
    };

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <Link className="w-4 h-4" /> Linked Issues
                </div>
                {onAddLink && (
                    <button
                        onClick={onAddLink}
                        className="text-xs text-primary-600 hover:underline"
                    >
                        + Link issue
                    </button>
                )}
            </div>

            {links.length === 0 && (
                <p className="text-xs text-gray-500 italic">No linked issues.</p>
            )}

            {Object.entries(grouped).map(([type, typeLinks]) => (
                <div key={type} className="space-y-1">
                    <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-1">{typeLabels[type] || type}</h4>
                    {typeLinks.map(link => {
                        const Icon = getLinkIcon(link.type);
                        return (
                            <div
                                key={link.id}
                                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 text-sm group"
                                onMouseEnter={() => setIsHovered(link.id)}
                                onMouseLeave={() => setIsHovered(null)}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className={cn("p-1 rounded", getLinkColor(link.type))}>
                                        <Icon className="w-3 h-3" />
                                    </div>
                                    <span className={cn(
                                        "truncate font-medium cursor-pointer hover:underline text-gray-700 dark:text-gray-200",
                                        link.relatedIssue.status === 'DONE' && "line-through text-gray-400"
                                    )}>
                                        {link.relatedIssue.key}
                                        <span className="text-gray-500 font-normal ml-1">
                                            {link.relatedIssue.title}
                                        </span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                    )}>
                                        {link.relatedIssue.status}
                                    </span>
                                    {onUnlink && isHovered === link.id && (
                                        <button onClick={() => onUnlink(link.id)} className="text-gray-400 hover:text-red-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </section>
    );
}
