import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Calendar, ChevronRight } from "lucide-react";
import { useForemanAssignedProjects } from "@/hooks/foreman/useForemanAssignedProjects";

interface Props {
  onViewProjects?: () => void;
}

const ForemanJobProgressCard: React.FC<Props> = ({ onViewProjects }) => {
  const { jobsites, loading, error, refetch } = useForemanAssignedProjects();

  const items = (jobsites || []).slice(0, 3);

  return (
    <Card className="border border-border shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <Building className="h-5 w-5" />
        </div>
        <div className="font-semibold">This Week's Overview</div>
      </div>
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
            {items.map((j) => {
              const pct = Math.max(0, Math.min(100, Math.round(j.progressPct)));
              const datesLabel = j.nextTask?.start_date && j.nextTask?.end_date
                ? `${new Date(j.nextTask.start_date).toLocaleDateString()}–${new Date(j.nextTask.end_date).toLocaleDateString()}`
                : "Dates: TBD";
              const statusLabel = j.nextTask?.status?.replace("_", " ") || "pending";

              return (
                <div key={j.id} className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{j.name}</div>
                      {j.address && (
                        <div className="text-xs text-muted-foreground truncate">{j.address}</div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium shrink-0">{pct}%</div>
                  </div>

                  <div className="h-2 w-full bg-green-100 rounded">
                    <div
                      className="h-2 bg-green-600 rounded"
                      style={{ width: `${pct}%` }}
                      aria-label={`Progress ${pct}%`}
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="truncate">
                        Next Task: {j.nextTask?.title || "—"} • {datesLabel}
                        {j.nextTask?.durationDays ? ` • Duration: ${j.nextTask.durationDays}d` : ""}
                      </span>
                    </div>
                    {j.nextTask?.status && (
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                        {statusLabel}
                      </Badge>
                    )}
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
          className="w-full hover:bg-primary/5"
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
