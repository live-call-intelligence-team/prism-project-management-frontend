import apiClient from '../client';

export interface DashboardOverview {
    overview: {
        projects: number;
        issues: number;
        activeSprints: number;
        totalUsers: number;
        activeUsers: number;
        activeUsers24h: number;
    };
    systemHealth: any;
    storageUsage: any;
    issuesByStatus: any;
    issuesByPriority: any;
    recentActivity: any[];
    projectHealth?: any;
    resourceAllocation?: any;
}

export const analyticsApi = {
    // Dashboard Stats
    getDashboard: async () => {
        const response = await apiClient.get('/analytics/dashboard');
        return response.data.data;
    },

    getPersonalStats: async () => {
        const response = await apiClient.get('/analytics/personal-stats');
        return response.data.data;
    },

    getClientStats: async () => {
        const response = await apiClient.get('/analytics/client-stats');
        return response.data.data;
    },

    getVelocityChart: async (projectId?: string) => {
        const response = await apiClient.get('/analytics/velocity', { params: { projectId } });
        return response.data.data;
    },

    getBurndownChart: async (sprintId: string) => {
        const response = await apiClient.get(`/analytics/burndown/${sprintId}`);
        return response.data.data;
    },

    getTeamPerformance: async (projectId?: string) => {
        const response = await apiClient.get('/analytics/team-performance', { params: { projectId } });
        return response.data.data;
    },

    getProjectHealth: async (projectId: string) => {
        const response = await apiClient.get(`/analytics/project-health/${projectId}`);
        return response.data.data;
    },

    // New System & Export Endpoints
    getSystemHealth: async () => {
        const response = await apiClient.get('/analytics/system');
        return response.data.data;
    },

    getDatabaseStats: async () => {
        const response = await apiClient.get('/analytics/db');
        return response.data.data;
    },

    getGrowthStats: async () => {
        const response = await apiClient.get('/analytics/growth');
        return response.data.data;
    },

    getResolutionRate: async () => {
        const response = await apiClient.get('/analytics/resolution');
        return response.data.data;
    },

    exportReport: async (type: 'issues' | 'users' | 'audit') => {
        const response = await apiClient.get('/analytics/export', {
            params: { type },
            responseType: 'blob'
        });
        return response.data;
    }
};
