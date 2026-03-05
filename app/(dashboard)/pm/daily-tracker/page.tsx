'use client';

import { useState, useEffect, useMemo } from 'react';
import Container from '@/components/ui/Container';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { cn } from '@/lib/utils';
import {
    Clock, Users, AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
    TrendingUp, Search, MessageSquare, Eye, Bell, Star, FolderKanban,
    ArrowUpRight, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Employee { id: string; firstName: string; lastName: string; email: string; }
interface Project { id: string; name: string; key: string; }

export default function PMDailyTrackerPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [members, setMembers] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedEmp, setExpandedEmp] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');
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

    // Mock data generator
    const reports = useMemo(() => {
        const statuses = ['excellent', 'good', 'excellent', 'at-risk', 'good'] as const;
        return members.map((emp, i) => {
            const st = statuses[i % statuses.length];
            const submitted = st !== 'at-risk' || i % 3 !== 0;
            const hrs = st === 'excellent' ? 7 : st === 'good' ? 5 : 2.5;
            return {
                employee: emp, status: st, standupSubmitted: submitted,
                standupTime: submitted ? `9:${10 + i * 3}` : null,
                hoursLogged: hrs, hoursPlanned: 8,
                entries: submitted ? [{ time: '10 AM', task: 'Development work', hours: 2, progress: 40 }, { time: '2 PM', task: 'Testing', hours: 1.5, progress: 30 }] : [],
                blockers: st === 'at-risk' ? [{ desc: 'Waiting for design assets', status: 'OPEN' }] : [],
            };
        });
    }, [members]);

    const filtered = reports.filter(r => {
        if (!search) return true;
        const name = `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase();
        return name.includes(search.toLowerCase());
    });

    const stats = {
        submitted: reports.filter(r => r.standupSubmitted).length,
        total: reports.length,
        hours: reports.reduce((s, r) => s + r.hoursLogged, 0),
        planned: reports.reduce((s, r) => s + r.hoursPlanned, 0),
        blockers: reports.reduce((s, r) => s + r.blockers.filter(b => b.status === 'OPEN').length, 0),
        done: reports.filter(r => r.status === 'excellent').length,
    };

    const currentProject = projects.find(p => p.id === selectedProject);

    if (loading) return <Container><LoadingSkeleton count={4} className="h-24 w-full" /></Container>;

    return (
        <Container size="full">
            <div className="space-y-5">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><FolderKanban className="w-6 h-6 text-indigo-500" />Project Daily Tracker</h1>
                            <p className="text-sm text-gray-500 mt-0.5">{date} · Project team progress</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.key})</option>)}
                            </select>
                            <div className="relative"><Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 w-40" /></div>
                        </div>
                    </div>
                </div>

                {/* Project Status Banner */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="font-bold text-lg">{currentProject?.name || 'Project'}</h2>
                            <p className="text-white/70 text-sm">Team: {stats.total} members · Status: {stats.submitted === stats.total ? '🟢 All Reported' : '🟡 Pending'}</p>
                        </div>
                        <div className="flex gap-4 text-center">
                            <div><p className="text-2xl font-bold">{stats.submitted}/{stats.total}</p><p className="text-[10px] text-white/70">Reports</p></div>
                            <div><p className="text-2xl font-bold">{stats.hours}h</p><p className="text-[10px] text-white/70">Logged</p></div>
                            <div><p className="text-2xl font-bold">{stats.blockers}</p><p className="text-[10px] text-white/70">Blockers</p></div>
                        </div>
                    </div>
                </div>

                {/* Team Members */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-1.5"><Users className="w-4 h-4" />Team Members ({filtered.length})</h3>
                    {filtered.map(report => {
                        const isExp = expandedEmp.has(report.employee.id);
                        const name = `${report.employee.firstName} ${report.employee.lastName}`;
                        const statusIcon = report.status === 'excellent' ? '🟢' : report.status === 'good' ? '🟡' : '🟠';
                        return (
                            <div key={report.employee.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <button onClick={() => setExpandedEmp(prev => { const n = new Set(prev); n.has(report.employee.id) ? n.delete(report.employee.id) : n.add(report.employee.id); return n; })}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors text-left">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{report.employee.firstName?.[0]}{report.employee.lastName?.[0]}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2"><span className="font-bold text-sm text-gray-900 dark:text-white">{name}</span><span>{statusIcon}</span></div>
                                        <p className="text-[10px] text-gray-400">Standup: {report.standupSubmitted ? '✅' : '❌'} · {report.hoursLogged}/{report.hoursPlanned}h · {report.entries.length} entries{report.blockers.length > 0 ? ` · 🔴 ${report.blockers.length} blocker` : ''}</p>
                                    </div>
                                    <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"><div className={cn("h-1.5 rounded-full", report.status === 'excellent' ? 'bg-green-500' : report.status === 'good' ? 'bg-blue-500' : 'bg-amber-500')} style={{ width: `${Math.min(100, (report.hoursLogged / report.hoursPlanned) * 100)}%` }} /></div>
                                    {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </button>
                                <AnimatePresence>
                                    {isExp && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                                                {report.entries.map((e, i) => (
                                                    <div key={i} className="flex items-center gap-3 text-xs py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                                        <span className="text-gray-400 w-14">{e.time}</span><span className="flex-1 text-gray-700 dark:text-gray-300">{e.task}</span><span className="text-gray-500">{e.hours}h · {e.progress}%</span>
                                                    </div>
                                                ))}
                                                {report.blockers.map((b, i) => (
                                                    <div key={i} className="bg-red-50 dark:bg-red-900/10 rounded-lg p-2 text-xs flex items-center gap-2">
                                                        <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">{b.desc}</span>
                                                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-bold">{b.status}</span>
                                                    </div>
                                                ))}
                                                <div className="flex gap-2">
                                                    <button className="text-xs px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg font-medium flex items-center gap-1"><Eye className="w-3 h-3" />Full Report</button>
                                                    <button className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg font-medium flex items-center gap-1"><MessageSquare className="w-3 h-3" />Comment</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

                {/* Project Blockers */}
                {stats.blockers > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />Project Blockers</h3>
                        {reports.flatMap(r => r.blockers.filter(b => b.status === 'OPEN').map(b => ({ ...b, emp: r.employee }))).map((b, i) => (
                            <div key={i} className="flex items-center justify-between text-xs py-1">
                                <span className="text-gray-700 dark:text-gray-300">{b.emp.firstName}: {b.desc}</span>
                                <button className="text-red-600 font-bold hover:underline">Escalate</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Container>
    );
}
