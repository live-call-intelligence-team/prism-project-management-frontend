import apiClient from '../client';

export interface Notification {
    id: string;
    userId: string;
    type: 'ISSUE_ASSIGNED' | 'ISSUE_UPDATED' | 'MENTION' | 'PROJECT_INVITATION' | 'SPRINT_STARTED' | 'SPRINT_COMPLETED';
    title: string;
    message: string;
    data: any;
    isRead: boolean;
    createdAt: string;
}

export interface NotificationsResponse {
    notifications: Notification[];
    unreadCount: number;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const notificationsApi = {
    // Get my notifications
    getMyNotifications: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
        const response = await apiClient.get<{ success: boolean; data: NotificationsResponse }>('/notifications', { params });
        return response.data.data;
    },

    // Mark single notification as read
    markAsRead: async (id: string) => {
        const response = await apiClient.put<{ success: boolean; message: string }>(`/notifications/${id}/read`);
        return response.data;
    },

    // Bulk mark all notifications as read
    markAllAsRead: async () => {
        const response = await apiClient.put<{ success: boolean; message: string }>('/notifications/read-all');
        return response.data;
    },

    // Delete a notification
    delete: async (id: string) => {
        const response = await apiClient.delete<{ success: boolean; message?: string }>(`/notifications/${id}`);
        return response.data;
    },
};
