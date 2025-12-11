import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Search } from 'lucide-react';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

const schema = z.object({
    targetIssueId: z.string().min(1, 'Issue is required'),
    type: z.enum(['BLOCKS', 'IS_BLOCKED_BY', 'RELATES_TO', 'DUPLICATES']),
});

type FormData = z.infer<typeof schema>;

interface LinkIssueModalProps {
    sourceIssueId: string;
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function LinkIssueModal({ sourceIssueId, projectId, isOpen, onClose, onSuccess }: LinkIssueModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Issue[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

    const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            type: 'RELATES_TO',
        }
    });

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) {
                searchIssues(searchTerm);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, isOpen]);

    const searchIssues = async (query: string) => {
        setIsSearching(true);
        try {
            const data = await issuesApi.getAll({
                projectId,
                search: query,
                limit: 10
            });
            // Filter out current issue
            setSearchResults(data.issues.filter(i => i.id !== sourceIssueId));
        } catch (error) {
            console.error('Failed to search issues', error);
        } finally {
            setIsSearching(false);
        }
    };

    const onSubmit = async (data: FormData) => {
        try {
            setIsLoading(true);
            await issuesApi.addLink(sourceIssueId, data.targetIssueId, data.type);
            reset();
            setSelectedIssue(null);
            setSearchTerm('');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to link issue', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Link Issue</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Relationship</label>
                        <select
                            {...register('type')}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="BLOCKS">blocks</option>
                            <option value="IS_BLOCKED_BY">is blocked by</option>
                            <option value="RELATES_TO">relates to</option>
                            <option value="DUPLICATES">duplicates</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Select Issue</label>

                        {!selectedIssue ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by key or title..."
                                    className="w-full pl-9 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />

                                <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                                    {isSearching ? (
                                        <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map(issue => (
                                            <div
                                                key={issue.id}
                                                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center border-b last:border-0"
                                                onClick={() => {
                                                    setSelectedIssue(issue);
                                                    setValue('targetIssueId', issue.id);
                                                }}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{issue.key}</span>
                                                    <span className="text-xs text-gray-500 truncate max-w-[200px]">{issue.title}</span>
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded uppercase">{issue.status}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-sm text-gray-500">No issues found</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200">
                                <div>
                                    <span className="font-bold text-blue-700 mr-2">{selectedIssue.key}</span>
                                    <span className="text-sm text-blue-600">{selectedIssue.title}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedIssue(null);
                                        setValue('targetIssueId', '');
                                    }}
                                    className="p-1 hover:bg-blue-100 rounded text-blue-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <input type="hidden" {...register('targetIssueId')} />
                        {errors.targetIssueId && <p className="text-red-500 text-sm mt-1">{errors.targetIssueId.message}</p>}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Link Issue
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
