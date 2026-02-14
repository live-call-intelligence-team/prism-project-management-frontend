'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar, Search, User, CheckCircle, XCircle, Clock, FileText, Download, Mail, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { attendanceApi, AttendanceRecord } from '@/lib/api/endpoints/attendance';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/Modal';

export default function AdminAttendancePage() {
    const { success, error: showError } = useToast();
    const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'reports'>('pending');
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    // Action Modal
    const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'Approve' | 'Reject' | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchAttendance = useCallback(async () => {
        try {
            setIsLoading(true);
            const approvalStatus = activeTab === 'pending' ? 'Pending' : undefined;
            // For 'all' tab, we might want to fetch everything, for 'pending' only pending.
            const data = await attendanceApi.getAllAttendance(dateFilter || undefined, approvalStatus);
            setAttendanceRecords(data);
        } catch (err: any) {
            console.error('Failed to fetch attendance:', err);
            showError('Error', 'Failed to fetch attendance records');
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, dateFilter, showError]);

    useEffect(() => {
        if (activeTab !== 'reports') {
            fetchAttendance();
        }
    }, [fetchAttendance, activeTab]);

    const handleActionClick = (record: AttendanceRecord, type: 'Approve' | 'Reject') => {
        if (type === 'Approve' && !confirm(`Approve attendance for ${record.user?.firstName} on ${format(new Date(record.date), 'MMM dd')}?`)) {
            return;
        }

        if (type === 'Approve') {
            confirmAction(record, 'Approve');
        } else {
            setSelectedAttendance(record);
            setActionType('Reject');
            setRejectionReason('');
            setIsActionModalOpen(true);
        }
    };

    const confirmAction = async (record: AttendanceRecord | null, type: 'Approve' | 'Reject') => {
        const targetRecord = record || selectedAttendance;
        if (!targetRecord) return;

        try {
            setIsProcessing(true);
            await attendanceApi.updateStatus(
                targetRecord.id,
                type === 'Approve' ? 'Approved' : 'Rejected',
                type === 'Reject' ? rejectionReason : undefined
            );
            success('Success', `Attendance ${type === 'Approve' ? 'approved' : 'rejected'} successfully`);
            fetchAttendance();
            setIsActionModalOpen(false);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to update status';
            showError('Error', message);
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredRecords = attendanceRecords.filter(record =>
        record.user?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.user?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string, approvalStatus: string) => {
        if (approvalStatus === 'Pending') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        if (approvalStatus === 'Rejected') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';

        switch (status) {
            case 'Present': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'Absent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'Half Day': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
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
                            Attendance Management
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Monitor and approve employee attendance
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
                        {/* We could add a badge count here if we fetched the count separately */}
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
                        All Attendance
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
                                    placeholder="Search employee..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    leftIcon={<Search className="w-5 h-5" />}
                                />
                            </div>
                            <div className="w-full md:w-auto">
                                <Input
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                />
                            </div>
                            <Button variant="secondary" onClick={fetchAttendance} leftIcon={<Filter className="w-4 h-4" />}>
                                Apply Filter
                            </Button>
                        </div>

                        {/* List / Table */}
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="text-center py-10 text-gray-500">Loading attendance records...</div>
                            ) : filteredRecords.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    No {activeTab} records found.
                                </div>
                            ) : (
                                activeTab === 'pending' ? (
                                    // Pending View (Cards)
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                        {filteredRecords.map((record) => (
                                            <Card key={record.id} className="border border-indigo-100 dark:border-indigo-900/30">
                                                <CardContent className="p-5">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                                <User className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                                    {record.user?.firstName} {record.user?.lastName}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {record.user?.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                            {record.date === format(new Date(), 'yyyy-MM-dd') ? 'Today' : format(new Date(record.date), 'MMM dd')}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 mb-4">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-500">Clock In</span>
                                                            <span className="font-medium text-gray-900 dark:text-white">{record.checkInTime ? format(new Date(record.checkInTime), 'hh:mm a') : '-'}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-500">Clock Out</span>
                                                            <span className="font-medium text-gray-900 dark:text-white">{record.checkOutTime ? format(new Date(record.checkOutTime), 'hh:mm a') : 'Working'}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-500">Duration</span>
                                                            <span className="font-medium text-gray-900 dark:text-white">{record.totalHours ? `${record.totalHours} hrs` : '-'}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-500">Location</span>
                                                            <span className="font-medium text-gray-900 dark:text-white">{record.workLocation || 'Office'}</span>
                                                        </div>
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
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Clock In</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Clock Out</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dur.</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                                        {filteredRecords.map((record) => (
                                                            <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                                <td className="px-6 py-4">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {record.user?.firstName} {record.user?.lastName}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">{record.user?.email}</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                                    {format(new Date(record.date), 'MMM dd')}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                                    {record.checkInTime ? format(new Date(record.checkInTime), 'hh:mm a') : '-'}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                                    {record.checkOutTime ? format(new Date(record.checkOutTime), 'hh:mm a') : '-'}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                                    {record.totalHours ? `${record.totalHours}h` : '-'}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={cn(
                                                                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1',
                                                                        getStatusColor(record.status, record.approvalStatus)
                                                                    )}>
                                                                        {record.approvalStatus === 'Pending' && <Clock className="w-3 h-3" />}
                                                                        {record.approvalStatus === 'Approved' && <CheckCircle className="w-3 h-3" />}
                                                                        {record.approvalStatus === 'Rejected' && <XCircle className="w-3 h-3" />}
                                                                        {record.approvalStatus === 'Pending' ? 'Pending' : (
                                                                            record.approvalStatus === 'Rejected' ? 'Rejected' : record.status
                                                                        )}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobile Card List */}
                                            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                                                {filteredRecords.map((record) => (
                                                    <div key={record.id} className="p-4 space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-white">
                                                                    {record.user?.firstName} {record.user?.lastName}
                                                                </div>
                                                                <div className="text-xs text-gray-500">{format(new Date(record.date), 'MMM dd, yyyy')}</div>
                                                            </div>
                                                            <span className={cn(
                                                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium gap-1',
                                                                getStatusColor(record.status, record.approvalStatus)
                                                            )}>
                                                                {record.approvalStatus === 'Pending' ? 'Pending' : (
                                                                    record.approvalStatus === 'Rejected' ? 'Rejected' : record.status
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                            <div>
                                                                <span className="block text-gray-500">In</span>
                                                                <span className="font-medium">{record.checkInTime ? format(new Date(record.checkInTime), 'hh:mm a') : '-'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="block text-gray-500">Out</span>
                                                                <span className="font-medium">{record.checkOutTime ? format(new Date(record.checkOutTime), 'hh:mm a') : '-'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="block text-gray-500">Hrs</span>
                                                                <span className="font-medium">{record.totalHours || '-'}</span>
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
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance Reports</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Report Type</label>
                                        <select className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                            <option>Monthly Attendance Report</option>
                                            <option>Daily Attendance Report</option>
                                            <option>Department-wise Report</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Month</label>
                                        <input type="month" className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" defaultValue="2024-12" />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button variant="primary" leftIcon={<FileText className="w-4 h-4" />}>
                                        Generate Report
                                    </Button>
                                    <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
                                        Download PDF
                                    </Button>
                                    <Button variant="secondary" leftIcon={<Mail className="w-4 h-4" />}>
                                        Email Report
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Mock Report Preview */}
                        <Card className="border-t-4 border-t-indigo-500">
                            <CardContent className="p-8 space-y-6">
                                <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">MONTHLY ATTENDANCE SUMMARY</h2>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">December 2024</p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">22</div>
                                        <div className="text-xs text-gray-500 uppercase mt-1">Working Days</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">45</div>
                                        <div className="text-xs text-gray-500 uppercase mt-1">Total Employees</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">92%</div>
                                        <div className="text-xs text-gray-500 uppercase mt-1">Avg Attendance</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">15</div>
                                        <div className="text-xs text-gray-500 uppercase mt-1">Pending Requests</div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Department Breakdown</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                            <span>Engineering</span>
                                            <span className="font-medium">95% Present</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                            <span>Design</span>
                                            <span className="font-medium">88% Present</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                            <span>QA</span>
                                            <span className="font-medium">90% Present</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            <Modal
                isOpen={isActionModalOpen}
                onClose={() => setIsActionModalOpen(false)}
                title="Reject Attendance"
                size="md"
            >
                <div className="space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex flex-col gap-1">
                        <div><strong>Employee:</strong> {selectedAttendance?.user?.firstName} {selectedAttendance?.user?.lastName}</div>
                        <div><strong>Date:</strong> {selectedAttendance?.date ? format(new Date(selectedAttendance.date), 'MMM dd, yyyy') : ''}</div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason for Rejection *</label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            rows={3}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Please provide reason..."
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setIsActionModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="danger"
                            onClick={() => confirmAction(null, 'Reject')}
                            isLoading={isProcessing}
                            disabled={!rejectionReason.trim()}
                        >
                            Reject Attendance
                        </Button>
                    </div>
                </div>
            </Modal>
        </Container>
    );
}
