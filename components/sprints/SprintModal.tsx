'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, RadioGroup } from '@headlessui/react';
import { X, Save, Calendar, Users, Layers } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import MultiUserSelect from '@/components/ui/MultiUserSelect';
import { useToast } from '@/components/ui/Toast';
import { sprintsApi } from '@/lib/api/endpoints/sprints';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { usersApi } from '@/lib/api/endpoints/users';
import { issuesApi } from '@/lib/api/endpoints/issues';
import { Sprint } from '@/types';
import { differenceInDays, addDays, format } from 'date-fns';

interface SprintModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSubmit: () => void;
    initialData?: Sprint;
}

const SPRINT_DURATIONS = [
    { label: '1 Week', days: 7 },
    { label: '2 Weeks', days: 14 },
    { label: '3 Weeks', days: 21 },
    { label: '4 Weeks', days: 28 },
];

export function SprintModal({
    isOpen,
    onClose,
    projectId,
    onSubmit,
    initialData
}: SprintModalProps) {
    const { success, error } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    // Backlog & Burndown Logic
    const [backlogCount, setBacklogCount] = useState<number | null>(null);
    const [burnDownConfig, setBurnDownConfig] = useState('points'); // 'points' or 'hours' || 'count'

    // Duration Logic
    const [startDate, setStartDate] = useState(initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '');
    const [endDate, setEndDate] = useState(initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '');
    const [durationText, setDurationText] = useState('');

    useEffect(() => {
        if (isOpen && projectId) {
            loadProjectMembers();
            loadBacklogData();
        }
    }, [isOpen, projectId]);

    useEffect(() => {
        if (startDate && endDate) {
            const days = differenceInDays(new Date(endDate), new Date(startDate));
            if (days > 0) {
                setDurationText(`${days} days`);
            } else {
                setDurationText('');
            }
        }
    }, [startDate, endDate]);

    const loadProjectMembers = async () => {
        try {
            // Fetch all employees and scrum masters from the system
            const [employeeResponse, scrumMasterResponse] = await Promise.all([
                usersApi.getAll({ role: 'EMPLOYEE', limit: 100 }),
                usersApi.getAll({ role: 'SCRUM_MASTER', limit: 100 })
            ]);

            const allEmployees = [...employeeResponse.users, ...scrumMasterResponse.users];

            // Map to UserOption format
            setMembers(allEmployees.map((user: any) => ({
                id: user.id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                avatar: user.avatar
            })));
        } catch (err) {
            console.error('Failed to load employees', err);
        }
    };

    const loadBacklogData = async () => {
        try {
            // Assuming default status for backlog is 'TODO' or unassigned sprint
            // Using getBacklog endpoint if available or generalized search
            const backlog = await issuesApi.getBacklog(projectId, { limit: 1 });
            if (backlog && backlog.pagination) {
                setBacklogCount(backlog.pagination.total);
            }
        } catch (err) {
            console.error('Failed to load backlog', err);
        }
    };

    const handleDurationSelect = (days: number) => {
        let start = startDate ? new Date(startDate) : new Date();
        if (!startDate) {
            const today = new Date().toISOString().split('T')[0];
            setStartDate(today);
            start = new Date(today);
        }
        const end = addDays(start, days);
        setEndDate(format(end, 'yyyy-MM-dd'));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            goal: formData.get('goal') as string,
            startDate: startDate,
            endDate: endDate,
            projectId,
            notes: formData.get('notes') as string,
            plannedPoints: formData.get('plannedPoints') ? parseInt(formData.get('plannedPoints') as string) : undefined,
            status: formData.get('status') as 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED',
            teamMembers: selectedMembers,
            burnDownConfig: { type: burnDownConfig }
        };

        try {
            if (initialData) {
                await sprintsApi.update(initialData.id, data);
                success('Sprint updated successfully');
            } else {
                await sprintsApi.create(data);
                success('Sprint created successfully');
            }
            onSubmit();
            onClose();
        } catch (err: any) {
            console.error(err);
            error(initialData ? 'Failed to update sprint' : 'Failed to create sprint');
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
                                    {initialData ? 'Edit Sprint' : 'Create Sprint'}
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            name="name"
                                            label="Sprint Name"
                                            placeholder="e.g., Sprint 1"
                                            defaultValue={initialData?.name}
                                            required
                                            autoFocus
                                            className="col-span-2"
                                        />

                                        {/* Sprint Type Template */}
                                        <div className="col-span-2 flex gap-2">
                                            {SPRINT_DURATIONS.map((dur) => (
                                                <button
                                                    key={dur.label}
                                                    type="button"
                                                    onClick={() => handleDurationSelect(dur.days)}
                                                    className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                                                >
                                                    {dur.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="col-span-1">
                                            <Input
                                                name="startDate"
                                                label="Start Date"
                                                type="date"
                                                required
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <Input
                                                name="endDate"
                                                label="End Date"
                                                type="date"
                                                required
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                            {durationText && (
                                                <p className="text-xs text-indigo-500 mt-1 font-medium">
                                                    Duration: {durationText}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Team Members Assignment */}
                                    <div>
                                        <MultiUserSelect
                                            users={members}
                                            value={selectedMembers}
                                            onChange={setSelectedMembers}
                                            label="Team & Capacity"
                                            placeholder="Search and select team members..."
                                        />

                                        {/* Capacity Display */}
                                        {selectedMembers.length > 0 && (
                                            <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                                                <Users className="w-3 h-3 mr-1" />
                                                <span>Estimated Capacity: {selectedMembers.length * 40} hours (based on 40h/week)</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <Input
                                                name="plannedPoints"
                                                label="Planned Story Points"
                                                type="number"
                                                placeholder="e.g. 40"
                                                defaultValue={initialData?.plannedPoints}
                                            />
                                            {backlogCount !== null && (
                                                <div className="absolute right-0 top-0 text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1 mr-1">
                                                    <Layers className="w-3 h-3 mr-1" />
                                                    <span>Backlog: {backlogCount} items</span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                defaultValue={initialData?.status || 'PLANNED'}
                                            >
                                                <option value="PLANNED">Planned</option>
                                                {initialData && (
                                                    <>
                                                        <option value="ACTIVE">Active</option>
                                                        <option value="COMPLETED">Completed</option>
                                                        <option value="CANCELLED">Cancelled</option>
                                                    </>
                                                )}
                                            </select>
                                            {!initialData && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Sprint will be created as "Planned". Use "Start Sprint" button to activate.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Burndown Config */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Burndown Chart Based On
                                        </label>
                                        <RadioGroup value={burnDownConfig} onChange={setBurnDownConfig} className="flex gap-4">
                                            <RadioGroup.Option value="points" as={Fragment}>
                                                {({ checked }) => (
                                                    <div className={`cursor-pointer px-4 py-2 rounded-lg border flex items-center text-sm ${checked ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                                                        <div className={`w-4 h-4 rounded-full border mr-2 flex items-center justify-center ${checked ? 'border-indigo-500' : 'border-gray-400'}`}>
                                                            {checked && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                                        </div>
                                                        Story Points
                                                    </div>
                                                )}
                                            </RadioGroup.Option>
                                            <RadioGroup.Option value="issues" as={Fragment}>
                                                {({ checked }) => (
                                                    <div className={`cursor-pointer px-4 py-2 rounded-lg border flex items-center text-sm ${checked ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                                                        <div className={`w-4 h-4 rounded-full border mr-2 flex items-center justify-center ${checked ? 'border-indigo-500' : 'border-gray-400'}`}>
                                                            {checked && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                                        </div>
                                                        Issue Count
                                                    </div>
                                                )}
                                            </RadioGroup.Option>
                                        </RadioGroup>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Sprint Goal
                                        </label>
                                        <textarea
                                            name="goal"
                                            rows={2}
                                            defaultValue={initialData?.goal || ''}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                                            placeholder="What is the goal of this sprint?"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Notes (Optional)
                                        </label>
                                        <textarea
                                            name="notes"
                                            rows={2}
                                            defaultValue={initialData?.notes || ''}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                                            placeholder="Strategy, risks, or other notes..."
                                        />
                                    </div>

                                    <div className="mt-8 flex justify-end gap-3">
                                        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            isLoading={isLoading}
                                            leftIcon={<Save className="w-5 h-5" />}
                                        >
                                            {initialData ? 'Update Sprint' : 'Create Sprint'}
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
