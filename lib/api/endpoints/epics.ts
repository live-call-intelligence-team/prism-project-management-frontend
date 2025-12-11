import client from '../client';

export interface Epic {
    id: string;
    projectId: string;
    name: string;
    key: string;
    description?: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'ON_HOLD';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    ownerId: string;
    startDate?: string;
    endDate?: string;
    color?: string;
    goals?: string;
    businessValue?: 'LOW' | 'MEDIUM' | 'HIGH';
    isVisibleToClient?: boolean;
    completedAt?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    owner?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar?: string;
    };
    stats?: {
        totalFeatures: number;
        completedFeatures: number;
        progress: number;
    };
}

export const epicsApi = {
    getAll: async (projectId: string, status?: string, search?: string) => {
        const response = await client.get('/epics', {
            params: { projectId, status, search }
        });
        return response.data.data as Epic[];
    },

    getById: async (id: string) => {
        const response = await client.get(`/epics/${id}`);
        return response.data.data as Epic;
    },

    create: async (data: Partial<Epic>) => {
        const response = await client.post('/epics', data);
        return response.data.data as Epic;
    },

    update: async (id: string, data: Partial<Epic>) => {
        const response = await client.put(`/epics/${id}`, data);
        return response.data.data as Epic;
    },

    delete: async (id: string) => {
        await client.delete(`/epics/${id}`);
    },

    close: async (id: string, data: { resolution: string; targetEpicId?: string; notes?: string }) => {
        const response = await client.post(`/epics/${id}/close`, data);
        return response.data.data as Epic;
    }
};
