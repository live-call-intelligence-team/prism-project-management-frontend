import apiClient from '../client';

export type ClientStatsRole = 'ADMIN' | 'PROJECT_MANAGER' | 'SCRUM_MASTER' | 'CLIENT' | 'EMPLOYEE' | string;

const CLIENT_STATS_ALLOWED_ROLES = new Set(['ADMIN', 'PROJECT_MANAGER', 'SCRUM_MASTER', 'CLIENT']);

export const canAccessClientStats = (role?: ClientStatsRole) => {
    if (!role) return true;
    return CLIENT_STATS_ALLOWED_ROLES.has(role.toUpperCase());
};

export const getClientStatsLabel = (role?: ClientStatsRole) =>
    role?.toUpperCase() === 'CLIENT' ? 'My client project stats' : 'Client project stats';

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

    getClientStats: async (role?: ClientStatsRole) => {
        if (!canAccessClientStats(role)) {
            const forbiddenError = new Error('Access denied');
            (forbiddenError as any).status = 403;
            throw forbiddenError;
        }
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
