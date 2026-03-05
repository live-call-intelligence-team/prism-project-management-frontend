'use client';

import { useState, useEffect } from 'react';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import { dailyReportsApi, DailyReport, DailyReportEntry } from '@/lib/api/endpoints/dailyReports';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';
import {
    Sun, Moon, Clock, AlertTriangle, CheckCircle, Send,
    ChevronDown, ChevronUp, Target, TrendingUp, Zap, Star,
    MessageSquare, UtensilsCrossed, Sunset, Sunrise, Plus, X,
    Calendar, BarChart3, ListTodo, Timer, Coffee, Flame, Award,
    ArrowRight, Eye, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdvancedDailyUpdateProps { projectId: string; }

type TimePhase = 'pre-office' | 'standup' | 'standup-overdue' | 'hourly' | 'lunch' | 'afternoon' | 'evening' | 'post-work';

const motivationalQuotes = [
    "🚀 Every line of code brings you closer to greatness!",
    "💡 Today's effort becomes tomorrow's success.",
    "🎯 Stay focused. Stay productive. Stay awesome!",
    "⚡ Small progress is still progress. Keep going!",
    "🔥 You're building something amazing today!",
    "✨ Great things are done by a series of small things.",
    "🌟 Your dedication today creates tomorrow's results.",
];

function getTimePhase(): TimePhase {
    const h = new Date().getHours();
    const m = new Date().getMinutes();
    if (h < 9) return 'pre-office';
    if (h === 9 && m < 30) return 'standup';
    if (h === 9 && m >= 30) return 'standup-overdue';
    if (h >= 10 && h < 13) return 'hourly';
    if (h === 13 && m >= 30 || (h === 13 && m < 30 && h >= 13)) return 'lunch';
    if (h >= 14 && h < 17) return 'afternoon';
    if (h >= 17 && h < 18) return 'evening';
    return 'post-work';
}

function formatTime(d: Date) { return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }

function getTimeMessage(phase: TimePhase, name: string, taskCount: number): { emoji: string; title: string; subtitle: string; gradient: string } {
    switch (phase) {
        case 'pre-office': return {
            emoji: '🌙', title: `Good morning, ${name}! ☕`,
            subtitle: taskCount > 0 ? `You have ${taskCount} tasks assigned for today. Review them below and plan your day!` : 'No tasks assigned yet. Enjoy the calm before the storm!',
            gradient: 'from-indigo-500 via-purple-500 to-pink-500'
        };
        case 'standup': return {
            emoji: '🌅', title: `Rise and shine, ${name}!`,
            subtitle: `It's standup time! Select your tasks and submit your morning plan.`,
            gradient: 'from-amber-400 via-orange-500 to-red-500'
        };
        case 'standup-overdue': return {
            emoji: '⏰', title: `${name}, your standup is overdue!`,
            subtitle: 'Please submit your morning standup now. Your team is waiting!',
            gradient: 'from-red-500 via-red-600 to-rose-700'
        };
        case 'hourly': return {
            emoji: '📋', title: `Stay focused, ${name}!`,
            subtitle: 'Log your work as you go. Track hours, progress, and blockers.',
            gradient: 'from-blue-500 via-cyan-500 to-teal-500'
        };
        case 'lunch': return {
            emoji: '🍽️', title: `Enjoy your lunch, ${name}!`,
            subtitle: 'Take a well-deserved break. You can continue logging after lunch.',
            gradient: 'from-green-400 via-emerald-500 to-teal-600'
        };
        case 'afternoon': return {
            emoji: '💪', title: `Keep pushing, ${name}!`,
            subtitle: 'Afternoon sprint! Log your work and crush those tasks.',
            gradient: 'from-blue-600 via-indigo-600 to-violet-600'
        };
        case 'evening': return {
            emoji: '🌙', title: `Wrapping up, ${name}!`,
            subtitle: 'Time to submit your evening summary and reflect on the day.',
            gradient: 'from-purple-500 via-pink-500 to-rose-500'
        };
        case 'post-work': return {
            emoji: '🎉', title: `Great work today, ${name}!`,
            subtitle: 'Your day is complete. Rest well and come back stronger!',
            gradient: 'from-green-500 via-emerald-500 to-teal-500'
        };
    }
}

function getPhaseConfig(phase: TimePhase) {
    const configs: Record<TimePhase, { label: string; icon: string; color: string; bg: string }> = {
        'pre-office': { label: 'PRE-OFFICE', icon: '🌙', color: 'text-indigo-700', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
        'standup': { label: 'STANDUP TIME', icon: '🌅', color: 'text-amber-700', bg: 'bg-amber-100 dark:bg-amber-900/30' },
        'standup-overdue': { label: 'STANDUP OVERDUE', icon: '⏰', color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30' },
        'hourly': { label: 'WORK TRACKING', icon: '📋', color: 'text-blue-700', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        'lunch': { label: 'LUNCH BREAK', icon: '🍽️', color: 'text-green-700', bg: 'bg-green-100 dark:bg-green-900/30' },
        'afternoon': { label: 'AFTERNOON', icon: '💪', color: 'text-indigo-700', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
        'evening': { label: 'EVENING WRAP-UP', icon: '🌙', color: 'text-purple-700', bg: 'bg-purple-100 dark:bg-purple-900/30' },
        'post-work': { label: 'DAY COMPLETE', icon: '✅', color: 'text-green-700', bg: 'bg-green-100 dark:bg-green-900/30' },
    };
    return configs[phase];
}

export default function AdvancedDailyUpdate({ projectId }: AdvancedDailyUpdateProps) {
    const { user } = useAuthStore();
    const [phase, setPhase] = useState<TimePhase>(getTimePhase());
    const [tasks, setTasks] = useState<Issue[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [historyDate, setHistoryDate] = useState('');
    const [historyReport, setHistoryReport] = useState<DailyReport | null>(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Report state
    const [report, setReport] = useState<DailyReport | null>(null);
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [concerns, setConcerns] = useState('');
    const [lessonsLearned, setLessonsLearned] = useState('');

    // Entry form
    const [entryTask, setEntryTask] = useState('');
    const [entryHours, setEntryHours] = useState(1);
    const [entryProgress, setEntryProgress] = useState(50);
    const [entryNotes, setEntryNotes] = useState('');

    // Blocker form
    const [blockerDesc, setBlockerDesc] = useState('');
    const [blockerSeverity, setBlockerSeverity] = useState<'low' | 'medium' | 'high'>('medium');
    const [blockerTags, setBlockerTags] = useState<string[]>([]);
    const [showBlockerForm, setShowBlockerForm] = useState(false);
    const [showEntryForm, setShowEntryForm] = useState(false);

    const randomQuote = motivationalQuotes[new Date().getDate() % motivationalQuotes.length];

    useEffect(() => {
        loadData();
        const timer = setInterval(() => setPhase(getTimePhase()), 60000);
        return () => clearInterval(timer);
    }, [projectId]);

    const loadData = async () => {
        try {
            setLoading(true);
            let issueData;
            try {
                issueData = await issuesApi.getAll({ projectId, assigneeId: user?.id, status: 'TODO,IN_PROGRESS,IN_REVIEW,BLOCKED' });
            } catch {
                try { issueData = await issuesApi.getAll({ projectId, assigneeId: user?.id }); } catch { issueData = { issues: [] }; }
            }
            let loadedTasks = issueData?.issues || [];
            if (loadedTasks.length === 0 && user?.id) {
                try {
                    const allData = await issuesApi.getAll({ assigneeId: user.id, status: 'TODO,IN_PROGRESS,IN_REVIEW,BLOCKED' });
                    loadedTasks = (allData?.issues || []).filter((t: Issue) => t.projectId === projectId);
                } catch { /* ignore */ }
            }
            setTasks(loadedTasks);

            try {
                const memberData = await projectsApi.getMembers(projectId);
                setMembers((memberData || []).map((m: any) => m.user || m));
            } catch { setMembers([]); }

            try {
                const reportData = await dailyReportsApi.getMyReport(projectId);
                if (reportData.report) {
                    setReport(reportData.report);
                    setSelectedTasks(reportData.report.standupTasks || []);
                    setConcerns(reportData.report.concerns || '');
                    setLessonsLearned(reportData.report.lessonsLearned || '');
                    if (reportData.report.standupSubmitted) {
                        const currentPhase = getTimePhase();
                        if (currentPhase === 'standup' || currentPhase === 'standup-overdue') setPhase('hourly');
                    }
                }
            } catch { /* No report yet */ }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadHistory = async (d: string) => {
        setHistoryLoading(true);
        try {
            const data = await dailyReportsApi.getMyReport(projectId, d);
            setHistoryReport(data.report || null);
        } catch { setHistoryReport(null); }
        finally { setHistoryLoading(false); }
    };

    const handleToggleTask = (id: string) => setSelectedTasks(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

    const handleSubmitStandup = async () => {
        setSaving(true);
        try {
            const result = await dailyReportsApi.submitStandup(projectId, { selectedTasks, concerns });
            setReport(result.report);
            setPhase('hourly');
        } catch (e) { console.error(e); alert('Failed to submit standup.'); }
        finally { setSaving(false); }
    };

    const handleAddEntry = async () => {
        if (!entryTask.trim()) return;
        setSaving(true);
        try {
            const matchedTask = tasks.find(t => t.title.toLowerCase().includes(entryTask.toLowerCase()) || t.id === entryTask);
            await dailyReportsApi.addEntry(projectId, { taskId: matchedTask?.id, taskTitle: matchedTask?.title || entryTask, hours: entryHours, progress: entryProgress, notes: entryNotes });
            setEntryTask(''); setEntryHours(1); setEntryProgress(50); setEntryNotes(''); setShowEntryForm(false);
            await loadData();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleAddBlocker = async () => {
        if (!blockerDesc.trim()) return;
        setSaving(true);
        try {
            await dailyReportsApi.addBlocker(projectId, { description: blockerDesc, severity: blockerSeverity, taggedPeople: blockerTags });
            setBlockerDesc(''); setBlockerSeverity('medium'); setBlockerTags([]); setShowBlockerForm(false);
            await loadData();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleSubmitSummary = async () => {
        setSaving(true);
        try {
            const result = await dailyReportsApi.submitSummary(projectId, { lessonsLearned });
            setReport(result.report);
            setPhase('post-work');
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const workEntries = (report?.entries || []).filter(e => e.type === 'work');
    const blockerEntries = (report?.entries || []).filter(e => e.type === 'blocker');
    const totalHours = workEntries.reduce((s, e) => s + Number(e.hours), 0);
    const hour = new Date().getHours();
    const firstName = user?.firstName || 'there';
    const timeMsg = getTimeMessage(phase, firstName, tasks.length);
    const phaseConfig = getPhaseConfig(phase);

    const highPriority = tasks.filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL' || t.priority === 'HIGHEST');
    const medPriority = tasks.filter(t => t.priority === 'MEDIUM');
    const lowPriority = tasks.filter(t => !['HIGH', 'CRITICAL', 'HIGHEST', 'MEDIUM'].includes(t.priority));
    const totalEstHours = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);

    if (loading) return <div className="text-center py-12 text-gray-400">Loading daily tracker...</div>;

    return (
        <div className="space-y-4 max-w-3xl mx-auto">
            {/* Phase Badge + Clock */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide", phaseConfig.bg, phaseConfig.color)}>
                        {phaseConfig.icon} {phaseConfig.label}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{formatTime(new Date())}</span>
                </div>
                <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-gray-500 hover:text-primary-500 flex items-center gap-1 transition-colors">
                    <History className="w-3.5 h-3.5" /> {showHistory ? 'Hide History' : 'View History'}
                </button>
            </div>

            {/* History Panel */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> View Past Reports</h3>
                            <div className="flex gap-2">
                                <input type="date" value={historyDate} onChange={e => { setHistoryDate(e.target.value); loadHistory(e.target.value); }} className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white" />
                            </div>
                            {historyLoading && <p className="text-xs text-gray-400">Loading...</p>}
                            {historyDate && !historyLoading && !historyReport && <p className="text-xs text-gray-400 italic">No report found for this date.</p>}
                            {historyReport && (
                                <div className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-3 mt-2">
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className={cn("px-2 py-0.5 rounded-full font-bold text-[9px] uppercase", historyReport.status === 'excellent' ? 'bg-green-100 text-green-700' : historyReport.status === 'good' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700')}>{historyReport.status}</span>
                                        <span className="text-gray-500">Standup: {historyReport.standupSubmitted ? `✅ ${historyReport.standupTime}` : '❌ Not submitted'}</span>
                                        <span className="text-gray-500">Summary: {historyReport.summarySubmitted ? `✅ ${historyReport.summaryTime}` : '❌ Not submitted'}</span>
                                    </div>
                                    {(historyReport.entries || []).filter(e => e.type === 'work').map(e => (
                                        <div key={e.id} className="flex items-center gap-2 text-xs py-1 border-b border-gray-50 dark:border-gray-800 last:border-0">
                                            <span className="text-gray-400 w-14">{e.time}</span>
                                            <span className="flex-1 text-gray-600 dark:text-gray-400">{e.taskTitle}</span>
                                            <span className="text-gray-400">{e.hours}h · {e.progress}%</span>
                                        </div>
                                    ))}
                                    {(historyReport.entries || []).filter(e => e.type === 'blocker').length > 0 && (
                                        <div className="text-xs text-red-500 font-medium">🚨 {(historyReport.entries || []).filter(e => e.type === 'blocker').length} blocker(s) reported</div>
                                    )}
                                    {historyReport.lessonsLearned && <p className="text-xs text-gray-500 italic mt-1">💡 &quot;{historyReport.lessonsLearned}&quot;</p>}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Banner */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("bg-gradient-to-r rounded-2xl p-6 text-white relative overflow-hidden", timeMsg.gradient)}>
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">{phase === 'pre-office' ? <Moon className="w-32 h-32" /> : phase === 'lunch' ? <Coffee className="w-32 h-32" /> : phase === 'evening' || phase === 'post-work' ? <Star className="w-32 h-32" /> : <Sun className="w-32 h-32" />}</div>
                <div className="relative z-10 text-center">
                    <p className="text-3xl mb-2">{timeMsg.emoji}</p>
                    <h2 className="text-xl font-bold">{timeMsg.title}</h2>
                    <p className="text-white/75 text-sm mt-1.5 max-w-lg mx-auto">{timeMsg.subtitle}</p>
                    <p className="text-white/50 text-[10px] mt-3 italic">{randomQuote}</p>
                </div>
            </motion.div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-2.5">
                {[
                    { icon: <ListTodo className="w-4 h-4" />, label: 'Tasks', value: tasks.length, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { icon: <Flame className="w-4 h-4" />, label: 'High Priority', value: highPriority.length, color: highPriority.length > 0 ? 'text-red-600' : 'text-gray-400', bg: highPriority.length > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800' },
                    { icon: <Timer className="w-4 h-4" />, label: 'Est. Hours', value: `${totalEstHours}h`, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { icon: <TrendingUp className="w-4 h-4" />, label: 'Logged', value: `${totalHours}h`, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                ].map((s, i) => (
                    <div key={i} className={cn("rounded-xl p-3 border border-gray-100 dark:border-gray-700 text-center", s.bg)}>
                        <div className={cn("flex items-center justify-center mb-1", s.color)}>{s.icon}</div>
                        <p className={cn("text-lg font-bold", s.color)}>{String(s.value)}</p>
                        <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wide">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* === TODAY'S TASKS === */}
            {tasks.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Target className="w-4 h-4 text-primary-500" /> Today&apos;s Tasks ({tasks.length})</h3>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {/* High Priority */}
                        {highPriority.length > 0 && (
                            <div className="px-4 py-2">
                                <p className="text-[9px] text-red-500 uppercase font-bold tracking-wider mb-1">🔴 HIGH PRIORITY ({highPriority.length})</p>
                                {highPriority.map(t => (
                                    <div key={t.id} className="flex items-center gap-2 text-xs py-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                        <span className="flex-1 text-gray-700 dark:text-gray-300 font-medium">{t.title}</span>
                                        <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase", t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' : t.status === 'TODO' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-600')}>{t.status?.replace('_', ' ')}</span>
                                        {t.estimatedHours && <span className="text-gray-400">{t.estimatedHours}h</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Medium Priority */}
                        {medPriority.length > 0 && (
                            <div className="px-4 py-2">
                                <p className="text-[9px] text-amber-500 uppercase font-bold tracking-wider mb-1">🟡 MEDIUM PRIORITY ({medPriority.length})</p>
                                {medPriority.map(t => (
                                    <div key={t.id} className="flex items-center gap-2 text-xs py-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                        <span className="flex-1 text-gray-700 dark:text-gray-300">{t.title}</span>
                                        <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase", t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500')}>{t.status?.replace('_', ' ')}</span>
                                        {t.estimatedHours && <span className="text-gray-400">{t.estimatedHours}h</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Low Priority */}
                        {lowPriority.length > 0 && (
                            <div className="px-4 py-2">
                                <p className="text-[9px] text-green-500 uppercase font-bold tracking-wider mb-1">🟢 OTHER ({lowPriority.length})</p>
                                {lowPriority.map(t => (
                                    <div key={t.id} className="flex items-center gap-2 text-xs py-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                        <span className="flex-1 text-gray-700 dark:text-gray-300">{t.title}</span>
                                        <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase", t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500')}>{t.status?.replace('_', ' ')}</span>
                                        {t.estimatedHours && <span className="text-gray-400">{t.estimatedHours}h</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Task summary footer */}
                    <div className="bg-gray-50 dark:bg-gray-900/30 px-4 py-2.5 flex items-center justify-between text-[10px] text-gray-400">
                        <span>Total: {tasks.length} tasks · {totalEstHours}h estimated</span>
                        <span>{tasks.filter(t => t.status === 'IN_PROGRESS').length} in progress · {tasks.filter(t => t.status === 'TODO').length} to do</span>
                    </div>
                </div>
            )}

            {/* === PROGRESS BAR (if work started) === */}
            {totalHours > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-primary-500" /> Today&apos;s Progress</h3>
                        <span className="text-xs font-bold text-primary-600">{Math.round((totalHours / 8) * 100)}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (totalHours / 8) * 100)}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                            className={cn("h-3 rounded-full", totalHours >= 6 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : totalHours >= 3 ? 'bg-gradient-to-r from-blue-400 to-cyan-500' : 'bg-gradient-to-r from-amber-400 to-orange-500')} />
                    </div>
                    <div className="grid grid-cols-4 gap-3 mt-3 text-center">
                        <div><p className="text-lg font-bold text-gray-900 dark:text-white">{totalHours}h</p><p className="text-[9px] text-gray-400">Logged</p></div>
                        <div><p className="text-lg font-bold text-green-600">{workEntries.filter(e => e.progress >= 100).length}</p><p className="text-[9px] text-gray-400">Done</p></div>
                        <div><p className="text-lg font-bold text-blue-600">{workEntries.filter(e => e.progress > 0 && e.progress < 100).length}</p><p className="text-[9px] text-gray-400">Active</p></div>
                        <div><p className="text-lg font-bold text-red-500">{blockerEntries.filter(b => b.blockerStatus === 'OPEN').length}</p><p className="text-[9px] text-gray-400">Blockers</p></div>
                    </div>
                </div>
            )}

            {/* === MORNING STANDUP (when phase is standup/overdue and not submitted) === */}
            {(phase === 'standup' || phase === 'standup-overdue') && !report?.standupSubmitted && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Sunrise className="w-4 h-4 text-amber-500" /> Morning Standup</h3>
                    <p className="text-xs text-gray-500">Select the tasks you plan to work on today:</p>
                    {tasks.map(t => (
                        <button key={t.id} onClick={() => handleToggleTask(t.id)} className={cn("w-full flex items-center gap-2 text-xs p-2.5 rounded-lg transition-all text-left border", selectedTasks.includes(t.id) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 shadow-sm' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/30')}>
                            <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors", selectedTasks.includes(t.id) ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 dark:border-gray-600')}>
                                {selectedTasks.includes(t.id) && <CheckCircle className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1">
                                <span className="text-gray-700 dark:text-gray-300">{t.title}</span>
                                {t.estimatedHours && <span className="text-gray-400 ml-2 text-[9px]">~{t.estimatedHours}h</span>}
                            </div>
                            <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase", t.priority === 'HIGH' || t.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' : t.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500')}>{t.priority}</span>
                        </button>
                    ))}
                    {tasks.length === 0 && <p className="text-xs text-gray-400 py-2">No tasks assigned. You can still submit your standup.</p>}
                    <div><label className="text-[9px] text-gray-500 uppercase font-bold tracking-wide">Any Concerns?</label><textarea value={concerns} onChange={e => setConcerns(e.target.value)} placeholder="Any concerns or blockers for today..." className="w-full mt-1 text-xs p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white h-16 resize-none" /></div>
                    <button onClick={handleSubmitStandup} disabled={saving} className="w-full mt-2 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold text-sm hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20">
                        <Send className="w-4 h-4" /> {saving ? 'Submitting...' : 'Submit Morning Standup'}
                    </button>
                </motion.div>
            )}

            {/* === HOURLY WORK TRACKING (after standup or during work hours) === */}
            {(phase === 'hourly' || phase === 'afternoon' || report?.standupSubmitted) && phase !== 'evening' && phase !== 'post-work' && phase !== 'lunch' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    {/* Logged entries */}
                    {workEntries.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-500" /> Time Log ({workEntries.length} entries · {totalHours}h)</h3>
                            </div>
                            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {workEntries.map(e => (
                                    <div key={e.id} className="flex items-center gap-3 text-xs px-4 py-2.5">
                                        <span className="text-gray-400 w-16 flex-shrink-0 font-mono">{e.time}</span>
                                        <span className="flex-1 text-gray-700 dark:text-gray-300">{e.taskTitle}</span>
                                        <span className="text-gray-500 font-medium">{e.hours}h</span>
                                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"><div className="h-1.5 rounded-full bg-green-500 transition-all" style={{ width: `${e.progress}%` }} /></div>
                                        <span className="text-gray-400 w-8 text-right">{e.progress}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add entry */}
                    {showEntryForm ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-primary-200 dark:border-primary-800 p-4 space-y-3 shadow-lg shadow-primary-500/5">
                            <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Plus className="w-4 h-4 text-primary-500" /> Log Work Entry</h3><button onClick={() => setShowEntryForm(false)}><X className="w-4 h-4 text-gray-400" /></button></div>
                            <select value={entryTask} onChange={e => setEntryTask(e.target.value)} className="w-full text-xs p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
                                <option value="">Select a task...</option>
                                {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                            </select>
                            <input value={entryTask && !tasks.find(t => t.id === entryTask) ? entryTask : ''} onChange={e => setEntryTask(e.target.value)} placeholder="Or type custom..." className="w-full text-xs p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white" />
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[9px] text-gray-500 uppercase font-bold">Hours</label><input type="number" min="0.5" max="8" step="0.5" value={entryHours} onChange={e => setEntryHours(Number(e.target.value))} className="w-full text-xs p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white mt-1" /></div>
                                <div><label className="text-[9px] text-gray-500 uppercase font-bold">Progress %</label><input type="range" min="0" max="100" step="10" value={entryProgress} onChange={e => setEntryProgress(Number(e.target.value))} className="w-full mt-2" /><span className="text-xs text-gray-500">{entryProgress}%</span></div>
                            </div>
                            <textarea value={entryNotes} onChange={e => setEntryNotes(e.target.value)} placeholder="What did you work on?" className="w-full text-xs p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white h-14 resize-none" />
                            <button onClick={handleAddEntry} disabled={saving} className="w-full py-2.5 bg-primary-500 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-primary-600 transition-colors">{saving ? 'Saving...' : '✅ Log Entry'}</button>
                        </div>
                    ) : (
                        <button onClick={() => setShowEntryForm(true)} className="w-full py-3.5 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-500 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all flex items-center justify-center gap-2 font-medium">
                            <Plus className="w-4 h-4" /> Log Work Entry
                        </button>
                    )}

                    {/* Blocker */}
                    {showBlockerForm ? (
                        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 p-4 space-y-3">
                            <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-red-600 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Report Blocker</h3><button onClick={() => setShowBlockerForm(false)}><X className="w-4 h-4 text-gray-400" /></button></div>
                            <textarea value={blockerDesc} onChange={e => setBlockerDesc(e.target.value)} placeholder="Describe the blocker..." className="w-full text-xs p-2.5 border border-red-200 dark:border-red-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white h-16 resize-none" />
                            <select value={blockerSeverity} onChange={e => setBlockerSeverity(e.target.value as any)} className="w-full text-xs p-2.5 border border-red-200 dark:border-red-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                                <option value="low">🟡 Low</option><option value="medium">🟠 Medium</option><option value="high">🔴 High</option>
                            </select>
                            <div><label className="text-[9px] text-gray-500 uppercase font-bold mb-1.5 block">Tag people for help</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {members.filter(m => m.id !== user?.id).map(m => (
                                        <button key={m.id} onClick={() => setBlockerTags(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                                            className={cn("text-[10px] px-2.5 py-1 rounded-full border transition-all", blockerTags.includes(m.id) ? 'bg-red-100 border-red-300 text-red-700 shadow-sm' : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400')}>
                                            @{m.firstName} {m.lastName?.[0]}.
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={handleAddBlocker} disabled={saving} className="w-full py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold disabled:opacity-50">{saving ? 'Reporting...' : '🚨 Report Blocker'}</button>
                        </div>
                    ) : (
                        <button onClick={() => setShowBlockerForm(true)} className="w-full py-2.5 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center justify-center gap-1.5 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" /> Report Blocker
                        </button>
                    )}

                    {/* Existing blockers */}
                    {blockerEntries.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-900/30 p-4">
                            <h3 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Active Blockers</h3>
                            {blockerEntries.map(b => (
                                <div key={b.id} className="flex items-center gap-2 text-xs py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", b.blockerStatus === 'OPEN' ? 'bg-red-500 animate-pulse' : 'bg-green-500')} />
                                    <span className="flex-1 text-gray-700 dark:text-gray-300">{b.notes || b.taskTitle}</span>
                                    <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold", b.severity === 'high' ? 'bg-red-100 text-red-600' : b.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-yellow-50 text-yellow-600')}>{b.severity}</span>
                                    <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold", b.blockerStatus === 'OPEN' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600')}>{b.blockerStatus}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Evening summary shortcut */}
                    {(phase === 'afternoon' || hour >= 16) && !report?.summarySubmitted && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl border border-purple-200 dark:border-purple-800 p-4 space-y-3">
                            <h3 className="text-sm font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5"><Sunset className="w-4 h-4" /> Ready to wrap up?</h3>
                            <p className="text-xs text-gray-500">Submit your evening summary when you&apos;re done for the day.</p>
                            <textarea value={lessonsLearned} onChange={e => setLessonsLearned(e.target.value)} placeholder="Lessons learned, notes for tomorrow..." className="w-full text-xs p-2.5 border border-purple-200 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white h-16 resize-none" />
                            <button onClick={handleSubmitSummary} disabled={saving} className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-bold disabled:opacity-50 shadow-lg shadow-purple-500/20">{saving ? 'Submitting...' : '🌙 Submit Evening Summary'}</button>
                        </div>
                    )}
                </motion.div>
            )}

            {/* === LUNCH BREAK === */}
            {phase === 'lunch' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    {totalHours > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                            <p className="text-xs text-gray-500 mb-1">Morning progress</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalHours}h <span className="text-sm text-gray-400 font-normal">logged before lunch</span></p>
                        </div>
                    )}
                </motion.div>
            )}

            {/* === EVENING SUMMARY === */}
            {phase === 'evening' && !report?.summarySubmitted && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    {totalHours > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">📊 Day Summary</h3>
                            <div className="grid grid-cols-4 gap-3 text-center text-xs">
                                <div><p className="text-lg font-bold text-gray-900 dark:text-white">{totalHours}h</p><p className="text-gray-400">Logged</p></div>
                                <div><p className="text-lg font-bold text-green-600">{workEntries.filter(e => e.progress >= 100).length}</p><p className="text-gray-400">Done</p></div>
                                <div><p className="text-lg font-bold text-blue-600">{workEntries.length}</p><p className="text-gray-400">Entries</p></div>
                                <div><p className="text-lg font-bold text-red-500">{blockerEntries.filter(b => b.blockerStatus === 'OPEN').length}</p><p className="text-gray-400">Blockers</p></div>
                            </div>
                        </div>
                    )}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                        <h3 className="text-sm font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5"><Sunset className="w-4 h-4" /> Evening Summary</h3>
                        <textarea value={lessonsLearned} onChange={e => setLessonsLearned(e.target.value)} placeholder="Lessons learned, reflections, notes for tomorrow..." className="w-full text-xs p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white h-20 resize-none" />
                        <button onClick={handleSubmitSummary} disabled={saving} className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 shadow-lg shadow-purple-500/20">{saving ? 'Submitting...' : '🌙 Submit Evening Summary'}</button>
                    </div>
                </motion.div>
            )}

            {/* === POST-WORK / DAY COMPLETE === */}
            {(phase === 'post-work' || report?.summarySubmitted) && phase !== 'standup' && phase !== 'standup-overdue' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-800 p-5">
                        <div className="text-center mb-4">
                            <Award className="w-10 h-10 text-green-500 mx-auto mb-2" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Day Complete! 🎉</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Your report has been submitted. Great work today!</p>
                        </div>
                        <div className="grid grid-cols-4 gap-3 text-center">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2"><p className="text-xl font-bold text-blue-600">{totalHours}h</p><p className="text-[9px] text-gray-400 uppercase">Logged</p></div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2"><p className="text-xl font-bold text-green-600">{workEntries.filter(e => e.progress >= 100).length}</p><p className="text-[9px] text-gray-400 uppercase">Done</p></div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2"><p className="text-xl font-bold text-purple-600">{workEntries.length}</p><p className="text-[9px] text-gray-400 uppercase">Entries</p></div>
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2"><p className="text-xl font-bold text-red-500">{blockerEntries.filter(b => b.blockerStatus === 'OPEN').length}</p><p className="text-[9px] text-gray-400 uppercase">Blockers</p></div>
                        </div>
                        {report?.lessonsLearned && (
                            <div className="mt-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
                                <p className="text-[9px] text-gray-400 uppercase font-bold mb-1">💡 Lessons Learned</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 italic">&quot;{report.lessonsLearned}&quot;</p>
                            </div>
                        )}
                        {report?.standupTime && (
                            <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400 justify-center">
                                <span>🌅 Standup: {report.standupTime}</span>
                                {report.summaryTime && <span>🌙 Summary: {report.summaryTime}</span>}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Comments section */}
            {report && (report.comments || []).length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-primary-500" /> Comments ({(report.comments || []).length})</h3>
                    {(report.comments || []).map(c => (
                        <div key={c.id} className="flex gap-2 text-xs py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                            <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-[9px] font-bold flex-shrink-0">{c.user?.firstName?.[0]}{c.user?.lastName?.[0]}</div>
                            <div><span className="font-bold text-gray-700 dark:text-gray-300">{c.user?.firstName} {c.user?.lastName}</span><span className="text-gray-400 ml-1.5">{new Date(c.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span><p className="text-gray-600 dark:text-gray-400 mt-0.5">{c.content}</p></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
