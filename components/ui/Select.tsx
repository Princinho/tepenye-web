import { forwardRef } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: readonly { label: string; value: string | number }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, options, placeholder, className = "", ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors appearance-none bg-white
          ${error
            ? "border-red-300 focus:border-red-500"
            : "border-gray-200 focus:border-emerald-500"
          } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = "Select";
export default Select;