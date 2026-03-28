import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors
          ${error
            ? "border-red-300 focus:border-red-500 bg-red-50"
            : "border-gray-200 focus:border-emerald-500 bg-white"
          } ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export default Input;