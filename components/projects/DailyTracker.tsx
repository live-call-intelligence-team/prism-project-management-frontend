'use client';

import { useState, useEffect, useMemo } from 'react';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import { dailyReportsApi, DailyReport as DailyReportType, DailyReportComment } from '@/lib/api/endpoints/dailyReports';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';
import {
    Sun, Moon, Clock, Camera, Paperclip, MessageSquare, AlertTriangle, CheckCircle,
    ChevronDown, ChevronUp, Plus, Send, Trash2, Target, TrendingUp, Play, Pause, Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DailyReportChat } from './DailyReportChat';

interface DailyTrackerProps {
    projectId: string;
}

interface TimeEntry {
    id: string;
    taskId: string;
    taskTitle: string;
    taskKey: string;
    hours: number;
    progress: number;
    note: string;
    timestamp: string;
    attachments?: string[];
}

interface Blocker {
    id: string;
    taskId: string;
    type: 'external' | 'technical' | 'resource' | 'dependency' | 'other';
    description: string;
    impact: string;
    status: 'OPEN' | 'RESOLVED';
    reportedAt: string;
    resolvedAt?: string;
}

export function DailyTracker({ projectId }: DailyTrackerProps) {
    const currentUser = useAuthStore(state => state.user);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Chat/Report state
    const [myReport, setMyReport] = useState<DailyReportType | null>(null);
    const [projectMembers, setProjectMembers] = useState<any[]>([]);

    // Sections
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['standup', 'timeTracking', 'summary', 'chat']));

    // Morning Standup State
    const [plannedTasks, setPlannedTasks] = useState<Array<{ taskId: string; plannedHours: number; priority: string; notes: string }>>([]);
    const [standupNotes, setStandupNotes] = useState('');
    const [standupSubmitted, setStandupSubmitted] = useState(false);

    // Hourly Tracking State
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [showAddTimeEntry, setShowAddTimeEntry] = useState(false);
    const [newEntry, setNewEntry] = useState({ taskId: '', hours: 1, progress: 0, note: '' });

    // Evening Summary State
    const [summaryNotes, setSummaryNotes] = useState('');
    const [lessonsLearned, setLessonsLearned] = useState('');
    const [summarySubmitted, setSummarySubmitted] = useState(false);

    // Blockers
    const [blockers, setBlockers] = useState<Blocker[]>([]);
    const [showAddBlocker, setShowAddBlocker] = useState(false);
    const [newBlocker, setNewBlocker] = useState({ taskId: '', type: 'technical' as Blocker['type'], description: '', impact: '' });

    useEffect(() => {
        loadData();
    }, [projectId, selectedDate]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [issuesData, reportData, membersData] = await Promise.all([
                issuesApi.getAll({ projectId, limit: 100 }),
                dailyReportsApi.getMyReport(projectId, selectedDate).catch(() => ({ report: null })),
                projectsApi.getMembers(projectId).catch(() => []),
            ]);
            setIssues(issuesData.issues || []);
            setMyReport(reportData.report);
            setProjectMembers((membersData || []).map((m: any) => ({ ...(m.user || m), memberRole: m.role })));
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // My assigned tasks (simulate: show all for now)
    const myTasks = useMemo(() => issues.filter(i => i.status !== 'DONE' && i.status !== 'CANCELLED'), [issues]);

    const toggleSection = (section: string) => {
        const s = new Set(expandedSections);
        if (s.has(section)) s.delete(section);
        else s.add(section);
        setExpandedSections(s);
    };

    // Task progress map
    const taskProgressMap = useMemo(() => {
        const map: Record<string, number> = {};
        timeEntries.forEach(e => {
            map[e.taskId] = Math.max(map[e.taskId] || 0, e.progress);
        });
        return map;
    }, [timeEntries]);

    const totalHoursLogged = useMemo(() => timeEntries.reduce((s, e) => s + e.hours, 0), [timeEntries]);
    const totalPlannedHours = useMemo(() => plannedTasks.reduce((s, t) => s + t.plannedHours, 0), [plannedTasks]);

    // Add time entry
    const addTimeEntry = () => {
        if (!newEntry.taskId) return;
        const task = issues.find(i => i.id === newEntry.taskId);
        const entry: TimeEntry = {
            id: `te-${Date.now()}`,
            taskId: newEntry.taskId,
            taskTitle: task?.title || 'Unknown',
            taskKey: task?.key || '?',
            hours: newEntry.hours,
            progress: newEntry.progress,
            note: newEntry.note,
            timestamp: new Date().toISOString(),
        };
        setTimeEntries(prev => [...prev, entry]);
        setNewEntry({ taskId: '', hours: 1, progress: 0, note: '' });
        setShowAddTimeEntry(false);
    };

    const removeTimeEntry = (id: string) => {
        setTimeEntries(prev => prev.filter(e => e.id !== id));
    };

    // Add planned task
    const addPlannedTask = (taskId: string) => {
        if (plannedTasks.find(t => t.taskId === taskId)) return;
        setPlannedTasks(prev => [...prev, { taskId, plannedHours: 2, priority: 'medium', notes: '' }]);
    };

    const removePlannedTask = (taskId: string) => {
        setPlannedTasks(prev => prev.filter(t => t.taskId !== taskId));
    };

    // Add blocker
    const addBlocker = () => {
        if (!newBlocker.description) return;
        const b: Blocker = {
            id: `b-${Date.now()}`,
            taskId: newBlocker.taskId,
            type: newBlocker.type,
            description: newBlocker.description,
            impact: newBlocker.impact,
            status: 'OPEN',
            reportedAt: new Date().toISOString(),
        };
        setBlockers(prev => [...prev, b]);
        setNewBlocker({ taskId: '', type: 'technical', description: '', impact: '' });
        setShowAddBlocker(false);
    };

    // Completed/In-progress/Blocked categorization from time entries
    const completedTasks = useMemo(() => {
        return Object.entries(taskProgressMap).filter(([, p]) => p >= 100).map(([id]) => {
            const task = issues.find(i => i.id === id);
            const hours = timeEntries.filter(e => e.taskId === id).reduce((s, e) => s + e.hours, 0);
            return { id, title: task?.title || '', key: task?.key || '', hours };
        });
    }, [taskProgressMap, issues, timeEntries]);

    const inProgressTasks = useMemo(() => {
        return Object.entries(taskProgressMap).filter(([, p]) => p > 0 && p < 100).map(([id, p]) => {
            const task = issues.find(i => i.id === id);
            const hours = timeEntries.filter(e => e.taskId === id).reduce((s, e) => s + e.hours, 0);
            return { id, title: task?.title || '', key: task?.key || '', hours, progress: p };
        });
    }, [taskProgressMap, issues, timeEntries]);

    const productivityScore = useMemo(() => {
        if (totalPlannedHours === 0) return 0;
        return Math.min(100, Math.round((totalHoursLogged / totalPlannedHours) * 100));
    }, [totalHoursLogged, totalPlannedHours]);

    const getDateLabel = (dateStr: string) => {
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary-500" />
                        Daily Tracker
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track your daily work, progress, and blockers</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    {standupSubmitted && summarySubmitted && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 font-medium">
                            ✅ Submitted
                        </span>
                    )}
                </div>
            </div>

            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{getDateLabel(selectedDate)}</p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Planned</span>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{totalPlannedHours}h</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Logged</span>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalHoursLogged}h</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Completed</span>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{completedTasks.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Blockers</span>
                    <p className={cn("text-xl font-bold", blockers.filter(b => b.status === 'OPEN').length > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white')}>
                        {blockers.filter(b => b.status === 'OPEN').length}
                    </p>
                </div>
            </div>

            {/* ═══════════════════════════════════ MORNING STANDUP ═══════════════════════════════════ */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                    onClick={() => toggleSection('standup')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                            <Sun className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Morning Standup</h3>
                            <p className="text-xs text-gray-500">Plan your day — what tasks are you working on?</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {standupSubmitted && <span className="text-xs text-green-600 font-medium px-2 py-0.5 bg-green-50 dark:bg-green-900/20 rounded-full">✅ Submitted</span>}
                        {expandedSections.has('standup') ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                </button>

                <AnimatePresence>
                    {expandedSections.has('standup') && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-200 dark:border-gray-700">
                            <div className="p-4 space-y-4">
                                {/* Task Selector */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Select Tasks for Today</label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {myTasks.map(task => {
                                            const isPlanned = plannedTasks.find(t => t.taskId === task.id);
                                            return (
                                                <div key={task.id} className={cn(
                                                    "flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer",
                                                    isPlanned ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                )}>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!isPlanned}
                                                        onChange={() => isPlanned ? removePlannedTask(task.id) : addPlannedTask(task.id)}
                                                        className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                                                    />
                                                    <span className="text-[10px] font-mono text-gray-400">{task.key}</span>
                                                    <span className="text-sm text-gray-900 dark:text-white flex-1 truncate">{task.title}</span>
                                                    {isPlanned && (
                                                        <input
                                                            type="number"
                                                            min={0.5}
                                                            max={8}
                                                            step={0.5}
                                                            value={isPlanned.plannedHours}
                                                            onChange={e => setPlannedTasks(prev => prev.map(t => t.taskId === task.id ? { ...t, plannedHours: parseFloat(e.target.value) || 0 } : t))}
                                                            className="w-14 text-xs text-center px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                            title="hours"
                                                        />
                                                    )}
                                                    {isPlanned && <span className="text-[10px] text-gray-400">hrs</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Concerns / Blockers</label>
                                    <textarea
                                        value={standupNotes}
                                        onChange={e => setStandupNotes(e.target.value)}
                                        placeholder="Any known blockers or concerns for today?"
                                        rows={2}
                                        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                {/* Summary */}
                                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
                                    <div>
                                        <span className="text-xs text-gray-500">Total Planned: </span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{totalPlannedHours} hours</span>
                                        <span className="text-xs text-gray-500 ml-3">({plannedTasks.length} tasks)</span>
                                    </div>
                                    <button
                                        onClick={() => setStandupSubmitted(true)}
                                        disabled={standupSubmitted || plannedTasks.length === 0}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                            standupSubmitted ? 'bg-green-100 text-green-700 cursor-default' : 'bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50'
                                        )}
                                    >
                                        {standupSubmitted ? '✅ Submitted' : 'Submit Standup'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ═══════════════════════════════════ HOURLY TIME TRACKING ═══════════════════════════════════ */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                    onClick={() => toggleSection('timeTracking')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Time Tracking</h3>
                            <p className="text-xs text-gray-500">Log hours and progress throughout the day</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">{totalHoursLogged}h logged</span>
                        {expandedSections.has('timeTracking') ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                </button>

                <AnimatePresence>
                    {expandedSections.has('timeTracking') && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-200 dark:border-gray-700">
                            <div className="p-4 space-y-3">
                                {/* Existing Entries */}
                                {timeEntries.map((entry, idx) => (
                                    <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-[10px] font-bold text-blue-600 flex-shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-mono text-gray-400">{entry.taskKey}</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.taskTitle}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span>⏱️ {entry.hours}h</span>
                                                <span>📊 {entry.progress}%</span>
                                                <span className="text-[10px] text-gray-400">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            {entry.note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">"{entry.note}"</p>}
                                            {/* Mini progress bar */}
                                            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
                                                <div className={cn("h-1.5 rounded-full transition-all", entry.progress >= 100 ? 'bg-green-500' : entry.progress >= 50 ? 'bg-blue-500' : 'bg-amber-500')} style={{ width: `${entry.progress}%` }} />
                                            </div>
                                        </div>
                                        <button onClick={() => removeTimeEntry(entry.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}

                                {timeEntries.length === 0 && !showAddTimeEntry && (
                                    <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                                        No time entries yet. Start logging your work!
                                    </div>
                                )}

                                {/* Add Time Entry Form */}
                                {showAddTimeEntry ? (
                                    <div className="p-3 rounded-lg border-2 border-dashed border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10 space-y-3">
                                        <select
                                            value={newEntry.taskId}
                                            onChange={e => setNewEntry(prev => ({ ...prev, taskId: e.target.value }))}
                                            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                            <option value="">Select Task</option>
                                            {myTasks.map(t => <option key={t.id} value={t.id}>{t.key} — {t.title}</option>)}
                                        </select>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-gray-500 uppercase mb-1 block">Hours</label>
                                                <select
                                                    value={newEntry.hours}
                                                    onChange={e => setNewEntry(prev => ({ ...prev, hours: parseFloat(e.target.value) }))}
                                                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                >
                                                    {[0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8].map(h => <option key={h} value={h}>{h}h</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-500 uppercase mb-1 block">Progress %</label>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={100}
                                                    step={5}
                                                    value={newEntry.progress}
                                                    onChange={e => setNewEntry(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                                                    className="w-full accent-primary-500"
                                                />
                                                <span className="text-xs text-gray-500 text-center block">{newEntry.progress}%</span>
                                            </div>
                                        </div>
                                        <textarea
                                            value={newEntry.note}
                                            onChange={e => setNewEntry(prev => ({ ...prev, note: e.target.value }))}
                                            placeholder="What did you work on?"
                                            rows={2}
                                            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={addTimeEntry}
                                                disabled={!newEntry.taskId}
                                                className="px-4 py-2 bg-primary-500 text-white text-sm rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
                                            >
                                                Log Time
                                            </button>
                                            <button onClick={() => setShowAddTimeEntry(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowAddTimeEntry(true)}
                                        className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 hover:text-primary-500 hover:border-primary-300 dark:hover:border-primary-700 transition-colors text-sm"
                                    >
                                        <Plus className="w-4 h-4" /> Log Time Entry
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ═══════════════════════════════════ BLOCKERS ═══════════════════════════════════ */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                    onClick={() => toggleSection('blockers')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Blockers & Issues</h3>
                            <p className="text-xs text-gray-500">Report anything blocking your progress</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {blockers.filter(b => b.status === 'OPEN').length > 0 && (
                            <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">{blockers.filter(b => b.status === 'OPEN').length} open</span>
                        )}
                        {expandedSections.has('blockers') ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                </button>

                <AnimatePresence>
                    {expandedSections.has('blockers') && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-200 dark:border-gray-700">
                            <div className="p-4 space-y-3">
                                {blockers.map(b => (
                                    <div key={b.id} className={cn("p-3 rounded-lg border", b.status === 'OPEN' ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' : 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10')}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                                                b.type === 'external' ? 'bg-orange-100 text-orange-700' :
                                                    b.type === 'technical' ? 'bg-blue-100 text-blue-700' :
                                                        b.type === 'dependency' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-gray-100 text-gray-700'
                                            )}>
                                                {b.type}
                                            </span>
                                            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full",
                                                b.status === 'OPEN' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                            )}>
                                                {b.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-900 dark:text-white">{b.description}</p>
                                        {b.impact && <p className="text-xs text-gray-500 mt-1">Impact: {b.impact}</p>}
                                        {b.status === 'OPEN' && (
                                            <button
                                                onClick={() => setBlockers(prev => prev.map(bl => bl.id === b.id ? { ...bl, status: 'RESOLVED', resolvedAt: new Date().toISOString() } : bl))}
                                                className="text-xs text-green-600 hover:underline mt-2"
                                            >
                                                ✓ Mark Resolved
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {showAddBlocker ? (
                                    <div className="p-3 rounded-lg border-2 border-dashed border-red-200 dark:border-red-800 space-y-3">
                                        <select
                                            value={newBlocker.type}
                                            onChange={e => setNewBlocker(prev => ({ ...prev, type: e.target.value as Blocker['type'] }))}
                                            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                            <option value="technical">Technical</option>
                                            <option value="external">External</option>
                                            <option value="resource">Resource</option>
                                            <option value="dependency">Dependency</option>
                                            <option value="other">Other</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={newBlocker.description}
                                            onChange={e => setNewBlocker(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Describe the blocker..."
                                            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                        <input
                                            type="text"
                                            value={newBlocker.impact}
                                            onChange={e => setNewBlocker(prev => ({ ...prev, impact: e.target.value }))}
                                            placeholder="What's the impact?"
                                            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={addBlocker} className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg font-medium hover:bg-red-600">Report Blocker</button>
                                            <button onClick={() => setShowAddBlocker(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowAddBlocker(true)}
                                        className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors text-sm"
                                    >
                                        <AlertTriangle className="w-4 h-4" /> Report a Blocker
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ═══════════════════════════════════ EVENING SUMMARY ═══════════════════════════════════ */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                    onClick={() => toggleSection('summary')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                            <Moon className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Evening Summary</h3>
                            <p className="text-xs text-gray-500">Summarize your day — what was accomplished?</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {summarySubmitted && <span className="text-xs text-green-600 font-medium px-2 py-0.5 bg-green-50 dark:bg-green-900/20 rounded-full">✅ Submitted</span>}
                        {expandedSections.has('summary') ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                </button>

                <AnimatePresence>
                    {expandedSections.has('summary') && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-200 dark:border-gray-700">
                            <div className="p-4 space-y-4">
                                {/* Auto-generated Summary */}
                                <div className="space-y-3">
                                    {/* Completed */}
                                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                                        <h4 className="text-xs font-bold text-green-700 dark:text-green-400 mb-2">✅ COMPLETED ({completedTasks.length})</h4>
                                        {completedTasks.length > 0 ? completedTasks.map(t => (
                                            <div key={t.id} className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                                                <span>├─ {t.title} — 100% ✓</span>
                                                <span className="text-xs text-gray-500">({t.hours}h)</span>
                                            </div>
                                        )) : <p className="text-xs text-gray-500 italic">No tasks completed yet</p>}
                                    </div>

                                    {/* In Progress */}
                                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                                        <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">🟡 IN PROGRESS ({inProgressTasks.length})</h4>
                                        {inProgressTasks.length > 0 ? inProgressTasks.map(t => (
                                            <div key={t.id} className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                                                <span>├─ {t.title} — {t.progress}%</span>
                                                <span className="text-xs text-gray-500">({t.hours}h)</span>
                                            </div>
                                        )) : <p className="text-xs text-gray-500 italic">No tasks in progress</p>}
                                    </div>

                                    {/* Hours Summary */}
                                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs text-gray-500">Hours Logged</span>
                                                <p className="text-lg font-bold text-gray-900 dark:text-white">{totalHoursLogged}h <span className="text-xs font-normal text-gray-400">/ {totalPlannedHours}h planned</span></p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Productivity</span>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{productivityScore}%</p>
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <span key={i} className={cn("text-sm", i < Math.round(productivityScore / 20) ? 'text-amber-400' : 'text-gray-300')}>⭐</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">📝 Notes</label>
                                    <textarea
                                        value={summaryNotes}
                                        onChange={e => setSummaryNotes(e.target.value)}
                                        placeholder="What went well? What didn't go as planned?"
                                        rows={3}
                                        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">💡 Lessons Learned</label>
                                    <textarea
                                        value={lessonsLearned}
                                        onChange={e => setLessonsLearned(e.target.value)}
                                        placeholder="Any insights or learnings from today?"
                                        rows={2}
                                        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-primary-500"
                                    />
                                </div>

                                {/* Submit */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setSummarySubmitted(true)}
                                        disabled={summarySubmitted}
                                        className={cn(
                                            "px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                                            summarySubmitted ? 'bg-green-100 text-green-700 cursor-default' : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg disabled:opacity-50'
                                        )}
                                    >
                                        {summarySubmitted ? '✅ Day Submitted' : '🌆 Submit Evening Summary'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* ═══════════════════════════════════ TEAM CHAT ═══════════════════════════════════ */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                    onClick={() => toggleSection('chat')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-primary-500" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Team Chat</h3>
                            <p className="text-xs text-gray-500">Discuss this report with your team</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {myReport?.comments && myReport.comments.length > 0 && (
                            <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">
                                {myReport.comments.length} messages
                            </span>
                        )}
                        {expandedSections.has('chat') ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                </button>

                <AnimatePresence>
                    {expandedSections.has('chat') && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-200 dark:border-gray-700">
                            {myReport ? (
                                <DailyReportChat
                                    reportId={myReport.id}
                                    comments={myReport.comments || []}
                                    currentUserId={currentUser?.id || ''}
                                    teamMembers={projectMembers}
                                    onCommentAdded={() => loadData()}
                                    onCommentDeleted={() => loadData()}
                                    onCommentUpdated={() => loadData()}
                                />
                            ) : (
                                <div className="p-8 text-center text-gray-400">
                                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Submit your standup first to start chatting</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
