'use client';

import { Feature } from '@/lib/api/endpoints/features';
import { motion } from 'framer-motion';
import { Layers, Trash2, Edit, User, Calendar, Target, TrendingUp, AlertTriangle, Clock, Shield, Link2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
    feature: Feature;
    onDelete: (id: string) => void;
    onEdit?: (feature: Feature) => void;
    canDelete: boolean;
    canEdit?: boolean;
}

export function FeatureCard({ feature, onDelete, onEdit, canDelete, canEdit }: FeatureCardProps) {
    const progress = feature.stats?.progress || 0;
    const totalIssues = feature.stats?.totalIssues || 0;
    const completedIssues = feature.stats?.completedIssues || 0;
    const sp = feature.storyPoints || 0;

    const startDate = feature.startDate ? new Date(feature.startDate) : null;
    const dueDate = feature.endDate ? new Date(feature.endDate) : null;
    const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / 86400000) : null;
    const isOverdue = daysLeft != null && daysLeft < 0 && feature.status !== 'CLOSED';
    const isDueSoon = daysLeft != null && daysLeft >= 0 && daysLeft <= 5 && feature.status !== 'CLOSED';

    // Risk assessment
    const atRisk = isOverdue || (isDueSoon && progress < 70) || (daysLeft != null && daysLeft <= 14 && progress < 40);

    // Effort/complexity estimate from story points
    const effort = sp >= 20 ? { label: '🔴 High', color: 'text-red-600' } : sp >= 8 ? { label: '🟡 Medium', color: 'text-amber-600' } : { label: '🟢 Low', color: 'text-green-600' };

    const statusConfig: Record<string, { label: string; emoji: string; bg: string; text: string }> = {
        'TO_DO': { label: 'To Do', emoji: '⚪', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },
        'IN_PROGRESS': { label: 'In Progress', emoji: '🟡', bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400' },
        'IN_REVIEW': { label: 'In Review', emoji: '🔵', bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400' },
        'CLOSED': { label: 'Done', emoji: '🟢', bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' },
    };
    const status = statusConfig[feature.status] || statusConfig['TO_DO'];

    const priorityBorder: Record<string, string> = { 'CRITICAL': 'border-l-red-500', 'HIGH': 'border-l-orange-500', 'MEDIUM': 'border-l-blue-500', 'LOW': 'border-l-gray-400' };

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={cn("bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all border-l-4",
                priorityBorder[feature.priority] || 'border-l-gray-400',
                atRisk && 'ring-1 ring-red-200 dark:ring-red-900/50'
            )}>
            {/* Header Row */}
            <div className="p-4 pb-2">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                                feature.priority === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                    feature.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                                        feature.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                                            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            )}>{feature.priority}</span>
                            <span className="text-[9px] font-mono text-gray-400">{feature.key}</span>
                            {feature.epic && <span className="flex items-center text-[9px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"><Layers className="w-2.5 h-2.5 mr-0.5" />{feature.epic.name}</span>}
                            <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded", status.bg, status.text)}>{status.emoji} {status.label}</span>
                            {atRisk && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">⚠️ AT RISK</span>}
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{feature.name}</h3>
                    </div>
                    <div className="flex items-center gap-0.5 ml-2 flex-shrink-0">
                        {canEdit && onEdit && <button onClick={() => onEdit(feature)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>}
                        {canDelete && <button onClick={() => onDelete(feature.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">{feature.description || "No description"}</p>

                {/* Tags */}
                {feature.tags && feature.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">{feature.tags.map((tag, i) => <span key={i} className="text-[8px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">#{tag}</span>)}</div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                    {/* Owner */}
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        {feature.owner ? (
                            <><div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[7px] text-white font-bold">{feature.owner.firstName?.[0]}{feature.owner.lastName?.[0]}</div><span className="truncate">{feature.owner.firstName}</span></>
                        ) : (<><User className="w-3 h-3" /><span className="text-gray-400">Unassigned</span></>)}
                    </div>
                    {/* Timeline */}
                    <div className={cn("flex items-center gap-1", isOverdue ? 'text-red-500 font-semibold' : isDueSoon ? 'text-amber-500' : 'text-gray-500')}>
                        <Calendar className="w-3 h-3" />
                        {dueDate ? <span>{dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {daysLeft != null && <span className="font-medium">({isOverdue ? `${Math.abs(daysLeft)}d late` : `${daysLeft}d left`})</span>}</span> : <span>No due date</span>}
                    </div>
                    {/* Effort */}
                    <div className={cn("flex items-center gap-1", effort.color)}>
                        <Shield className="w-3 h-3" />
                        <span>{effort.label} Complexity</span>
                    </div>
                    {/* Issues */}
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Target className="w-3 h-3" />
                        <span className="font-medium">{completedIssues}/{totalIssues}</span> issues
                    </div>
                </div>
            </div>

            {/* Progress Footer */}
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 rounded-b-xl">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /><strong>{sp}</strong> SP</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div className={cn("h-1.5 rounded-full transition-all duration-500",
                                progress >= 80 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : progress > 0 ? 'bg-amber-500' : 'bg-gray-300'
                            )} style={{ width: `${progress}%` }} />
                        </div>
                        <span className={cn("text-[10px] font-bold", progress >= 80 ? 'text-green-600' : progress >= 50 ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400')}>{progress}%</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
