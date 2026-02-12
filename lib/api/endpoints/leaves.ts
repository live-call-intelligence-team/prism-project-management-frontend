import apiClient from '../client';

export interface LeaveRequest {
    id: string;
    userId: string;
    leaveType: 'Annual' | 'Sick' | 'Casual' | 'Other';
    startDate: string;
    endDate: string;
    daysCount: number;
    reason: string;
    contactNumber?: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
    rejectionReason?: string;
    createdAt?: string;
    user?: {
        firstName: string;
        lastName: string;
        email: string;
        employeeDetails?: {
            department: string;
        };
    };
}

export interface LeaveBalances {
    annual: number;
    sick: number;
    casual: number;
    other: number;
}

export const leaveApi = {
    applyLeave: async (data: Partial<LeaveRequest>) => {
        const response = await apiClient.post<{ success: boolean; data: { leaveRequest: LeaveRequest } }>('/leaves/apply', data);
        return response.data.data.leaveRequest;
    },

    getMyLeaves: async (page = 1, limit = 10, status?: string) => {
        const response = await apiClient.get<{ success: boolean; data: { leaves: LeaveRequest[]; pagination: any } }>('/leaves/my-leaves', {
            params: { page, limit, status }
        });
        return response.data.data;
    },

    getMyBalances: async () => {
        const response = await apiClient.get<{ success: boolean; data: LeaveBalances }>('/leaves/my-balances');
        return response.data.data;
    },

    getAllLeaveRequests: async (page = 1, limit = 10, status?: string) => {
        const response = await apiClient.get<{ success: boolean; data: { leaves: LeaveRequest[]; pagination: any } }>('/leaves', {
            params: { page, limit, status }
        });
        return response.data.data;
    },

    updateLeaveStatus: async (id: string, status: 'Approved' | 'Rejected', rejectionReason?: string) => {
        const response = await apiClient.patch<{ success: boolean; data: { leaveRequest: LeaveRequest } }>(`/leaves/${id}/status`, {
            status,
            rejectionReason
        });
        return response.data.data.leaveRequest;
    }
};
