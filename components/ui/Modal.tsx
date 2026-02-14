import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnOverlayClick = true,
    footer,
}) => {
    const sizeStyles = {
        sm: 'md:max-w-md',
        md: 'md:max-w-lg',
        lg: 'md:max-w-2xl',
        xl: 'md:max-w-4xl',
        '2xl': 'md:max-w-6xl',
        full: 'md:max-w-7xl',
    };

    // Close on Escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={closeOnOverlayClick ? onClose : undefined}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            className={cn(
                                'relative w-full bg-card dark:bg-gray-800 rounded-xl shadow-xl pointer-events-auto',
                                'max-h-[90vh] flex flex-col',
                                'w-[95vw] md:w-auto', // Mobile width override
                                sizeStyles[size]
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            {(title || showCloseButton) && (
                                <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex-1">
                                        {title && (
                                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                                {title}
                                            </h2>
                                        )}
                                        {description && (
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                {description}
                                            </p>
                                        )}
                                    </div>
                                    {showCloseButton && (
                                        <button
                                            onClick={onClose}
                                            className={cn(
                                                'ml-4 p-2 rounded-lg',
                                                'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                                                'hover:bg-background dark:hover:bg-gray-700',
                                                'transition-colors'
                                            )}
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                {children}
                            </div>

                            {/* Footer */}
                            {footer && (
                                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                                    {footer}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Modal;
