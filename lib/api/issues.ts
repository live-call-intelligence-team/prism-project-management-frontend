import apiClient from './client';
import { Issue } from '@/types';
import axios from 'axios';

export interface CreateStoryPayload {
    projectId: string;
    epicId: string;
    featureId?: string;
    title: string;
    description?: string;
    assigneeId?: string;
    storyPoints?: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

type WritableIssueType = Exclude<Issue['type'], 'EPIC'>;
type IssueMutationPayload = Omit<Partial<Issue>, 'type'> & { type?: WritableIssueType };

const ensureNonEpicIssuePayload = <T extends Record<string, any>>(data: T): T => {
    if (String(data?.type || '').toUpperCase() === 'EPIC') {
        throw new Error('Issue type EPIC is no longer supported on /issues. Use Epics module');
    }
    return data;
};

const normalizeIssueError = (error: unknown): never => {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const serverMessage = (error.response?.data as any)?.message || (error.response?.data as any)?.error;
        if (status === 400 && typeof serverMessage === 'string' && /epic/i.test(serverMessage)) {
            throw new Error('Use Epics module');
        }
        if (typeof serverMessage === 'string' && serverMessage.trim()) {
            throw new Error(serverMessage);
        }
    }
    throw error instanceof Error ? error : new Error('Issue request failed');
};

export const issuesApi = {
    getAll: async (filters?: any) => {
        const response = await apiClient.get('/issues', { params: filters });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await apiClient.get(`/issues/${id}`);
        return response.data;
    },

    create: async (data: IssueMutationPayload) => {
        try {
            const payload = ensureNonEpicIssuePayload(data);
            const response = await apiClient.post('/issues', payload);
            return response.data;
        } catch (error) {
            normalizeIssueError(error);
        }
    },

    update: async (id: string, data: IssueMutationPayload) => {
        try {
            const payload = ensureNonEpicIssuePayload(data);
            const response = await apiClient.put(`/issues/${id}`, payload);
            return response.data;
        } catch (error) {
            normalizeIssueError(error);
        }
    },

    delete: async (id: string) => {
        const response = await apiClient.delete(`/issues/${id}`);
        return response.data;
    },

    addComment: async (id: string, content: string) => {
        const response = await apiClient.post(`/issues/${id}/comments`, { content });
        return response.data;
    },

    logWork: async (id: string, data: { hours: number; description: string }) => {
        const response = await apiClient.post(`/issues/${id}/work-logs`, data);
        return response.data;
    },

    getHierarchy: async (projectId: string) => {
        const response = await apiClient.get(`/issues/hierarchy/${projectId}`);
        return response.data;
    },

    getChildren: async (id: string) => {
        const response = await apiClient.get(`/issues/${id}/children`);
        return response.data;
    },

    createStory: async (data: CreateStoryPayload) => {
        const response = await apiClient.post('/issues/create-story', data);
        return response.data;
    },

    createSubtask: async (data: any) => {
        const response = await apiClient.post('/issues/create-subtask', data);
        return response.data;
    },

    moveToSprint: async (id: string, sprintId: string | null) => {
        const response = await apiClient.put(`/issues/${id}/move-to-sprint`, { sprintId });
        return response.data;
    },

};
