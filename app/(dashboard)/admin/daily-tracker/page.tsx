'use client';

import { useState, useEffect, useMemo } from 'react';
import Container from '@/components/ui/Container';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import { cn } from '@/lib/utils';
import {
    Clock, Users, AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
    TrendingUp, Search, MessageSquare, Send, Filter, BarChart3, Zap, Star,
    Eye, Bell, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Employee { id: string; firstName: string; lastName: string; email: string; role?: string; }
interface Project { id: string; name: string; key: string; }

interface MockReport {
    employeeId: string; employee: Employee; standupTime?: string; standupSubmitted: boolean;
    hourlyEntries: { time: string; task: string; hours: number; progress: number; notes: string; }[];
    blockers: { id: string; description: string; severity: string; status: string; reportedAt: string; }[];
    summarySubmitted: boolean; hoursLogged: number; hoursPlanned: number; status: 'excellent' | 'good' | 'at-risk' | 'missing';
}

function generateMockReports(employees: Employee[]): MockReport[] {
    const statuses: MockReport['status'][] = ['excellent', 'good', 'excellent', 'at-risk', 'missing'];
    return employees.map((emp, i) => {
        const st = statuses[i % statuses.length];
        const submitted = st !== 'missing';
        const hrs = st === 'excellent' ? 7.5 : st === 'good' ? 5.5 : st === 'at-risk' ? 3 : 0;
        return {
            employeeId: emp.id, employee: emp, standupSubmitted: submitted,
            standupTime: submitted ? `9:${10 + (i * 5) % 20} AM` : undefined,
            hourlyEntries: submitted ? [
                { time: '10:00 AM', task: 'Task implementation', hours: 1.5, progress: 30, notes: 'Good progress' },
                { time: '11:30 AM', task: 'Code review', hours: 1, progress: 50, notes: 'Reviewed 2 PRs' },
                { time: '2:00 PM', task: 'Bug fixes', hours: 1.5, progress: 70, notes: 'Fixed 3 bugs' },
            ] : [],
            blockers: st === 'at-risk' ? [{ id: '1', description: 'Waiting for API access', severity: 'high', status: 'OPEN', reportedAt: '10:15 AM' }] : [],
            summarySubmitted: st === 'excellent', hoursLogged: hrs, hoursPlanned: 8, status: st,
        };
    });
}

export default function AdminDailyTrackerPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState('all');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [expandedEmp, setExpandedEmp] = useState<Set<string>>(new Set());
    const [date] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const pData = await projectsApi.getAll();
            const pList = (pData.projects || pData || []) as Project[];
            setProjects(pList);
            // Load members from first project or all
            if (pList.length > 0) {
                try {
                    const members = await projectsApi.getMembers(pList[0].id);
                    setEmployees((members || []).map((m: any) => m.user || m));
                } catch { setEmployees([]); }
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const reports = useMemo(() => generateMockReports(employees), [employees]);

    const filtered = useMemo(() => {
        return reports.filter(r => {
            if (search) {
                const term = search.toLowerCase();
                const name = `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase();
                if (!name.includes(term)) return false;
            }
            if (statusFilter !== 'all' && r.status !== statusFilter) return false;
            return true;
        });
    }, [reports, search, statusFilter]);

    const stats = useMemo(() => {
        const total = reports.length;
        const submitted = reports.filter(r => r.standupSubmitted).length;
        const totalHours = reports.reduce((s, r) => s + r.hoursLogged, 0);
        const totalPlanned = reports.reduce((s, r) => s + r.hoursPlanned, 0);
        const blockers = reports.reduce((s, r) => s + r.blockers.filter(b => b.status === 'OPEN').length, 0);
        const excellent = reports.filter(r => r.status === 'excellent').length;
        return { total, submitted, totalHours, totalPlanned, blockers, excellent, health: total > 0 ? Math.round((submitted / total) * 100) : 0 };
    }, [reports]);

    const statusIcon = (s: string) => s === 'excellent' ? '🟢' : s === 'good' ? '🟡' : s === 'at-risk' ? '🟠' : '🔴';

    if (loading) return <Container><LoadingSkeleton count={4} className="h-24 w-full" /></Container>;

    return (
        <Container size="full">
            <div className="space-y-5">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Clock className="w-6 h-6 text-primary-500" />Admin Daily Tracker</h1>
                            <p className="text-sm text-gray-500 mt-0.5">{date} · Real-time team tracking</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
                                <option value="all">All Projects</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
                                <option value="all">All Status</option>
                                <option value="excellent">🟢 Excellent</option>
                                <option value="good">🟡 Good</option>
                                <option value="at-risk">🟠 At Risk</option>
                                <option value="missing">🔴 Missing</option>
                            </select>
                            <div className="relative"><Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee..." className="pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white w-44" /></div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                        { label: 'Reports Submitted', value: `${stats.submitted}/${stats.total}`, sub: `${stats.health}%`, color: stats.health >= 80 ? 'text-green-600' : 'text-red-500', icon: CheckCircle },
                        { label: 'Hours Logged', value: `${stats.totalHours}h`, sub: `/ ${stats.totalPlanned}h planned`, color: 'text-blue-600', icon: Clock },
                        { label: 'Open Blockers', value: stats.blockers, sub: stats.blockers > 0 ? 'Needs attention' : 'All clear', color: stats.blockers > 0 ? 'text-red-500' : 'text-green-600', icon: AlertTriangle },
                        { label: 'Excellent', value: stats.excellent, sub: `/ ${stats.total} employees`, color: 'text-green-600', icon: Star },
                        { label: 'Team Health', value: stats.health >= 80 ? '🟢' : stats.health >= 50 ? '🟡' : '🔴', sub: `${stats.health}% healthy`, color: 'text-gray-900 dark:text-white', icon: TrendingUp },
                    ].map((card, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                            <div className="flex items-center gap-2 mb-1"><card.icon className={cn("w-4 h-4", card.color)} /><span className="text-[10px] text-gray-500 uppercase font-bold">{card.label}</span></div>
                            <p className={cn("text-xl font-bold", card.color)}>{String(card.value)}</p>
                            <p className="text-[10px] text-gray-400">{card.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Employee Reports */}
                <div className="space-y-3">
                    {filtered.map(report => {
                        const isExp = expandedEmp.has(report.employeeId);
                        const name = `${report.employee.firstName} ${report.employee.lastName}`;
                        return (
                            <motion.div key={report.employeeId} layout className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <button onClick={() => setExpandedEmp(prev => { const n = new Set(prev); n.has(report.employeeId) ? n.delete(report.employeeId) : n.add(report.employeeId); return n; })}
                                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors text-left">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{report.employee.firstName?.[0]}{report.employee.lastName?.[0]}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2"><h3 className="font-bold text-sm text-gray-900 dark:text-white">{name}</h3><span className="text-[10px]">{statusIcon(report.status)}</span></div>
                                        <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-0.5">
                                            <span>Standup: {report.standupSubmitted ? `✅ ${report.standupTime}` : '❌ Missing'}</span>
                                            <span>Hours: {report.hoursLogged}/{report.hoursPlanned}h</span>
                                            <span>Entries: {report.hourlyEntries.length}</span>
                                            {report.blockers.filter(b => b.status === 'OPEN').length > 0 && <span className="text-red-500 font-bold">🔴 {report.blockers.filter(b => b.status === 'OPEN').length} blocker(s)</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"><div className={cn("h-1.5 rounded-full", report.hoursLogged / report.hoursPlanned >= 0.7 ? 'bg-green-500' : report.hoursLogged > 0 ? 'bg-blue-500' : 'bg-gray-300')} style={{ width: `${Math.min(100, (report.hoursLogged / report.hoursPlanned) * 100)}%` }} /></div>
                                        {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isExp && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                                                {/* Standup */}
                                                <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">🌅 Morning Standup</h4>
                                                    {report.standupSubmitted ? <p className="text-xs text-green-600">Submitted at {report.standupTime}</p> : <p className="text-xs text-red-500 font-bold">❌ NOT SUBMITTED — Send reminder</p>}
                                                </div>
                                                {/* Hourly entries */}
                                                {report.hourlyEntries.length > 0 && (
                                                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
                                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">⏱️ Hourly Tracking</h4>
                                                        {report.hourlyEntries.map((e, i) => (
                                                            <div key={i} className="flex items-center gap-3 text-xs py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                                                <span className="text-gray-400 w-16">{e.time}</span>
                                                                <span className="flex-1 text-gray-700 dark:text-gray-300">{e.task}</span>
                                                                <span className="text-gray-500">{e.hours}h · {e.progress}%</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Blockers */}
                                                {report.blockers.length > 0 && (
                                                    <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3 border border-red-200 dark:border-red-800">
                                                        <h4 className="text-xs font-bold text-red-600 uppercase mb-2">🚨 Blockers</h4>
                                                        {report.blockers.map(b => (
                                                            <div key={b.id} className="flex items-center justify-between text-xs">
                                                                <span className="text-gray-700 dark:text-gray-300">{b.description}</span>
                                                                <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold", b.status === 'OPEN' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600')}>{b.status}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Actions */}
                                                <div className="flex gap-2 pt-1">
                                                    <button className="text-xs px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-lg font-medium flex items-center gap-1"><Eye className="w-3 h-3" />Full Report</button>
                                                    <button className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg font-medium flex items-center gap-1"><MessageSquare className="w-3 h-3" />Comment</button>
                                                    {!report.standupSubmitted && <button className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg font-medium flex items-center gap-1"><Bell className="w-3 h-3" />Remind</button>}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                    {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No employee reports found matching your filters.</div>}
                </div>

                {/* Action Items */}
                {reports.filter(r => !r.standupSubmitted || r.blockers.some(b => b.status === 'OPEN')).length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />Action Items</h3>
                        {reports.filter(r => !r.standupSubmitted).map(r => (
                            <div key={r.employeeId + 'missing'} className="flex items-center justify-between text-xs py-1">
                                <span className="text-gray-700 dark:text-gray-300">🔴 {r.employee.firstName} {r.employee.lastName}: Missing morning standup</span>
                                <button className="text-red-600 font-bold hover:underline">Send Reminder</button>
                            </div>
                        ))}
                        {reports.flatMap(r => r.blockers.filter(b => b.status === 'OPEN').map(b => ({ ...b, emp: r.employee }))).map(b => (
                            <div key={b.id} className="flex items-center justify-between text-xs py-1">
                                <span className="text-gray-700 dark:text-gray-300">🟠 {b.emp.firstName}: {b.description}</span>
                                <button className="text-amber-600 font-bold hover:underline">Resolve</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Container>
    );
}
