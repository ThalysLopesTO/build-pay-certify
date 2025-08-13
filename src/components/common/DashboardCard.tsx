import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCardHeader } from "@/components/common/DashboardCardHeader";

interface DashboardCardProps {
  title: string;
  icon?: React.ReactNode;
  accent?: "green" | "blue";
  statusPill?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  icon,
  accent = "green",
  statusPill,
  children,
  footer,
  className,
}) => {
  return (
    <Card className={"rounded-2xl overflow-hidden border border-border shadow-sm " + (className || "") }>
      <DashboardCardHeader title={title} icon={icon} accent={accent} statusPill={statusPill} />
      <CardContent className="p-5">
        {children}
      </CardContent>
      {footer && (
        <div className="p-5 pt-0">
          {footer}
        </div>
      )}
    </Card>
  );
};

export default DashboardCard;
