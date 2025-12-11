
'use client';

import { Feature } from '@/lib/api/endpoints/features';
import { motion } from 'framer-motion';
import { Layers, Book, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
    feature: Feature;
    onDelete: (id: string) => void;
    canDelete: boolean;
}

export function FeatureCard({ feature, onDelete, canDelete }: FeatureCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                            feature.priority === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                feature.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                                    feature.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                                        'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                        )}>
                            {feature.priority}
                        </span>
                        <span className="text-xs font-mono text-gray-500">{feature.key}</span>
                        {feature.epic && (
                            <span className="flex items-center text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                                <Layers className="w-3 h-3 mr-1" />
                                {feature.epic.name}
                            </span>
                        )}
                        <span className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded",
                            feature.status === 'CLOSED' ? 'bg-green-100 text-green-700' :
                                feature.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-600'
                        )}>
                            {feature.status.replace('_', ' ')}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{feature.name}</h3>

                    {/* Tags */}
                    {feature.tags && feature.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {feature.tags.map((tag, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    {canDelete && (
                        <button
                            onClick={() => onDelete(feature.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                {feature.description || "No description provided."}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <Book className="w-4 h-4 mr-2" />
                        <span>
                            {feature.stats?.completedIssues || 0}/{feature.stats?.totalIssues || 0} Issues
                        </span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-semibold mr-1">SP:</span>
                        <span>{feature.storyPoints || 0}</span>
                    </div>
                </div>
                <div className="flex items-center min-w-[150px]">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                        <div
                            className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${feature.stats?.progress || 0}%` }}
                        />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                        {feature.stats?.progress || 0}%
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
