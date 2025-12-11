import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usersApi, User, UserRole } from '@/lib/api/endpoints/users';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserUpdated: () => void;
    user: User | null;
}

export default function EditUserModal({ isOpen, onClose, onUserUpdated, user }: EditUserModalProps) {
    const [formData, setFormData] = useState<{
        firstName: string;
        lastName: string;
        role: UserRole;
        isActive: boolean;
    }>({
        firstName: '',
        lastName: '',
        role: 'EMPLOYEE',
        isActive: true,
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isActive: user.isActive,
            });
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await usersApi.update(user.id, formData);
            toast.success('User updated successfully');
            onUserUpdated();
            onClose();
        } catch (error: any) {
            console.error('Failed to update user:', error);
            toast.error(error.response?.data?.error || 'Failed to update user');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X className="h-6 w-6" />
                </button>

                <h2 className="text-xl font-bold mb-4">Edit User</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        >
                            <option value="ADMIN">Admin</option>
                            <option value="SCRUM_MASTER">Scrum Master</option>
                            <option value="EMPLOYEE">Employee</option>
                            <option value="CLIENT">Client</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.isActive ? 'true' : 'false'}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                        >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="mr-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
