import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type ButtonTheme =
  | "primary"
  | "secondary"
  | "secondaryOutline"
  | "primaryOutline"
  | "info"
  | "infoOutline"
  | "success";

type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit" | "reset";
  theme?: ButtonTheme;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  target?: "_blank" | "_self";
}

const themes: Record<ButtonTheme, string> = {
  primary: `
    bg-primary text-white
  `,
  info: `
    bg-info text-white
  `,
    success: `
    bg-success text-white
  `,
  primaryOutline: `
    border border-primary text-primary
  `,
  secondary: `
    bg-secondary text-white
  `,

  secondaryOutline: `
    border border-gray-500
    bg-white text-secondary
  `,
  infoOutline: `
    border border-info
    bg-white text-info
  `,
};

const baseStyles = `
  inline-flex
  items-center
  justify-center
  gap-2
  whitespace-nowrap
  font-medium
  transition-all
  select-none
  focus:outline-none
  focus-visible:ring-2
  focus-visible:ring-primary/30
  disabled:pointer-events-none
  disabled:opacity-50
`;

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 text-size-base rounded-lg",
  md: "min-h-12 px-6 text-size-lg rounded-xl",
  lg: "min-h-14 px-7 text-size-xl rounded-xl",
};

function LoadingSpinner() {
  return (
    <span
      aria-hidden="true"
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export default function Button({
  children,
  className = "",
  onClick,
  href,
  type = "button",
  theme = "secondary",
  size = "md",
  disabled = false,
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = "left",
  target,
}: ButtonProps) {
  const classes = `
    ${baseStyles}
    ${themes[theme]}
    ${sizes[size]}
    ${fullWidth ? "w-full" : ""}
    ${className}
  `;

  const content = (
    <>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {icon && iconPosition === "right" && icon}
          <span>{children}</span>
          {icon && iconPosition === "left" && icon}
        </>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        to={href}
        target={target}
        aria-disabled={disabled || loading}
        tabIndex={disabled || loading ? -1 : undefined}
        className={classes}
        onClick={(event) => {
          if (disabled || loading) {
            event.preventDefault();
            return;
          }

          onClick?.();
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={classes}
    >
      {content}
    </button>
  );
}
