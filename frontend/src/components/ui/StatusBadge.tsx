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
    | "Retired"
    | "Suspended";
};

const statusClasses: Record<StatusBadgeProps["status"], string> = {
  Available: "border-success/30 bg-success/10 text-green-300",
  "On Trip": "border-warning/30 bg-warning/10 text-amber-300",
  On_Trip: "border-warning/30 bg-warning/10 text-amber-300",
  "In Shop": "border-danger/30 bg-danger/10 text-red-300",
  In_Shop: "border-danger/30 bg-danger/10 text-red-300",
  "Off Duty": "border-slate-500/30 bg-slate-500/10 text-slate-300",
  Off_Duty: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  Retired: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  Suspended: "border-danger/30 bg-danger/10 text-red-300",
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const label = status.replace("_", " ");

  return (
    <span
      className={cn(
        "mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        statusClasses[status],
      )}
    >
      {label}
    </span>
  );
};
