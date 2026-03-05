'use client';

import { useState, useEffect, useMemo } from 'react';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { issuesApi, Issue } from '@/lib/api/endpoints/issues';
import { cn } from '@/lib/utils';
import {
    Users, TrendingUp, Target, Zap, Award, Search, ChevronDown,
    BarChart3, Star, Clock, CheckCircle, AlertTriangle, Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TeamPerformanceProps {
    projectId: string;
}

interface MemberMetrics {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
    assigned: number;
    completed: number;
    active: number;
    overdue: number;
    totalHours: number;
    velocity: number; // issues per sprint equivalent
    qualityScore: number; // 0-100
    utilization: number; // 0-100
}

export function TeamPerformance({ projectId }: TeamPerformanceProps) {
    const [members, setMembers] = useState<any[]>([]);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'comparison' | 'detailed'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [sortBy, setSortBy] = useState<'productivity' | 'quality' | 'velocity' | 'name'>('productivity');
    const [selectedMember, setSelectedMember] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [membersData, issuesData] = await Promise.all([
                projectsApi.getMembers(projectId),
                issuesApi.getAll({ projectId, limit: 500 })
            ]);
            setMembers(membersData);
            setIssues(issuesData.issues || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Compute metrics for each member
    const memberMetrics: MemberMetrics[] = useMemo(() => {
        return members.map(m => {
            const memberId = m.id || m.user?.id;
            const memberIssues = issues.filter(i => i.assigneeId === memberId || i.assignee?.id === memberId);
            const completed = memberIssues.filter(i => i.status === 'DONE').length;
            const active = memberIssues.filter(i => i.status === 'IN_PROGRESS' || i.status === 'IN_REVIEW').length;
            const assigned = memberIssues.length;
            const overdue = memberIssues.filter(i => {
                if (!i.dueDate || i.status === 'DONE') return false;
                return new Date(i.dueDate) < new Date();
            }).length;

            const utilization = assigned > 0 ? Math.min(100, Math.round((active / Math.max(assigned, 1)) * 100 + (completed / Math.max(assigned, 1)) * 100)) : 0;
            const qualityScore = completed > 0 ? Math.min(100, Math.round(100 - (overdue / Math.max(completed, 1)) * 30)) : 100;
            const velocity = completed; // simplified

            return {
                id: memberId,
                firstName: m.firstName || m.user?.firstName || '',
                lastName: m.lastName || m.user?.lastName || '',
                email: m.email || m.user?.email || '',
                role: m.role || m.projectRole || 'MEMBER',
                avatar: m.avatar || m.user?.avatar,
                assigned, completed, active, overdue,
                totalHours: completed * 4 + active * 2, // estimated
                velocity, qualityScore, utilization,
            };
        });
    }, [members, issues]);

    // Filtered and sorted metrics
    const filteredMetrics = useMemo(() => {
        let result = memberMetrics;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
        }
        if (roleFilter) {
            result = result.filter(m => m.role === roleFilter);
        }
        result.sort((a, b) => {
            switch (sortBy) {
                case 'productivity': return b.completed - a.completed;
                case 'quality': return b.qualityScore - a.qualityScore;
                case 'velocity': return b.velocity - a.velocity;
                case 'name': return a.firstName.localeCompare(b.firstName);
                default: return 0;
            }
        });
        return result;
    }, [memberMetrics, searchQuery, roleFilter, sortBy]);

    // Summary stats
    const teamStats = useMemo(() => ({
        totalMembers: memberMetrics.length,
        avgUtilization: memberMetrics.length > 0 ? Math.round(memberMetrics.reduce((s, m) => s + m.utilization, 0) / memberMetrics.length) : 0,
        totalCompleted: memberMetrics.reduce((s, m) => s + m.completed, 0),
        avgQuality: memberMetrics.length > 0 ? Math.round(memberMetrics.reduce((s, m) => s + m.qualityScore, 0) / memberMetrics.length) : 0,
        overloaded: memberMetrics.filter(m => m.utilization > 90).length,
        topPerformer: memberMetrics.length > 0 ? [...memberMetrics].sort((a, b) => b.completed - a.completed)[0] : null,
    }), [memberMetrics]);

    const getRoleColor = (role: string) => {
        const r = role?.toUpperCase();
        if (r === 'ADMIN') return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
        if (r === 'PROJECT_MANAGER') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
        if (r === 'SCRUM_MASTER') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
        if (r === 'DEVELOPER' || r === 'EMPLOYEE') return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary-500" />
                    Team Performance
                </h2>
                <div className="flex items-center gap-2">
                    {['grid', 'comparison', 'detailed'].map(v => (
                        <button
                            key={v}
                            onClick={() => setViewMode(v as any)}
                            className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-colors capitalize",
                                viewMode === v ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            )}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Users className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] text-gray-500 uppercase">Members</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{teamStats.totalMembers}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] text-gray-500 uppercase">Avg Util</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{teamStats.avgUtilization}%</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-[10px] text-gray-500 uppercase">Done</span>
                    </div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{teamStats.totalCompleted}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Star className="w-3 h-3 text-purple-500" />
                        <span className="text-[10px] text-gray-500 uppercase">Avg Quality</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{teamStats.avgQuality}%</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        <span className="text-[10px] text-gray-500 uppercase">Overloaded</span>
                    </div>
                    <p className={cn("text-xl font-bold", teamStats.overloaded > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white')}>{teamStats.overloaded}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Award className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] text-gray-500 uppercase">Top Performer</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{teamStats.topPerformer ? `${teamStats.topPerformer.firstName}` : '—'}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search team members..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="text-sm px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                    <option value="">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="PROJECT_MANAGER">PM</option>
                    <option value="SCRUM_MASTER">Scrum Master</option>
                    <option value="DEVELOPER">Developer</option>
                    <option value="EMPLOYEE">Employee</option>
                </select>
                <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="text-sm px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                    <option value="productivity">Sort: Productivity</option>
                    <option value="quality">Sort: Quality</option>
                    <option value="velocity">Sort: Velocity</option>
                    <option value="name">Sort: Name</option>
                </select>
            </div>

            {/* Views */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredMetrics.map((m, i) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn("bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer",
                                m.utilization > 90 && 'ring-1 ring-red-200 dark:ring-red-900'
                            )}
                            onClick={() => setSelectedMember(selectedMember === m.id ? null : m.id)}
                        >
                            <div className="p-4">
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                                        {m.firstName[0]}{m.lastName[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{m.firstName} {m.lastName}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase", getRoleColor(m.role))}>{m.role?.replace('_', ' ')}</span>
                                            {m.utilization > 90 && <span className="text-[9px] text-red-500 font-bold">🔴 OVERLOADED</span>}
                                        </div>
                                    </div>
                                    {i === 0 && sortBy === 'productivity' && <Award className="w-5 h-5 text-amber-400 flex-shrink-0" />}
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-2 text-center">
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{m.assigned}</p>
                                        <p className="text-[9px] text-gray-500 uppercase">Assigned</p>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-2 text-center">
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{m.completed}</p>
                                        <p className="text-[9px] text-gray-500 uppercase">Done</p>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-2 text-center">
                                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{m.active}</p>
                                        <p className="text-[9px] text-gray-500 uppercase">Active</p>
                                    </div>
                                </div>

                                {/* Utilization Bar */}
                                <div className="mb-2">
                                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                        <span>Utilization</span>
                                        <span className="font-medium">{m.utilization}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                                        <div className={cn("h-1.5 rounded-full transition-all",
                                            m.utilization > 90 ? 'bg-red-500' : m.utilization > 70 ? 'bg-amber-500' : 'bg-green-500'
                                        )} style={{ width: `${m.utilization}%` }} />
                                    </div>
                                </div>

                                {/* Quality + Overdue */}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Quality: <strong className={cn(m.qualityScore >= 80 ? 'text-green-600' : m.qualityScore >= 60 ? 'text-amber-600' : 'text-red-600')}>{m.qualityScore}%</strong></span>
                                    {m.overdue > 0 && <span className="text-red-500 font-medium">⏰ {m.overdue} overdue</span>}
                                </div>
                            </div>

                            {/* Expanded Detail */}
                            {selectedMember === m.id && (
                                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-b-xl space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-[10px] text-gray-500 uppercase">Est. Hours</span>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{m.totalHours}h</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500 uppercase">Velocity</span>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{m.velocity} issues</p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-500 uppercase mb-1 block">Performance Rating</span>
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, si) => (
                                                <Star key={si} className={cn("w-4 h-4", si < Math.round(m.qualityScore / 20) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600')} />
                                            ))}
                                            <span className="text-xs text-gray-500 ml-1">{(m.qualityScore / 20).toFixed(1)}/5</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400">{m.email}</p>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {viewMode === 'comparison' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left p-3 text-xs text-gray-500 font-medium">#</th>
                                <th className="text-left p-3 text-xs text-gray-500 font-medium">Team Member</th>
                                <th className="text-left p-3 text-xs text-gray-500 font-medium">Role</th>
                                <th className="text-center p-3 text-xs text-gray-500 font-medium">Assigned</th>
                                <th className="text-center p-3 text-xs text-gray-500 font-medium">Done</th>
                                <th className="text-center p-3 text-xs text-gray-500 font-medium">Active</th>
                                <th className="text-center p-3 text-xs text-gray-500 font-medium">Overdue</th>
                                <th className="text-center p-3 text-xs text-gray-500 font-medium">Quality</th>
                                <th className="p-3 text-xs text-gray-500 font-medium">Utilization</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMetrics.map((m, i) => (
                                <tr key={m.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-3 text-xs text-gray-400">{i + 1}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-[10px]">
                                                {m.firstName[0]}{m.lastName[0]}
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-900 dark:text-white text-sm">{m.firstName} {m.lastName}</span>
                                                {i === 0 && sortBy === 'productivity' && <span className="ml-1">⭐</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3"><span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase", getRoleColor(m.role))}>{m.role?.replace('_', ' ')}</span></td>
                                    <td className="p-3 text-center font-medium text-gray-900 dark:text-white">{m.assigned}</td>
                                    <td className="p-3 text-center font-medium text-green-600 dark:text-green-400">{m.completed}</td>
                                    <td className="p-3 text-center font-medium text-blue-600 dark:text-blue-400">{m.active}</td>
                                    <td className="p-3 text-center"><span className={cn("font-medium", m.overdue > 0 ? 'text-red-500' : 'text-gray-400')}>{m.overdue}</span></td>
                                    <td className="p-3 text-center"><span className={cn("font-medium", m.qualityScore >= 80 ? 'text-green-600' : m.qualityScore >= 60 ? 'text-amber-600' : 'text-red-600')}>{m.qualityScore}%</span></td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                <div className={cn("h-1.5 rounded-full", m.utilization > 90 ? 'bg-red-500' : m.utilization > 70 ? 'bg-amber-500' : 'bg-green-500')} style={{ width: `${m.utilization}%` }} />
                                            </div>
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-8 text-right">{m.utilization}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {viewMode === 'detailed' && (
                <div className="space-y-4">
                    {filteredMetrics.map((m, i) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                    {m.firstName[0]}{m.lastName[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white">{m.firstName} {m.lastName}</h4>
                                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase", getRoleColor(m.role))}>{m.role?.replace('_', ' ')}</span>
                                        {m.utilization > 90 && <span className="text-[9px] text-red-500 font-bold px-1.5 py-0.5 bg-red-50 dark:bg-red-900/10 rounded">🔴 OVERLOADED</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3">{m.email}</p>

                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">{m.assigned}</p>
                                            <p className="text-[9px] text-gray-500 uppercase">Assigned</p>
                                        </div>
                                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
                                            <p className="text-xl font-bold text-green-600 dark:text-green-400">{m.completed}</p>
                                            <p className="text-[9px] text-gray-500 uppercase">Done</p>
                                        </div>
                                        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{m.active}</p>
                                            <p className="text-[9px] text-gray-500 uppercase">Active</p>
                                        </div>
                                        <div className="text-center p-2 rounded-lg" style={{ background: m.overdue > 0 ? 'rgba(239,68,68,0.05)' : undefined }}>
                                            <p className={cn("text-xl font-bold", m.overdue > 0 ? 'text-red-500' : 'text-gray-400')}>{m.overdue}</p>
                                            <p className="text-[9px] text-gray-500 uppercase">Overdue</p>
                                        </div>
                                        <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">{m.qualityScore}%</p>
                                            <p className="text-[9px] text-gray-500 uppercase">Quality</p>
                                        </div>
                                    </div>

                                    {/* Utilization and rating */}
                                    <div className="flex items-center gap-4 mt-3">
                                        <div className="flex-1">
                                            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                                <span>Utilization</span>
                                                <span>{m.utilization}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                <div className={cn("h-2 rounded-full",
                                                    m.utilization > 90 ? 'bg-red-500' : m.utilization > 70 ? 'bg-amber-500' : 'bg-green-500'
                                                )} style={{ width: `${m.utilization}%` }} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, si) => (
                                                <Star key={si} className={cn("w-3.5 h-3.5", si < Math.round(m.qualityScore / 20) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600')} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {filteredMetrics.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                    <Users className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="font-medium">No team members found</p>
                    <p className="text-sm mt-1">{searchQuery || roleFilter ? 'Try adjusting your filters' : 'Add members to this project to see performance data'}</p>
                </div>
            )}
        </div>
    );
}
