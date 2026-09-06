import { HiArrowRight } from "react-icons/hi2";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  className?: string;
  rightSlot?: ReactNode;
};

export default function AppHeader({
  title,
  subtitle,
  onBack,
  className = "",
  rightSlot,
}: AppHeaderProps) {
  const navigate = useNavigate();

  return title ? (
    <header
      dir="rtl"
      className={`sticky top-0 z-[99] w-full bg-white px-5 py-2 ${className}`}
    >
      <div className="grid grid-cols-[44px_1fr_44px] items-center">
        <button
          type="button"
          onClick={onBack ? onBack : () => navigate(-1)}
          aria-label="بازگشت"
          className="
            flex size-9 items-center justify-center
            rounded-lg
            border border-stroke
            bg-box
            text-secondary
            shadow-sm shadow-box
          "
        >
          <HiArrowRight size={18} strokeWidth={1.5} />
        </button>

        <div className="flex flex-col items-center text-center">
          <h1 className="text-size-lg mb-0.5 font-bold text-secondary">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-0.5 text-size-xs font-bold text-gray-text">
              {subtitle}
            </p>
          )}
        </div>

        <div className="size-11">{rightSlot}</div>
      </div>
    </header>
  ) : (
    <div className={`w-fit fixed  top-0 z-[99] px-5 py-3 ${className}`}>
      <button
        type="button"
        onClick={onBack ? onBack : () => navigate(-1)}
        aria-label="بازگشت"
        className="
              flex size-9 items-center justify-center
              rounded-lg
              border border-stroke
              bg-box
              text-secondary
              
            "
      >
        <HiArrowRight size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}
