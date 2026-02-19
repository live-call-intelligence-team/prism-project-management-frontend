import axios from 'axios';

const getBaseUrl = () => {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    if (url.endsWith('/api/v1')) return url;
    return `${url}/api/v1`;
};

const apiClient = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
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
        const originalRequest = error.config;

        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(
                        `${getBaseUrl()}/auth/refresh-token`,
                        { refreshToken }
                    );

                    const { accessToken } = response.data.data;
                    localStorage.setItem('token', accessToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return apiClient(originalRequest);
                } else {
                    // No refresh token available, logout
                    throw new Error('No refresh token');
                }
            } catch (refreshError) {
                // Refresh failed or no refresh token, logout user
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        if (error.code === 'ERR_NETWORK') {
            console.error('Network Error detected on:', originalRequest?.method?.toUpperCase(), originalRequest?.url);
            console.error('Base URL:', originalRequest?.baseURL || apiClient.defaults.baseURL);
            console.error('Complete URL:', (originalRequest?.baseURL || apiClient.defaults.baseURL) + (originalRequest?.url || ''));
            console.error('Possible causes: Backend is down, CORS mismatch, or incorrect URL.');
        }

        return Promise.reject(error);
    }
);

export default apiClient;
