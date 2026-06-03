import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Loading skeleton for the Income & Expenses section.
 * Mirrors the real layout (header, KPIs, charts, table) so the page
 * does not flash a bare "Loading..." text while data is fetched.
 */
export const IncomeExpensesSkeleton = ({ isMobile }: { isMobile?: boolean }) => {
  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen overflow-x-hidden max-w-full">
      {/* Header */}
      <Card className="border-slate-200">
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          {!isMobile && <Skeleton className="h-10 w-40 rounded-md" />}
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-slate-200">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      {!isMobile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-56 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table rows */}
      <Card className="border-slate-200">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24 hidden sm:block" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncomeExpensesSkeleton;
