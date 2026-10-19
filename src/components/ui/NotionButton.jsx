import React from "react";

export const NotionButton = ({
  variant = "secondary",
  size = "md",
  disabled = false,
  children,
  onClick,
  type = "button",
  className = "",
  icon: Icon,
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded transition-colors duration-100 select-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none";

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3 py-1.5 text-sm gap-2",
    lg: "px-4 py-2 text-sm gap-2",
  };

  const variantStyles = {
    primary:
      "bg-[var(--notion-blue)] hover:bg-[var(--notion-blue-hover)] text-white shadow-none border border-transparent",
    secondary:
      "bg-[var(--notion-bg)] hover:bg-[var(--notion-surface-hover)] text-[var(--notion-text)] border border-[var(--notion-border)]",
    ghost:
      "bg-transparent hover:bg-[var(--notion-hover)] text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] border border-transparent",
    danger:
      "bg-transparent hover:bg-[var(--tag-red-bg)] text-[#EB5757] hover:text-[var(--tag-red-text)] border border-transparent",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {Icon && <Icon size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
};
