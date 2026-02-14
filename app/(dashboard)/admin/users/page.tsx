
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, Edit2, Trash2, Lock, Key } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getRoleColor, getRoleDisplayName } from '@/lib/auth/routing';
import { formatRelativeTime, getInitials, cn } from '@/lib/utils';
import CreateUserModal from '@/components/users/CreateUserModal';
import EditUserModal from '@/components/users/EditUserModal';
import ResetPasswordModal from '@/components/users/ResetPasswordModal';
import { usersApi, User, UserRole } from '@/lib/api/endpoints/users';
import { useToast } from '@/components/ui/Toast';

export default function UserManagementPage() {
    const { success, error: showError } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

    // Modals state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await usersApi.getAll({
                search: searchQuery,
                role: roleFilter !== 'ALL' ? roleFilter : undefined,
                isActive: statusFilter !== 'all' ? (statusFilter === 'active' ? 'true' : 'false') : undefined
            });
            // usersApi.getAll returns data.data (UsersResponse) which has users array
            setUsers(response.users);
        } catch (err: any) {
            console.error('Failed to fetch users:', err);
            showError('Error', 'Failed to fetch users');
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, roleFilter, statusFilter, showError]);

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await usersApi.delete(userId);
            success('User Deleted', 'User has been removed successfully');
            fetchUsers();
            setSelectedUsers((prev) => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        } catch (err: any) {
            showError('Error', err.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleResetPassword = (user: User) => {
        setSelectedUser(user);
        setIsResetPasswordModalOpen(true);
    };

    const toggleUserSelection = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const toggleAllUsers = () => {
        if (selectedUsers.size === users.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(users.map(u => u.id)));
        }
    };

    return (
        <Container size="2xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            User Management
                        </h1>
                        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
                            Manage users and permissions
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        leftIcon={<UserPlus className="w-5 h-5" />}
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full md:w-auto"
                    >
                        Add User
                    </Button>
                </div>

                {/* Filters & Search */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    leftIcon={<Search className="w-5 h-5" />}
                                />
                            </div>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="ALL">All Roles</option>
                                <option value="ADMIN">Admin</option>
                                <option value="SCRUM_MASTER">Scrum Master</option>
                                <option value="EMPLOYEE">Employee</option>
                                <option value="CLIENT">Client</option>
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Bulk Actions Bar */}
                {selectedUsers.size > 0 && (
                    <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
                                {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
                            </span>
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm">Deactivate</Button>
                                <Button variant="danger" size="sm" leftIcon={<Trash2 className="w-4 h-4" />}>
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* User Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={users.length > 0 && selectedUsers.size === users.length}
                                                onChange={toggleAllUsers}
                                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Last Active
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                                Loading users...
                                            </td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                                No users found
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.has(user.id)}
                                                        onChange={() => toggleUserSelection(user.id)}
                                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                                                                {getInitials(`${user.firstName} ${user.lastName} `)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {user.firstName} {user.lastName}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                                        getRoleColor(user.role as UserRole)
                                                    )}>
                                                        {getRoleDisplayName(user.role as UserRole)}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                                        user.isActive
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                    )}>
                                                        {user.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {formatRelativeTime(user.lastLogin || user.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            className="p-2 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                                                            onClick={() => handleResetPassword(user)}
                                                            title="Reset Password"
                                                        >
                                                            <Key className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                                            onClick={() => handleEditUser(user)}
                                                            title="Edit User"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <div className="p-4 text-center text-gray-500">Loading users...</div>
                            ) : users.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">No users found</div>
                            ) : (
                                users.map((user) => (
                                    <div key={user.id} className="p-4 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.has(user.id)}
                                                    onChange={() => toggleUserSelection(user.id)}
                                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-1"
                                                />
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                                                            {getInitials(`${user.firstName} ${user.lastName} `)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {user.firstName} {user.lastName}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    className="p-2 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                                                    onClick={() => handleResetPassword(user)}
                                                >
                                                    <Key className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                                    onClick={() => handleEditUser(user)}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm pl-7">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                                    getRoleColor(user.role as UserRole)
                                                )}>
                                                    {getRoleDisplayName(user.role as UserRole)}
                                                </span>
                                                <span className={cn(
                                                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                                    user.isActive
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                )}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                                                {formatRelativeTime(user.lastLogin || user.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination - Simplified for now */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                Showing <span className="font-medium">{users.length}</span> users
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onUserCreated={fetchUsers}
            />

            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                }}
                onUserUpdated={fetchUsers}
                user={selectedUser}
            />

            <ResetPasswordModal
                isOpen={isResetPasswordModalOpen}
                onClose={() => {
                    setIsResetPasswordModalOpen(false);
                    setSelectedUser(null);
                }}
                userId={selectedUser?.id || null}
                userName={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName} ` : ''}
            />
        </Container>
    );
}

