import apiClient from '../client';

export interface DashboardStats {
    overview: {
        projects: number;
        issues: number;
        activeSprints: number;
        activeUsers: number;
        totalUsers: number;
    };
    issuesByStatus: Array<{
        status: string;
        count: string;
    }>;
    issuesByPriority: Array<{
        priority: string;
        count: string;
    }>;
    recentActivity: Array<{
        id: string;
        action: string;
        resource: string;
        resourceId?: string;
        details?: any;
        createdAt: string;
        user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
    }>;
}

export const dashboardApi = {
    // Get dashboard stats
    getStats: async () => {
        const response = await apiClient.get<{ success: boolean; data: DashboardStats }>('/analytics/dashboard');
        return response.data.data;
    },
};
