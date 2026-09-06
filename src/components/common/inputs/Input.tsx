import type { ChangeEvent, InputHTMLAttributes } from "react";
import { convertPersianNumbers } from "../../../utils/helper";

type Props = {
  label: string;
  error?: string;
  required?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

export default function Input({
  label,
  error,
  required,
  className = "",
  onChange,
  ...props
}: Props) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const convertedValue = convertPersianNumbers(event.target.value);

    event.target.value = convertedValue;

    onChange?.(event);
  };

  return (
    <label className="block">
      <span className="mb-2 block text-right text-size-sm font-bold text-dark">
        {label}
        {required && <span className="mr-1 text-primary">*</span>}
      </span>

      <input
        dir="ltr"
        {...props}
        onChange={handleChange}
        className={`
          h-12 w-full rounded-xl border px-4
          text-right text-size-sm font-bold text-dark
          outline-none transition
          placeholder:text-gray-text
          disabled:bg-box
          ${
            error
              ? "border-primary/50 bg-primary-light/20 focus:border-primary"
              : "border-stroke bg-white focus:border-secondary"
          }
          ${className}
        `}
      />

      {error && (
        <p className="mt-1.5 text-right text-size-xs font-medium text-primary">
          {error}
        </p>
      )}
    </label>
  );
}
