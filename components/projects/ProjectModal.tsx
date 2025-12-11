'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Building2, FileText, Eye, EyeOff, Save, Calendar, Users, Briefcase, Layers, Info } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Project } from '@/lib/api/endpoints/projects';
import { usersApi, User } from '@/lib/api/endpoints/users';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const projectSchema = z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters'),
    key: z.string().min(2, 'Key must be 2+ chars').max(10, 'Key max 10 chars').regex(/^[A-Z]+$/, 'Uppercase letters only'),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z.enum(['SCRUM', 'KANBAN', 'WATERFALL']),
    usesEpics: z.boolean().default(true),
    usesSprints: z.boolean().default(false),
    leadId: z.string().optional(),
    projectManagerId: z.string().optional(),
    scrumMasterId: z.string().optional(),
    memberIds: z.array(z.string()).default([]),
    visibility: z.enum(['PUBLIC', 'PRIVATE']),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: Project;
}

export function ProjectModal({ isOpen, onClose, onSubmit, initialData }: ProjectModalProps) {
    const isEditing = !!initialData;
    const [isLoading, setIsLoading] = useState(false);
    const [scrumMasters, setScrumMasters] = useState<User[]>([]);
    const [projectManagers, setProjectManagers] = useState<User[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
        watch,
        setValue
    } = useForm<ProjectFormData>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            type: 'SCRUM',
            visibility: 'PUBLIC',
            usesEpics: true,
            usesSprints: false,
            memberIds: []
        },
    });

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            if (initialData) {
                reset({
                    name: initialData.name,
                    key: initialData.key,
                    description: initialData.description || '',
                    startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
                    endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
                    type: (initialData.type as any) || 'SCRUM',
                    usesEpics: initialData.usesEpics ?? true,
                    usesSprints: initialData.usesSprints ?? false,
                    leadId: initialData.leadId,
                    projectManagerId: initialData.leadId, // Re-map if needed or assume separate? Initial data might not have pmId yet if not in model interface?
                    // Wait, Project interface in frontend needs update too!
                    visibility: initialData.visibility as 'PUBLIC' | 'PRIVATE',
                    memberIds: [] // We don't have members in initialData yet usually, would need separate fetch
                });
            } else {
                reset({
                    type: 'SCRUM',
                    visibility: 'PUBLIC',
                    usesEpics: true,
                    usesSprints: false,
                    memberIds: []
                });
            }
        }
    }, [isOpen, initialData, reset]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            // Fetch potential Scrum Masters and Employees
            // For now fetching all and filtering in memory or separate calls
            // Ideally backend filter: roles=['SCRUM_MASTER', 'ADMIN'] for leads etc.
            const [smData, pmData, empData] = await Promise.all([
                usersApi.getAll({ role: 'SCRUM_MASTER', limit: 100 }),
                usersApi.getAll({ role: 'PROJECT_MANAGER', limit: 100 }),
                usersApi.getAll({ role: 'EMPLOYEE', limit: 100 }) // Assuming employees are team members
            ]);
            setScrumMasters(smData.users || []);
            setProjectManagers(pmData.users || []);
            setEmployees(empData.users || []);

            // If we didn't find specific roles, maybe just fetch all users
            if ((!smData.users || smData.users.length === 0) && (!empData.users || empData.users.length === 0)) {
                const allUsers = await usersApi.getAll({ limit: 200 });
                setScrumMasters(allUsers.users || []);
                setEmployees(allUsers.users || []);
            }

        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleFormSubmit = async (data: ProjectFormData) => {
        setIsLoading(true);
        try {
            // Clean up empty dates
            const submissionData = {
                ...data,
                startDate: data.startDate || null,
                endDate: data.endDate || null,
            };
            await onSubmit(submissionData);
            onClose();
        } catch (error) {
            console.error('Error saving project:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const projectType = watch('type');

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
                    />
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {isEditing ? 'Edit Project' : 'Create New Project'}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Set up your project details, timeline, and team.
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            {/* Form Content */}
                            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-8">

                                {/* Section 1: Basic Details */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-primary-500" />
                                        Basic Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-3">
                                            <Input
                                                label="Project Name *"
                                                placeholder="e.g. Mobile Banking App"
                                                error={errors.name?.message}
                                                {...register('name')}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="Key *"
                                                placeholder="MBA"
                                                className="uppercase font-mono"
                                                error={errors.key?.message}
                                                disabled={isEditing}
                                                {...register('key')}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Describe the project goals..."
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none transition-shadow"
                                            {...register('description')}
                                        />
                                    </div>
                                </section>

                                {/* Section 2: Timeline */}
                                <section className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary-500" />
                                        Timeline
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            type="date"
                                            label="Start Date"
                                            {...register('startDate')}
                                        />
                                        <Input
                                            type="date"
                                            label="End Date"
                                            {...register('endDate')}
                                        />
                                    </div>
                                </section>

                                {/* Section 3: Project Type */}
                                <section className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-primary-500" />
                                        Project Type
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {(['SCRUM', 'KANBAN', 'WATERFALL'] as const).map((type) => (
                                            <label
                                                key={type}
                                                className={cn(
                                                    "cursor-pointer rounded-lg border p-4 flex flex-col items-center justify-center gap-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50",
                                                    projectType === type
                                                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10 ring-1 ring-primary-500"
                                                        : "border-gray-200 dark:border-gray-700"
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    value={type}
                                                    className="sr-only"
                                                    {...register('type')}
                                                />
                                                <span className="font-semibold text-sm">{type}</span>
                                                <span className="text-xs text-center text-gray-500">
                                                    {type === 'SCRUM' && 'Sprints & Backlog'}
                                                    {type === 'KANBAN' && 'Continuous Flow'}
                                                    {type === 'WATERFALL' && 'Sequential Phases'}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </section>

                                {/* Section 4: Features Config */}
                                <section className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-primary-500" />
                                        Features Configuration
                                    </h3>
                                    <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                                {...register('usesEpics')}
                                            />
                                            <div>
                                                <span className="block font-medium text-gray-900 dark:text-white">Enable Epics & Features Hierarchy</span>
                                                <span className="block text-xs text-gray-500">Enable Epic → Feature → Issue structure</span>
                                            </div>
                                        </label>

                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                                {...register('usesSprints')}
                                            />
                                            <div>
                                                <span className="block font-medium text-gray-900 dark:text-white">Enable Sprint Management</span>
                                                <span className="block text-xs text-gray-500">Plan and track work in Sprints</span>
                                            </div>
                                        </label>
                                    </div>
                                </section>

                                {/* Section 5: Team Assignment */}
                                <section className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Users className="w-4 h-4 text-primary-500" />
                                        Team Assignment
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Project Manager
                                            </label>
                                            <select
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                                {...register('projectManagerId')}
                                            >
                                                <option value="">Select a Project Manager...</option>
                                                {projectManagers.map(user => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.firstName} {user.lastName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Scrum Master
                                            </label>
                                            <select
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                                {...register('scrumMasterId')}
                                            >
                                                <option value="">Select a Scrum Master...</option>
                                                {scrumMasters.map(user => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.firstName} {user.lastName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Tech Lead / Project Lead
                                            </label>
                                            <select
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                                {...register('leadId')}
                                            >
                                                <option value="">Select a user...</option>
                                                {/* Tech Lead can be anyone, usually Senior Dev or SM. Using SM list + Employees for now or just All */}
                                                {/* Reusing ScrumMasters list for now as they are likely leads, or should we filter Senior Employees? */}
                                                {/* For simplicity, let's allow SMs or Employees to be leads */}
                                                {[...scrumMasters, ...employees].map(user => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.firstName} {user.lastName} ({user.email})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Team Members
                                            </label>
                                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto p-2 bg-white dark:bg-gray-900">
                                                {employees.length === 0 ? (
                                                    <p className="text-xs text-gray-500 p-2 text-center">No available employees found.</p>
                                                ) : (
                                                    <div className="space-y-1">
                                                        {employees.map(user => (
                                                            <label key={user.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    value={user.id}
                                                                    className="w-4 h-4 text-primary-600 rounded border-gray-300"
                                                                    {...register('memberIds')}
                                                                />
                                                                <span className="text-sm">{user.firstName} {user.lastName}</span>
                                                                <span className="text-xs text-gray-500 ml-auto">{user.email}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Select multiple team members to add to this project.</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Section 6: Visibility */}
                                <section className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-primary-500" />
                                        Visibility
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className={cn(
                                            "cursor-pointer rounded-lg border p-3 flex items-center gap-3 transition-all",
                                            watch('visibility') === 'PUBLIC'
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10"
                                                : "border-gray-200 dark:border-gray-700"
                                        )}>
                                            <input type="radio" value="PUBLIC" className="sr-only" {...register('visibility')} />
                                            <Eye className={cn("w-5 h-5", watch('visibility') === 'PUBLIC' ? "text-primary-600" : "text-gray-400")} />
                                            <div>
                                                <span className="block font-medium text-sm">Public</span>
                                                <span className="block text-xs text-gray-500">Visible to all employees</span>
                                            </div>
                                        </label>
                                        <label className={cn(
                                            "cursor-pointer rounded-lg border p-3 flex items-center gap-3 transition-all",
                                            watch('visibility') === 'PRIVATE'
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10"
                                                : "border-gray-200 dark:border-gray-700"
                                        )}>
                                            <input type="radio" value="PRIVATE" className="sr-only" {...register('visibility')} />
                                            <EyeOff className={cn("w-5 h-5", watch('visibility') === 'PRIVATE' ? "text-primary-600" : "text-gray-400")} />
                                            <div>
                                                <span className="block font-medium text-sm">Private</span>
                                                <span className="block text-xs text-gray-500">Only members can view</span>
                                            </div>
                                        </label>
                                    </div>
                                </section>
                            </form>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                                <Button
                                    variant="secondary"
                                    onClick={onClose}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmit(handleFormSubmit)}
                                    isLoading={isLoading}
                                    leftIcon={<Save className="w-4 h-4" />}
                                >
                                    {isEditing ? 'Save Changes' : 'Create Project'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
