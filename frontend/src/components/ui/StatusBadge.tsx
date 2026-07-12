import { cn } from "../../lib/cn";

type StatusBadgeProps = {
  status: "Available" | "On Trip" | "In Shop" | "Retired" | "Suspended";
};

const statusClasses: Record<StatusBadgeProps["status"], string> = {
  Available: "border-success/30 bg-success/10 text-green-300",
  "On Trip": "border-warning/30 bg-warning/10 text-amber-300",
  "In Shop": "border-danger/30 bg-danger/10 text-red-300",
  Retired: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  Suspended: "border-danger/30 bg-danger/10 text-red-300",
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        "mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        statusClasses[status],
      )}
    >
      {status}
    </span>
  );
};

