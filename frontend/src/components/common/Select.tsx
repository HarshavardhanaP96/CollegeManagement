import { type SelectHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              'w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 bg-white appearance-none',
              'focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2',
              error
                ? 'border-red-300 bg-red-50/30'
                : 'border-slate-200 hover:border-slate-300',
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
              className
            )}
            {...props}
          >
            {placeholder && (
              // Not `disabled`: a disabled option can't be the browser's native default
              // selection, so on first render the browser silently falls through to the first
              // real <option> instead — which looks selected but was never chosen by the user,
              // so no change event fires and react-hook-form's registered value stays
              // `undefined`. Submitting then fails validation ("expected number, received NaN")
              // even though a value is visibly shown. Leaving this enabled keeps the DOM's
              // default selection and RHF's default value in agreement (both "nothing chosen").
              <option value="">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
