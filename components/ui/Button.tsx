import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            children,
            disabled,
            fullWidth = false,
            ...props
        },
        ref
    ) => {
        const baseStyles = cn(
            'inline-flex items-center justify-center',
            'font-medium rounded-lg',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
        );

        const variantStyles = {
            primary: cn(
                'bg-gradient-to-r from-primary-600 to-primary-500',
                'text-white shadow-md',
                'hover:shadow-lg hover:scale-[1.02]',
                'active:scale-[0.98]',
                'focus:ring-primary-500'
            ),
            secondary: cn(
                'bg-card dark:bg-gray-800',
                'text-gray-700 dark:text-gray-300',
                'border border-gray-300 dark:border-gray-600',
                'hover:bg-background dark:hover:bg-gray-700',
                'focus:ring-gray-500'
            ),
            danger: cn(
                'bg-gradient-to-r from-red-600 to-red-500',
                'text-white shadow-md',
                'hover:shadow-lg hover:scale-[1.02]',
                'active:scale-[0.98]',
                'focus:ring-red-500'
            ),
            success: cn(
                'bg-gradient-to-r from-green-600 to-green-500',
                'text-white shadow-md',
                'hover:shadow-lg hover:scale-[1.02]',
                'active:scale-[0.98]',
                'focus:ring-green-500'
            ),
            ghost: cn(
                'bg-transparent',
                'text-gray-700 dark:text-gray-300',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'focus:ring-gray-500'
            ),
            outline: cn(
                'bg-transparent',
                'text-primary-600 dark:text-primary-400',
                'border-2 border-primary-600 dark:border-primary-400',
                'hover:bg-primary-50 dark:hover:bg-primary-900/20',
                'focus:ring-primary-500'
            ),
        };

        const sizeStyles = {
            sm: 'h-8 px-3 text-sm gap-1.5',
            md: 'h-10 px-4 text-sm gap-2',
            lg: 'h-12 px-6 text-base gap-2',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    baseStyles,
                    variantStyles[variant],
                    sizeStyles[size],
                    fullWidth && 'w-full',
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {children}
                    </>
                ) : (
                    <>
                        {leftIcon && <span className="inline-flex">{leftIcon}</span>}
                        {children}
                        {rightIcon && <span className="inline-flex">{rightIcon}</span>}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
