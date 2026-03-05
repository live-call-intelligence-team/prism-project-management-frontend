'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { teamPerformanceApi, TeamMember, EmployeeDetail, TimelineMember } from '@/lib/api/endpoints/teamPerformance';
import { cn } from '@/lib/utils';
import { Users, LayoutGrid, User, Calendar, ArrowLeft, Loader2 } from 'lucide-react';

type ViewType = 'grid' | 'detail' | 'timeline';

interface TeamPerformanceViewProps {
    projectId: string;
}

// ─── STATUS BADGE ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        Active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        Blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        Available: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        Completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    };
    return (
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", colors[status] || colors.Available)}>
            {status}
        </span>
    );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────
function ProgressBar({ value, className }: { value: number; className?: string }) {
    const color = value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-amber-500' : value >= 25 ? 'bg-blue-500' : 'bg-gray-400';
    return (
        <div className={cn("w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2", className)}>
            <div className={cn("h-2 rounded-full transition-all", color)} style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
    );
}

// ─── VIEW 1: TEAM GRID ───────────────────────────────────────────
function TeamGridView({
    team, loading, onSelectMember, sortBy, onSort
}: {
    team: TeamMember[];
    loading: boolean;
    onSelectMember: (id: string) => void;
    sortBy: string;
    onSort: (key: string) => void;
}) {
    const [filter, setFilter] = useState('');

    const filtered = team.filter(m =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(filter.toLowerCase()) ||
        m.email.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>;
    }

    return (
        <div className="space-y-4">
            <input
                type="text"
                placeholder="Search team members..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full max-w-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                            {[
                                { key: 'name', label: 'Employee' },
                                { key: 'status', label: 'Status' },
                                { key: 'totalTasks', label: 'Tasks' },
                                { key: 'percentDone', label: '% Done' },
                                { key: 'hoursLogged', label: 'Hours' },
                            ].map(col => (
                                <th
                                    key={col.key}
                                    onClick={() => onSort(col.key)}
                                    className={cn(
                                        "px-4 py-3 text-left font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                                        sortBy === col.key && "text-primary-600"
                                    )}
                                >
                                    {col.label} {sortBy === col.key && '↓'}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">No team members found</td></tr>
                        ) : (
                            filtered.map(member => (
                                <tr
                                    key={member.id}
                                    onClick={() => onSelectMember(member.id)}
                                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 cursor-pointer transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-bold text-white">
                                                {member.firstName?.[0]}{member.lastName?.[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{member.firstName} {member.lastName}</div>
                                                <div className="text-xs text-gray-500">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge status={member.status} /></td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{member.doneTasks}/{member.totalTasks}</span>
                                            <span className="text-xs text-gray-400">done</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2 min-w-[120px]">
                                            <ProgressBar value={member.percentDone} className="flex-1" />
                                            <span className="text-xs font-medium">{member.percentDone}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-medium">{member.hoursLogged.toFixed(1)}h</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── VIEW 2: EMPLOYEE DETAIL PANEL ───────────────────────────────
function EmployeeDetailPanel({
    data, loading, onBack
}: {
    data: EmployeeDetail | null;
    loading: boolean;
    onBack: () => void;
}) {
    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>;
    }
    if (!data) {
        return <div className="text-center py-8 text-gray-500">Select a team member to view details</div>;
    }

    const priorityColors: Record<string, string> = {
        CRITICAL: 'text-red-600', HIGHEST: 'text-red-500', HIGH: 'text-orange-500',
        MEDIUM: 'text-yellow-600', LOW: 'text-blue-500', LOWEST: 'text-gray-400',
    };
    const statusColors: Record<string, string> = {
        TODO: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        IN_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        DONE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        BLOCKED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Team Grid
            </button>

            {/* Employee Header */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-lg font-bold text-white">
                    {data.employee.firstName?.[0]}{data.employee.lastName?.[0]}
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {data.employee.firstName} {data.employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{data.employee.email} • {data.employee.role}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Tasks', value: data.stats.totalTasks, color: 'text-gray-900' },
                    { label: 'Done', value: data.stats.doneTasks, color: 'text-green-600' },
                    { label: 'In Progress', value: data.stats.inProgressTasks, color: 'text-blue-600' },
                    { label: 'Hours Logged', value: `${data.stats.totalHours}h`, color: 'text-purple-600' },
                ].map(stat => (
                    <div key={stat.label} className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                        <div className={cn("text-xl font-bold", stat.color)}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Progress */}
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Overall Progress</span>
                    <span className="font-medium">{data.stats.percentDone}%</span>
                </div>
                <ProgressBar value={data.stats.percentDone} />
            </div>

            {/* Tasks Table */}
            <div>
                <h4 className="font-semibold mb-3">Assigned Tasks</h4>
                <div className="space-y-2">
                    {data.tasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="text-xs font-mono text-gray-400 flex-shrink-0">{task.key}</span>
                                <span className="text-sm truncate">{task.title}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={cn("text-xs font-medium", priorityColors[task.priority] || 'text-gray-500')}>
                                    {task.priority}
                                </span>
                                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[task.status] || statusColors.TODO)}>
                                    {task.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    ))}
                    {data.tasks.length === 0 && <div className="text-center py-4 text-gray-400 text-sm">No tasks assigned</div>}
                </div>
            </div>

            {/* Weekly Hours Chart (simple bars) */}
            {data.weeklyHours.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-3">Weekly Hours (Last 30 days)</h4>
                    <div className="flex items-end gap-2 h-32 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                        {data.weeklyHours.map((wh) => {
                            const maxHours = Math.max(...data.weeklyHours.map(w => w.hours), 1);
                            const height = (wh.hours / maxHours) * 100;
                            return (
                                <div key={wh.week} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[10px] text-gray-400">{wh.hours}h</span>
                                    <div className="w-full bg-primary-500/80 rounded-t" style={{ height: `${height}%` }} />
                                    <span className="text-[10px] text-gray-400">{wh.week.slice(5)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── VIEW 3: TEAM TIMELINE ───────────────────────────────────────
function TeamTimelineView({ data, loading }: { data: TimelineMember[]; loading: boolean }) {
    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>;
    }
    if (data.length === 0) {
        return <div className="text-center py-8 text-gray-500">No timeline data available</div>;
    }

    // Collect all unique weeks
    const allWeeks = Array.from(new Set(data.flatMap(m => m.weeks.map(w => w.week)))).sort();

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-gray-50 dark:bg-gray-800/50">Employee</th>
                        {allWeeks.map(week => (
                            <th key={week} className="px-3 py-3 text-center font-medium text-xs">
                                {week.slice(5)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map(member => (
                        <tr key={member.id} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="px-4 py-3 font-medium sticky left-0 bg-white dark:bg-gray-900">
                                {member.name}
                            </td>
                            {allWeeks.map(week => {
                                const wk = member.weeks.find(w => w.week === week);
                                const hours = wk?.hours || 0;
                                const intensity = Math.min(hours / 40, 1);
                                return (
                                    <td key={week} className="px-3 py-3 text-center">
                                        {hours > 0 ? (
                                            <div
                                                className="inline-flex items-center justify-center w-10 h-8 rounded text-xs font-medium"
                                                style={{
                                                    backgroundColor: `rgba(59, 130, 246, ${0.1 + intensity * 0.6})`,
                                                    color: intensity > 0.5 ? 'white' : undefined,
                                                }}
                                            >
                                                {hours}h
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 dark:text-gray-600">—</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── MAIN PAGE COMPONENT ─────────────────────────────────────────
export default function TeamPerformanceView({ projectId }: TeamPerformanceViewProps) {
    const [view, setView] = useState<ViewType>('grid');
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [employeeDetail, setEmployeeDetail] = useState<EmployeeDetail | null>(null);
    const [timeline, setTimeline] = useState<TimelineMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [sortBy, setSortBy] = useState('name');
    const [sortAsc, setSortAsc] = useState(true);

    useEffect(() => {
        loadTeamData();
    }, [projectId]);

    const loadTeamData = async () => {
        try {
            setLoading(true);
            const [teamData, timelineData] = await Promise.all([
                teamPerformanceApi.getTeamGrid(projectId),
                teamPerformanceApi.getTeamTimeline(projectId),
            ]);
            setTeam(teamData);
            setTimeline(timelineData);
        } catch (err) {
            console.error('Error loading team performance:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMember = async (memberId: string) => {
        try {
            setDetailLoading(true);
            setView('detail');
            const detail = await teamPerformanceApi.getEmployeeDetail(projectId, memberId);
            setEmployeeDetail(detail);
        } catch (err) {
            console.error('Error loading employee detail:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleSort = (key: string) => {
        if (sortBy === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortBy(key);
            setSortAsc(true);
        }
    };

    // Apply sorting
    const sortedTeam = [...team].sort((a: any, b: any) => {
        const aVal = sortBy === 'name' ? `${a.firstName} ${a.lastName}` : a[sortBy];
        const bVal = sortBy === 'name' ? `${b.firstName} ${b.lastName}` : b[sortBy];
        if (typeof aVal === 'string') return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        return sortAsc ? aVal - bVal : bVal - aVal;
    });

    const views: { key: ViewType; label: string; icon: React.ReactNode }[] = [
        { key: 'grid', label: 'Team Grid', icon: <LayoutGrid className="w-4 h-4" /> },
        { key: 'detail', label: 'Individual', icon: <User className="w-4 h-4" /> },
        { key: 'timeline', label: 'Timeline', icon: <Calendar className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-6">
            {/* View Tabs */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
                {views.map(v => (
                    <button
                        key={v.key}
                        onClick={() => setView(v.key)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                            view === v.key
                                ? "bg-white dark:bg-gray-900 shadow-sm text-primary-600"
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                    >
                        {v.icon}
                        {v.label}
                    </button>
                ))}
            </div>

            {/* View Content */}
            {view === 'grid' && (
                <TeamGridView
                    team={sortedTeam}
                    loading={loading}
                    onSelectMember={handleSelectMember}
                    sortBy={sortBy}
                    onSort={handleSort}
                />
            )}
            {view === 'detail' && (
                <EmployeeDetailPanel
                    data={employeeDetail}
                    loading={detailLoading}
                    onBack={() => setView('grid')}
                />
            )}
            {view === 'timeline' && (
                <TeamTimelineView data={timeline} loading={loading} />
            )}
        </div>
    );
}
