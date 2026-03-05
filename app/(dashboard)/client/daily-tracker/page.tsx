'use client';

import { useState, useEffect, useMemo } from 'react';
import Container from '@/components/ui/Container';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { cn } from '@/lib/utils';
import {
    Clock, Users, CheckCircle, TrendingUp, Calendar, BarChart3,
    FolderKanban, Star, MessageSquare, Shield, Package, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Project { id: string; name: string; key: string; }

export default function ClientDailyTrackerPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [loading, setLoading] = useState(true);
    const [date] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

    useEffect(() => { loadProjects(); }, []);

    const loadProjects = async () => {
        try {
            const data = await projectsApi.getAll();
            const list = (data.projects || data || []) as Project[];
            setProjects(list);
            if (list.length > 0) setSelectedProject(list[0].id);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const currentProject = projects.find(p => p.id === selectedProject);

    // Mock sanitized data for client
    const projectProgress = {
        overall: 60, onSchedule: true, quality: 'Excellent', teamHealth: 'Good',
        featuresTotal: 4, featuresDone: 2, daysLeft: 47,
    };

    const features = [
        { name: 'Rental Location Discovery', status: 'COMPLETED', progress: 100, delivered: 'Feb 28', quality: 'Excellent' },
        { name: 'Battery Rental Checkout', status: 'COMPLETED', progress: 100, delivered: 'Mar 1', quality: 'Excellent' },
        { name: 'Return & Replacement', status: 'IN_PROGRESS', progress: 60, due: 'Mar 25', quality: 'Good' },
        { name: 'Payment & Billing', status: 'PLANNED', progress: 0, due: 'Apr 10', quality: 'N/A' },
    ];

    const todaySummary = {
        teamSize: 9, activeMembers: 9, tasksCompleted: 5, hoursWorked: 72,
        blockers: 0, quality: 'No new issues',
    };

    const deliverables = [
        { name: 'Feature 3 — Return & Replacement', date: 'Mar 22', status: 'On Track' },
        { name: 'Feature 4 — Payment & Billing', date: 'Apr 10', status: 'On Track' },
        { name: 'Full MVP Release', date: 'Apr 30', status: 'On Track' },
    ];

    if (loading) return <Container><LoadingSkeleton count={4} className="h-24 w-full" /></Container>;

    return (
        <Container size="full">
            <div className="space-y-5">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><BarChart3 className="w-6 h-6 text-violet-500" />Project Progress Tracker</h1>
                            <p className="text-sm text-gray-500 mt-0.5">{date} · Real-time project visibility</p>
                        </div>
                        {projects.length > 1 && (
                            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                {/* Project Summary Banner */}
                <div className="bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl p-5 text-white">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="font-bold text-xl">{currentProject?.name || 'Project'}</h2>
                            <p className="text-white/70 text-sm mt-0.5">Status: {projectProgress.onSchedule ? '🟢 On Track' : '🟡 Attention Needed'} · {projectProgress.daysLeft} days left</p>
                        </div>
                        <div className="flex gap-6 text-center">
                            <div><p className="text-3xl font-bold">{projectProgress.overall}%</p><p className="text-[10px] text-white/70">Complete</p></div>
                            <div><p className="text-3xl font-bold">{projectProgress.featuresDone}/{projectProgress.featuresTotal}</p><p className="text-[10px] text-white/70">Features</p></div>
                            <div><p className="text-3xl font-bold">{projectProgress.daysLeft}</p><p className="text-[10px] text-white/70">Days Left</p></div>
                        </div>
                    </div>
                    <div className="mt-4 w-full h-3 bg-white/20 rounded-full"><div className="h-3 bg-white rounded-full transition-all" style={{ width: `${projectProgress.overall}%` }} /></div>
                </div>

                {/* Confidence Metrics */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'On-Time Delivery', value: '95%', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' },
                        { label: 'Quality Score', value: '90%', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' },
                        { label: 'Budget Status', value: 'On Budget', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800' },
                    ].map(m => (
                        <div key={m.label} className={cn("rounded-xl border p-3 text-center", m.bg)}>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">{m.label}</p>
                            <p className={cn("text-xl font-bold mt-1", m.color)}>{m.value}</p>
                        </div>
                    ))}
                </div>

                {/* Features & Deliverables */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Package className="w-4 h-4 text-violet-500" />Features & Deliverables</h3>
                    {features.map((f, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                f.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30' : f.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700')}>
                                {f.status === 'COMPLETED' ? <CheckCircle className="w-4 h-4 text-green-500" /> : f.status === 'IN_PROGRESS' ? <TrendingUp className="w-4 h-4 text-blue-500" /> : <Clock className="w-4 h-4 text-gray-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{f.name}</p>
                                <p className="text-[10px] text-gray-400">{f.status === 'COMPLETED' ? `Delivered: ${f.delivered}` : `Due: ${f.due}`} · Quality: {f.quality}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"><div className={cn("h-1.5 rounded-full", f.progress >= 100 ? 'bg-green-500' : f.progress > 0 ? 'bg-blue-500' : 'bg-gray-300')} style={{ width: `${f.progress}%` }} /></div>
                                <span className={cn("text-xs font-bold", f.progress >= 100 ? 'text-green-600' : f.progress > 0 ? 'text-blue-600' : 'text-gray-400')}>{f.progress}%</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Team Activity Today */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Users className="w-4 h-4 text-violet-500" />Team Activity Today</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500">Active Team</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{todaySummary.activeMembers}/{todaySummary.teamSize}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500">Tasks Completed</p>
                            <p className="text-lg font-bold text-green-600">{todaySummary.tasksCompleted}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500">Hours Worked</p>
                            <p className="text-lg font-bold text-blue-600">{todaySummary.hoursWorked}h</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500">Quality Issues</p>
                            <p className="text-lg font-bold text-green-600">{todaySummary.quality}</p>
                        </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3 text-center text-sm text-green-700 dark:text-green-400">
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Team Productivity: <strong>Excellent</strong> · All members active and on track
                    </div>
                </div>

                {/* Blockers Affecting Client */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Shield className="w-4 h-4 text-green-500" />Blockers Affecting Your Project</h3>
                    <div className="mt-2 bg-green-50 dark:bg-green-900/10 rounded-lg p-3 text-center">
                        <p className="text-sm text-green-700 dark:text-green-400">✅ No blockers affecting project timeline</p>
                    </div>
                </div>

                {/* Upcoming Deliverables */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-violet-500" />Upcoming Deliverables</h3>
                    {deliverables.map((d, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/30 text-sm">
                            <ArrowRight className="w-4 h-4 text-violet-500 flex-shrink-0" />
                            <span className="flex-1 text-gray-700 dark:text-gray-300">{d.name}</span>
                            <span className="text-xs text-gray-400">{d.date}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full font-bold">{d.status}</span>
                        </div>
                    ))}
                </div>

                {/* Contact PM */}
                <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-xl p-4 text-center">
                    <p className="text-sm text-violet-700 dark:text-violet-400 mb-2">Have questions about your project?</p>
                    <button className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 mx-auto transition-colors">
                        <MessageSquare className="w-4 h-4" /> Contact Project Manager
                    </button>
                </div>
            </div>
        </Container>
    );
}
