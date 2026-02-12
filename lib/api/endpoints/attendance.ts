import apiClient from '../client';

export interface AttendanceRecord {
    id: string;
    userId: string;
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    workLocation?: 'Office' | 'Home' | 'Remote';
    status: 'Present' | 'Absent' | 'Half Day' | 'On Leave';
    approvalStatus: 'Pending' | 'Approved' | 'Rejected';
    rejectionReason?: string;
    totalHours?: number;
    notes?: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export const attendanceApi = {
    checkIn: async (workLocation: 'Office' | 'Home' | 'Remote', notes?: string) => {
        const response = await apiClient.post<{ success: boolean; data: { attendance: AttendanceRecord } }>('/attendance/check-in', {
            workLocation,
            notes
        });
        return response.data.data.attendance;
    },

    checkOut: async () => {
        const response = await apiClient.post<{ success: boolean; data: { attendance: AttendanceRecord } }>('/attendance/check-out');
        return response.data.data.attendance;
    },

    getMyAttendance: async (startDate?: string, endDate?: string) => {
        const response = await apiClient.get<{ success: boolean; data: { attendance: AttendanceRecord[] } }>('/attendance/my-attendance', {
            params: { startDate, endDate }
        });
        return response.data.data.attendance;
    },

    getAllAttendance: async (date?: string, approvalStatus?: string) => {
        const response = await apiClient.get<{ success: boolean; data: { attendance: AttendanceRecord[] } }>('/attendance', {
            params: { date, approvalStatus }
        });
        return response.data.data.attendance;
    },

    getEmployeeAttendance: async (userId: string, startDate?: string, endDate?: string) => {
        const response = await apiClient.get<{ success: boolean; data: { attendance: AttendanceRecord[] } }>(`/attendance/employee/${userId}`, {
            params: { startDate, endDate }
        });
        return response.data.data.attendance;
    },

    updateStatus: async (id: string, status: 'Approved' | 'Rejected', rejectionReason?: string) => {
        const response = await apiClient.patch<{ success: boolean; data: { attendance: AttendanceRecord } }>(`/attendance/${id}/status`, {
            status,
            rejectionReason
        });
        return response.data.data.attendance;
    }
};
