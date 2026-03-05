'use client';

import { useState, useEffect, useMemo } from 'react';
import Container from '@/components/ui/Container';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { cn } from '@/lib/utils';
import {
    Clock, Users, AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
    TrendingUp, Search, MessageSquare, Eye, Bell, Star, Timer,
    BarChart3, Zap, Target, ArrowDown, ArrowUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Employee { id: string; firstName: string; lastName: string; email: string; }
interface Project { id: string; name: string; key: string; }

export default function ScrumDailyTrackerPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [members, setMembers] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedEmp, setExpandedEmp] = useState<Set<string>>(new Set());
    const [date] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

    useEffect(() => { loadProjects(); }, []);
    useEffect(() => { if (selectedProject) loadMembers(); }, [selectedProject]);

    const loadProjects = async () => {
        try {
            const data = await projectsApi.getAll();
            const list = (data.projects || data || []) as Project[];
            setProjects(list);
            if (list.length > 0) setSelectedProject(list[0].id);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const loadMembers = async () => {
        try {
            const data = await projectsApi.getMembers(selectedProject);
            setMembers((data || []).map((m: any) => m.user || m));
        } catch { setMembers([]); }
    };

    const reports = useMemo(() => {
        const statuses = ['excellent', 'good', 'excellent', 'at-risk', 'good', 'excellent'] as const;
        return members.map((emp, i) => {
            const st = statuses[i % statuses.length];
            const submitted = st !== 'at-risk';
            const hrs = st === 'excellent' ? 7 : st === 'good' ? 5 : 2;
            return {
                employee: emp, status: st, standupSubmitted: submitted,
                standupTime: submitted ? `9:${10 + i * 4} AM` : null,
                hoursLogged: hrs, hoursPlanned: 8,
                yesterday: submitted ? 'Code review and bug fixes' : 'No report',
                today: submitted ? 'API integration & testing' : 'No plan submitted',
                blockers: st === 'at-risk' ? [{ desc: 'Waiting for DB migration', status: 'OPEN' }] : [],
            };
        });
    }, [members]);

    const stats = {
        submitted: reports.filter(r => r.standupSubmitted).length,
        total: reports.length,
        hours: reports.reduce((s, r) => s + r.hoursLogged, 0),
        blockers: reports.reduce((s, r) => s + r.blockers.filter(b => b.status === 'OPEN').length, 0),
        excellent: reports.filter(r => r.status === 'excellent').length,
        good: reports.filter(r => r.status === 'good').length,
        atRisk: reports.filter(r => r.status === 'at-risk').length,
    };

    // Mock sprint data
    const sprint = { name: 'Sprint 5', startDate: 'Mar 3', endDate: 'Mar 16', daysLeft: 11, totalTasks: 40, doneTasks: 15, velocity: 12 };

    if (loading) return <Container><LoadingSkeleton count={4} className="h-24 w-full" /></Container>;

    return (
        <Container size="full">
            <div className="space-y-5">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Timer className="w-6 h-6 text-emerald-500" />Sprint Daily Tracker</h1>
                            <p className="text-sm text-gray-500 mt-0.5">{date} · Sprint team status & standup aggregation</p>
                        </div>
                        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Sprint Health Banner */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="font-bold text-lg flex items-center gap-2"><Zap className="w-5 h-5" />{sprint.name}</h2>
                            <p className="text-white/70 text-sm">{sprint.startDate} – {sprint.endDate} · {sprint.daysLeft} days left</p>
                        </div>
                        <div className="flex gap-6 text-center">
                            <div><p className="text-2xl font-bold">{sprint.doneTasks}/{sprint.totalTasks}</p><p className="text-[10px] text-white/70">Tasks Done</p></div>
                            <div><p className="text-2xl font-bold">{Math.round((sprint.doneTasks / sprint.totalTasks) * 100)}%</p><p className="text-[10px] text-white/70">Progress</p></div>
                            <div><p className="text-2xl font-bold">{sprint.velocity}</p><p className="text-[10px] text-white/70">Velocity</p></div>
                            <div><p className="text-2xl font-bold">{stats.submitted}/{stats.total}</p><p className="text-[10px] text-white/70">Reports</p></div>
                        </div>
                    </div>
                    {/* Mini burndown bar */}
                    <div className="mt-3 w-full h-2 bg-white/20 rounded-full"><div className="h-2 bg-white rounded-full transition-all" style={{ width: `${(sprint.doneTasks / sprint.totalTasks) * 100}%` }} /></div>
                </div>

                {/* Standup Aggregation */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><MessageSquare className="w-4 h-4 text-emerald-500" />Daily Standup Aggregation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-green-600 uppercase mb-1.5 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Completed Yesterday</h4>
                            {reports.filter(r => r.standupSubmitted).slice(0, 4).map((r, i) => (
                                <p key={i} className="text-xs text-gray-600 dark:text-gray-400 py-0.5">• {r.employee.firstName}: {r.yesterday}</p>
                            ))}
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-blue-600 uppercase mb-1.5 flex items-center gap-1"><Target className="w-3 h-3" />Working On Today</h4>
                            {reports.filter(r => r.standupSubmitted).slice(0, 4).map((r, i) => (
                                <p key={i} className="text-xs text-gray-600 dark:text-gray-400 py-0.5">• {r.employee.firstName}: {r.today}</p>
                            ))}
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-red-600 uppercase mb-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Blockers Identified</h4>
                            {reports.flatMap(r => r.blockers.filter(b => b.status === 'OPEN').map(b => ({ ...b, emp: r.employee }))).length === 0 && <p className="text-xs text-gray-400">No blockers ✅</p>}
                            {reports.flatMap(r => r.blockers.filter(b => b.status === 'OPEN').map(b => ({ ...b, emp: r.employee }))).map((b, i) => (
                                <p key={i} className="text-xs text-gray-600 dark:text-gray-400 py-0.5">• {b.emp.firstName}: {b.desc}</p>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Team Status Groups */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        { label: '🟢 Excellent', count: stats.excellent, list: reports.filter(r => r.status === 'excellent'), color: 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/5' },
                        { label: '🟡 Good', count: stats.good, list: reports.filter(r => r.status === 'good'), color: 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/5' },
                        { label: '🟠 At Risk', count: stats.atRisk, list: reports.filter(r => r.status === 'at-risk'), color: 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/5' },
                    ].map(group => (
                        <div key={group.label} className={cn("rounded-xl border p-3", group.color)}>
                            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{group.label} ({group.count})</h4>
                            {group.list.map(r => (
                                <div key={r.employee.id} className="flex items-center gap-2 text-xs py-1">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-[9px] font-bold">{r.employee.firstName?.[0]}{r.employee.lastName?.[0]}</div>
                                    <span className="text-gray-700 dark:text-gray-300">{r.employee.firstName}</span>
                                    <span className="text-gray-400 ml-auto">{r.hoursLogged}h</span>
                                </div>
                            ))}
                            {group.list.length === 0 && <p className="text-xs text-gray-400">No members</p>}
                        </div>
                    ))}
                </div>

                {/* All Team Members - Expandable */}
                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-1.5"><Users className="w-4 h-4" />Individual Reports ({stats.total})</h3>
                    {reports.map(report => {
                        const isExp = expandedEmp.has(report.employee.id);
                        const name = `${report.employee.firstName} ${report.employee.lastName}`;
                        return (
                            <div key={report.employee.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <button onClick={() => setExpandedEmp(prev => { const n = new Set(prev); n.has(report.employee.id) ? n.delete(report.employee.id) : n.add(report.employee.id); return n; })}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors text-left">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{report.employee.firstName?.[0]}{report.employee.lastName?.[0]}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2"><span className="font-bold text-sm text-gray-900 dark:text-white">{name}</span><span className="text-xs">{report.status === 'excellent' ? '🟢' : report.status === 'good' ? '🟡' : '🟠'}</span></div>
                                        <p className="text-[10px] text-gray-400">Standup: {report.standupSubmitted ? '✅' : '❌'} · {report.hoursLogged}h logged{report.blockers.length > 0 ? ' · 🔴 Blocker' : ''}</p>
                                    </div>
                                    {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </button>
                                <AnimatePresence>
                                    {isExp && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                            <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2 text-xs">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-2"><strong className="text-gray-500">Yesterday:</strong><p className="text-gray-700 dark:text-gray-300 mt-0.5">{report.yesterday}</p></div>
                                                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-2"><strong className="text-gray-500">Today:</strong><p className="text-gray-700 dark:text-gray-300 mt-0.5">{report.today}</p></div>
                                                </div>
                                                {report.blockers.map((b, i) => (
                                                    <div key={i} className="bg-red-50 dark:bg-red-900/10 rounded-lg p-2 flex items-center gap-2">
                                                        <AlertTriangle className="w-3 h-3 text-red-500" /><span>{b.desc}</span><span className="ml-auto text-[9px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-bold">{b.status}</span>
                                                    </div>
                                                ))}
                                                <div className="flex gap-2 pt-1">
                                                    <button className="text-xs px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg font-medium flex items-center gap-1"><Eye className="w-3 h-3" />Full Report</button>
                                                    <button className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg font-medium flex items-center gap-1"><MessageSquare className="w-3 h-3" />Comment</button>
                                                    {!report.standupSubmitted && <button className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg font-medium flex items-center gap-1"><Bell className="w-3 h-3" />Remind</button>}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

                {/* Ceremony Reminders */}
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4" />Ceremony Reminders</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center"><p className="text-green-600 font-bold">✅ Daily Standup</p><p className="text-gray-400">Today 9:00 AM</p></div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center"><p className="text-gray-700 dark:text-gray-300 font-bold">⏳ Sprint Review</p><p className="text-gray-400">Mar 16, 4 PM</p></div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center"><p className="text-gray-700 dark:text-gray-300 font-bold">⏳ Retrospective</p><p className="text-gray-400">Mar 16, 5 PM</p></div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center"><p className="text-gray-700 dark:text-gray-300 font-bold">⏳ Sprint Planning</p><p className="text-gray-400">Mar 17, 10 AM</p></div>
                    </div>
                </div>
            </div>
        </Container>
    );
}
