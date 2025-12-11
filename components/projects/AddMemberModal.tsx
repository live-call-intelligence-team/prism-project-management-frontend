
'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, UserPlus, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import { usersApi } from '@/lib/api/endpoints/users';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (userId: string, role: string) => Promise<void>;
    projectId: string; // To check existing members if needed
}

export function AddMemberModal({ isOpen, onClose, onSubmit, projectId }: AddMemberModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState('MEMBER');
    const { error: toastError } = useToast();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                try {
                    // Need to verify if usersApi has search, if not assume getAll works
                    const data = await usersApi.getAll({ search: searchTerm, limit: 10 });
                    setUsers(data.users);
                } catch (e) {
                    console.error(e);
                }
            } else {
                setUsers([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        setIsLoading(true);
        try {
            await onSubmit(selectedUser, selectedRole);
            onClose();
            setSelectedUser(null);
            setSearchTerm('');
        } catch (error) {
            // Error handled by parent or toast
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex justify-between items-center"
                                >
                                    Add Team Member
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Search User
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Search by name or email..."
                                                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* User List */}
                                    {users.length > 0 && (
                                        <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                            {users.map(user => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => setSelectedUser(user.id)}
                                                    className={cn(
                                                        "px-4 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between",
                                                        selectedUser === user.id ? "bg-primary-50 dark:bg-primary-900/20" : ""
                                                    )}
                                                >
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {user.firstName} {user.lastName}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                    {selectedUser === user.id && (
                                                        <div className="text-primary-600 text-xs font-medium">Selected</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {searchTerm.length >= 2 && users.length === 0 && (
                                        <p className="text-sm text-gray-500 text-center py-2">No users found</p>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Role
                                        </label>
                                        <select
                                            value={selectedRole}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="MEMBER">Member</option>
                                            <option value="ADMIN">Admin</option>
                                            <option value="VIEWER">Viewer</option>
                                            <option value="CLIENT">Client</option>
                                        </select>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <Button type="button" variant="secondary" onClick={onClose}>
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            isLoading={isLoading}
                                            disabled={!selectedUser}
                                            leftIcon={<UserPlus className="w-5 h-5" />}
                                        >
                                            Add Member
                                        </Button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
