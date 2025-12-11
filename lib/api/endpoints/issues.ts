import apiClient from '../client';

export interface Issue {
    id: string;
    key: string;
    title: string;
    description?: string;
    type: 'BUG' | 'FEATURE' | 'TASK' | 'STORY' | 'EPIC' | 'SUBTASK' | 'SUPPORT';
    status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED' | 'CANCELLED';
    priority: 'LOWEST' | 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST' | 'CRITICAL';
    projectId: string;
    assigneeId?: string;
    reporterId: string;
    sprintId?: string;
    featureId?: string | null;
    epicId?: string | null;
    storyPoints?: number;
    estimatedHours?: number;
    actualHours?: number;
    dueDate?: string;
    fixVersion?: string;
    labels?: string[];
    customFields?: any;
    isClientVisible?: boolean;
    clientApprovalStatus?: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED' | null;
    clientFeedback?: string;
    createdAt: string;
    updatedAt: string;
    project?: { id: string; name: string; key: string };
    epic?: { id: string; name: string; key: string; color?: string };
    feature?: { id: string; name: string; key: string };
    sprint?: { id: string; name: string; startDate?: string; endDate?: string };
    assignee?: { id: string; firstName: string; lastName: string; email: string; avatar?: string };
    comments?: IssueComment[];
    attachments?: IssueAttachment[];
    subtasks?: Issue[];
    parentId?: string | null;
    parent?: { id: string; title: string; key: string }; // For Subtasks linking to Story
    childIssues?: Issue[]; // For Epics/Stories linking to children
    links?: {
        id: string;
        type: 'BLOCKS' | 'IS_BLOCKED_BY' | 'RELATES_TO' | 'DUPLICATES';
        relatedIssue: { id: string; key: string; title: string; status: string }
    }[];
}

export interface IssuesResponse {
    issues: Issue[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const issuesApi = {
    // Get all issues
    getAll: async (params?: {
        page?: number;
        limit?: number;
        projectId?: string;
        assigneeId?: string;
        status?: string;
        priority?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
        clientApprovalStatus?: string;
    }) => {
        const response = await apiClient.get<{ success: boolean; data: IssuesResponse }>('/issues', { params });
        return response.data.data;
    },

    // Get issue by ID
    getById: async (id: string) => {
        const response = await apiClient.get<{ success: boolean; data: { issue: Issue } }>(`/issues/${id}`);
        return response.data.data.issue;
    },

    // Create issue
    create: async (data: Partial<Issue>) => {
        const response = await apiClient.post<{ success: boolean; data: { issue: Issue } }>('/issues', data);
        console.log('Create Issue Response:', response);

        if (!response.data?.data?.issue) {
            console.error('Invalid response structure:', response.data);
            if (response.data && (response.data as any).issue) {
                return (response.data as any).issue;
            }
            throw new Error('Invalid response from server');
        }

        return response.data.data.issue;
    },

    // Update issue
    update: async (id: string, data: Partial<Issue>) => {
        const response = await apiClient.put<{ success: boolean; data: { issue: Issue } }>(`/issues/${id}`, data);
        return response.data.data.issue;
    },

    // Delete issue
    delete: async (id: string) => {
        const response = await apiClient.delete<{ success: boolean }>(`/issues/${id}`);
        return response.data;
    },

    // Get issues assigned to the current user
    getMyIssues: async (params?: {
        status?: string;
        role?: 'assignee' | 'reporter';
        page?: number;
        limit?: number;
        search?: string;
        priority?: string;
        type?: string;
    }) => {
        const response = await apiClient.get<{ success: boolean; data: IssuesResponse }>('/issues/my-issues', { params });
        return response.data.data;
    },

    // Get backlog issues
    getBacklog: async (projectId: string, params?: {
        search?: string;
        type?: string;
        priority?: string;
        page?: number;
        limit?: number;
    }) => {
        const response = await apiClient.get<{ success: boolean; data: IssuesResponse }>(`/issues/project/${projectId}/backlog`, { params });
        return response.data.data;
    },

    // Assign multiple issues to sprint
    assignSprint: async (sprintId: string | null, issueIds: string[]) => {
        const response = await apiClient.post<{ success: boolean; message: string }>('/issues/assign-sprint', { sprintId, issueIds });
        return response.data;
    },

    // Update issue status
    updateStatus: async (id: string, status: string) => {
        const response = await apiClient.put<{ success: boolean; data: { issue: Issue } }>(`/issues/${id}/status`, { status });
        return response.data.data.issue;
    },

    // Add work log
    addWorkLog: async (issueId: string, data: { timeSpent: number; date?: string; description?: string }) => {
        const payload = {
            ...data,
            date: data.date || new Date().toISOString()
        };
        const response = await apiClient.post<{ success: boolean; data: { workLog: any } }>(`/issues/${issueId}/worklog`, payload);
        return response.data.data.workLog;
    },

    // Add comment
    addComment: async (issueId: string, content: string) => {
        const response = await apiClient.post<{ success: boolean; data: { comment: IssueComment } }>(`/issues/${issueId}/comments`, { content });
        return response.data.data.comment;
    },

    // Upload attachment
    uploadAttachment: async (issueId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post<{ success: boolean; data: { attachment: IssueAttachment } }>(`/issues/${issueId}/attachments`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data.attachment;
    },

    // Delete attachment
    deleteAttachment: async (id: string) => {
        const response = await apiClient.delete<{ success: boolean }>(`/issues/attachments/${id}`);
        return response.data;
    },

    // Client approval
    clientApproval: async (id: string, data: { status: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED'; feedback?: string }) => {
        const response = await apiClient.patch<{ success: boolean; data: { issue: Issue } }>(`/issues/${id}/client-approval`, data);
        return response.data.data.issue;
    },

    // Add Link
    addLink: async (id: string, targetIssueId: string, type: string) => {
        const response = await apiClient.post<{ success: boolean; data: { link: any } }>(`/issues/${id}/links`, { targetIssueId, type });
        return response.data.data.link;
    },

    // Remove Link
    removeLink: async (id: string, linkId: string) => {
        const response = await apiClient.delete<{ success: boolean }>(`/issues/${id}/links/${linkId}`);
        return response.data;
    },

    // Get History (Audit Logs)
    getHistory: async (id: string) => {
        const response = await apiClient.get<{ success: boolean; data: { history: any[] } }>(`/issues/${id}/history`);
        return response.data.data.history;
    },
};

export interface IssueComment {
    id: string;
    content: string;
    userId: string;
    issueId: string;
    createdAt: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export interface IssueAttachment {
    id: string;
    issueId: string;
    userId: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    fileUrl: string;
    createdAt: string;
}
