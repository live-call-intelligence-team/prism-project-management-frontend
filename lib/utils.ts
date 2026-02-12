import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function getInitials(name: string): string {
    if (!name) return '??';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Status color utilities
export function getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
        TODO: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
        IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        DONE: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        ON_HOLD: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
        ARCHIVED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
        BLOCKED: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    };
    return statusColors[status] || statusColors.TODO;
}

// Priority color utilities
export function getPriorityColor(priority: string): string {
    const priorityColors: Record<string, string> = {
        CRITICAL: 'text-red-600 dark:text-red-400',
        HIGH: 'text-orange-600 dark:text-orange-400',
        MEDIUM: 'text-yellow-600 dark:text-yellow-400',
        LOW: 'text-green-600 dark:text-green-400',
    };
    return priorityColors[priority] || priorityColors.MEDIUM;
}

// Role color utilities
export function getRoleColor(role: string): string {
    const roleColors: Record<string, string> = {
        ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        SCRUM_MASTER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
        EMPLOYEE: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
        CLIENT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    };
    return roleColors[role] || roleColors.EMPLOYEE;
}

// Type color utilities (for issues)
export function getTypeColor(type: string): string {
    const typeColors: Record<string, string> = {
        BUG: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20',
        TASK: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
        STORY: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20',
        EPIC: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20',
    };
    return typeColors[type] || typeColors.TASK;
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return formatDate(date);
}

// Format duration (for time tracking)
export function formatDuration(hours: number): string {
    if (hours < 1) {
        return `${Math.round(hours * 60)}m`;
    }
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Truncate text
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
