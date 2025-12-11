import apiClient from './client';
import { Issue } from '@/types';

export const issuesApi = {
    getAll: async (filters?: any) => {
        const response = await apiClient.get('/issues', { params: filters });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await apiClient.get(`/issues/${id}`);
        return response.data;
    },

    create: async (data: Partial<Issue>) => {
        const response = await apiClient.post('/issues', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Issue>) => {
        const response = await apiClient.put(`/issues/${id}`, data);
        return response.data;
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

    createStory: async (data: any) => {
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

    closeEpic: async (epicId: string, force: boolean = false) => {
        const response = await apiClient.put(`/issues/${epicId}/close`, { force });
        return response.data;
    },
};
