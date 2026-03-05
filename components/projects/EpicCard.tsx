
'use client';

import { useState } from 'react';
import { Epic } from '@/lib/api/endpoints/epics';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Layers, Calendar, Trash2, ChevronDown, ChevronUp, Edit, CheckCircle, Target, Clock, AlertTriangle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EpicCardProps {
    epic: Epic;
    onEdit: (epic: Epic) => void;
    onDelete: (id: string) => void;
    canEdit: boolean;
}

export function EpicCard({ epic, onEdit, onDelete, canEdit }: EpicCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const features = (epic as any).features || [];
    const progress = epic.stats?.progress || 0;

    // Calculate health & status
    const epicStatus = epic.status === 'CLOSED' ? 'done' :
        epic.status === 'ON_HOLD' ? 'onhold' :
            progress >= 50 ? 'ontrack' :
                progress > 0 ? 'atrisk' : 'planning';

    const statusConfig = {
        done: { emoji: '✅', label: 'DONE', bg: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300', border: 'border-l-green-500' },
        ontrack: { emoji: '🟢', label: 'ON TRACK', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300', border: 'border-l-blue-500' },
        atrisk: { emoji: '🟡', label: 'AT RISK', bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300', border: 'border-l-yellow-500' },
        onhold: { emoji: '⏸️', label: 'ON HOLD', bg: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', border: 'border-l-gray-400' },
        planning: { emoji: '⚪', label: 'PLANNING', bg: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', border: 'border-l-gray-300' },
    }[epicStatus];

    // Health score (0-100 based on progress & status)
    const healthScore = epicStatus === 'done' ? 100 :
        epicStatus === 'onhold' ? 30 :
            Math.min(100, progress + (epic.owner ? 10 : 0) + (progress > 0 ? 10 : 0));

    const healthColor = healthScore >= 70 ? 'text-green-500' : healthScore >= 40 ? 'text-yellow-500' : 'text-red-500';

    const totalFeatures = epic.stats?.totalFeatures || 0;
    const completedFeatures = epic.stats?.completedFeatures || 0;

    // Due date
    const dueDate = epic.endDate ? new Date(epic.endDate) : null;
    const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    const isOverdue = daysLeft != null && daysLeft < 0 && epicStatus !== 'done';

    const getFeatureStatusColor = (status: string) => {
        switch (status) {
            case 'DONE': case 'CLOSED': case 'COMPLETED':
                return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
            case 'IN_PROGRESS':
                return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
            default:
                return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden border-l-4",
                statusConfig.border
            )}
        >
            <div className="p-5">
                {/* Row 1: Status badges + actions */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center flex-wrap gap-2">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase", statusConfig.bg)}>
                            {statusConfig.emoji} {statusConfig.label}
                        </span>
                        <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                            epic.priority === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                epic.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                                    epic.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        )}>
                            {epic.priority}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">{epic.key}</span>
                    </div>
                    {canEdit && (
                        <div className="flex items-center gap-0.5">
                            <button onClick={() => onEdit(epic)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                                <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onDelete(epic.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Row 2: Title */}
                <Link href={`/projects/${epic.projectId}/epics/${epic.id}`} className="hover:underline">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{epic.name}</h3>
                </Link>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 line-clamp-2">
                    {epic.description || "No description provided."}
                </p>

                {/* Row 3: Owner + Health */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {epic.owner ? (
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[9px] font-bold text-white">
                                    {epic.owner.firstName?.[0]}{epic.owner.lastName?.[0]}
                                </div>
                                <span className="text-xs text-gray-600 dark:text-gray-400">{epic.owner.firstName} {epic.owner.lastName}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> No Owner
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400">Health:</span>
                        <span className={cn("text-xs font-bold", healthColor)}>{healthScore}%</span>
                    </div>
                </div>

                {/* Row 4: Progress Bar */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-500",
                                epicStatus === 'done' ? 'bg-green-500' :
                                    epicStatus === 'ontrack' ? 'bg-blue-500' :
                                        epicStatus === 'atrisk' ? 'bg-yellow-500' :
                                            'bg-gray-400'
                            )}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-10 text-right">{progress}%</span>
                </div>

                {/* Row 5: Stats Grid */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{completedFeatures}/{totalFeatures}</p>
                        <p className="text-[10px] text-gray-500">Features</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        </p>
                        <p className={cn("text-[10px]", isOverdue ? 'text-red-500 font-medium' : 'text-gray-500')}>
                            {isOverdue ? `${Math.abs(daysLeft!)}d overdue` : daysLeft != null ? `${daysLeft}d left` : 'No date'}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className={cn("text-lg font-bold", healthColor)}>{healthScore}</p>
                        <p className="text-[10px] text-gray-500">Health</p>
                    </div>
                </div>

                {/* Tags */}
                {epic.tags && epic.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {epic.tags.map((tag, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Expand toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-center w-full mt-3 text-xs font-medium text-primary-600 hover:text-primary-700 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
                >
                    {isExpanded ? 'Hide Features' : `Show Features (${features.length})`}
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                </button>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700 px-5"
                    >
                        <div className="py-4 space-y-2">
                            {features.length > 0 ? features.map((feature: any) => (
                                <div key={feature.id} className="flex items-center justify-between text-sm p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate flex-1 mr-4">
                                        {feature.name}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded font-bold uppercase",
                                        getFeatureStatusColor(feature.status)
                                    )}>
                                        {feature.status?.replace('_', ' ')}
                                    </span>
                                </div>
                            )) : (
                                <div className="text-center text-gray-500 text-xs py-2">
                                    No features linked to this Epic yet.
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
