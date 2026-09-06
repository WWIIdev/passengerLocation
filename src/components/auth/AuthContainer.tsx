import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function AuthContainer({ children, className = "" }: Props) {
  return (
    <section
      dir="rtl"
      className={`flex min-h-dvh flex-col bg-white px-6 pb-[calc(18px+env(safe-area-inset-bottom))] pt-[calc(26px+env(safe-area-inset-top))] ${className}`}
    >
      {children}
    </section>
  );
}
