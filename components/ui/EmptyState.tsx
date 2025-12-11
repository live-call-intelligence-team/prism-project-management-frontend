import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    action,
    className,
}) => {
    return (
        <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
            {Icon && (
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-gray-400" />
                </div>
            )}

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
            </h3>

            {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                    {description}
                </p>
            )}

            {action && (
                <button
                    onClick={action.onClick}
                    className={cn(
                        'px-4 py-2 rounded-lg font-medium',
                        'bg-gradient-to-r from-primary-600 to-primary-500',
                        'text-white shadow-md',
                        'hover:shadow-lg hover:scale-[1.02]',
                        'active:scale-[0.98]',
                        'transition-all duration-200'
                    )}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
