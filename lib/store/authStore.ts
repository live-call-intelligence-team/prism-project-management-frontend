import { create } from 'zustand';
import { authApi, LoginCredentials, RegisterData } from '../api/auth';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    orgId: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authApi.login(credentials);
            const { user, accessToken, refreshToken } = response.data;

            // Store tokens
            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            set({
                user,
                token: accessToken,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Login failed',
                isLoading: false,
            });
            throw error;
        }
    },

    register: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authApi.register(data);
            const { user, accessToken, refreshToken } = response.data;

            // Store tokens
            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            set({
                user,
                token: accessToken,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Registration failed',
                isLoading: false,
            });
            throw error;
        }
    },

    logout: () => {
        authApi.logout().catch(() => { });
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({
            user: null,
            token: null,
            isAuthenticated: false,
        });
    },

    setUser: (user) => set({ user }),

    clearError: () => set({ error: null }),
}));
