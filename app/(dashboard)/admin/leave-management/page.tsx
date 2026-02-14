'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Search, User, CheckCircle, XCircle, Clock, FileText, Download, Mail, Filter, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { leaveApi, LeaveRequest, LeaveBalances } from '@/lib/api/endpoints/leaves';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/Modal';

export default function AdminLeavePage() {
    const { success, error: showError } = useToast();
    const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'reports'>('pending');
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');

    // Action Modal
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'Approve' | 'Reject' | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchLeaves = useCallback(async () => {
        try {
            setIsLoading(true);
            const status = activeTab === 'pending' ? 'Pending' : undefined;
            const data = await leaveApi.getAllLeaveRequests(1, 100, status);
            setLeaves(data.leaves);
        } catch (err: any) {
            console.error('Failed to fetch leaves:', err);
            showError('Error', 'Failed to fetch leave records');
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, showError]);

    useEffect(() => {
        if (activeTab !== 'reports') {
            fetchLeaves();
        }
    }, [fetchLeaves, activeTab]);

    const handleActionClick = (leave: LeaveRequest, type: 'Approve' | 'Reject') => {
        if (type === 'Approve') {
            setSelectedLeave(leave);
            setActionType('Approve');
            setRejectionReason(''); // reset
            setIsActionModalOpen(true);
            // confirmAction(leave, 'Approve'); // Original flow was instant, but modal is better for "Double Check" as per wireframe
        } else {
            setSelectedLeave(leave);
            setActionType('Reject');
            setRejectionReason('');
            setIsActionModalOpen(true);
        }
    };

    const confirmAction = async () => {
        if (!selectedLeave || !actionType) return;

        try {
            setIsProcessing(true);
            await leaveApi.updateLeaveStatus(
                selectedLeave.id,
                actionType === 'Approve' ? 'Approved' : 'Rejected',
                actionType === 'Reject' ? rejectionReason : undefined
            );
            success('Success', `Leave request ${actionType === 'Approve' ? 'approved' : 'rejected'} successfully`);
            fetchLeaves();
            setIsActionModalOpen(false);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to update leave status';
            showError('Error', message);
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredLeaves = leaves.filter(record =>
        record.user?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.user?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.leaveType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <Container size="2xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            LEAVE MANAGEMENT
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage employee leave requests
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={cn(
                            'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
                            activeTab === 'pending'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        )}
                    >
                        Pending Requests
                        {leaves.filter(l => l.status === 'Pending').length > 0 && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full ml-1">
                                {leaves.filter(l => l.status === 'Pending').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={cn(
                            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                            activeTab === 'all'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        )}
                    >
                        All Leaves
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={cn(
                            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                            activeTab === 'reports'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        )}
                    >
                        Reports
                    </button>
                </div>

                {activeTab !== 'reports' && (
                    <>
                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search employee or leave type..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    leftIcon={<Search className="w-5 h-5" />}
                                />
                            </div>
                        </div>

                        {/* List / Table */}
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="text-center py-10 text-gray-500">Loading leave requests...</div>
                            ) : filteredLeaves.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    No {activeTab} leave requests found.
                                </div>
                            ) : (
                                activeTab === 'pending' ? (
                                    // Pending View (Cards)
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                        {filteredLeaves.map((record) => (
                                            <Card key={record.id} className="border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
                                                <CardContent className="p-5">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                                <User className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                                    {record.user?.firstName} {record.user?.lastName}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {record.user?.employeeDetails?.department || 'Employee'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                                            {record.leaveType}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3 mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-500">Dates</span>
                                                            <div className="text-right">
                                                                <span className="block font-medium text-gray-900 dark:text-white">
                                                                    {format(parseISO(record.startDate), 'MMM dd')} - {format(parseISO(record.endDate), 'MMM dd, yyyy')}
                                                                </span>
                                                                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{record.daysCount} days</span>
                                                            </div>
                                                        </div>
                                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                                                            <div className="text-xs text-gray-500 mb-1">Reason</div>
                                                            <div className="text-sm text-gray-700 dark:text-gray-300 italic">
                                                                "{record.reason}"
                                                            </div>
                                                        </div>
                                                        {record.contactNumber && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
                                                                <span className="font-medium">Contact:</span> {record.contactNumber}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            className="flex-1"
                                                            onClick={() => handleActionClick(record, 'Reject')}
                                                        >
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            className="flex-1"
                                                            onClick={() => handleActionClick(record, 'Approve')}
                                                        >
                                                            Approve
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    // All View (Table)
                                    <Card>
                                        <CardContent className="p-0">
                                            {/* Desktop Table */}
                                            <div className="hidden md:block overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Start</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">End</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Days</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                                        {filteredLeaves.map((record) => (
                                                            <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                                <td className="px-6 py-4">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {record.user?.firstName} {record.user?.lastName}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">{record.user?.employeeDetails?.department || '-'}</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                                    {record.leaveType}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                                    {format(parseISO(record.startDate), 'MMM dd')}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                                    {format(parseISO(record.endDate), 'MMM dd')}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                                                                    {record.daysCount}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={cn(
                                                                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1',
                                                                        getStatusColor(record.status)
                                                                    )}>
                                                                        {record.status === 'Pending' && <Clock className="w-3 h-3" />}
                                                                        {record.status === 'Approved' && <CheckCircle className="w-3 h-3" />}
                                                                        {record.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                                                                        {record.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobile Card List */}
                                            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                                                {filteredLeaves.map((record) => (
                                                    <div key={record.id} className="p-4 space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-white">
                                                                    {record.user?.firstName} {record.user?.lastName}
                                                                </div>
                                                                <div className="text-xs text-gray-500">{record.user?.employeeDetails?.department || 'Employee'}</div>
                                                            </div>
                                                            <span className={cn(
                                                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium gap-1',
                                                                getStatusColor(record.status)
                                                            )}>
                                                                {record.status}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                            <div>
                                                                <span className="text-xs text-gray-500 block">Type</span>
                                                                <span className="font-medium text-gray-900 dark:text-white">{record.leaveType}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-xs text-gray-500 block">Duration</span>
                                                                <span className="font-medium text-gray-900 dark:text-white">{record.daysCount} Days</span>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <span className="text-xs text-gray-500 block">Dates</span>
                                                                <span className="text-gray-700 dark:text-gray-300">
                                                                    {format(parseISO(record.startDate), 'MMM dd')} - {format(parseISO(record.endDate), 'MMM dd, yyyy')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            )}
                        </div>
                    </>
                )}

                {/* Reports Tab Mockup */}
                {activeTab === 'reports' && (
                    <div className="space-y-6">
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Leave Reports</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Report Type</label>
                                        <select className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                            <option>Monthly Leave Summary</option>
                                            <option>Employee Leave Balances</option>
                                            <option>Department-wise Leave Report</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Period</label>
                                        <select className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                            <option>This Month</option>
                                            <option>Last Month</option>
                                            <option>This Year</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button variant="primary" leftIcon={<FileText className="w-4 h-4" />}>
                                        Generate Report
                                    </Button>
                                    <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
                                        Download CSV
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-lg p-6 text-center">
                            <p className="text-blue-800 dark:text-blue-300">Report generation feature is coming soon.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Approval / Rejection Modal */}
            <Modal
                isOpen={isActionModalOpen}
                onClose={() => setIsActionModalOpen(false)}
                title={actionType === 'Approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
                size="md"
            >
                <div className="space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <strong>Employee:</strong>
                            <span>{selectedLeave?.user?.firstName} {selectedLeave?.user?.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                            <strong>Leave Type:</strong>
                            <span>{selectedLeave?.leaveType}</span>
                        </div>
                        <div className="flex justify-between">
                            <strong>Dates:</strong>
                            <span>{selectedLeave?.startDate ? format(parseISO(selectedLeave.startDate), 'MMM dd') : ''} - {selectedLeave?.endDate ? format(parseISO(selectedLeave.endDate), 'MMM dd, yyyy') : ''}</span>
                        </div>
                        <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                            <strong>Duration:</strong>
                            <span>{selectedLeave?.daysCount} Days</span>
                        </div>
                    </div>

                    {actionType === 'Approve' ? (
                        <div className="p-3 bg-green-50 dark:bg-green-900/10 text-green-800 dark:text-green-200 text-sm rounded-lg flex gap-2">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <p>Are you sure you want to approve this leave request? The days have already been deducted from the employee's balance.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-200 text-sm rounded-lg flex gap-2">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                <p>Rejecting this request will <strong>refund {selectedLeave?.daysCount} days</strong> to the employee's {selectedLeave?.leaveType} leave balance.</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason for Rejection *</label>
                                <textarea
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    rows={3}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="e.g. Critical project deadline, Insufficient notice..."
                                    required={actionType === 'Reject'}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setIsActionModalOpen(false)}>Cancel</Button>
                        <Button
                            variant={actionType === 'Approve' ? 'success' : 'danger'}
                            onClick={confirmAction}
                            isLoading={isProcessing}
                            disabled={actionType === 'Reject' && !rejectionReason.trim()}
                        >
                            {actionType === 'Approve' ? 'Confirm Approval' : 'Reject Leave'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </Container>
    );
}
