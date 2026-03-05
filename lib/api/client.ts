import axios from 'axios';

const getBaseUrl = () => {
    if (process.env.NODE_ENV === 'development') return '/api/v1';
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    if (url.endsWith('/api/v1')) return url;
    return `${url}/api/v1`;
};

const apiClient = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Add Bearer token from localStorage as fallback for cookie-based auth
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config || {};

        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                if (typeof window === 'undefined') {
                    throw error;
                }

                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(
                        `${getBaseUrl()}/auth/refresh-token`,
                        { refreshToken }
                    );

                    const { accessToken } = response.data.data;
                    localStorage.setItem('token', accessToken);

                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return apiClient(originalRequest);
                } else {
                    // No refresh token available, logout
                    throw new Error('No refresh token');
                }
            } catch (refreshError) {
                // Refresh failed or no refresh token, logout user
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        const status = error.response?.status;
        const serverMessage =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.response?.data?.details;

        if (status === 400 || status === 422) {
            error.message = typeof serverMessage === 'string' && serverMessage.trim()
                ? serverMessage
                : 'Validation failed. Please review your input.';
        } else if (status === 401) {
            error.message = typeof serverMessage === 'string' && serverMessage.trim()
                ? serverMessage
                : 'Your session expired. Please sign in again.';
        } else if (status === 403) {
            error.message = typeof serverMessage === 'string' && serverMessage.trim()
                ? serverMessage
                : 'You do not have permission to perform this action.';
        } else if (status === 404) {
            error.message = typeof serverMessage === 'string' && serverMessage.trim()
                ? serverMessage
                : 'Requested resource was not found.';
        }

        if (error.code === 'ERR_NETWORK') {
            console.error('Network Error detected on:', originalRequest?.method?.toUpperCase(), originalRequest?.url);
            console.error('Configured Base URL:', getBaseUrl());
            console.error('Actual Base URL in request:', originalRequest?.baseURL || apiClient.defaults.baseURL);
            console.error('Complete URL attempted:', (originalRequest?.baseURL || apiClient.defaults.baseURL) + (originalRequest?.url || ''));
            console.error('Possible causes: Backend is down, CORS mismatch, or incorrect URL.');
        }

        return Promise.reject(error);
    }
);

export default apiClient;
