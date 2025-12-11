import client from '../client';

export interface Feature {
    id: string;
    epicId?: string;
    projectId: string;
    name: string;
    key: string;
    description?: string;
    status: 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    ownerId: string;
    startDate?: string;
    endDate?: string;
    storyPoints?: number;
    color?: string;
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
    epic?: {
        id: string;
        name: string;
        key: string;
    };
    stats?: {
        totalIssues: number;
        completedIssues: number;
        progress: number;
    };
}

export const featuresApi = {
    getAll: async (projectId: string, epicId?: string, status?: string) => {
        const response = await client.get('/features', {
            params: { projectId, epicId, status }
        });
        return response.data.data as Feature[];
    },

    getById: async (id: string) => {
        const response = await client.get(`/features/${id}`);
        return response.data.data as Feature;
    },

    create: async (data: Partial<Feature>) => {
        const response = await client.post('/features', data);
        return response.data.data as Feature;
    },

    update: async (id: string, data: Partial<Feature>) => {
        const response = await client.put(`/features/${id}`, data);
        return response.data.data as Feature;
    },

    delete: async (id: string) => {
        await client.delete(`/features/${id}`);
    }
};
