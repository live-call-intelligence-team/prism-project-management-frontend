import React, { useState } from 'react';
import { X, User, Mail, Lock, Briefcase } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { usersApi, UserRole } from '@/lib/api/endpoints/users';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserCreated: () => void;
}

const ROLES: { value: UserRole; label: string }[] = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'PROJECT_MANAGER', label: 'Project Manager' },
    { value: 'SCRUM_MASTER', label: 'Scrum Master' },
    { value: 'EMPLOYEE', label: 'Employee' },
    { value: 'CLIENT', label: 'Client' },
];

export default function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
    const { success, error: showError } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<{
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        role: UserRole;
    }>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await usersApi.create(formData);

            success('User Created', `${formData.firstName} ${formData.lastName} has been added successfully.`);
            onUserCreated();
            onClose();
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                role: 'EMPLOYEE',
            });
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to create user';
            showError('Error', message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New User">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="John"
                        required
                        leftIcon={<User className="w-4 h-4" />}
                    />
                    <Input
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                        required
                        leftIcon={<User className="w-4 h-4" />}
                    />
                </div>

                <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                    leftIcon={<Mail className="w-4 h-4" />}
                />

                <Input
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    leftIcon={<Lock className="w-4 h-4" />}
                    minLength={8}
                />

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Role
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Briefcase className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                            {ROLES.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" isLoading={isLoading}>
                        Create User
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
