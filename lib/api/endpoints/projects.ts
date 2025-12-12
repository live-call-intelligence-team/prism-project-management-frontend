import apiClient from '../client';

export interface Project {
    id: string;
    name: string;
    key: string;
    description?: string;
    status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
    visibility: 'PUBLIC' | 'PRIVATE';
    type: 'SCRUM' | 'KANBAN' | 'WATERFALL';
    usesEpics: boolean;
    usesSprints: boolean;
    leadId: string;
    clientId?: string;
    projectManagerId?: string;
    scrumMasterId?: string;
    orgId: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    settings?: any;
    memberCount?: number;
    issueCount?: number;
    // Extended stats from getAllProjects
    activeEpicCount?: number;
    totalFeatureCount?: number;
    doneFeatureCount?: number;
    inProgressFeatureCount?: number;
    todoFeatureCount?: number;
    createdAt: string;
    updatedAt: string;
    lead?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    recentActivity?: {
        id: string;
        user: string;
        action: string;
        target: string;
        time: string;
        attachments?: any[]; // Simplified for now
    };
}

export interface ProjectsResponse {
    projects: Project[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        activeSprints: number;
        priorityBreakdown?: {
            [key: string]: number;
        };
    };
}

export const projectsApi = {
    // Get all projects
    getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
        const response = await apiClient.get<{ success: boolean; data: ProjectsResponse }>('/projects', { params });
        return response.data.data;
    },

    // Get client specific projects
    getClientProjects: async (params?: { page?: number; limit?: number; search?: string }) => {
        const response = await apiClient.get<{ success: boolean; data: ProjectsResponse }>('/projects/client', { params });
        return response.data.data;
    },

    // Get project by ID
    getById: async (id: string) => {
        const response = await apiClient.get<{ success: boolean; data: { project: Project } }>(`/projects/${id}`);
        return response.data.data.project;
    },

    // Create project
    create: async (data: Partial<Project>) => {
        const response = await apiClient.post<{ success: boolean; data: { project: Project } }>('/projects', data);
        console.log('Create Project Response:', response);

        if (!response.data?.data?.project) {
            console.error('Invalid response structure:', response.data);
            // If data is missing but success is true, maybe return null or throw specific error
            if (response.data && (response.data as any).project) {
                // Handle case where project is at root of data
                return (response.data as any).project;
            }
            throw new Error('Invalid response from server');
        }

        return response.data.data.project;
    },

    // Update project
    update: async (id: string, data: Partial<Project>) => {
        const response = await apiClient.put<{ success: boolean; data: { project: Project } }>(`/projects/${id}`, data);
        return response.data.data.project;
    },

    // Delete project
    delete: async (id: string) => {
        const response = await apiClient.delete<{ success: boolean }>(`/projects/${id}`);
        return response.data;
    },

    // Get members
    getMembers: async (id: string) => {
        const response = await apiClient.get<{ success: boolean; data: { members: any[] } }>(`/projects/${id}/members`);
        return response.data.data.members;
    },

    // Add member
    addMember: async (id: string, userId: string, role: string) => {
        const response = await apiClient.post<{ success: boolean; data: { member: any } }>(`/projects/${id}/members`, { userId, role });
        return response.data.data.member;
    },

    // Remove member
    removeMember: async (id: string, userId: string) => {
        const response = await apiClient.delete<{ success: boolean }>(`/projects/${id}/members/${userId}`);
        return response.data;
    },

    // Upload attachment
    uploadAttachment: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post<{ success: boolean; data: { attachment: any } }>(`/projects/${id}/attachments`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data.attachment;
    },

    // Client-specific endpoints
    getClientProjectDetail: async (id: string) => {
        const response = await apiClient.get<{ success: boolean; data: { project: any } }>(`/client/projects/${id}`);
        return response.data.data.project;
    },

    getClientProjectTasks: async (id: string, params?: { status?: string; page?: number; limit?: number }) => {
        const response = await apiClient.get<{ success: boolean; data: { tasks: any[]; pagination: any } }>(`/client/projects/${id}/tasks`, { params });
        return response.data.data;
    },

    getClientProjectMilestones: async (id: string) => {
        const response = await apiClient.get<{ success: boolean; data: { milestones: any[] } }>(`/client/projects/${id}/milestones`);
        return response.data.data.milestones;
    },

    getClientProjectActivity: async (id: string, limit?: number) => {
        const response = await apiClient.get<{ success: boolean; data: { activity: any[] } }>(`/client/projects/${id}/activity`, { params: { limit } });
        return response.data.data.activity;
    },

    getPendingActions: async (limit?: number) => {
        const response = await apiClient.get<{ success: boolean; data: { actions: any[] } }>('/client/pending-actions', { params: { limit } });
        return response.data.data.actions;
    },
    globalSearch: async (query: string) => {
        const response = await apiClient.get<{ success: boolean; data: { projects: any[]; tasks: any[]; files: any[] } }>('/client/search', { params: { q: query } });
        return response.data.data;
    },
};
