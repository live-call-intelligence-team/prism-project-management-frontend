
import { useState, useEffect, useMemo } from 'react';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import { Loader2, ChevronRight, ChevronDown, Plus, ArrowRight, Layers, Target, Clock, AlertCircle, Search, Filter } from 'lucide-react';
import { CreateStoryModal } from '@/components/issues/CreateStoryModal';
import { MoveToSprintModal } from '@/components/sprints/MoveToSprintModal';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface BacklogViewProps {
    projectId: string;
}

export function BacklogView({ projectId }: BacklogViewProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [epics, setEpics] = useState<Issue[]>([]);
    const [unassigned, setUnassigned] = useState<Issue[]>([]);
    const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
    const [selectedEpicId, setSelectedEpicId] = useState<string | undefined>(undefined);
    const [isMoveToSprintOpen, setIsMoveToSprintOpen] = useState(false);
    const [issueToMove, setIssueToMove] = useState<string | null>(null);

    const user = useAuthStore(state => state.user);
    const canCreateEpic = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';
    const canCreateStory = user?.role !== 'CLIENT';

    useEffect(() => { loadData(); }, [projectId]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const hierarchy = await issuesApi.getHierarchy(projectId);
            setEpics(hierarchy.epics || []);
            setUnassigned(hierarchy.unassigned || []);
        } catch (error) {
            console.error('Failed to load backlog', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleEpic = (epicId: string) => {
        const newExpanded = new Set(expandedEpics);
        if (newExpanded.has(epicId)) newExpanded.delete(epicId);
        else newExpanded.add(epicId);
        setExpandedEpics(newExpanded);
    };

    const openMoveToSprint = (issueId: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIssueToMove(issueId);
        setIsMoveToSprintOpen(true);
    };

    const openCreateStory = (epicId?: string) => {
        setSelectedEpicId(epicId);
        setIsCreateStoryOpen(true);
    };

    // Summary stats
    const totalStories = useMemo(() => epics.reduce((sum, e) => sum + (e.childIssues?.length || 0), 0), [epics]);
    const totalUnassigned = unassigned.length;

    // Filtered unassigned
    const filteredUnassigned = useMemo(() => {
        let items = unassigned;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(i => i.title.toLowerCase().includes(q) || i.key.toLowerCase().includes(q));
        }
        if (priorityFilter) {
            items = items.filter(i => i.priority === priorityFilter);
        }
        return items;
    }, [unassigned, searchQuery, priorityFilter]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const typeEmojis: Record<string, string> = {
        BUG: '🐛', FEATURE: '✨', STORY: '📖', TASK: '✅', EPIC: '🏔️', SUB_TASK: '📋', IMPROVEMENT: '📈'
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'CRITICAL': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800';
            case 'HIGH': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800';
            case 'MEDIUM': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Summary Bar */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                            <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-xs text-gray-500">Epics</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{epics.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs text-gray-500">Total Stories</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStories}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-xs text-gray-500">Backlog</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUnassigned}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                            <AlertCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-xs text-gray-500">Avg Stories/Epic</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{epics.length > 0 ? Math.round(totalStories / epics.length) : 0}</p>
                </div>
            </div>

            {/* Epics Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-purple-500" /> Epics ({epics.length})
                    </h2>
                    {canCreateEpic && (
                        <button className="text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium">
                            + Create Epic
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {epics.map((epic, i) => {
                        const childCount = epic.childIssues?.length || 0;
                        const doneCount = epic.childIssues?.filter(c => c.status === 'DONE').length || 0;
                        const progress = childCount > 0 ? Math.round((doneCount / childCount) * 100) : 0;
                        const totalPoints = epic.childIssues?.reduce((s, c) => s + (c.storyPoints || 0), 0) || 0;

                        return (
                            <motion.div
                                key={epic.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden"
                            >
                                <div
                                    className="flex items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    onClick={() => toggleEpic(epic.id)}
                                >
                                    {expandedEpics.has(epic.id) ? (
                                        <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0" />
                                    )}
                                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold mr-3 border border-purple-200 dark:border-purple-700 flex-shrink-0">
                                        EPIC
                                    </span>
                                    <span className="font-mono text-xs text-gray-400 mr-3 flex-shrink-0">{epic.key}</span>
                                    <span className="flex-1 font-medium text-gray-900 dark:text-white truncate">{epic.title}</span>

                                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                            {childCount} stories
                                        </span>
                                        {totalPoints > 0 && (
                                            <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded font-medium">
                                                ⚡ {totalPoints} pts
                                            </span>
                                        )}
                                        <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all",
                                                    progress >= 75 ? 'bg-green-500' : progress >= 40 ? 'bg-blue-500' : progress > 0 ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
                                                )}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-8 text-right">{progress}%</span>
                                    </div>
                                </div>

                                {/* Expanded Stories */}
                                <AnimatePresence>
                                    {expandedEpics.has(epic.id) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 px-4 pb-4 pt-3"
                                        >
                                            <div className="space-y-2 pl-8">
                                                {epic.childIssues && epic.childIssues.length > 0 ? (
                                                    epic.childIssues.map(story => (
                                                        <div
                                                            key={story.id}
                                                            className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center shadow-sm hover:shadow-md transition-all group"
                                                        >
                                                            <span className="text-sm mr-2">{typeEmojis[story.type || 'TASK'] || '📋'}</span>
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded text-[10px] font-bold mr-2 border flex-shrink-0",
                                                                story.type === 'STORY' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-700' :
                                                                    story.type === 'BUG' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-700' :
                                                                        'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-700'
                                                            )}>
                                                                {story.type}
                                                            </span>
                                                            <span className="font-mono text-[10px] text-gray-400 mr-2 flex-shrink-0">{story.key}</span>
                                                            <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">{story.title}</span>

                                                            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                                                <span className={cn("text-[10px] px-2 py-0.5 rounded border", getPriorityColor(story.priority))}>
                                                                    {story.priority}
                                                                </span>
                                                                {story.storyPoints ? (
                                                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded font-medium">
                                                                        {story.storyPoints} pts
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">—</span>
                                                                )}
                                                                {story.assignee ? (
                                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[8px] text-white font-bold" title={`${story.assignee.firstName} ${story.assignee.lastName}`}>
                                                                        {story.assignee.firstName?.[0]}{story.assignee.lastName?.[0]}
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] text-gray-500">?</div>
                                                                )}
                                                                <button
                                                                    onClick={(e) => openMoveToSprint(story.id, e)}
                                                                    className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                                                    title="Move to Sprint"
                                                                >
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 italic py-3 text-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                                        No stories in this epic
                                                    </div>
                                                )}
                                                {canCreateStory && (
                                                    <button
                                                        className="text-xs flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mt-2 px-2 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                                                        onClick={(e) => { e.stopPropagation(); openCreateStory(epic.id); }}
                                                    >
                                                        <Plus className="w-4 h-4 mr-1" /> Create Story in {epic.key}
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                    {epics.length === 0 && (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                            <Layers className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                            <p className="font-medium">No epics found</p>
                            <p className="text-sm mt-1">Create an epic to start organizing your backlog</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Unassigned Backlog */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Backlog — Unassigned ({unassigned.length})
                    </h2>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search backlog..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <select
                            value={priorityFilter}
                            onChange={e => setPriorityFilter(e.target.value)}
                            className="text-sm py-1.5 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-primary-500"
                        >
                            <option value="">All Priorities</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    {filteredUnassigned.map((issue, i) => (
                        <motion.div
                            key={issue.id}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="bg-white dark:bg-gray-800 p-3.5 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all group"
                        >
                            <span className="text-sm mr-2">{typeEmojis[issue.type || 'TASK'] || '📋'}</span>
                            <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold border mr-2 flex-shrink-0",
                                issue.type === 'BUG' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-700' :
                                    issue.type === 'STORY' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-700' :
                                        'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-700'
                            )}>
                                {issue.type}
                            </span>
                            <span className="font-mono text-[10px] text-gray-400 mr-3 flex-shrink-0">{issue.key}</span>
                            <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">{issue.title}</span>

                            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", getPriorityColor(issue.priority))}>
                                    {issue.priority}
                                </span>
                                {issue.assignee ? (
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[8px] text-white font-bold">
                                        {issue.assignee.firstName?.[0]}{issue.assignee.lastName?.[0]}
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-400">?</div>
                                )}
                                <button
                                    onClick={(e) => openMoveToSprint(issue.id, e)}
                                    className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Move to Sprint"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                    {filteredUnassigned.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                            {searchQuery || priorityFilter ? 'No matching issues' : 'No unassigned issues'}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <CreateStoryModal
                projectId={projectId}
                initialEpicId={selectedEpicId}
                isOpen={isCreateStoryOpen}
                onClose={() => setIsCreateStoryOpen(false)}
                onSuccess={loadData}
            />
            <MoveToSprintModal
                isOpen={isMoveToSprintOpen}
                onClose={() => setIsMoveToSprintOpen(false)}
                projectId={projectId}
                issueId={issueToMove}
                onSuccess={loadData}
            />
        </div>
    );
}
