'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { dailyReportsApi, DailyReport, DailyReportEntry, DailyReportComment } from '@/lib/api/endpoints/dailyReports';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';
import {
    Clock, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Users, Send,
    Search, TrendingUp, Eye, Bell, Award, MessageSquare, Calendar, X,
    Filter, BarChart3, Grid3X3, List, ArrowUpDown, Download, RefreshCw,
    Flame, Timer, Activity, ChevronLeft, ChevronRight, UserCheck, UserX,
    ShieldAlert, ChevronLast, ChevronFirst, Sun, Moon, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DailyReportChat } from './DailyReportChat';

interface AdminDailyTrackerProps { projectId: string; }

// Unified employee with report data
interface EmployeeRow {
    id: string; firstName: string; lastName: string; email: string; role: string;
    avatar?: string; memberRole?: string;
    report?: DailyReport;
    status: 'SUBMITTED' | 'NOT SUBMITTED' | 'PENDING';
}

type ViewMode = 'list' | 'grid';
type StatusFilter = 'all' | 'submitted' | 'not_submitted' | 'pending';
type SortField = 'name' | 'team' | 'status' | 'mrg' | 'blockers' | 'hours';

export default function AdminDailyTracker({ projectId }: AdminDailyTrackerProps) {
    const currentUser = useAuthStore(state => state.user);
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [missingMembers, setMissingMembers] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalMembers: 0, submitted: 0, totalHours: 0, openBlockers: 0 });
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0] || '');
    const [commentText, setCommentText] = useState<Record<string, string>>({});
    const [sendingComment, setSendingComment] = useState<Record<string, boolean>>({});
    const [sendingReminder, setSendingReminder] = useState<Record<string, boolean>>({});
    const [projectMembers, setProjectMembers] = useState<any[]>([]);

    // Advanced filters
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [teamFilter, setTeamFilter] = useState<string>('all');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortAsc, setSortAsc] = useState(true);
    const [sendingBulkReminder, setSendingBulkReminder] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => { loadData(); }, [projectId, date]);
    useEffect(() => { loadMembers(); }, [projectId]);

    const loadData = async () => {
        try {
            setLoading(true);
            console.log(`[DailyTracker FE] Loading reports for project ${projectId}, date ${date}`);
            const data = await dailyReportsApi.getProjectReports(projectId, date);
            console.log(`[DailyTracker FE] API response:`, { reports: data.reports?.length, missingMembers: data.missingMembers?.length, stats: data.stats });
            setReports(data.reports || []);
            setMissingMembers(data.missingMembers || []);
            setStats(data.stats || { totalMembers: 0, submitted: 0, totalHours: 0, openBlockers: 0 });
            setLastUpdated(new Date());
        } catch (e: any) {
            console.error('[DailyTracker FE] Failed to load reports:', e?.message || e);
            console.error('[DailyTracker FE] Error details:', e?.response?.status, e?.response?.data);
        }
        finally { setLoading(false); }
    };

    const loadMembers = async () => {
        try {
            const data = await projectsApi.getMembers(projectId);
            setProjectMembers((data || []).map((m: any) => ({ ...(m.user || m), memberRole: m.role })));
        } catch { setProjectMembers([]); }
    };

    // Build unified employee list
    const allEmployees: EmployeeRow[] = useMemo(() => {
        const rows: EmployeeRow[] = [];
        const seenIds = new Set<string>();

        // Submitted employees
        reports.forEach(r => {
            if (r.user) {
                seenIds.add(r.userId);
                const projectMember = projectMembers.find(m => m.id === r.userId);
                let roleStr = projectMember?.memberRole || r.user.role || 'Member';

                // Determine Status
                let status: 'SUBMITTED' | 'PENDING' = 'PENDING';
                if (r.standupSubmitted && r.summarySubmitted) status = 'SUBMITTED';
                else if (r.standupSubmitted || (r.entries && r.entries.length > 0)) status = 'PENDING';

                rows.push({
                    id: r.userId,
                    firstName: r.user.firstName,
                    lastName: r.user.lastName,
                    email: r.user.email,
                    role: r.user.role,
                    avatar: r.user.avatar,
                    memberRole: roleStr,
                    report: r,
                    status
                });
            }
        });

        // Missing employees
        missingMembers.forEach(m => {
            if (!seenIds.has(m.id)) {
                seenIds.add(m.id);
                // Also try to find in project members, or rely on the backend pre-populated memberRole
                const projectMember = projectMembers.find(pm => pm.id === m.id);
                let roleStr = projectMember?.memberRole || m.memberRole || m.role || 'Member';

                rows.push({
                    id: m.id,
                    firstName: m.firstName,
                    lastName: m.lastName,
                    email: m.email,
                    role: m.role,
                    avatar: m.avatar,
                    memberRole: roleStr,
                    report: undefined,
                    status: 'NOT SUBMITTED'
                });
            }
        });

        return rows;
    }, [reports, missingMembers, projectMembers]);

    // Get unique teams for filter
    const teams = useMemo(() => {
        const t = new Set(allEmployees.map(e => e.memberRole).filter(Boolean));
        return Array.from(t);
    }, [allEmployees]);

    // Filter and sort
    const filteredEmployees = useMemo(() => {
        let rows = [...allEmployees];

        // Search
        if (search) {
            const s = search.toLowerCase();
            rows = rows.filter(r => `${r.firstName} ${r.lastName}`.toLowerCase().includes(s) || r.email?.toLowerCase().includes(s));
        }

        // Status filter
        if (statusFilter === 'submitted') rows = rows.filter(r => r.status === 'SUBMITTED');
        else if (statusFilter === 'not_submitted') rows = rows.filter(r => r.status === 'NOT SUBMITTED');
        else if (statusFilter === 'pending') rows = rows.filter(r => r.status === 'PENDING');

        // Team filter
        if (teamFilter && teamFilter !== 'all') {
            rows = rows.filter(r => r.memberRole === teamFilter);
        }

        // Sort
        rows.sort((a, b) => {
            let cmp = 0;
            const aHours = (a.report?.entries || []).filter(e => e.type === 'work').reduce((s, e) => s + Number(e.hours), 0);
            const bHours = (b.report?.entries || []).filter(e => e.type === 'work').reduce((s, e) => s + Number(e.hours), 0);
            const aBlockers = (a.report?.entries || []).filter(e => e.type === 'blocker' && e.blockerStatus === 'OPEN').length;
            const bBlockers = (b.report?.entries || []).filter(e => e.type === 'blocker' && e.blockerStatus === 'OPEN').length;
            const aMrg = a.status === 'SUBMITTED' ? 2 : a.status === 'PENDING' ? 1 : 0;
            const bMrg = b.status === 'SUBMITTED' ? 2 : b.status === 'PENDING' ? 1 : 0;

            if (sortField === 'name') cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
            else if (sortField === 'team') cmp = (a.memberRole || '').localeCompare(b.memberRole || '');
            else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
            else if (sortField === 'hours') cmp = aHours - bHours;
            else if (sortField === 'blockers') cmp = aBlockers - bBlockers;
            else if (sortField === 'mrg') cmp = aMrg - bMrg;

            return sortAsc ? cmp : -cmp;
        });

        return rows;
    }, [allEmployees, search, statusFilter, teamFilter, sortField, sortAsc]);

    // Pagination
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [search, statusFilter, teamFilter, itemsPerPage]);

    const toggleExpand = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    };

    const handleComment = async (reportId: string) => {
        const text = commentText[reportId]?.trim();
        if (!text) return;
        setSendingComment(prev => ({ ...prev, [reportId]: true }));
        try {
            const mentionRegex = /@(\w+)/g;
            const mentionNames = [...text.matchAll(mentionRegex)].map(m => m[1]);
            const mentionIds = projectMembers.filter(m => mentionNames.some(name => m.firstName?.toLowerCase() === name.toLowerCase())).map(m => m.id);
            await dailyReportsApi.addComment(reportId, { content: text, mentions: mentionIds });
            setCommentText(prev => ({ ...prev, [reportId]: '' }));
            await loadData();
        } catch (e) { console.error(e); }
        finally { setSendingComment(prev => ({ ...prev, [reportId]: false })); }
    };

    const handleReminder = async (userId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSendingReminder(prev => ({ ...prev, [userId]: true }));
        try { await dailyReportsApi.sendReminder('project', { targetUserId: userId }); } catch { }
        finally { setSendingReminder(prev => ({ ...prev, [userId]: false })); }
    };

    const handleBulkRemind = async () => {
        setSendingBulkReminder(true);
        try {
            const missing = allEmployees.filter(e => e.status === 'NOT SUBMITTED');
            for (const m of missing) {
                try { await dailyReportsApi.sendReminder('project', { targetUserId: m.id }); } catch { }
            }
        } catch { }
        finally { setSendingBulkReminder(false); }
    };

    const handleResolveBlocker = async (entryId: string) => { try { await dailyReportsApi.resolveBlocker(entryId); await loadData(); } catch { } };

    const getEmployeeData = (emp: EmployeeRow) => {
        const work = (emp.report?.entries || []).filter(e => e.type === 'work');
        const blockers = (emp.report?.entries || []).filter(e => e.type === 'blocker');
        return {
            hours: work.reduce((s, e) => s + Number(e.hours), 0),
            tasksDone: work.filter(e => e.progress >= 100).length,
            tasksActive: work.filter(e => e.progress > 0 && e.progress < 100).length,
            openBlockers: blockers.filter(b => b.blockerStatus === 'OPEN').length,
            totalBlockers: blockers.length,
            totalEntries: work.length,
            work, blockers,
        };
    };

    const healthPct = stats.totalMembers > 0 ? Math.round((stats.submitted / stats.totalMembers) * 100) : 0;
    const now = new Date();
    const isToday = date === (now.toISOString().split('T')[0] || '');

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30 inline-block ml-1" />;
        return sortAsc ? <ChevronUp className="w-3 h-3 inline-block ml-1 text-primary-500" /> : <ChevronDown className="w-3 h-3 inline-block ml-1 text-primary-500" />;
    };

    return (
        <div className="space-y-5">
            {/* === HEADER & DATE SELECTOR === */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        Admin Daily Tracker
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 ml-[52px]">Real-time team performance & daily updates</p>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-900/60 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1.5 border border-white/[0.06]">
                    <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().split('T')[0] || ''); }} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="text-sm px-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500/40" />
                    <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().split('T')[0] || ''); }} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"><ChevronRight className="w-4 h-4" /></button>
                </div>
            </div>

            {/* === TOP METRICS === */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: 'SUBMISSIONS', value: `${stats.submitted}/${stats.totalMembers}`, gradient: 'from-indigo-500/10 to-violet-500/5', border: 'border-indigo-500/20', iconBg: 'bg-indigo-500/15', iconColor: 'text-indigo-400', valueColor: 'text-indigo-400', icon: <UserCheck className="w-4 h-4" /> },
                    { label: 'TOTAL HOURS', value: `${stats.totalHours}h`, gradient: 'from-blue-500/10 to-cyan-500/5', border: 'border-blue-500/20', iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400', valueColor: 'text-blue-400', icon: <Timer className="w-4 h-4" /> },
                    { label: 'COMPLETED', value: reports.filter(r => r.summarySubmitted).length, gradient: 'from-emerald-500/10 to-green-500/5', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', valueColor: 'text-emerald-400', icon: <CheckCircle className="w-4 h-4" /> },
                    { label: 'BLOCKERS', value: stats.openBlockers, gradient: stats.openBlockers > 0 ? 'from-red-500/10 to-rose-500/5' : 'from-gray-500/5 to-gray-500/5', border: stats.openBlockers > 0 ? 'border-red-500/20' : 'border-gray-500/10', iconBg: stats.openBlockers > 0 ? 'bg-red-500/15' : 'bg-gray-500/10', iconColor: stats.openBlockers > 0 ? 'text-red-400' : 'text-gray-500', valueColor: stats.openBlockers > 0 ? 'text-red-400' : 'text-gray-500', icon: <ShieldAlert className="w-4 h-4" /> },
                    { label: 'MISSING', value: missingMembers.length, gradient: missingMembers.length > 0 ? 'from-amber-500/10 to-orange-500/5' : 'from-emerald-500/10 to-green-500/5', border: missingMembers.length > 0 ? 'border-amber-500/20' : 'border-emerald-500/20', iconBg: missingMembers.length > 0 ? 'bg-amber-500/15' : 'bg-emerald-500/15', iconColor: missingMembers.length > 0 ? 'text-amber-400' : 'text-emerald-400', valueColor: missingMembers.length > 0 ? 'text-amber-400' : 'text-emerald-400', icon: <AlertTriangle className="w-4 h-4" /> },
                ].map((s, i) => (
                    <div key={i} className={cn("relative overflow-hidden rounded-2xl border p-4 bg-gradient-to-br backdrop-blur-sm", s.gradient, s.border)}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{s.label}</p>
                            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", s.iconBg)}>
                                <span className={s.iconColor}>{s.icon}</span>
                            </div>
                        </div>
                        <p className={cn("text-3xl font-bold tracking-tight", s.valueColor)}>{String(s.value)}</p>
                    </div>
                ))}
            </div>
            {lastUpdated && <p className="text-right text-[10px] text-gray-500 italic -mt-2">Updated: {lastUpdated.toLocaleTimeString()}</p>}

            {/* === TEAM HEALTH === */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gray-900/50 dark:bg-gray-900/60 backdrop-blur-sm p-5">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center"><Activity className="w-3.5 h-3.5 text-indigo-400" /></div>
                        Team Health Overview
                    </h3>
                    <span className={cn("text-[11px] font-bold px-3 py-1.5 rounded-full ring-1",
                        healthPct >= 80 ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' :
                            healthPct >= 50 ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20' :
                                'bg-red-500/10 text-red-400 ring-red-500/20'
                    )}>{healthPct >= 80 ? 'Excellent' : healthPct >= 50 ? 'Moderate' : 'Critical'} · {healthPct}%</span>
                </div>
                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden flex relative z-10 ring-1 ring-white/[0.04]">
                    {reports.filter(r => r.status === 'excellent').length > 0 && <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all cursor-help" style={{ width: `${(reports.filter(r => r.status === 'excellent').length / Math.max(stats.totalMembers, 1)) * 100}%` }} title="Excellent" />}
                    {reports.filter(r => r.status === 'good').length > 0 && <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all cursor-help" style={{ width: `${(reports.filter(r => r.status === 'good').length / Math.max(stats.totalMembers, 1)) * 100}%` }} title="Good" />}
                    {reports.filter(r => r.status === 'at-risk').length > 0 && <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all cursor-help" style={{ width: `${(reports.filter(r => r.status === 'at-risk').length / Math.max(stats.totalMembers, 1)) * 100}%` }} title="At Risk" />}
                    {missingMembers.length > 0 && <div className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all cursor-help" style={{ width: `${(missingMembers.length / Math.max(stats.totalMembers, 1)) * 100}%` }} title="Missing" />}
                </div>
                <div className="flex items-center gap-6 mt-3.5 text-[11px] text-gray-400 justify-center relative z-10">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" /> Excellent</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30" /> Good</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/30" /> At Risk</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/30" /> Missing</span>
                </div>
            </div>

            {/* === FILTERS & CONTROLS === */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-gray-900/40 dark:bg-gray-900/50 backdrop-blur-sm p-3 rounded-2xl border border-white/[0.06]">
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                    {/* Team Filter */}
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center"><Filter className="w-3.5 h-3.5 text-gray-400" /></div>
                        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} className="text-sm px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl min-w-[120px] text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/30">
                            <option value="all">All Teams</option>
                            {teams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)} className="text-sm px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl min-w-[120px] text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/30">
                        <option value="all">All Statuses</option>
                        <option value="submitted">✅ Submitted</option>
                        <option value="not_submitted">❌ Not Submitted</option>
                        <option value="pending">⏳ Pending</option>
                    </select>

                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Name or Email..." className="w-full pl-9 pr-3 py-2 text-sm border border-white/[0.08] rounded-xl bg-white/[0.05] text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30" />
                    </div>
                </div>

                <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
                    {missingMembers.length > 0 && (
                        <button onClick={handleBulkRemind} disabled={sendingBulkReminder} className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 hover:from-red-400 hover:to-rose-500 disabled:opacity-50 transition-all shadow-lg shadow-red-500/20">
                            <Bell className="w-4 h-4" />{sendingBulkReminder ? 'Sending...' : 'Remind Non-Submitters'}
                        </button>
                    )}
                    <div className="flex items-center bg-white/[0.06] rounded-xl p-1 border border-white/[0.04]">
                        <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-300')}><List className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-300')}><Grid3X3 className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            {/* === EMPLOYEE LIST TABLE (MAIN SECTION) === */}
            {loading ? (
                <div className="text-center py-20 text-gray-400"><RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />Loading employee data...</div>
            ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-20 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-lg font-bold text-gray-500">No employees found</p>
                    <p className="text-sm">Try adjusting your filters or search term.</p>
                </div>
            ) : viewMode === 'list' ? (
                <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-gray-900/40 dark:bg-gray-900/50 backdrop-blur-sm shadow-2xl shadow-black/20">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-900/60 border-b border-white/[0.06] text-[10px] uppercase tracking-widest text-gray-500">
                                    <th className="p-4 font-bold cursor-pointer hover:text-gray-300 transition-colors" onClick={() => { setSortField('name'); setSortAsc(!sortAsc); }}>Employee Name <SortIcon field="name" /></th>
                                    <th className="p-4 font-bold cursor-pointer hover:text-gray-300 transition-colors" onClick={() => { setSortField('team'); setSortAsc(!sortAsc); }}>Team/Dept <SortIcon field="team" /></th>
                                    <th className="p-4 font-bold cursor-pointer hover:text-gray-300 transition-colors" onClick={() => { setSortField('status'); setSortAsc(!sortAsc); }}>Submission Status <SortIcon field="status" /></th>
                                    <th className="p-4 font-bold cursor-pointer hover:text-gray-300 transition-colors" onClick={() => { setSortField('mrg'); setSortAsc(!sortAsc); }}>MRG Status <SortIcon field="mrg" /></th>
                                    <th className="p-4 font-bold cursor-pointer hover:text-gray-300 transition-colors" onClick={() => { setSortField('blockers'); setSortAsc(!sortAsc); }}>Blockers <SortIcon field="blockers" /></th>
                                    <th className="p-4 font-bold cursor-pointer hover:text-gray-300 transition-colors text-right" onClick={() => { setSortField('hours'); setSortAsc(!sortAsc); }}>Total Hours <SortIcon field="hours" /></th>
                                    <th className="p-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {paginatedEmployees.map(emp => {
                                    const d = getEmployeeData(emp);
                                    const isExp = expanded.has(emp.id);
                                    const avatarGradient = emp.status === 'SUBMITTED' ? 'from-emerald-400 to-emerald-600' : emp.status === 'PENDING' ? 'from-amber-400 to-amber-600' : 'from-red-400 to-red-600';

                                    return (
                                        <React.Fragment key={emp.id}>
                                            <tr onClick={() => toggleExpand(emp.id)} className={cn("hover:bg-white/[0.03] cursor-pointer transition-all group", isExp ? 'bg-white/[0.04]' : '')}>
                                                <td className="p-4 font-medium text-white flex items-center gap-3">
                                                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-lg bg-gradient-to-br ring-1 ring-white/10", avatarGradient)}>
                                                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">{emp.firstName} {emp.lastName}</p>
                                                        <p className="text-[10px] text-gray-500 font-normal">{emp.email}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4"><span className="px-2.5 py-1 bg-white/[0.06] text-gray-300 rounded-lg font-medium text-[10px] uppercase tracking-wider ring-1 ring-white/[0.06]">{emp.memberRole}</span></td>
                                                <td className="p-4">
                                                    {emp.status === 'SUBMITTED' ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold ring-1 ring-emerald-500/20"><CheckCircle className="w-3 h-3" /> SUBMITTED</span> :
                                                        emp.status === 'PENDING' ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-bold ring-1 ring-amber-500/20"><Clock className="w-3 h-3" /> PENDING</span> :
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-400 rounded-lg text-[10px] font-bold ring-1 ring-red-500/20"><AlertTriangle className="w-3 h-3" /> NOT SUBMITTED</span>}
                                                </td>
                                                <td className="p-4">
                                                    {emp.status === 'SUBMITTED' ? <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Completed</span> :
                                                        emp.status === 'PENDING' ? <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1.5"><Clock className="w-3 h-3" /> In Progress</span> :
                                                            <span className="text-red-400 font-bold text-[11px] flex items-center gap-1.5"><X className="w-3 h-3" /> Not Done</span>}
                                                </td>
                                                <td className="p-4">
                                                    <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold ring-1 inline-flex items-center gap-1.5",
                                                        d.openBlockers > 0 ? 'bg-red-500/10 ring-red-500/20 text-red-400' : 'bg-emerald-500/10 ring-emerald-500/20 text-emerald-400'
                                                    )}>
                                                        <ShieldAlert className="w-3 h-3" /> {d.openBlockers} Blocker(s)
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-mono text-sm font-semibold text-gray-300">{d.hours}h</td>
                                                <td className="p-4 text-right">
                                                    {emp.status === 'NOT SUBMITTED' ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="px-2.5 py-1 bg-red-500/15 text-red-400 text-[9px] font-bold uppercase rounded-lg ring-1 ring-red-500/25">Not Submitted</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className={cn("px-2.5 py-1 text-[9px] font-bold uppercase rounded-lg ring-1",
                                                                emp.status === 'SUBMITTED' ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25' : 'bg-amber-500/15 text-amber-400 ring-amber-500/25'
                                                            )}>{emp.status}</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* EXPANDED DETAILS */}
                                            <AnimatePresence>
                                                {isExp && (
                                                    <tr>
                                                        <td colSpan={7} className="p-0 border-b border-indigo-500/20">
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-gray-950/40 backdrop-blur-sm">
                                                                <div className="p-6">
                                                                    {emp.status === 'NOT SUBMITTED' ? (
                                                                        /* NOT SUBMITTED DETAILS */
                                                                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center shadow-sm">
                                                                            <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3" />
                                                                            <h4 className="text-lg font-bold text-red-600 mb-1">Pending Items Required</h4>
                                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">Employee has not submitted their morning standup or daily tracking for {isToday ? 'today' : 'this date'}.</p>
                                                                            <div className="flex items-center justify-center gap-3">
                                                                                <button onClick={() => handleReminder(emp.id)} disabled={sendingReminder[emp.id]} className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 shadow-md transition-all flex items-center gap-2 disabled:opacity-50">
                                                                                    <Bell className="w-4 h-4" /> {sendingReminder[emp.id] ? 'Sending Reminder...' : 'Send Reminder'}
                                                                                </button>
                                                                                <button className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-600 font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center gap-2">
                                                                                    <AlertTriangle className="w-4 h-4" /> Override / Force Submit
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        /* SUBMITTED / PENDING — PREMIUM TWO-COLUMN LAYOUT */
                                                                        <div className="flex flex-col lg:flex-row gap-5 min-h-[480px]">
                                                                            {/* LEFT PANEL (40%) — Daily Details */}
                                                                            <div className="lg:w-[40%] space-y-4 flex-shrink-0">
                                                                                {/* ────── Employee Summary Header ────── */}
                                                                                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-gray-900 to-slate-900 p-5 shadow-xl">
                                                                                    {/* BG Decorations */}
                                                                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2230%22%20height%3D%2230%22%20viewBox%3D%220%200%2030%2030%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%2010h10V0H0zm20%200h10V0H20z%22%20fill%3D%22rgba(255%2C255%2C255%2C0.02)%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
                                                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl" />
                                                                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />

                                                                                    <div className="relative flex items-center gap-4 z-10">
                                                                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-xl ring-2 ring-white/10 bg-gradient-to-br",
                                                                                            emp.status === 'SUBMITTED' ? 'from-emerald-400 to-emerald-600' : 'from-amber-400 to-amber-600'
                                                                                        )}>
                                                                                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                                                        </div>
                                                                                        <div>
                                                                                            <h3 className="text-lg font-bold text-white tracking-tight">{emp.firstName} {emp.lastName}</h3>
                                                                                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                                                                                                <span className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] font-bold text-gray-300 uppercase tracking-wider">{emp.memberRole}</span>
                                                                                                <span>·</span>
                                                                                                <span>{d.hours}h logged</span>
                                                                                                <span>·</span>
                                                                                                <span>{d.totalEntries} tasks</span>
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Mini Stats Row */}
                                                                                    <div className="relative z-10 grid grid-cols-3 gap-2 mt-4">
                                                                                        {[
                                                                                            { label: 'COMPLETED', value: d.tasksDone, color: 'text-emerald-400' },
                                                                                            { label: 'IN PROGRESS', value: d.tasksActive, color: 'text-blue-400' },
                                                                                            { label: 'BLOCKERS', value: d.openBlockers, color: d.openBlockers > 0 ? 'text-red-400' : 'text-gray-500' },
                                                                                        ].map((stat, i) => (
                                                                                            <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl px-3 py-2 text-center border border-white/5">
                                                                                                <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
                                                                                                <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mt-0.5">{stat.label}</p>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>

                                                                                {/* ────── MRG Timeline ────── */}
                                                                                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-5 shadow-sm">
                                                                                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                                                                                        <div className="w-5 h-5 rounded-lg bg-primary-500/10 flex items-center justify-center"><Activity className="w-3 h-3 text-primary-500" /></div>
                                                                                        Daily Progress Timeline
                                                                                    </h4>
                                                                                    <div className="space-y-0 relative">
                                                                                        <div className="absolute left-[17px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-green-300 via-blue-300 to-gray-200 dark:from-green-600 dark:via-blue-600 dark:to-gray-700 rounded-full" />
                                                                                        {[
                                                                                            { icon: Sun, label: 'Morning Standup', done: emp.report?.standupSubmitted, time: emp.report?.standupTime, doneText: `Completed at ${emp.report?.standupTime}`, pendingText: 'Missing', gradient: 'from-green-400 to-emerald-500', pendingGradient: 'from-red-400 to-red-500' },
                                                                                            { icon: Clock, label: 'Work Logged', done: d.hours > 0, time: null, doneText: `${d.hours}h across ${d.totalEntries} entries`, pendingText: 'No entries yet', gradient: 'from-blue-400 to-blue-500', pendingGradient: 'from-gray-300 to-gray-400' },
                                                                                            { icon: Moon, label: 'Evening Summary', done: emp.report?.summarySubmitted, time: emp.report?.summaryTime, doneText: `Completed at ${emp.report?.summaryTime}`, pendingText: 'Pending...', gradient: 'from-violet-400 to-purple-500', pendingGradient: 'from-amber-400 to-amber-500' },
                                                                                        ].map((step, i) => (
                                                                                            <div key={i} className="flex gap-4 relative z-10 py-3">
                                                                                                <div className={cn(
                                                                                                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-lg ring-4 ring-white dark:ring-gray-800 bg-gradient-to-br transition-all",
                                                                                                    step.done ? step.gradient : step.pendingGradient
                                                                                                )}>
                                                                                                    <step.icon className="w-4 h-4" />
                                                                                                </div>
                                                                                                <div className="flex-1 min-w-0 pt-0.5">
                                                                                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{step.label}</p>
                                                                                                    <p className={cn("text-xs mt-0.5", step.done ? 'text-green-600 dark:text-green-400' : 'text-gray-400 font-medium')}>
                                                                                                        {step.done ? step.doneText : step.pendingText}
                                                                                                    </p>
                                                                                                </div>
                                                                                                {step.done && <CheckCircle className="w-4 h-4 text-green-500 mt-1.5 flex-shrink-0" />}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>

                                                                                {/* ────── Work Completed ────── */}
                                                                                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm overflow-hidden">
                                                                                    <div className="p-4 bg-gradient-to-r from-emerald-50/80 to-green-50/40 dark:from-emerald-900/10 dark:to-green-900/5 border-b border-gray-200/60 dark:border-gray-700/60 flex justify-between items-center">
                                                                                        <h4 className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                                                                                            <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center"><CheckCircle className="w-3 h-3 text-emerald-500" /></div>
                                                                                            Work Completed
                                                                                        </h4>
                                                                                        <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full ring-1 ring-emerald-500/20">{d.tasksDone}/{d.totalEntries} tasks</span>
                                                                                    </div>
                                                                                    <div className="overflow-y-auto max-h-[220px]">
                                                                                        {d.work.length > 0 ? d.work.map((w, i) => (
                                                                                            <div key={i} className="px-4 py-2.5 border-b border-gray-100/60 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors flex items-center gap-3">
                                                                                                <span className="text-[10px] text-gray-400 font-mono w-10 flex-shrink-0">{w.time}</span>
                                                                                                <div className="flex-1 min-w-0">
                                                                                                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{w.taskTitle}</p>
                                                                                                    <div className="flex items-center gap-2 mt-1">
                                                                                                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                                                            <div className={cn("h-full rounded-full transition-all", w.progress >= 100 ? 'bg-emerald-500' : w.progress >= 50 ? 'bg-blue-500' : 'bg-amber-500')} style={{ width: `${Math.min(100, w.progress)}%` }} />
                                                                                                        </div>
                                                                                                        <span className="text-[9px] font-bold text-gray-400 w-8 text-right">{w.progress}%</span>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <span className="text-xs font-bold text-gray-500 font-mono flex-shrink-0">{w.hours}h</span>
                                                                                            </div>
                                                                                        )) : (
                                                                                            <div className="p-8 text-center">
                                                                                                <Clock className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                                                                                <p className="text-xs text-gray-400">No tasks logged yet</p>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                {/* ────── Blockers ────── */}
                                                                                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm overflow-hidden">
                                                                                    <div className="p-4 bg-gradient-to-r from-red-50/80 to-rose-50/40 dark:from-red-900/10 dark:to-rose-900/5 border-b border-gray-200/60 dark:border-gray-700/60 flex justify-between items-center">
                                                                                        <h4 className="text-[11px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-2">
                                                                                            <div className="w-5 h-5 rounded-lg bg-red-500/10 flex items-center justify-center"><ShieldAlert className="w-3 h-3 text-red-500" /></div>
                                                                                            Blockers
                                                                                        </h4>
                                                                                        <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full ring-1",
                                                                                            d.openBlockers > 0 ? 'bg-red-500/10 text-red-700 dark:text-red-400 ring-red-500/20' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20'
                                                                                        )}>{d.openBlockers > 0 ? `${d.openBlockers} open` : 'All clear'}</span>
                                                                                    </div>
                                                                                    <div className="overflow-y-auto max-h-[200px] p-3 space-y-2.5">
                                                                                        {d.blockers.length > 0 ? d.blockers.map(b => (
                                                                                            <div key={b.id} className={cn("p-3 rounded-xl border transition-all",
                                                                                                b.blockerStatus === 'OPEN'
                                                                                                    ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200/60 dark:border-red-800/40 shadow-sm shadow-red-500/5'
                                                                                                    : 'bg-gray-50/50 dark:bg-gray-700/20 border-gray-200/40 dark:border-gray-700/40'
                                                                                            )}>
                                                                                                <div className="flex justify-between items-center mb-2">
                                                                                                    <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold ring-1",
                                                                                                        b.severity === 'high' ? 'bg-red-500/10 text-red-700 ring-red-500/20' : b.severity === 'medium' ? 'bg-amber-500/10 text-amber-700 ring-amber-500/20' : 'bg-blue-500/10 text-blue-700 ring-blue-500/20'
                                                                                                    )}>{b.severity?.toUpperCase()}</span>
                                                                                                    <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold ring-1",
                                                                                                        b.blockerStatus === 'OPEN' ? 'bg-red-500/10 text-red-600 ring-red-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20'
                                                                                                    )}>{b.blockerStatus}</span>
                                                                                                </div>
                                                                                                <p className="text-xs text-gray-800 dark:text-gray-200 font-medium leading-relaxed">{b.notes || b.taskTitle}</p>
                                                                                                {b.blockerStatus === 'OPEN' && (
                                                                                                    <button onClick={() => handleResolveBlocker(b.id)} className="w-full mt-2.5 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-lg text-[10px] font-bold transition-all shadow-sm shadow-blue-500/20">
                                                                                                        ✓ Mark Resolved
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                        )) : (
                                                                                            <div className="text-center py-6">
                                                                                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                                                                                                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                                                                                                </div>
                                                                                                <p className="text-xs text-gray-500 font-medium">No blockers reported</p>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                {/* ────── Lessons Learned ────── */}
                                                                                {emp.report?.lessonsLearned && (
                                                                                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50/90 via-violet-50/70 to-purple-50/50 dark:from-indigo-900/15 dark:via-violet-900/10 dark:to-purple-900/5 border border-indigo-200/40 dark:border-indigo-700/30 p-4 shadow-sm">
                                                                                        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-400/10 rounded-full blur-2xl" />
                                                                                        <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 relative z-10">
                                                                                            <Sparkles className="w-3.5 h-3.5" /> Key Learnings
                                                                                        </h4>
                                                                                        <p className="text-xs text-indigo-800 dark:text-indigo-200 italic leading-relaxed relative z-10">&quot;{emp.report.lessonsLearned}&quot;</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* RIGHT PANEL (60%) — Conversation / Chat */}
                                                                            <div className="lg:w-[60%] flex flex-col">
                                                                                {emp.report ? (
                                                                                    <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-black/5 dark:shadow-black/20 flex-1 flex flex-col overflow-hidden">
                                                                                        <DailyReportChat
                                                                                            reportId={emp.report.id}
                                                                                            comments={emp.report.comments || []}
                                                                                            currentUserId={currentUser?.id || ''}
                                                                                            teamMembers={projectMembers}
                                                                                            onCommentAdded={() => loadData()}
                                                                                            onCommentDeleted={() => loadData()}
                                                                                            onCommentUpdated={() => loadData()}
                                                                                            className="flex-1"
                                                                                        />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg flex-1 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                                                                                        <div className="text-center text-gray-400">
                                                                                            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                                                                                                <MessageSquare className="w-7 h-7 opacity-40" />
                                                                                            </div>
                                                                                            <p className="text-sm font-medium">No report to comment on</p>
                                                                                            <p className="text-xs mt-1 text-gray-400">Submit a daily report first</p>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* === PAGINATION === */}
                    <div className="p-4 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-3 bg-gray-900/30">
                        <div className="text-xs text-gray-500 font-medium">
                            Showing <span className="font-semibold text-gray-300">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredEmployees.length)}</span> to <span className="font-semibold text-gray-300">{Math.min(currentPage * itemsPerPage, filteredEmployees.length)}</span> of <span className="font-semibold text-gray-300">{filteredEmployees.length}</span> employees
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Rows per page:</span>
                                <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))} className="text-xs border border-white/[0.08] rounded-lg px-2 py-1 bg-white/[0.05] text-gray-300 focus:outline-none">
                                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] disabled:opacity-30 transition-all"><ChevronFirst className="w-4 h-4" /></button>
                                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-xs border border-white/[0.08] rounded-lg bg-white/[0.04] font-medium disabled:opacity-40 hover:bg-white/[0.08] text-gray-300 transition-all">« Previous</button>
                                <span className="text-xs px-3 font-medium text-gray-500">Page {currentPage} of {totalPages || 1}</span>
                                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1.5 text-xs border border-white/[0.08] rounded-lg bg-white/[0.04] font-medium disabled:opacity-40 hover:bg-white/[0.08] text-gray-300 transition-all">Next »</button>
                                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] disabled:opacity-30 transition-all"><ChevronLast className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* GRID VIEW (Alternative) - MATCHING PERFORMANCE UI */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedEmployees.map(emp => {
                        const d = emp.status !== 'NOT SUBMITTED' ? getEmployeeData(emp) : { hours: 0, tasksDone: 0, openBlockers: 0 };
                        const util = Math.min(100, Math.round((d.hours / 8) * 100));
                        const quality = emp.status === 'NOT SUBMITTED' ? '0' : emp.report?.status === 'excellent' ? '100' : emp.report?.status === 'good' ? '80' : '50';
                        const stars = emp.status === 'NOT SUBMITTED' ? 0 : emp.report?.status === 'excellent' ? 5 : emp.report?.status === 'good' ? 4 : 3;
                        const ratingStr = stars.toFixed(1);

                        return (
                            <div key={emp.id} onClick={() => toggleExpand(emp.id)} className={cn("rounded-xl border p-5 cursor-pointer transition-colors shadow-sm relative overflow-hidden flex flex-col h-full", "bg-[#1E232B] dark:bg-[#1E232B] hover:border-gray-500", emp.status !== 'NOT SUBMITTED' ? 'border-gray-700' : 'border-red-900/50')}>
                                {/* Submitter Badge (Top Right) */}
                                {emp.status === 'NOT SUBMITTED' && (
                                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                                        Not Submitted
                                    </div>
                                )}

                                {/* Top Row */}
                                <div className="flex items-start justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm", emp.status === 'SUBMITTED' ? 'bg-blue-500' : emp.status === 'PENDING' ? 'bg-amber-500' : 'bg-gray-600')}>
                                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white">{emp.firstName} {emp.lastName}</p>
                                            <div className="mt-0.5">
                                                <span className="text-[8px] px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded uppercase font-bold tracking-wide">{emp.memberRole}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Award className={cn("w-4 h-4", emp.status === 'SUBMITTED' ? "text-yellow-500" : "text-gray-600")} />
                                </div>

                                {/* Middle Stats */}
                                <div className="grid grid-cols-3 gap-2 text-center mb-5">
                                    <div className="bg-[#171A21] rounded-lg py-3 px-1">
                                        <p className="text-xl font-bold text-white">{d.hours}</p>
                                        <p className="text-[8px] text-gray-500 uppercase font-bold mt-1 tracking-wider">LOGGED</p>
                                    </div>
                                    <div className="bg-[#171A21] rounded-lg py-3 px-1">
                                        <p className="text-xl font-bold text-green-500">{d.tasksDone}</p>
                                        <p className="text-[8px] text-gray-500 uppercase font-bold mt-1 tracking-wider">DONE</p>
                                    </div>
                                    <div className="bg-[#171A21] rounded-lg py-3 px-1">
                                        <p className={cn("text-xl font-bold", d.openBlockers > 0 ? "text-red-500" : "text-blue-500")}>{d.openBlockers}</p>
                                        <p className="text-[8px] text-gray-500 uppercase font-bold mt-1 tracking-wider">BLOCKERS</p>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="mb-5">
                                    <div className="flex justify-between items-end mb-1.5">
                                        <span className="text-[9px] text-gray-500">Utilization</span>
                                        <span className="text-[9px] text-gray-500">{util}%</span>
                                    </div>
                                    <div className="w-full h-1 bg-gray-700 rounded-full mb-3">
                                        <div className="h-1 bg-blue-500 rounded-full transition-all" style={{ width: `${util}%` }} />
                                    </div>
                                    <p className="text-[10px] text-gray-500">Quality: <span className="text-green-500 font-bold">{quality}%</span></p>
                                </div>

                                {/* Bottom Section */}
                                <div className="border-t border-gray-700/60 pt-4 mt-auto">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[8px] text-gray-500 uppercase font-bold mb-1 tracking-wider">EST. HOURS</p>
                                            <p className="text-xs font-bold text-white">{d.hours}h</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] text-gray-500 uppercase font-bold mb-1 text-right tracking-wider">VELOCITY</p>
                                            <p className="text-xs font-bold text-white text-right">{d.tasksDone} tasks</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[8px] text-gray-500 uppercase font-bold mb-1.5 tracking-wider">PERFORMANCE RATING</p>
                                            <div className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <svg key={star} className={cn("w-3 h-3 fill-current", star <= stars ? 'text-yellow-500' : 'text-gray-600')} viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                                <span className="text-[9px] text-gray-400 ml-1.5">{ratingStr}/5</span>
                                            </div>
                                        </div>
                                        {emp.status === 'NOT SUBMITTED' ? (
                                            <button onClick={(e) => handleReminder(emp.id, e)} className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded hover:bg-red-500/20 text-[10px] font-bold transition-colors">
                                                Remind
                                            </button>
                                        ) : (
                                            <button className="px-3 py-1.5 bg-gray-700/30 text-gray-300 border border-gray-600/50 rounded hover:bg-gray-700 text-[10px] font-bold transition-colors">
                                                Details
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-gray-600 mt-4 truncate">{emp.email}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Grid pagination */}
            {viewMode === 'grid' && filteredEmployees.length > 0 && (
                <div className="flex items-center justify-center gap-4 py-4">
                    <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50">« Prev</button>
                    <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50">Next »</button>
                </div>
            )}
        </div>
    );
}
