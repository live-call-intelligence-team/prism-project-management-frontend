'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { useToast } from '@/components/ui/Toast';
import { IssuesTable } from '@/components/issues/IssuesTable';
import { IssueFilters } from '@/components/issues/IssueFilters';
import { IssueModal } from '@/components/issues/IssueModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import Button from '@/components/ui/Button';

export default function IssuesPage() {
    const router = useRouter();
    const { success, error } = useToast();

    // Data State
    const [issues, setIssues] = useState<Issue[]>([]);
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        type: 'all',
        priority: 'all',
        status: 'all',
        assigneeId: 'all'
    });

    // Selection State
    const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

    // Modal State
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [editingIssue, setEditingIssue] = useState<Issue | undefined>(undefined);

    // Delete Confirmation
    const [issueToDelete, setIssueToDelete] = useState<Issue | null>(null);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);

    const fetchIssues = async () => {
        try {
            setIsLoading(true);
            const [data, projectsData] = await Promise.all([
                issuesApi.getAll(),
                projectsApi.getAll()
            ]);
            setIssues(data.issues);
            setProjects(projectsData.projects || []);
        } catch (err) {
            console.error('Failed to fetch issues:', err);
            error('Failed to load issues');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    const handleIssueSubmit = (issue: Issue) => {
        if (editingIssue) {
            setIssues(prev => prev.map(i => i.id === issue.id ? issue : i));
        } else {
            setIssues(prev => [issue, ...prev]);
        }
        setIsIssueModalOpen(false);
    };

    const openCreateModal = () => {
        setEditingIssue(undefined);
        setIsIssueModalOpen(true);
    };

    const openEditModal = (issue: Issue) => {
        setEditingIssue(issue);
        setIsIssueModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!issueToDelete) return;
        setIsDeleteLoading(true);
        try {
            await issuesApi.delete(issueToDelete.id);
            setIssues(prev => prev.filter(i => i.id !== issueToDelete.id));
            success('Issue deleted successfully');
            setIssueToDelete(null);
            // Remove from selection if it was selected
            if (selectedIssues.includes(issueToDelete.id)) {
                setSelectedIssues(prev => prev.filter(id => id !== issueToDelete.id));
            }
        } catch (err) {
            console.error('Failed to delete issue:', err);
            error('Failed to delete issue');
        } finally {
            setIsDeleteLoading(false);
        }
    };

    // Filter Logic
    const filteredIssues = issues.filter(issue => {
        const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.key.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filters.type === 'all' || issue.type === filters.type;
        const matchesPriority = filters.priority === 'all' || issue.priority === filters.priority;
        const matchesStatus = filters.status === 'all' || issue.status === filters.status;
        return matchesSearch && matchesType && matchesPriority && matchesStatus;
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            type: 'all',
            priority: 'all',
            status: 'all',
            assigneeId: 'all'
        });
        setSearchQuery('');
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIssues.length} issues?`)) return; // Use window.confirm for bulk for now

        try {
            // Parallel delete (or add bulk delete API if available, currently looping)
            await Promise.all(selectedIssues.map(id => issuesApi.delete(id)));
            setIssues(prev => prev.filter(i => !selectedIssues.includes(i.id)));
            setSelectedIssues([]);
            success(`Deleted ${selectedIssues.length} issues`);
        } catch (err) {
            error('Failed to delete some issues');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        Issues
                        {isLoading && <Loader2 className="w-6 h-6 animate-spin text-primary-500" />}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Track and manage all project issues
                    </p>
                </div>
                <div className="flex gap-3">
                    {selectedIssues.length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {selectedIssues.length} selected
                            </span>
                            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                                Delete Selected
                            </Button>
                        </div>
                    )}
                    <Button
                        variant="primary"
                        leftIcon={<Plus className="w-5 h-5" />}
                        onClick={openCreateModal}
                    >
                        Create Issue
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <IssueFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                currentFilters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
            />

            {/* Table */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                </div>
            ) : filteredIssues.length > 0 ? (
                <IssuesTable
                    issues={filteredIssues}
                    onEdit={openEditModal}
                    onDelete={setIssueToDelete}
                    selectedIssues={selectedIssues}
                    onSelectionChange={setSelectedIssues}
                />
            ) : (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No issues found matching your filters.</p>
                    <Button variant="ghost" onClick={handleClearFilters}>Clear Filters</Button>
                </div>
            )}

            {/* Issue Modal */}
            <IssueModal
                isOpen={isIssueModalOpen}
                onClose={() => setIsIssueModalOpen(false)}
                onSubmit={handleIssueSubmit}
                projects={projects}
                initialData={editingIssue}
            />

            <ConfirmationModal
                isOpen={!!issueToDelete}
                onClose={() => setIssueToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Issue"
                message={`Are you sure you want to delete "${issueToDelete?.key}"? This action cannot be undone.`}
                confirmText="Delete Issue"
                variant="danger"
                isLoading={isDeleteLoading}
            />
        </div>
    );
}
