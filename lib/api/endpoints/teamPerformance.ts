import apiClient from '../client';

export interface TeamMember {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: 'Active' | 'Blocked' | 'Available' | 'Completed';
    totalTasks: number;
    doneTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    percentDone: number;
    hoursLogged: number;
}

export interface EmployeeTask {
    id: string;
    key: string;
    title: string;
    status: string;
    priority: string;
    type: string;
    storyPoints: number | null;
    dueDate: string | null;
    updatedAt: string;
    sprint?: { id: string; name: string };
}

export interface EmployeeDetail {
    employee: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    };
    stats: {
        totalTasks: number;
        doneTasks: number;
        inProgressTasks: number;
        percentDone: number;
        totalHours: number;
        totalStoryPoints: number;
    };
    tasks: EmployeeTask[];
    weeklyHours: { week: string; hours: number }[];
}

export interface TimelineMember {
    id: string;
    name: string;
    weeks: { week: string; hours: number }[];
}

export const teamPerformanceApi = {
    getTeamGrid: async (projectId: string): Promise<TeamMember[]> => {
        const res = await apiClient.get<{ success: boolean; data: { team: TeamMember[] } }>(
            `/client/projects/${projectId}/team`
        );
        return res.data.data.team || [];
    },

    getEmployeeDetail: async (projectId: string, memberId: string): Promise<EmployeeDetail> => {
        const res = await apiClient.get<{ success: boolean; data: EmployeeDetail }>(
            `/client/projects/${projectId}/team/${memberId}`
        );
        return res.data.data;
    },

    getTeamTimeline: async (projectId: string, weeks?: number): Promise<TimelineMember[]> => {
        const res = await apiClient.get<{ success: boolean; data: { timeline: TimelineMember[] } }>(
            `/client/projects/${projectId}/team-timeline`,
            { params: { weeks } }
        );
        return res.data.data.timeline || [];
    },
};
