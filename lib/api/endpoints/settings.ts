
import apiClient from '../client';

export interface SettingItem {
    key: string;
    value: any;
    description?: string;
    updatedBy?: string;
    updatedAt?: string;
}

export const settingsApi = {
    // Get all settings or specific key
    get: async (key?: string) => {
        const url = key ? `/settings/${key}` : '/settings';
        const response = await apiClient.get(url);
        return response.data.data;
    },

    // Update specific setting key
    update: async (key: string, data: { value: any; description?: string }) => {
        const response = await apiClient.put(`/settings/${key}`, data);
        return response.data.data;
    },

    // Test email configuration
    testEmail: async (config: any) => {
        const response = await apiClient.post('/settings/test-email', config);
        return response.data;
    }
};
