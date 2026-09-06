import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function MobileLayout({ children }: Props) {
  return (
    <section className="min-h-dvh bg-background ">
      <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col bg-white">
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </section>
  );
}
