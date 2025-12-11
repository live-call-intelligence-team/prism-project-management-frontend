'use client';

import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
    className?: string;
    variant?: 'card' | 'text' | 'circle' | 'stat' | 'chart';
    count?: number;
}

export default function LoadingSkeleton({ className, variant = 'card', count = 1 }: LoadingSkeletonProps) {
    const skeletons = Array.from({ length: count }, (_, i) => i);

    if (variant === 'stat') {
        return (
            <>
                {skeletons.map((i) => (
                    <div key={i} className={cn("animate-pulse", className)}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
                                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-2"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                                </div>
                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </>
        );
    }

    if (variant === 'chart') {
        return (
            <div className={cn("animate-pulse", className)}>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
                    <div className="h-64 bg-gray-100 dark:bg-gray-700/50 rounded"></div>
                </div>
            </div>
        );
    }

    if (variant === 'circle') {
        return (
            <>
                {skeletons.map((i) => (
                    <div key={i} className={cn("animate-pulse", className)}>
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>
                ))}
            </>
        );
    }

    if (variant === 'text') {
        return (
            <>
                {skeletons.map((i) => (
                    <div key={i} className={cn("animate-pulse space-y-2", className)}>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                ))}
            </>
        );
    }

    // Default: card variant
    return (
        <>
            {skeletons.map((i) => (
                <div key={i} className={cn("animate-pulse", className)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                </div>
            ))}
        </>
    );
}
