import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 dark:text-slate-350 tracking-wide uppercase"
        >
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={`w-full text-sm rounded-xl border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
            leftIcon ? 'pl-11' : 'pl-4'
          } ${
            rightIcon ? 'pr-11' : 'pr-4'
          } ${
            error 
              ? 'border-red-500 focus:ring-red-500/20' 
              : 'focus:ring-green-500/20 focus:border-green-500 dark:focus:border-green-500'
          } py-2.5`}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3.5 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <span className="text-xs font-medium text-red-500">
          {error}
        </span>
      )}
      
      {!error && helperText && (
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
