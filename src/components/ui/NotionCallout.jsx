import React from "react";

export const NotionCallout = ({
  icon = "💡",
  children,
  className = "",
}) => {
  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded bg-[var(--notion-surface)] border border-[var(--notion-border)] text-[var(--notion-text)] text-sm ${className}`}
    >
      <span className="text-base select-none shrink-0 leading-none pt-0.5">
        {icon}
      </span>
      <div className="flex-1 leading-relaxed text-xs sm:text-sm text-[var(--notion-text)]">
        {children}
      </div>
    </div>
  );
};
