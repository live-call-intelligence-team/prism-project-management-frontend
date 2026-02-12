import React, { useState } from 'react';
import { X, User, Mail, Lock, Briefcase, Calendar, MapPin, Clock, Building } from 'lucide-react';
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

const DEPARTMENTS = [
    'Engineering', 'Design', 'QA/Testing', 'DevOps', 'Product Management', 'HR', 'Finance', 'Sales', 'Marketing'
];

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern'];
const WORK_LOCATIONS = ['Office', 'Remote', 'Hybrid'];
const SHIFTS = ['9 AM - 6 PM (Day Shift)', '2 PM - 11 PM (Evening Shift)', '10 PM - 7 AM (Night Shift)', 'Flexible'];

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

    const [employeeDetails, setEmployeeDetails] = useState({
        department: 'Engineering',
        designation: '',
        employeeId: '',
        dateOfJoining: '',
        employmentType: 'Full-time',
        reportingManagerId: '',
        workLocation: 'Office',
        officeLocation: 'Hyderabad Office',
        shiftTiming: '9 AM - 6 PM (Day Shift)',
        annualLeaveBalance: 20,
        sickLeaveBalance: 10,
        casualLeaveBalance: 5,
        otherLeaveBalance: 5,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleEmployeeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEmployeeDetails((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload = {
                ...formData,
                ...(formData.role === 'EMPLOYEE' ? { employeeDetails } : {})
            };

            await usersApi.create(payload);

            success('User Created', `${formData.firstName} ${formData.lastName} has been added successfully.`);
            onUserCreated();
            onClose();
            // Reset form
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                role: 'EMPLOYEE',
            });
            setEmployeeDetails({
                department: 'Engineering',
                designation: '',
                employeeId: '',
                dateOfJoining: '',
                employmentType: 'Full-time',
                reportingManagerId: '',
                workLocation: 'Office',
                officeLocation: 'Hyderabad Office',
                shiftTiming: '9 AM - 6 PM (Day Shift)',
                annualLeaveBalance: 20,
                sickLeaveBalance: 10,
                casualLeaveBalance: 5,
                otherLeaveBalance: 5,
            });
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to create user';
            showError('Error', message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New User" size="2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
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
                </div>

                {formData.role === 'EMPLOYEE' && (
                    <div className="space-y-4 border-t pt-4 border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Employee Details</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Department *</label>
                                <select name="department" value={employeeDetails.department} onChange={handleEmployeeChange}
                                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm" required>
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <Input label="Designation *" name="designation" value={employeeDetails.designation} onChange={handleEmployeeChange} placeholder="Senior Developer" required leftIcon={<Briefcase className="w-4 h-4" />} />

                            <Input label="Employee ID *" name="employeeId" value={employeeDetails.employeeId} onChange={handleEmployeeChange} placeholder="EMP-2024-001" required leftIcon={<User className="w-4 h-4" />} />
                            <Input label="Date of Joining *" name="dateOfJoining" type="date" value={employeeDetails.dateOfJoining} onChange={handleEmployeeChange} required leftIcon={<Calendar className="w-4 h-4" />} />

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Employment Type *</label>
                                <select name="employmentType" value={employeeDetails.employmentType} onChange={handleEmployeeChange}
                                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm" required>
                                    {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            {/* Reporting Manager would ideally be a dropdown of users, simpler text for now or need to fetch users. Leaving empty for now as text input */}
                            <Input label="Reporting Manager ID" name="reportingManagerId" value={employeeDetails.reportingManagerId} onChange={handleEmployeeChange} placeholder="UUID of Manager (Optional)" />

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Work Location *</label>
                                <select name="workLocation" value={employeeDetails.workLocation} onChange={handleEmployeeChange}
                                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm" required>
                                    {WORK_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>

                            {(employeeDetails.workLocation === 'Office' || employeeDetails.workLocation === 'Hybrid') && (
                                <Input label="Office Location" name="officeLocation" value={employeeDetails.officeLocation} onChange={handleEmployeeChange} placeholder="Hyderabad Office" leftIcon={<Building className="w-4 h-4" />} />
                            )}

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Shift Timing</label>
                                <select name="shiftTiming" value={employeeDetails.shiftTiming} onChange={handleEmployeeChange}
                                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm">
                                    {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Leave Balances (Per Year)</h4>
                        <div className="grid grid-cols-4 gap-4">
                            <Input label="Annual" name="annualLeaveBalance" type="number" value={String(employeeDetails.annualLeaveBalance)} onChange={handleEmployeeChange} />
                            <Input label="Sick" name="sickLeaveBalance" type="number" value={String(employeeDetails.sickLeaveBalance)} onChange={handleEmployeeChange} />
                            <Input label="Casual" name="casualLeaveBalance" type="number" value={String(employeeDetails.casualLeaveBalance)} onChange={handleEmployeeChange} />
                            <Input label="Other" name="otherLeaveBalance" type="number" value={String(employeeDetails.otherLeaveBalance)} onChange={handleEmployeeChange} />
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
