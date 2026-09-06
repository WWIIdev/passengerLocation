import { useEffect, useRef } from "react";
import { convertPersianNumbers } from "../../utils/helper";

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
};

const toDigits = (value: string, length: number) =>
  convertPersianNumbers(value).replace(/\D/g, "").slice(0, length);

export default function OtpInput({
  value,
  onChange,
  length = 6,
  error,
}: Props) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const updateDigit = (index: number, digit: string) => {
    const nextDigits = digits.map((item) => (item === " " ? "" : item));
    nextDigits[index] = digit;
    onChange(nextDigits.join("").slice(0, length));

    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (text: string) => {
    const nextValue = toDigits(text, length);

    if (!nextValue) {
      return;
    }

    onChange(nextValue);
    inputsRef.current[Math.min(nextValue.length, length) - 1]?.focus();
  };

  return (
    <div dir="ltr">
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(element) => {
              inputsRef.current[index] = element;
            }}
            value={digits[index] === " " ? "" : digits[index]}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            onChange={(event) => {
              const nextValue = toDigits(event.target.value, length);

              if (nextValue.length > 1) {
                handlePaste(nextValue);
                return;
              }

              updateDigit(index, nextValue);
            }}
            onPaste={(event) => {
              event.preventDefault();
              handlePaste(event.clipboardData.getData("text"));
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !digits[index]?.trim()) {
                inputsRef.current[index - 1]?.focus();
              }
            }}
            className={`h-12 rounded-xl border bg-white text-center text-size-lg font-bold text-dark outline-none transition focus:border-secondary ${
              error ? "border-primary/50" : "border-stroke"
            }`}
          />
        ))}
      </div>

      {error && (
        <p dir="rtl" className="mt-2 text-right text-size-xs text-primary">
          {error}
        </p>
      )}
    </div>
  );
}
