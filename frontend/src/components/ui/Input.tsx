import React from 'react'
import { cn } from '@/utils/cn'
import { THEME_COLORS, COMPONENT_COLORS } from '../../constants/colors'
import { COMPONENT_TYPOGRAPHY } from '../../constants/typography'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helperText, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-sm font-medium text-foreground transition-colors duration-200">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-muted-foreground transition-colors duration-200">
                {leftIcon}
              </div>
            </div>
          )}
          <input
            type={type}
            className={cn(
              // Modern base styles
              'flex h-10 w-full rounded-xl border px-3 py-2 text-sm',
              'bg-background text-foreground',
              'placeholder:text-muted-foreground',
              'transition-all duration-200 ease-in-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              // Modern spacing
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              // Modern states
              error 
                ? 'border-destructive focus-visible:ring-red-500' 
                : 'border-input focus-visible:ring-blue-500',
              // Modern shadows
              'shadow-modern-xs hover:shadow-modern-sm',
              'focus-visible:shadow-modern-md',
              // Modern focus effects
              'focus-visible:border-primary',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-muted-foreground transition-colors duration-200">
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p
            className={cn(
              'mt-2 text-sm transition-colors duration-200',
              error
                ? 'text-destructive font-medium'
                : 'text-muted-foreground'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
