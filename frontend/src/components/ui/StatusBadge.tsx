import type { CSSProperties } from "react";

import { cn } from "../../lib/cn";

type StatusBadgeProps = {
  status:
    | "Available"
    | "On Trip"
    | "On_Trip"
    | "In Shop"
    | "In_Shop"
    | "Off Duty"
    | "Off_Duty"
    | "Open"
    | "Closed"
    | "Retired"
    | "Suspended";
};

const statusTokens: Record<StatusBadgeProps["status"], string> = {
  Available: "var(--status-success)",
  "On Trip": "var(--status-info)",
  On_Trip: "var(--status-info)",
  "In Shop": "var(--status-warning)",
  In_Shop: "var(--status-warning)",
  "Off Duty": "var(--text-secondary)",
  Off_Duty: "var(--text-secondary)",
  Open: "var(--status-warning)",
  Closed: "var(--status-success)",
  Retired: "var(--status-danger)",
  Suspended: "var(--status-danger)",
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const label = status.replace("_", " ");
  const color = statusTokens[status];
  const style = {
    backgroundColor: `color-mix(in srgb, ${color} 11%, transparent)`,
    borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
    color,
  } satisfies CSSProperties;

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
      )}
      style={style}
    >
      {label}
    </span>
  );
};
