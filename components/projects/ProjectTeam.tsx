'use client';

import React, { useEffect, useState } from 'react';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { issuesApi } from '@/lib/api/endpoints/issues';
import { cn, getInitials } from '@/lib/utils';
import {
    Users, UserPlus, Search, BarChart3, Shield, Code, CheckSquare, Palette,
    Crown, Loader2, TrendingUp, Clock, Target, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { motion } from 'framer-motion';

interface ProjectTeamProps {
    projectId: string;
    onAddMember?: () => void;
}

const getRoleIcon = (role: string) => {
    switch (role) {
        case 'LEAD': return Crown;
        case 'ADMIN': return Shield;
        case 'DEVELOPER': return Code;
        case 'QA_TESTER': return CheckSquare;
        case 'DESIGNER': return Palette;
        case 'SCRUM_MASTER': return Users;
        case 'PROJECT_MANAGER': return BarChart3;
        default: return Code;
    }
};

const getRoleBadgeColor = (role: string) => {
    switch (role) {
        case 'LEAD': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
        case 'ADMIN': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300';
        case 'DEVELOPER': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
        case 'QA_TESTER': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
        case 'DESIGNER': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300';
        case 'SCRUM_MASTER': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300';
        case 'PROJECT_MANAGER': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300';
        default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
};

export function ProjectTeam({ projectId, onAddMember }: ProjectTeamProps) {
    const [members, setMembers] = useState<any[]>([]);
    const [issues, setIssues] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'cards' | 'capacity'>('cards');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectData, issuesData] = await Promise.all([
                    projectsApi.getById(projectId).catch(() => null),
                    issuesApi.getAll({ projectId }).catch(() => ({ issues: [] })),
                ]);
                setMembers((projectData as any)?.members || []);
                const issuesList = Array.isArray(issuesData) ? issuesData : (issuesData as any)?.issues || [];
                setIssues(issuesList);
            } catch (error) {
                console.error('Failed to fetch team data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (projectId) fetchData();
    }, [projectId]);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    // Calculate per-member workload
    const memberWorkload = members.map(member => {
        const assigned = issues.filter((i: any) => i.assigneeId === member.userId || i.assignee?.id === member.userId);
        const done = assigned.filter((i: any) => i.status === 'DONE' || i.status === 'CLOSED');
        const inProgress = assigned.filter((i: any) => i.status === 'IN_PROGRESS');
        const overdue = assigned.filter((i: any) => i.dueDate && new Date(i.dueDate) < new Date() && i.status !== 'DONE' && i.status !== 'CLOSED');
        const maxCapacity = 10; // default max issues capacity
        const utilization = Math.min(Math.round((assigned.length / maxCapacity) * 100), 150);

        return {
            ...member,
            assignedCount: assigned.length,
            doneCount: done.length,
            inProgressCount: inProgress.length,
            overdueCount: overdue.length,
            utilization,
            isOverloaded: utilization > 100,
            completionRate: assigned.length > 0 ? Math.round((done.length / assigned.length) * 100) : 0,
        };
    });

    const filteredMembers = memberWorkload.filter(m =>
        m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Team summary
    const totalAssigned = memberWorkload.reduce((sum, m) => sum + m.assignedCount, 0);
    const totalDone = memberWorkload.reduce((sum, m) => sum + m.doneCount, 0);
    const overloadedCount = memberWorkload.filter(m => m.isOverloaded).length;
    const avgUtilization = memberWorkload.length > 0 ? Math.round(memberWorkload.reduce((sum, m) => sum + m.utilization, 0) / memberWorkload.length) : 0;

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-500" />
                    Team Members ({members.length})
                </h2>
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                        {(['cards', 'capacity'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize",
                                    viewMode === mode
                                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                    {onAddMember && (
                        <button
                            onClick={onAddMember}
                            className={cn(
                                'flex items-center px-4 py-2 rounded-lg font-medium text-sm',
                                'bg-gradient-to-r from-primary-500 to-accent-purple',
                                'text-white shadow-lg hover:shadow-glow-purple hover:scale-[1.02] active:scale-[0.98]',
                                'transition-all duration-200'
                            )}
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Member
                        </button>
                    )}
                </div>
            </div>

            {/* Team Summary Stats */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                <MiniStat icon={Users} label="Members" value={members.length} color="blue" />
                <MiniStat icon={Target} label="Avg Utilization" value={`${avgUtilization}%`} color={avgUtilization > 100 ? 'red' : avgUtilization > 75 ? 'amber' : 'green'} />
                <MiniStat icon={CheckSquare} label="Tasks Done" value={`${totalDone}/${totalAssigned}`} color="green" />
                <MiniStat icon={AlertTriangle} label="Overloaded" value={overloadedCount} color={overloadedCount > 0 ? 'red' : 'green'} />
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>

            {viewMode === 'cards' ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredMembers.map((member, i) => {
                        const RoleIcon = getRoleIcon(member.role);
                        return (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={cn(
                                    "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all relative overflow-hidden",
                                    member.isOverloaded && "border-l-4 border-l-red-500"
                                )}
                            >
                                {/* Badge for overloaded */}
                                {member.isOverloaded && (
                                    <div className="absolute top-3 right-3">
                                        <span className="text-[9px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-bold px-1.5 py-0.5 rounded-full">
                                            🔴 OVERLOADED
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white font-bold text-sm">
                                        {getInitials(member.name)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 dark:text-white truncate">{member.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full", getRoleBadgeColor(member.role))}>
                                        <RoleIcon className="w-3 h-3" />
                                        {member.role?.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300 font-medium">
                                        Active
                                    </span>
                                </div>

                                {/* Workload Stats */}
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{member.assignedCount}</p>
                                        <p className="text-[9px] text-gray-500">Assigned</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                                        <p className="text-lg font-bold text-green-600">{member.doneCount}</p>
                                        <p className="text-[9px] text-gray-500">Done</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                                        <p className="text-lg font-bold text-blue-600">{member.inProgressCount}</p>
                                        <p className="text-[9px] text-gray-500">Active</p>
                                    </div>
                                </div>

                                {/* Capacity Bar */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-gray-500">
                                        <span>Capacity</span>
                                        <span className={cn("font-medium", member.utilization > 100 ? 'text-red-500' : member.utilization > 75 ? 'text-amber-500' : 'text-green-500')}>
                                            {member.utilization}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all",
                                                member.utilization > 100 ? 'bg-red-500' : member.utilization > 75 ? 'bg-amber-500' : 'bg-green-500'
                                            )}
                                            style={{ width: `${Math.min(member.utilization, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Overdue badge */}
                                {member.overdueCount > 0 && (
                                    <p className="text-[10px] text-red-500 font-medium mt-2 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {member.overdueCount} overdue
                                    </p>
                                )}

                                {/* Completion rate */}
                                <p className="text-[10px] text-gray-400 mt-2">
                                    Completion rate: <span className="font-medium text-gray-600 dark:text-gray-300">{member.completionRate}%</span>
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                /* Capacity View - Table */
                <Card>
                    <CardContent className="pt-4">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px]">
                                <thead className="border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3 pl-2">Member</th>
                                        <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Role</th>
                                        <th className="text-center text-xs font-medium text-gray-500 uppercase pb-3">Assigned</th>
                                        <th className="text-center text-xs font-medium text-gray-500 uppercase pb-3">Done</th>
                                        <th className="text-center text-xs font-medium text-gray-500 uppercase pb-3">Active</th>
                                        <th className="text-center text-xs font-medium text-gray-500 uppercase pb-3">Overdue</th>
                                        <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3 w-48">Capacity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredMembers.map(member => {
                                        const RoleIcon = getRoleIcon(member.role);
                                        return (
                                            <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="py-3 pl-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white font-medium text-xs">
                                                            {getInitials(member.name)}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full", getRoleBadgeColor(member.role))}>
                                                        <RoleIcon className="w-3 h-3" />
                                                        {member.role?.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-center text-sm font-medium text-gray-900 dark:text-white">{member.assignedCount}</td>
                                                <td className="py-3 text-center text-sm font-medium text-green-600">{member.doneCount}</td>
                                                <td className="py-3 text-center text-sm font-medium text-blue-600">{member.inProgressCount}</td>
                                                <td className="py-3 text-center">
                                                    <span className={cn("text-sm font-medium", member.overdueCount > 0 ? 'text-red-500' : 'text-gray-400')}>
                                                        {member.overdueCount}
                                                    </span>
                                                </td>
                                                <td className="py-3 w-48">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                                            <div
                                                                className={cn(
                                                                    "h-full rounded-full transition-all",
                                                                    member.utilization > 100 ? 'bg-red-500' : member.utilization > 75 ? 'bg-amber-500' : 'bg-green-500'
                                                                )}
                                                                style={{ width: `${Math.min(member.utilization, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className={cn(
                                                            "text-xs font-medium w-10 text-right",
                                                            member.utilization > 100 ? 'text-red-500' : 'text-gray-500'
                                                        )}>
                                                            {member.utilization}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function MiniStat({ icon: Icon, label, value, color }: {
    icon: any; label: string; value: string | number; color: string;
}) {
    const colorMap: Record<string, string> = {
        blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
        green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
        red: 'text-red-600 bg-red-50 dark:bg-red-900/20',
        amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    };

    return (
        <Card>
            <CardContent className="pt-3 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", colorMap[color] || colorMap.blue)}>
                        <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs text-gray-500">{label}</span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            </CardContent>
        </Card>
    );
}
