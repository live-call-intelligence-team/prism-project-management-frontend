
import { useState, useEffect } from 'react';
import { issuesApi } from '@/lib/api/issues';
import { Issue } from '@/types';
import { Loader2, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { CreateStoryModal } from '@/components/issues/CreateStoryModal';
import { MoveToSprintModal } from '@/components/sprints/MoveToSprintModal';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';

interface BacklogViewProps {
    projectId: string;
}

export function BacklogView({ projectId }: BacklogViewProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [epics, setEpics] = useState<Issue[]>([]);
    const [unassigned, setUnassigned] = useState<Issue[]>([]);
    const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

    // Modal State
    const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
    const [selectedEpicId, setSelectedEpicId] = useState<string | undefined>(undefined);

    // Move to Sprint State
    const [isMoveToSprintOpen, setIsMoveToSprintOpen] = useState(false);
    const [issueToMove, setIssueToMove] = useState<string | null>(null);

    const user = useAuthStore(state => state.user);
    const canCreateEpic = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';
    const canCreateStory = user?.role !== 'CLIENT';

    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const data = await issuesApi.getHierarchy(projectId);
            setEpics(data.data.epics);
            setUnassigned(data.data.unassigned);
        } catch (error) {
            console.error('Failed to load backlog', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleEpic = (epicId: string) => {
        const newExpanded = new Set(expandedEpics);
        if (newExpanded.has(epicId)) {
            newExpanded.delete(epicId);
        } else {
            newExpanded.add(epicId);
        }
        setExpandedEpics(newExpanded);
    };

    const openMoveToSprint = (issueId: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIssueToMove(issueId);
        setIsMoveToSprintOpen(true);
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    const openCreateStory = (epicId?: string) => {
        setSelectedEpicId(epicId);
        setIsCreateStoryOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Epics Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Epics</h2>
                    {canCreateEpic && (
                        <button className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 transition-colors">
                            Create Epic
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {epics.map(epic => (
                        <div key={epic.id} className="border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                            <div
                                className="flex items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                onClick={() => toggleEpic(epic.id)}
                            >
                                {expandedEpics.has(epic.id) ? (
                                    <ChevronDown className="w-5 h-5 text-gray-500 mr-2" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-500 mr-2" />
                                )}
                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs mr-2 border border-purple-200">EPIC</span>
                                <span className="font-medium mr-2">{epic.key}</span>
                                <span className="flex-1">{epic.title}</span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">
                                        {epic.childIssues?.length || 0} Stories
                                    </span>
                                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        {/* Placeholder progress */}
                                        <div className="h-full bg-green-500 w-0"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Stories in Epic */}
                            {expandedEpics.has(epic.id) && (
                                <div className="border-t bg-gray-50 dark:bg-gray-900/50 p-3 space-y-2 pl-10">
                                    {epic.childIssues && epic.childIssues.length > 0 ? (
                                        epic.childIssues.map(story => (
                                            <div key={story.id} className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 flex items-center shadow-sm">
                                                <span className={`px-2 py-0.5 rounded text-xs mr-2 border ${story.type === 'STORY' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                                                    {story.type}
                                                </span>
                                                <span className="font-medium text-sm mr-2 text-gray-500">{story.key}</span>
                                                <span className="flex-1">{story.title}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                        {story.storyPoints ? `${story.storyPoints} pts` : '-'}
                                                    </span>
                                                    <button
                                                        onClick={(e) => openMoveToSprint(story.id, e)}
                                                        className="p-1 hover:bg-gray-200 rounded text-gray-500"
                                                        title="Move to Sprint"
                                                    >
                                                        <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-gray-500 italic py-2">No stories in this epic</div>
                                    )}
                                    {canCreateStory && (
                                        <button
                                            className="text-xs flex items-center text-gray-500 hover:text-blue-600 mt-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openCreateStory(epic.id);
                                            }}
                                        >
                                            <Plus className="w-4 h-4 mr-1" /> Create Story in {epic.key}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Unassigned Issues Section */}
            <div className="space-y-4 pt-6 border-t">
                <h2 className="text-lg font-semibold">Backlog (Unassigned)</h2>
                <div className="space-y-2">
                    {unassigned.map(issue => (
                        <div key={issue.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center shadow-sm hover:border-blue-300 transition-colors">
                            <div className="flex items-center space-x-3 w-full">
                                <span className={`px-2 py-0.5 rounded text-xs border ${issue.type === 'BUG' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                    {issue.type}
                                </span>
                                <span className="font-medium text-sm text-gray-500">{issue.key}</span>
                                <span className="flex-1 font-medium">{issue.title}</span>
                                <div className="flex items-center space-x-4">
                                    <span className={`text-xs px-2 py-1 rounded-full ${issue.priority === 'HIGH' ? 'bg-red-100 text-red-700' : issue.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {issue.priority}
                                    </span>
                                    <button
                                        onClick={(e) => openMoveToSprint(issue.id, e)}
                                        className="p-1 hover:bg-gray-200 rounded text-gray-500"
                                        title="Move to Sprint"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <div className="flex items-center space-x-1">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {issue.assigneeId ? 'UA' : '?'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {unassigned.length === 0 && (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                            No unassigned issues
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
