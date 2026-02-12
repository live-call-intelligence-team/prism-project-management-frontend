'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { Calendar, Search, LogIn, LogOut, Clock, CheckCircle, MapPin, Home, Building, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { attendanceApi, AttendanceRecord } from '@/lib/api/endpoints/attendance';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export default function EmployeeAttendancePage() {
    const { success, error: showError } = useToast();
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Filters: 'week', 'month'
    const [timeRange, setTimeRange] = useState<'week' | 'month'>('month');

    // Check-In/Out State
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
    const [workLocation, setWorkLocation] = useState<'Office' | 'Home'>('Office');
    const [isProcessing, setIsProcessing] = useState(false);

    // Timer
    const [elapsedTime, setElapsedTime] = useState<string>('0h 0m');

    const fetchAttendance = useCallback(async () => {
        try {
            setIsLoading(true);
            const now = new Date();
            let startDate = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd'); // Start of month
            if (timeRange === 'week') {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                startDate = format(new Date(now.setDate(diff)), 'yyyy-MM-dd');
            }
            const endDate = format(new Date(), 'yyyy-MM-dd');

            const data = await attendanceApi.getMyAttendance(startDate, endDate);
            setAttendanceRecords(data);

            // Check if checked in today
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const foundToday = data.find(r => r.date === todayStr);
            setTodayAttendance(foundToday || null);

        } catch (err: any) {
            console.error('Failed to fetch attendance:', err);
            showError('Error', 'Failed to fetch your attendance records');
        } finally {
            setIsLoading(false);
        }
    }, [timeRange, showError]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (todayAttendance && todayAttendance.checkInTime && !todayAttendance.checkOutTime) {
            interval = setInterval(() => {
                const start = new Date(todayAttendance.checkInTime as any);
                const now = new Date();
                const diff = differenceInMinutes(now, start);
                const hours = Math.floor(diff / 60);
                const minutes = diff % 60;
                setElapsedTime(`${hours}h ${minutes}m`);
            }, 60000); // Update every minute

            // Initial set
            const start = new Date(todayAttendance.checkInTime as any);
            const now = new Date();
            const diff = differenceInMinutes(now, start);
            const hours = Math.floor(diff / 60);
            const minutes = diff % 60;
            setElapsedTime(`${hours}h ${minutes}m`);
        } else if (todayAttendance && todayAttendance.totalHours) {
            const hours = Math.floor(todayAttendance.totalHours);
            const minutes = Math.round((todayAttendance.totalHours - hours) * 60);
            setElapsedTime(`${hours}h ${minutes}m`);
        } else {
            setElapsedTime('0h 0m');
        }
        return () => clearInterval(interval);
    }, [todayAttendance]);

    const handleCheckIn = async () => {
        try {
            setIsProcessing(true);
            await attendanceApi.checkIn(workLocation);
            success('Checked In', 'You have been checked in successfully.');
            fetchAttendance();
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to check in';
            showError('Error', message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCheckOut = async () => {
        if (!confirm('Are you sure you want to check out?')) return;
        try {
            setIsProcessing(true);
            await attendanceApi.checkOut();
            success('Checked Out', 'You have been checked out successfully.');
            fetchAttendance();
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to check out';
            showError('Error', message);
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = (status: string, approvalStatus: string) => {
        if (approvalStatus === 'Pending') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">⏳ Pending Approval</span>;
        }
        if (approvalStatus === 'Rejected') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">❌ Rejected</span>;
        }
        // Approved
        if (status === 'Absent' || status === 'On Leave') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">🔴 {status}</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">✅ Approved</span>;
    };

    const todayDate = format(new Date(), 'EEEE, MMMM dd, yyyy');

    return (
        <Container size="2xl">
            <div className="space-y-8">
                {/* Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        MY ATTENDANCE
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        TODAY: {todayDate}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Clock In/Out Card */}
                    <Card className="md:h-full flex flex-col justify-between border-2 border-indigo-100 dark:border-indigo-900/30 shadow-lg">
                        <CardContent className="pt-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-indigo-500" />
                                    CLOCK IN/OUT
                                </h3>
                            </div>

                            <div className="text-center py-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Current Status</div>
                                {todayAttendance ? (
                                    todayAttendance.checkOutTime ? (
                                        <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2">
                                            <CheckCircle className="w-8 h-8 text-gray-500" />
                                            COMPLETED
                                        </div>
                                    ) : (
                                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-2 animate-pulse">
                                            <CheckCircle className="w-8 h-8" />
                                            CLOCKED IN
                                        </div>
                                    )
                                ) : (
                                    <div className="text-2xl font-bold text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-gray-400" />
                                        NOT CLOCKED IN
                                    </div>
                                )}
                            </div>

                            {/* Conditional Display */}
                            {todayAttendance ? (
                                <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs text-gray-500">Clock In Time</div>
                                            <div className="font-semibold text-gray-900 dark:text-white text-lg">
                                                {format(new Date(todayAttendance.checkInTime as any), 'hh:mm a')}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Work Duration</div>
                                            <div className="font-semibold text-indigo-600 dark:text-indigo-400 text-lg">
                                                {elapsedTime}
                                            </div>
                                        </div>
                                    </div>
                                    {!todayAttendance.checkOutTime && (
                                        <Button
                                            variant="danger"
                                            className="w-full py-6 text-lg"
                                            onClick={handleCheckOut}
                                            isLoading={isProcessing}
                                            leftIcon={<LogOut className="w-6 h-6" />}
                                        >
                                            CLOCK OUT
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            Where are you working from today? *
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                className={cn(
                                                    "flex items-center justify-center gap-2 p-3 rounded-lg border transition-all",
                                                    workLocation === 'Office'
                                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900"
                                                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                                                )}
                                                onClick={() => setWorkLocation('Office')}
                                            >
                                                <Building className="w-5 h-5" />
                                                Office
                                            </button>
                                            <button
                                                className={cn(
                                                    "flex items-center justify-center gap-2 p-3 rounded-lg border transition-all",
                                                    workLocation === 'Home'
                                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900"
                                                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                                                )}
                                                onClick={() => setWorkLocation('Home')}
                                            >
                                                <Home className="w-5 h-5" />
                                                Home (Remote)
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        variant="primary"
                                        className="w-full py-6 text-lg shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-shadow"
                                        onClick={handleCheckIn}
                                        isLoading={isProcessing}
                                        leftIcon={<LogIn className="w-6 h-6" />}
                                    >
                                        CLOCK IN
                                    </Button>
                                </div>
                            )}

                        </CardContent>
                    </Card>

                    {/* Today's Summary Card */}
                    <Card className="md:h-full">
                        <CardContent className="pt-6 h-full flex flex-col">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-6 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                TODAY'S SUMMARY
                            </h3>

                            <div className="flex-1 space-y-6">
                                <div className="grid grid-cols-2 gap-y-6">
                                    <div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Clock In</div>
                                        <div className="font-medium text-gray-900 dark:text-white text-lg">
                                            {todayAttendance?.checkInTime ? format(new Date(todayAttendance.checkInTime as any), 'hh:mm a') : '--:--'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Clock Out</div>
                                        <div className="font-medium text-gray-900 dark:text-white text-lg">
                                            {todayAttendance?.checkOutTime ? format(new Date(todayAttendance.checkOutTime as any), 'hh:mm a') : '--:--'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Duration</div>
                                        <div className="font-medium text-gray-900 dark:text-white text-lg">
                                            {elapsedTime}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Location</div>
                                        <div className="font-medium text-gray-900 dark:text-white text-lg flex items-center gap-1">
                                            {todayAttendance?.workLocation ? (
                                                <>
                                                    {todayAttendance.workLocation === 'Office' ? <Building className="w-4 h-4 text-gray-400" /> : <Home className="w-4 h-4 text-gray-400" />}
                                                    {todayAttendance.workLocation}
                                                </>
                                            ) : '-'}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Status</div>
                                    <div className="text-xl">
                                        {todayAttendance ?
                                            getStatusBadge(todayAttendance.status, todayAttendance.approvalStatus)
                                            : <span className="text-gray-400">No Activity</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* History Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">ATTENDANCE HISTORY</h2>
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                            <button
                                onClick={() => setTimeRange('week')}
                                className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", timeRange === 'week' ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}
                            >
                                This Week
                            </button>
                            <button
                                onClick={() => setTimeRange('month')}
                                className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", timeRange === 'month' ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}
                            >
                                This Month
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="text-center py-10 text-gray-500">Loading attendance history...</div>
                        ) : attendanceRecords.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl">No attendance records found for this period.</div>
                        ) : (
                            attendanceRecords.map((record) => (
                                <Card key={record.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-5">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            {/* Date & Location */}
                                            <div className="min-w-[200px]">
                                                <div className="font-semibold text-lg text-gray-900 dark:text-white">
                                                    {format(new Date(record.date), 'MMM dd, yyyy')} <span className="text-gray-500 text-sm font-normal">({format(new Date(record.date), 'EEE')})</span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {record.workLocation || 'Office'}
                                                    </span>
                                                    {record.rejectionReason && (
                                                        <span className="text-red-500 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {record.rejectionReason}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Times */}
                                            <div className="flex items-center gap-6 text-sm flex-1">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500 text-xs uppercase">Clock In</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {record.checkInTime ? format(new Date(record.checkInTime as any), 'hh:mm a') : '-'}
                                                    </span>
                                                </div>
                                                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500 text-xs uppercase">Clock Out</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {record.checkOutTime ? format(new Date(record.checkOutTime as any), 'hh:mm a') : '-'}
                                                    </span>
                                                </div>
                                                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500 text-xs uppercase">Duration</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {record.totalHours ? `${Math.floor(record.totalHours)}h ${Math.round((record.totalHours - Math.floor(record.totalHours)) * 60)}m` : '-'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div>
                                                {getStatusBadge(record.status, record.approvalStatus)}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Container>
    );
}
