import { BacklogView } from '@/components/backlog/BacklogView';

interface ProjectBacklogProps {
    projectId: string;
}

export function ProjectBacklog({ projectId }: ProjectBacklogProps) {
    return (
        <div className="h-full">
            <BacklogView projectId={projectId} />
        </div>
    );
}
