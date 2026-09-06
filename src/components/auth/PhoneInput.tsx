import Input from "../common/inputs/Input";
import { formatPhone, normalizePhone } from "./phoneUtils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

export default function PhoneInput({
  value,
  onChange,
  error,
  disabled = false,
}: Props) {
  return (
    <Input
      className="text-lg! placeholder:font-normal!"
      label="شماره موبایل"
      placeholder="۰۹۱۲ ۱۲۳ ۴۵۶۷"
      inputMode="numeric"
      autoComplete="tel"
      maxLength={13}
      value={formatPhone(value)}
      disabled={disabled}
      error={error}
      onChange={(event) => onChange(normalizePhone(event.target.value))}
    />
  );
}
