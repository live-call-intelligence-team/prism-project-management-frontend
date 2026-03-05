import apiClient from '../client';

export interface DailyReport {
    id: string;
    projectId: string;
    userId: string;
    date: string;
    standupSubmitted: boolean;
    standupTime?: string;
    standupTasks: string[];
    concerns: string;
    lessonsLearned: string;
    summarySubmitted: boolean;
    summaryTime?: string;
    status: 'excellent' | 'good' | 'at-risk' | 'missing';
    createdAt: string;
    updatedAt: string;
    user?: { id: string; firstName: string; lastName: string; email: string; role: string; avatar?: string };
    entries?: DailyReportEntry[];
    comments?: DailyReportComment[];
}

export interface DailyReportEntry {
    id: string;
    reportId: string;
    taskId?: string;
    taskTitle: string;
    type: 'work' | 'blocker';
    hours: number;
    progress: number;
    notes: string;
    time: string;
    severity?: 'low' | 'medium' | 'high';
    blockerStatus?: 'OPEN' | 'RESOLVED';
    taggedPeople?: string[];
    resolvedAt?: string;
    createdAt: string;
}

export interface DailyReportComment {
    id: string;
    reportId: string;
    userId: string;
    content: string;
    mentions: string[];
    messageType: 'comment' | 'question' | 'announcement' | 'action_item';
    parentId?: string | null;
    isPinned: boolean;
    isEdited: boolean;
    reactions: Record<string, string[]>;
    createdAt: string;
    updatedAt: string;
    user?: { id: string; firstName: string; lastName: string; avatar?: string };
    replies?: DailyReportComment[];
}

export interface ProjectReportsResponse {
    reports: DailyReport[];
    missingMembers: { id: string; firstName: string; lastName: string; email: string; role: string; avatar?: string }[];
    stats: { totalMembers: number; submitted: number; totalHours: number; openBlockers: number };
}

export const dailyReportsApi = {
    // Get all reports for a project on a date
    getProjectReports: async (projectId: string, date?: string, userId?: string): Promise<ProjectReportsResponse> => {
        const params: any = {};
        if (date) params.date = date;
        if (userId) params.userId = userId;
        const response = await apiClient.get(`/daily-reports/${projectId}`, { params });
        return response.data.data;
    },

    // Get my report for a project on a date
    getMyReport: async (projectId: string, date?: string): Promise<{ report: DailyReport | null }> => {
        const params: any = {};
        if (date) params.date = date;
        const response = await apiClient.get(`/daily-reports/${projectId}/my`, { params });
        return response.data.data;
    },

    // Submit morning standup
    submitStandup: async (projectId: string, data: { selectedTasks: string[]; concerns: string }): Promise<{ report: DailyReport }> => {
        const response = await apiClient.post(`/daily-reports/${projectId}/standup`, data);
        return response.data.data;
    },

    // Add hourly tracking entry
    addEntry: async (projectId: string, data: { taskId?: string; taskTitle: string; hours: number; progress: number; notes: string }): Promise<{ entry: DailyReportEntry }> => {
        const response = await apiClient.post(`/daily-reports/${projectId}/entry`, data);
        return response.data.data;
    },

    // Report a blocker
    addBlocker: async (projectId: string, data: { description: string; severity: string; taggedPeople?: string[] }): Promise<{ entry: DailyReportEntry }> => {
        const response = await apiClient.post(`/daily-reports/${projectId}/blocker`, data);
        return response.data.data;
    },

    // Submit evening summary
    submitSummary: async (projectId: string, data: { lessonsLearned: string }): Promise<{ report: DailyReport }> => {
        const response = await apiClient.post(`/daily-reports/${projectId}/summary`, data);
        return response.data.data;
    },

    // Add comment to a report (enhanced with messageType + threading)
    addComment: async (reportId: string, data: { content: string; mentions?: string[]; messageType?: string; parentId?: string }): Promise<{ comment: DailyReportComment }> => {
        const response = await apiClient.post(`/daily-reports/${reportId}/comment`, data);
        return response.data.data;
    },

    // Edit a comment (within 5-min window)
    editComment: async (commentId: string, content: string): Promise<{ comment: DailyReportComment }> => {
        const response = await apiClient.put(`/daily-reports/comments/${commentId}`, { content });
        return response.data.data;
    },

    // Delete a comment
    deleteComment: async (commentId: string): Promise<void> => {
        await apiClient.delete(`/daily-reports/comments/${commentId}`);
    },

    // Toggle emoji reaction on a comment
    reactToComment: async (commentId: string, emoji: string): Promise<{ reactions: Record<string, string[]> }> => {
        const response = await apiClient.patch(`/daily-reports/comments/${commentId}/react`, { emoji });
        return response.data.data;
    },

    // Toggle pin on a comment
    pinComment: async (commentId: string): Promise<{ isPinned: boolean }> => {
        const response = await apiClient.patch(`/daily-reports/comments/${commentId}/pin`);
        return response.data.data;
    },

    // Send reminder
    sendReminder: async (reportId: string, data: { targetUserId?: string; message?: string }): Promise<void> => {
        await apiClient.post(`/daily-reports/${reportId}/remind`, data);
    },

    // Resolve a blocker
    resolveBlocker: async (entryId: string): Promise<void> => {
        await apiClient.patch(`/daily-reports/entries/${entryId}/resolve`);
    },
};
