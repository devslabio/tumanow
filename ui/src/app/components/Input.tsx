'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import Icon, { IconDefinition } from './Icon';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: IconDefinition;
  iconPosition?: 'left' | 'right';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, iconPosition = 'left', className = '', ...props }, ref) => {
    const inputClasses = `
      input
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
      ${icon ? (iconPosition === 'left' ? '!pl-[3.5rem]' : '!pr-[3.5rem]') : ''}
      ${className}
    `.trim();

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10 flex items-center">
              <Icon icon={icon} size="sm" />
            </div>
          )}
          <input
            ref={ref}
            className={inputClasses}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10 flex items-center">
              <Icon icon={icon} size="sm" />
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

