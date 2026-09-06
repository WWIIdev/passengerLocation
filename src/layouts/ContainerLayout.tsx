import type { ReactNode } from "react";

const ContainerLayout = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return <div className={`p-5 ${className || ""}`}>{children}</div>;
};

export default ContainerLayout;
