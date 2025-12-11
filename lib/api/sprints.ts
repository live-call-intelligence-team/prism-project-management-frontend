
import apiClient from './client';
import { Sprint } from '@/types';

export const sprintsApi = {
    getByProject: async (projectId: string, status?: string) => {
        const response = await apiClient.get(`/sprints/project/${projectId}`, {
            params: { status }
        });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await apiClient.get(`/sprints/${id}`);
        return response.data;
    },

    create: async (data: Partial<Sprint>) => {
        const response = await apiClient.post('/sprints', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Sprint>) => {
        const response = await apiClient.put(`/sprints/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await apiClient.delete(`/sprints/${id}`);
        return response.data;
    },

    start: async (id: string) => {
        const response = await apiClient.post(`/sprints/${id}/start`);
        return response.data;
    },

    complete: async (id: string, moveIssuesToSprintId?: string) => {
        const response = await apiClient.post(`/sprints/${id}/complete`, { moveIssuesToSprintId });
        return response.data;
    },
};
