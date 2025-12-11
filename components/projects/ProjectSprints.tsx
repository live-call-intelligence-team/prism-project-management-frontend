
'use client';

import { SprintPlanningView } from '@/components/sprints/SprintPlanningView';

interface ProjectSprintsProps {
    projectId: string;
}

export function ProjectSprints({ projectId }: ProjectSprintsProps) {
    return (
        <div className="h-full">
            <SprintPlanningView projectId={projectId} />
        </div>
    );
}
