
'use client';

import { useState } from 'react';
import { Epic } from '@/lib/api/endpoints/epics';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Layers, Calendar, Trash2, ChevronDown, ChevronUp, Edit, MoreVertical, CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface EpicCardProps {
    epic: Epic;
    onEdit: (epic: Epic) => void;
    onDelete: (id: string) => void;
    canEdit: boolean;
}

export function EpicCard({ epic, onEdit, onDelete, canEdit }: EpicCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate detailed progress if needed, but we rely on epic.stats mostly.

    // Feature list (if available from controller)
    // The type definition might need update, controller returns features with name/status.
    const features = (epic as any).features || [];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DONE':
            case 'CLOSED':
            case 'COMPLETED':
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
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden"
            style={{ borderLeft: epic.color ? `4px solid ${epic.color}` : undefined }}
        >
            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                            <span className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                                epic.priority === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                    epic.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                                        epic.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                                            'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                            )}>
                                {epic.priority}
                            </span>
                            <span className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                                epic.status === 'CLOSED' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                    epic.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                            )}>
                                {epic.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-mono text-gray-500">{epic.key}</span>
                        </div>
                        <Link href={`/projects/${epic.projectId}/epics/${epic.id}`} className="hover:underline">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {epic.name}
                            </h3>
                        </Link>
                        {epic.tags && epic.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {epic.tags.map((tag, i) => (
                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-1">
                        {canEdit && (
                            <>
                                <button
                                    onClick={() => onEdit(epic)}
                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                    title="Edit Epic"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(epic.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Delete Epic"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {epic.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <Layers className="w-4 h-4 mr-2" />
                            <span>
                                {epic.stats?.completedFeatures || 0}/{epic.stats?.totalFeatures || 0} Features
                            </span>
                        </div>
                        <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>
                                {epic.startDate ? new Date(epic.startDate).toLocaleDateString() : 'No start date'}
                            </span>
                        </div>
                    </div>

                    {/* Expand Button */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                        {isExpanded ? 'Hide Features' : 'Show Features'}
                        {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 flex items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                        <div
                            className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${epic.stats?.progress || 0}%` }}
                        />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-xs w-8 text-right">
                        {epic.stats?.progress || 0}%
                    </span>
                </div>
            </div>

            {/* Expanded Content: Features List */}
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
                                <div key={feature.id} className="flex items-center justify-between text-sm p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate flex-1 mr-4">
                                        {feature.name}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded font-bold uppercase",
                                        getStatusColor(feature.status)
                                    )}>
                                        {feature.status.replace('_', ' ')}
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
