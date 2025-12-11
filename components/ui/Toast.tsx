import React from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}

interface ToastProps extends Toast {
    onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({
    id,
    type,
    title,
    description,
    duration = 5000,
    onClose,
}) => {
    React.useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose]);

    const icons = {
        success: CheckCircle2,
        error: AlertCircle,
        warning: AlertTriangle,
        info: Info,
    };

    const styles = {
        success: 'bg-success-50 dark:bg-success-900/20 border-success-500 text-success-900 dark:text-success-100',
        error: 'bg-danger-50 dark:bg-danger-900/20 border-danger-500 text-danger-900 dark:text-danger-100',
        warning: 'bg-warning-50 dark:bg-warning-900/20 border-warning-500 text-warning-900 dark:text-warning-100',
        info: 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-900 dark:text-primary-100',
    };

    const iconStyles = {
        success: 'text-success-600 dark:text-success-400',
        error: 'text-danger-600 dark:text-danger-400',
        warning: 'text-warning-600 dark:text-warning-400',
        info: 'text-primary-600 dark:text-primary-400',
    };

    const Icon = icons[type];

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
                'w-full max-w-sm rounded-lg border-l-4 shadow-lg p-4',
                'backdrop-blur-sm',
                styles[type]
            )}
        >
            <div className="flex items-start gap-3">
                <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconStyles[type])} />

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{title}</p>
                    {description && (
                        <p className="mt-1 text-sm opacity-90">{description}</p>
                    )}
                </div>

                <button
                    onClick={() => onClose(id)}
                    className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};

interface ToastContainerProps {
    toasts: Toast[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItem {...toast} onClose={onClose} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// Toast Hook
export function useToast() {
    const [toasts, setToasts] = React.useState<Toast[]>([]);

    const toast = React.useCallback(
        (options: Omit<Toast, 'id'>) => {
            const id = Math.random().toString(36).substring(7);
            setToasts((prev) => [...prev, { ...options, id }]);
            return id;
        },
        []
    );

    const close = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = React.useCallback(
        (title: string, description?: string, duration?: number) => {
            return toast({ type: 'success', title, description, duration });
        },
        [toast]
    );

    const error = React.useCallback(
        (title: string, description?: string, duration?: number) => {
            return toast({ type: 'error', title, description, duration });
        },
        [toast]
    );

    const warning = React.useCallback(
        (title: string, description?: string, duration?: number) => {
            return toast({ type: 'warning', title, description, duration });
        },
        [toast]
    );

    const info = React.useCallback(
        (title: string, description?: string, duration?: number) => {
            return toast({ type: 'info', title, description, duration });
        },
        [toast]
    );

    return {
        toasts,
        toast,
        success,
        error,
        warning,
        info,
        close,
    };
}

export default ToastContainer;
