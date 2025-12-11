import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className }) => {
    const sizeStyles = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <Loader2 className={cn('animate-spin text-primary-600', sizeStyles[size], className)} />
    );
};

export interface LoadingOverlayProps {
    message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Loading...' }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{message}</p>
            </div>
        </div>
    );
};

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'rectangular',
    width,
    height,
    className,
    ...props
}) => {
    const variantStyles = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    return (
        <div
            className={cn(
                'animate-shimmer bg-gray-200 dark:bg-gray-700',
                variantStyles[variant],
                className
            )}
            style={{ width, height }}
            {...props}
        />
    );
};

export interface LoadingStateProps {
    count?: number;
    type?: 'card' | 'list' | 'table';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ count = 3, type = 'card' }) => {
    if (type === 'card') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <Skeleton variant="rectangular" height={120} className="mb-4" />
                        <Skeleton variant="text" className="mb-2" />
                        <Skeleton variant="text" width="60%" />
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'list') {
        return (
            <div className="space-y-4">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton variant="circular" width={48} height={48} />
                        <div className="flex-1">
                            <Skeleton variant="text" className="mb-2" />
                            <Skeleton variant="text" width="70%" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={60} />
            ))}
        </div>
    );
};

export default LoadingSpinner;
