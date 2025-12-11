import apiClient from './client';
import { Project } from '@/types';

export const projectsApi = {
    getAll: async () => {
        const response = await apiClient.get('/projects');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await apiClient.get(`/projects/${id}`);
        return response.data;
    },

    create: async (data: Partial<Project>) => {
        const response = await apiClient.post('/projects', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Project>) => {
        const response = await apiClient.put(`/projects/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await apiClient.delete(`/projects/${id}`);
        return response.data;
    },

    getMembers: async (id: string) => {
        const response = await apiClient.get(`/projects/${id}/members`);
        return response.data;
    },

    addMember: async (id: string, userId: string, role: string) => {
        const response = await apiClient.post(`/projects/${id}/members`, { userId, role });
        return response.data;
    },
};
