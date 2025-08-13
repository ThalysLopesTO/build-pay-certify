import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Calendar, ChevronRight } from "lucide-react";
import { useForemanAssignedTasksThisWeek } from "@/hooks/foreman/useForemanAssignedTasksThisWeek";
import { DashboardCardHeader } from "@/components/common/DashboardCardHeader";

interface Props {
  onViewProjects?: () => void;
}

const ForemanJobProgressCard: React.FC<Props> = ({ onViewProjects }) => {
  const { items, loading, error, refetch } = useForemanAssignedTasksThisWeek();

  return (
    <Card className="border border-border shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl overflow-hidden">
      <DashboardCardHeader
        title="This Week's Overview"
        icon={<Building className="h-5 w-5" />}
        accent="green"
      />
      <CardContent className="p-6 space-y-5">
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse space-y-3 p-4 bg-muted/30 rounded-lg">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-2 bg-muted rounded w-full" />
                <div className="h-2 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-destructive">Failed to load job progress.</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-4">
            {items.map((it) => {
              const datesLabel = it.startDate && it.endDate
                ? `${new Date(it.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}–${new Date(it.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                : "Dates: TBD";
              const statusLabel = it.status?.replace("_", " ") || "pending";

              return (
                <div key={it.taskId} className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{it.jobsiteName}</div>
                      {it.jobsiteAddress && (
                        <div className="text-xs text-muted-foreground truncate">{it.jobsiteAddress}</div>
                      )}
                    </div>
                    {it.status && (
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                        {statusLabel}
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm font-medium truncate">{it.taskTitle}</div>

                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="truncate">
                        {datesLabel}
                        {it.durationDays ? ` • Duration: ${it.durationDays}d` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Building className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No assigned jobsites</p>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full hover:bg-primary/5 focus-visible:ring-offset-2 focus-visible:ring-2"
          onClick={onViewProjects}
        >
          View My Projects
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default ForemanJobProgressCard;
