export type UserRole = 'ADMIN' | 'SCRUM_MASTER' | 'EMPLOYEE' | 'CLIENT';

export interface DemoUser {
    id: string;
    email: string;
    password: string;
    name: string;
    role: UserRole;
    avatar: string | null;
    organizationId: string;
    organizationName: string;
}

export const demoUsers: Record<string, DemoUser> = {
    admin: {
        id: 'demo-admin-1',
        email: 'admin@demo.com',
        password: 'demo123',
        name: 'Admin User',
        role: 'ADMIN',
        avatar: null,
        organizationId: 'demo-org-1',
        organizationName: 'Demo Organization',
    },
    scrumMaster: {
        id: 'demo-scrum-1',
        email: 'scrum@demo.com',
        password: 'demo123',
        name: 'Sarah Johnson',
        role: 'SCRUM_MASTER',
        avatar: null,
        organizationId: 'demo-org-1',
        organizationName: 'Demo Organization',
    },
    employee: {
        id: 'demo-employee-1',
        email: 'employee@demo.com',
        password: 'demo123',
        name: 'John Developer',
        role: 'EMPLOYEE',
        avatar: null,
        organizationId: 'demo-org-1',
        organizationName: 'Demo Organization',
    },
    client: {
        id: 'demo-client-1',
        email: 'client@demo.com',
        password: 'demo123',
        name: 'Client User',
        role: 'CLIENT',
        avatar: null,
        organizationId: 'demo-org-1',
        organizationName: 'Demo Organization',
    },
};

export function getDemoUser(email: string): DemoUser | null {
    return Object.values(demoUsers).find(user => user.email === email) || null;
}

export function validateDemoCredentials(email: string, password: string): DemoUser | null {
    const user = getDemoUser(email);
    if (user && user.password === password) {
        return user;
    }
    return null;
}
