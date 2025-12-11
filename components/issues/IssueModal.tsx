'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import UserSelect from '@/components/ui/UserSelect';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { usersApi } from '@/lib/api/endpoints/users';
import { useToast } from '@/components/ui/Toast';
import { featuresApi, Feature } from '@/lib/api/endpoints/features';
import { epicsApi, Epic } from '@/lib/api/endpoints/epics';

interface IssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (issue: Issue) => void;
    initialData?: Issue;
    projectId?: string;
    projects?: { id: string; name: string }[];
    defaultStatus?: string;
    sprintId?: string;
}

export function IssueModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    projectId,
    projects = [],
    defaultStatus,
    sprintId
}: IssueModalProps) {
    const { success, error } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [epics, setEpics] = useState<Epic[]>([]);
    const [selectedAssignee, setSelectedAssignee] = useState<string>(initialData?.assigneeId || '');
    const [selectedProjectId, setSelectedProjectId] = useState<string>(initialData?.projectId || projectId || '');
    const [selectedEpicId, setSelectedEpicId] = useState<string>(initialData?.epicId || '');

    useEffect(() => {
        if (initialData) {
            setSelectedAssignee(initialData.assigneeId || '');
            setSelectedProjectId(initialData.projectId);
        } else if (projectId) {
            setSelectedProjectId(projectId);
        }
    }, [initialData, projectId, isOpen]);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const [employeeResponse, scrumMasterResponse] = await Promise.all([
                    usersApi.getAll({ role: 'EMPLOYEE', limit: 100 }),
                    usersApi.getAll({ role: 'SCRUM_MASTER', limit: 100 })
                ]);
                const allEmployees = [...employeeResponse.users, ...scrumMasterResponse.users];
                const mappedMembers = allEmployees.map((user: any) => ({
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    avatar: user.avatar
                }));
                setMembers(mappedMembers);
            } catch (err) {
                console.error('Failed to load employees', err);
            }
        };

        if (isOpen) {
            fetchMembers();
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedProjectId && isOpen) {
            const fetchData = async () => {
                try {
                    const [featuresData, epicsData] = await Promise.all([
                        featuresApi.getAll(selectedProjectId),
                        epicsApi.getAll(selectedProjectId)
                    ]);
                    setFeatures(featuresData);
                    setEpics(epicsData);
                } catch (error) {
                    console.error('Failed to fetch project data', error);
                }
            };
            fetchData();
        } else {
            setFeatures([]);
            setEpics([]);
        }
    }, [selectedProjectId, isOpen]);

    // Filter features based on selected epic
    const filteredFeatures = selectedEpicId
        ? features.filter(f => f.epicId === selectedEpicId)
        : features.filter(f => !f.epicId); // Show only independent features if no epic selected

    // Auto-select epic if feature is selected (reverse lookup)
    const handleFeatureChange = (featureId: string) => {
        const feature = features.find(f => f.id === featureId);
        if (feature && feature.epicId) {
            setSelectedEpicId(feature.epicId);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const data: any = {
            title: formData.get('title'),
            description: formData.get('description'),
            type: formData.get('type'),
            priority: formData.get('priority'),
            storyPoints: Number(formData.get('storyPoints')) || 0,
            assigneeId: selectedAssignee || undefined,
            status: formData.get('status') || defaultStatus || 'TODO',
            sprintId: sprintId,
            featureId: formData.get('featureId') || null,
            epicId: selectedEpicId || null,
            isClientVisible: formData.get('isClientVisible') === 'on'
        };

        if (!initialData) {
            data.projectId = selectedProjectId;
            if (!data.projectId) {
                error('Please select a project');
                setIsLoading(false);
                return;
            }
        }

        try {
            let result;
            if (initialData) {
                result = await issuesApi.update(initialData.id, data);
                success('Issue updated');
            } else {
                result = await issuesApi.create(data);
                success('Issue created');
            }
            onSubmit(result);
        } catch (err: any) {
            console.error(err);
            error(initialData ? 'Failed to update issue' : 'Failed to create issue');
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
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex justify-between items-center"
                                >
                                    {initialData ? `Edit Issue ${initialData.key}` : 'Create New Issue'}
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                                    {!initialData && !projectId && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Project <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="projectId"
                                                required
                                                value={selectedProjectId}
                                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="">Select a Project</option>
                                                {projects.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <Input
                                        name="title"
                                        label="Issue Title"
                                        placeholder="e.g., Fix navigation bug"
                                        defaultValue={initialData?.title}
                                        required
                                        autoFocus={!initialData}
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            rows={4}
                                            defaultValue={initialData?.description}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                                            placeholder="Describe the issue..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Type
                                            </label>
                                            <select
                                                name="type"
                                                defaultValue={initialData?.type || 'STORY'}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="STORY">Story</option>
                                                <option value="BUG">Bug</option>
                                                <option value="TASK">Task</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Epic Context
                                            </label>
                                            <select
                                                name="epicId"
                                                value={selectedEpicId}
                                                onChange={(e) => setSelectedEpicId(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="">No Epic</option>
                                                {epics.map(e => (
                                                    <option key={e.id} value={e.id}>{e.key} - {e.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Feature Context
                                            </label>
                                            <select
                                                name="featureId"
                                                defaultValue={initialData?.featureId || ''}
                                                onChange={(e) => handleFeatureChange(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="">No Feature</option>
                                                {filteredFeatures.map(f => (
                                                    <option key={f.id} value={f.id}>{f.key} - {f.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Priority
                                            </label>
                                            <select
                                                name="priority"
                                                defaultValue={initialData ? initialData.priority : 'MEDIUM'}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="LOW">Low</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="HIGH">High</option>
                                                <option value="CRITICAL">Critical</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                defaultValue={initialData?.status || 'TODO'}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="TODO">To Do</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="IN_REVIEW">In Review</option>
                                                <option value="DONE">Done</option>
                                                <option value="BLOCKED">Blocked</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input
                                            name="storyPoints"
                                            label="Story Points"
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            defaultValue={initialData?.storyPoints}
                                        />

                                        <UserSelect
                                            users={members}
                                            value={selectedAssignee}
                                            onChange={setSelectedAssignee}
                                            label="Assignee"
                                            placeholder="Select Assignee..."
                                            disabled={!selectedProjectId}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="isClientVisible"
                                            name="isClientVisible"
                                            defaultChecked={initialData?.isClientVisible}
                                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <label htmlFor="isClientVisible" className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none flex items-center gap-2">
                                            {initialData?.isClientVisible ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                                            Visible to Client
                                        </label>
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
                                            {initialData ? 'Update Issue' : 'Create Issue'}
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
