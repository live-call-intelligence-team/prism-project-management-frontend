import apiClient from '../client';

export type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'SCRUM_MASTER' | 'EMPLOYEE' | 'CLIENT';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    orgId: string;
    profileData?: any;
    mfaEnabled: boolean;
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UsersResponse {
    users: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const usersApi = {
    // Get all users
    getAll: async (params?: { page?: number; limit?: number; role?: string; search?: string; isActive?: string }) => {
        // Handle isActive boolean/string conversion if needed properly
        const response = await apiClient.get<{ success: boolean; data: UsersResponse }>('/users', { params });
        return response.data.data;
    },

    // Get user by ID
    getById: async (id: string) => {
        const response = await apiClient.get<{ success: boolean; data: { user: User } }>(`/users/${id}`);
        return response.data.data.user;
    },

    // Get current user
    getCurrentUser: async () => {
        const response = await apiClient.get<{ success: boolean; data: { user: User } }>('/auth/me');
        return response.data.data.user;
    },

    // Create user
    create: async (userData: any) => {
        const response = await apiClient.post<{ success: boolean; data: { user: User } }>('/users', userData);

        if (!response.data?.data?.user) {
            throw new Error('Invalid response from server');
        }

        return response.data.data.user;
    },

    // Update user
    update: async (id: string, userData: any) => {
        const response = await apiClient.put<{ success: boolean; data: { user: User } }>(`/users/${id}`, userData);
        return response.data.data.user;
    },

    // Delete user
    delete: async (id: string) => {
        await apiClient.delete<{ success: boolean }>(`/users/${id}`);
    },
};
