import apiClient from './client';

export interface LoginCredentials {
    email?: string;
    username?: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    orgName: string;
}

export interface AuthResponse {
    success: boolean;
    data: {
        user: any;
        accessToken: string;
        refreshToken: string;
        forcePasswordChange?: boolean;
    };
}

export const authApi = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/login', credentials);
        return response.data;
    },

    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    },

    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
    },

    getCurrentUser: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },

    forgotPassword: async (email: string) => {
        const response = await apiClient.post('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (token: string, password: string) => {
        const response = await apiClient.post('/auth/reset-password', { token, password });
        return response.data;
    },

    changePassword: async (data: any) => {
        const response = await apiClient.post('/auth/change-password', data);
        return response.data;
    },
};
