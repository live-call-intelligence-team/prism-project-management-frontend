'use client';

import { useState, useEffect } from 'react';
import { auditLogsApi, AuditLog } from '@/lib/api/endpoints/auditLogs';
import { Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Container from '@/components/ui/Container';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils'; // Keep assuming cn exists

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchLogs = async () => {
        try {
            setIsLoading(true);
            const data = await auditLogsApi.getAll({
                page,
                limit: 15,
                search,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            });

            setLogs(data.logs);
            setTotalPages(data.pagination.pages);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            toast.error('Failed to load audit logs');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchLogs();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [page, search, startDate, endDate]);

    return (
        <Container size="2xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            System Audit Logs
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Track system activities and security events.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        leftIcon={<RefreshCw className="w-5 h-5" />}
                        onClick={fetchLogs}
                        isLoading={isLoading}
                    >
                        Refresh
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <Input
                                    label="Search"
                                    placeholder="Search resource, IP, user..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    leftIcon={<Search className="w-5 h-5" />}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="pb-0.5">
                                <Button
                                    variant="secondary"
                                    onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setPage(1); }}
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resource</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                Loading logs...
                                            </td>
                                        </tr>
                                    ) : logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                No logs found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-xs ring-2 ring-white dark:ring-gray-900">
                                                            {(log.user?.firstName?.[0] || 'U') + (log.user?.lastName?.[0] || '')}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System / Unknown'}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{log.user?.role}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={cn(
                                                        "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                                                        log.action.includes('DELETE') ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/50" :
                                                            log.action.includes('CREATE') ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900/50" :
                                                                log.action.includes('UPDATE') ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-900/50" :
                                                                    "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                                                    )}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="font-medium text-gray-900 dark:text-white">{log.resource}</div>
                                                    {log.ipAddress && <div className="text-xs text-gray-400 font-mono mt-0.5">IP: {log.ipAddress}</div>}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <pre className="text-[10px] bg-gray-50 dark:bg-gray-950 p-2 rounded border border-gray-200 dark:border-gray-800 max-w-[250px] overflow-x-auto font-mono">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <Button
                                    variant="secondary"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    size="sm"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    size="sm"
                                >
                                    Next
                                </Button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700 dark:text-gray-400">
                                        Page <span className="font-medium text-gray-900 dark:text-white">{page}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        leftIcon={<ChevronLeft className="w-4 h-4" />}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        rightIcon={<ChevronRight className="w-4 h-4" />}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
}
