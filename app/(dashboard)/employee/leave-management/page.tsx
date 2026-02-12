'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { Calendar, PlusCircle, Clock, CheckCircle, XCircle, FileText, ChevronDown, Phone, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { leaveApi, LeaveRequest, LeaveBalances } from '@/lib/api/endpoints/leaves';
import { cn } from '@/lib/utils';

export default function EmployeeLeavePage() {
    const { success, error: showError } = useToast();
    const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [balances, setBalances] = useState<LeaveBalances | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Form State
    const [leaveType, setLeaveType] = useState<'Annual' | 'Sick' | 'Casual' | 'Other'>('Annual');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [daysCount, setDaysCount] = useState(0);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [leavesData, balancesData] = await Promise.all([
                leaveApi.getMyLeaves(1, 50, activeTab === 'All' ? undefined : activeTab),
                leaveApi.getMyBalances()
            ]);
            setLeaves(leavesData.leaves);
            setBalances(balancesData);
        } catch (err: any) {
            console.error('Failed to fetch leave data:', err);
            showError('Error', 'Failed to fetch leave data');
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, showError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Calculate days when dates change
    useEffect(() => {
        if (startDate && endDate) {
            const start = parseISO(startDate);
            const end = parseISO(endDate);
            if (end >= start) {
                // inclusive difference + 1
                const diff = differenceInDays(end, start) + 1;
                setDaysCount(diff);
            } else {
                setDaysCount(0);
            }
        } else {
            setDaysCount(0);
        }
    }, [startDate, endDate]);

    const handleApplyLeave = async () => {
        if (!startDate || !endDate || !reason) {
            showError('Validation Error', 'Please fill all required fields');
            return;
        }

        if (reason.length < 10) {
            showError('Validation Error', 'Reason must be at least 10 characters');
            return;
        }

        if (daysCount <= 0) {
            showError('Validation Error', 'Invalid date range');
            return;
        }

        // Client-side balance check (optional, but good UX)
        if (balances) {
            const currentBalance = balances[leaveType.toLowerCase() as keyof LeaveBalances];
            if (currentBalance < daysCount) {
                showError('Insufficient Balance', `You only have ${currentBalance} days of ${leaveType} leave available.`);
                return;
            }
        }

        try {
            setIsProcessing(true);
            await leaveApi.applyLeave({
                leaveType,
                startDate,
                endDate,
                daysCount,
                reason,
                contactNumber
            });
            success('Success', 'Leave request submitted successfully');
            setIsApplyModalOpen(false);
            // Reset form
            setStartDate('');
            setEndDate('');
            setReason('');
            setContactNumber('');
            fetchData();
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to apply for leave';
            showError('Error', message);
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <Container size="2xl">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">MY LEAVE MANAGEMENT</h1>
                        <p className="text-gray-600 dark:text-gray-400">Track balance and manage requests</p>
                    </div>
                </div>

                {/* Balances */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">LEAVE BALANCE</h3>
                    {balances ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Annual', icon: '📅', value: balances.annual, total: 20, color: 'text-indigo-600' },
                                { label: 'Sick', icon: '🤒', value: balances.sick, total: 10, color: 'text-pink-600' },
                                { label: 'Casual', icon: '☕', value: balances.casual, total: 5, color: 'text-orange-600' },
                                { label: 'Other', icon: '📋', value: balances.other, total: 5, color: 'text-blue-600' },
                            ].map((item) => (
                                <Card key={item.label} className="border border-gray-200 dark:border-gray-800">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                                        <div className="text-2xl mb-2">{item.icon}</div>
                                        <div className="text-sm font-medium text-gray-500 mb-1">{item.label}</div>
                                        <div className={cn("text-2xl font-bold", item.color)}>
                                            {item.value}/{item.total}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">Available</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-4 animate-pulse">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>)}
                        </div>
                    )}
                </div>

                <Button
                    variant="primary"
                    className="w-full md:w-auto"
                    onClick={() => setIsApplyModalOpen(true)}
                    leftIcon={<PlusCircle className="w-5 h-5" />}
                >
                    Apply for Leave
                </Button>

                {/* Requests List */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">MY LEAVE REQUESTS</h3>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {['All', 'Pending', 'Approved', 'Rejected'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                                    activeTab === tab
                                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                                )}
                            >
                                {tab} {tab === 'Pending' && leaves.filter(l => l.status === 'Pending').length > 0 && `(${leaves.filter(l => l.status === 'Pending').length})`}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="text-center py-10 text-gray-500">Loading requests...</div>
                        ) : leaves.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-500">No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} leave requests found.</p>
                            </div>
                        ) : (
                            leaves.map(leave => (
                                <Card key={leave.id} className="border border-gray-200 dark:border-gray-800 hover:border-indigo-300 transition-colors">
                                    <CardContent className="p-5">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-gray-900 dark:text-white text-lg">{leave.leaveType} Leave</span>
                                                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", getStatusBadge(leave.status))}>
                                                        {leave.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                                                        {leave.status === 'Approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                        {leave.status === 'Rejected' && <XCircle className="w-3 h-3 mr-1" />}
                                                        {leave.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="text-gray-600 dark:text-gray-300">
                                                    {format(parseISO(leave.startDate), 'MMM dd, yyyy')} - {format(parseISO(leave.endDate), 'MMM dd, yyyy')}
                                                    <span className="ml-2 font-medium text-gray-900 dark:text-white">({leave.daysCount} days)</span>
                                                </div>
                                                <p className="text-sm text-gray-500 italic">" {leave.reason} "</p>
                                                <div className="text-xs text-gray-400 pt-2">
                                                    Applied on: {leave.createdAt ? format(parseISO(leave.createdAt), 'MMM dd, yyyy') : '-'}
                                                </div>
                                            </div>

                                            {leave.status === 'Rejected' && leave.rejectionReason && (
                                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30 max-w-md">
                                                    <div className="text-xs font-bold text-red-800 dark:text-red-300 uppercase mb-1">Rejection Reason</div>
                                                    <p className="text-sm text-red-700 dark:text-red-400">{leave.rejectionReason}</p>
                                                    <div className="text-xs text-red-500 mt-2">Rejected by Admin</div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Apply Leave Modal */}
            <Modal
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                title="Apply for Leave"
                size="md"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Leave Type *</label>
                        <div className="relative">
                            <select
                                className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm"
                                value={leaveType}
                                onChange={(e) => setLeaveType(e.target.value as any)}
                            >
                                <option value="Annual">Annual Leave ({balances?.annual || 0} days)</option>
                                <option value="Sick">Sick Leave ({balances?.sick || 0} days)</option>
                                <option value="Casual">Casual Leave ({balances?.casual || 0} days)</option>
                                <option value="Other">Other Leave ({balances?.other || 0} days)</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date *</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                min={format(new Date(), 'yyyy-MM-dd')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date *</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate || format(new Date(), 'yyyy-MM-dd')}
                            />
                        </div>
                    </div>

                    {daysCount > 0 && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg flex items-center justify-between">
                            <span className="text-indigo-700 dark:text-indigo-300 text-sm font-medium">Total Duration:</span>
                            <span className="text-indigo-800 dark:text-indigo-200 font-bold">{daysCount} Days</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason * <span className="text-xs font-normal text-gray-500">(Min 10 chars)</span></label>
                        <textarea
                            rows={3}
                            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="I need leave because..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact During Leave (Optional)</label>
                        <Input
                            placeholder="+91 9876543210"
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            leftIcon={<Phone className="w-4 h-4" />}
                        />
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg flex gap-3 text-xs text-yellow-800 dark:text-yellow-200 border border-yellow-100 dark:border-yellow-900/30">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p>Note: Leave request will be deducted from your balance immediately. If rejected, the balance will be refunded.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setIsApplyModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={handleApplyLeave}
                            isLoading={isProcessing}
                        >
                            Submit Application
                        </Button>
                    </div>
                </div>
            </Modal>
        </Container>
    );
}
