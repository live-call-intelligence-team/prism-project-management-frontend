import apiClient from '../client';
import { Issue } from './issues';

export interface Sprint {
    id: string;
    projectId: string;
    name: string;
    key?: string;
    goal?: string;
    startDate: string;
    endDate: string;
    status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    issues?: Issue[];
    totalPoints?: number;
    completedPoints?: number;
    notes?: string;
    plannedPoints?: number;
    capacity?: number;
    project?: { id: string; name: string; key: string };
    sprintMembers?: {
        id: string;
        user?: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            avatar?: string;
        };
    }[];
    createdAt?: string;
    updatedAt?: string;
}

export interface SprintStatistics {
    totalPoints: number;
    completedPoints: number;
    burnDown: {
        date: string;
        ideal: number;
        actual: number | null;
    }[];
}

export const sprintsApi = {
    // Get all sprints
    getAll: async (params?: { projectId?: string; status?: string; limit?: number }) => {
        const response = await apiClient.get<{ success: boolean; data: { sprints: Sprint[] } }>('/sprints', {
            params,
        });
        return response.data.data.sprints || [];
    },

    // Get sprint statistics
    getStatistics: async (id: string) => {
        const response = await apiClient.get<{ success: boolean; data: SprintStatistics }>(`/sprints/${id}/statistics`);
        return response.data.data;
    },

    // Create sprint
    create: async (data: {
        projectId: string;
        name: string;
        startDate: string;
        endDate: string;
        goal?: string;
        key?: string;
        notes?: string;
        plannedPoints?: number;
        teamMembers?: string[];
        status?: string;
    }) => {
        const response = await apiClient.post<{ success: boolean; data: { sprint: Sprint } }>('/sprints', data);
        return response.data.data.sprint;
    },

    // Get project sprints
    getProjectSprints: async (projectId: string, status?: string) => {
        const response = await apiClient.get<{ success: boolean; data: { sprints: Sprint[] } }>(
            `/sprints/project/${projectId}`,
            { params: { status } }
        );
        return response.data.data.sprints;
    },

    // Start sprint
    start: async (id: string) => {
        const response = await apiClient.post<{ success: boolean; data: { sprint: Sprint } }>(`/sprints/${id}/start`);
        return response.data.data.sprint;
    },

    // Complete sprint
    complete: async (id: string, moveIssuesToSprintId?: string) => {
        const response = await apiClient.post<{ success: boolean; data: { sprint: Sprint } }>(
            `/sprints/${id}/complete`,
            { moveIssuesToSprintId }
        );
        return response.data.data.sprint;
    },

    // Update sprint
    update: async (id: string, data: Partial<Sprint>) => {
        const response = await apiClient.put<{ success: boolean; data: { sprint: Sprint } }>(`/sprints/${id}`, data);
        return response.data.data.sprint;
    },

    // Delete sprint
    delete: async (id: string) => {
        const response = await apiClient.delete<{ success: boolean }>(`/sprints/${id}`);
        return response.data;
    },
};
