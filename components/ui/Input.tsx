import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    success?: boolean;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    showPasswordToggle?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = 'text', label, error, leftIcon, showPasswordToggle, helperText, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const [isFocused, setIsFocused] = useState(false);
        const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            props.onFocus?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            props.onBlur?.(e);
        };

        return (
            <div className="w-full space-y-1 group">
                {label && (
                    <label className={cn(
                        "text-sm font-medium transition-colors duration-200",
                        isFocused ? "text-indigo-400" : "text-gray-300",
                        error && "text-red-400"
                    )}>
                        {label}
                    </label>
                )}

                <motion.div
                    className="relative"
                    animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    {/* Left Icon */}
                    {leftIcon && (
                        <div className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10",
                            isFocused ? "text-indigo-400" : "text-gray-500",
                            error && "text-red-400"
                        )}>
                            {leftIcon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        type={inputType}
                        className={cn(
                            "flex h-11 w-full rounded-xl border bg-gray-900/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
                            leftIcon && "pl-10",
                            showPasswordToggle && "pr-10",
                            error
                                ? "border-red-500 focus:border-red-500 text-red-100 placeholder:text-red-300/50"
                                : "border-gray-800 focus:border-indigo-500 text-gray-100 placeholder:text-gray-500",
                            className
                        )}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        {...props}
                    />

                    {/* Bottom Glow Border */}
                    <motion.div
                        className={cn("absolute bottom-0 left-0 h-[2px] rounded-full z-20", error ? "bg-red-500" : "bg-indigo-500")}
                        initial={{ width: "0%" }}
                        animate={{ width: isFocused ? "100%" : "0%" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        style={{ left: '50%', translateX: '-50%' }} // Center expansion
                    />

                    {/* Password Toggle */}
                    {showPasswordToggle && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors focus:outline-none z-10"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    )}
                </motion.div>

                {/* Error / Helper Text */}
                <AnimatePresence>
                    {error ? (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-1.5 mt-1.5"
                        >
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <p className="text-xs font-medium text-red-400">{error}</p>
                        </motion.div>
                    ) : helperText ? (
                        <p className="text-xs text-gray-500 mt-1.5">{helperText}</p>
                    ) : null}
                </AnimatePresence>
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
