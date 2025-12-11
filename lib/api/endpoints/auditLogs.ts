import apiClient from '../client';

export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    resource: string;
    details: any;
    ipAddress?: string;
    createdAt: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    };
}

export interface AuditLogsResponse {
    logs: AuditLog[];
    pagination: {
        total: number;
        page: number;
        pages: number;
    };
}

export const auditLogsApi = {
    getAll: async (params: { page?: number; limit?: number; search?: string; userId?: string; action?: string; startDate?: string; endDate?: string }) => {
        const response = await apiClient.get<{ success: boolean; data: AuditLogsResponse }>('/audit-logs', { params });
        return response.data.data;
    },

    getStats: async (days: number = 7) => {
        const response = await apiClient.get<{ success: boolean; data: any }>('/audit-logs/stats', { params: { days } });
        return response.data.data;
    },
};
