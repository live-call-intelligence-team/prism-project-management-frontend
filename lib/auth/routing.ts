import { UserRole } from '@/lib/api/endpoints/users';

export function getDashboardRoute(role: UserRole): string {
    const routes: Record<UserRole, string> = {
        ADMIN: '/admin/dashboard',
        SCRUM_MASTER: '/scrum/dashboard',
        EMPLOYEE: '/employee/dashboard',
        CLIENT: '/client/portal',
        PROJECT_MANAGER: '/scrum/dashboard', // Assuming PM shares scrum view or has their own
    };
    return routes[role] || '/employee/dashboard';
}

export function getRoleDisplayName(role: UserRole): string {
    const names: Record<UserRole, string> = {
        ADMIN: 'Admin',
        SCRUM_MASTER: 'Scrum Master',
        EMPLOYEE: 'Employee',
        CLIENT: 'Client',
        PROJECT_MANAGER: 'Project Manager',
    };
    return names[role] || 'User';
}

export function getRoleColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
        ADMIN: 'from-blue-600 to-blue-500',
        SCRUM_MASTER: 'from-purple-600 to-purple-500',
        EMPLOYEE: 'from-green-600 to-green-500',
        CLIENT: 'from-orange-600 to-orange-500',
        PROJECT_MANAGER: 'from-pink-600 to-pink-500',
    };
    return colors[role] || 'from-gray-600 to-gray-500';
}

export function getRoleIcon(role: UserRole): string {
    const icons: Record<UserRole, string> = {
        ADMIN: 'Shield',
        SCRUM_MASTER: 'Zap',
        EMPLOYEE: 'User',
        CLIENT: 'Briefcase',
        PROJECT_MANAGER: 'Briefcase',
    };
    return icons[role] || 'User';
}

export function canAccessRoute(userRole: UserRole, pathname: string): boolean {
    // Admin can access everything
    if (userRole === 'ADMIN') return true;

    // Check role-specific routes
    if (pathname.startsWith('/admin')) return false;
    if (pathname.startsWith('/scrum')) return userRole === 'SCRUM_MASTER' || userRole === 'PROJECT_MANAGER';
    if (pathname.startsWith('/employee')) return userRole === 'EMPLOYEE';
    if (pathname.startsWith('/client')) return userRole === 'CLIENT';

    // Allow access to common routes
    return true;
}
