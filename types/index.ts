export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    orgId: string;
    profileData?: {
        avatar?: string;
        bio?: string;
        phone?: string;
    };
}

export interface Project {
    id: string;
    name: string;
    key: string;
    description?: string;
    status: 'ACTIVE' | 'ARCHIVED' | 'ON_HOLD';
    visibility: 'PUBLIC' | 'PRIVATE';
    leadId: string;
    orgId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Issue {
    id: string;
    key: string;
    title: string;
    description?: string;
    type: 'TASK' | 'BUG' | 'STORY' | 'EPIC' | 'SUBTASK';
    status: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    assigneeId?: string;
    reporterId: string;
    epicId?: string | null;
    featureId?: string | null;
    childIssues?: Issue[];
    parentId?: string;
    parent?: Issue;
    projectId: string;
    sprintId?: string;
    storyPoints?: number;
    estimatedHours?: number;
    actualHours?: number;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;

    // Relationships/Populated fields
    subtasks?: Issue[];
    attachments?: any[];
    assignee?: { firstName: string; lastName: string; email: string };
    sprint?: { id: string; name: string; startDate: string; endDate: string };
    project?: { id: string; name: string; key: string };
    epic?: { id: string; name: string; key: string };
    feature?: { id: string; name: string; key: string };
}

export interface Sprint {
    id: string;
    name: string;
    goal?: string;
    notes?: string;
    plannedPoints?: number;
    status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    startDate?: string;
    endDate?: string;
    projectId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
}
