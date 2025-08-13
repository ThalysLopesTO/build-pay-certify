import React from "react";
import { cn } from "@/lib/utils";

interface DashboardCardHeaderProps {
  title: string;
  icon: React.ReactNode;
  statusPill?: React.ReactNode;
  accent?: "green" | "blue";
  className?: string;
}

const accentClasses: Record<NonNullable<DashboardCardHeaderProps["accent"]>, string> = {
  green: "bg-gradient-to-r from-green-500 to-green-600",
  blue: "bg-gradient-to-r from-blue-600 to-blue-700",
};

export const DashboardCardHeader: React.FC<DashboardCardHeaderProps> = ({
  title,
  icon,
  statusPill,
  accent = "green",
  className,
}) => {
  return (
    <div
      className={cn(
        "text-white p-4 flex items-center justify-between gap-3",
        accentClasses[accent],
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-white/20 rounded-lg shrink-0">{icon}</div>
        <div className="font-semibold truncate" title={title}>
          {title}
        </div>
      </div>
      {statusPill && <div className="shrink-0">{statusPill}</div>}
    </div>
  );
};
