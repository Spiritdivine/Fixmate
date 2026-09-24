import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelAction?: React.ReactNode;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  (
    {
      label,
      labelAction,
      helperText,
      error,
      type = 'text',
      leftIcon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);
    const isPasswordType = type === 'password';
    const computedType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1.5 text-left font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
        {/* Label and optional top-right action */}
        {(label || labelAction) && (
          <div className="flex items-center justify-between text-xs sm:text-[13px]">
            {label && (
              <label
                htmlFor={inputId}
                className="font-semibold text-stone-800 tracking-normal select-none"
              >
                {label}
              </label>
            )}
            {labelAction && <div className="text-right">{labelAction}</div>}
          </div>
        )}

        {/* Input container */}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={computedType}
            className={`w-full rounded-2xl border bg-white text-stone-900 placeholder:text-stone-400 text-sm px-4 py-3.5 transition-all outline-none disabled:opacity-50 disabled:bg-stone-50 ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : 'border-stone-200 hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-200/50'
            } ${leftIcon ? 'pl-10' : ''} ${isPasswordType ? 'pr-11' : ''} ${className}`}
            {...props}
          />

          {/* Password toggle icon */}
          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Error or Helper text */}
        {error ? (
          <p className="text-xs text-rose-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-stone-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
