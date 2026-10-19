import React from "react";

export const NotionTag = ({ variant = "gray", children, className = "" }) => {
  const styles = {
    green: "bg-[var(--tag-green-bg)] text-[var(--tag-green-text)]",
    yellow: "bg-[var(--tag-yellow-bg)] text-[var(--tag-yellow-text)]",
    red: "bg-[var(--tag-red-bg)] text-[var(--tag-red-text)]",
    gray: "bg-[var(--tag-gray-bg)] text-[var(--tag-gray-text)]",
    blue: "bg-[var(--tag-blue-bg)] text-[var(--tag-blue-text)]",
  };

  const selected = styles[variant] || styles.gray;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium leading-none ${selected} ${className}`}
    >
      {children}
    </span>
  );
};
