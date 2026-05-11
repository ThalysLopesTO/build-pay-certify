import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  live?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onExportCsv?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

const LivePill: React.FC<{ live?: boolean }> = ({ live }) => (
  <Badge variant="outline" className="gap-2">
    <span className={cn("inline-block h-2 w-2 rounded-full bg-primary", live && "animate-pulse")}></span>
    Live
  </Badge>
);

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  live = true,
  isRefreshing,
  onRefresh,
  onExportCsv,
  className,
}) => {
  return (
    <header className={cn("pb-6 border-b-2 border-primary", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <LivePill live={live} />
          {onExportCsv && (
            <Button variant="outline" size="lg" className="gap-2" onClick={onExportCsv} aria-label="Export CSV">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              size="lg"
              className="gap-2 hover:bg-accent/50 transition-all duration-200"
              aria-label="Refresh data"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
