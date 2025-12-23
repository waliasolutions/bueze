/**
 * Admin Page Skeleton - Consistent loading state for admin pages
 * Shows layout structure while content loads to prevent flickering
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface AdminPageSkeletonProps {
  /** Show stats cards skeleton */
  showStats?: boolean;
  /** Number of stat cards to show */
  statsCount?: number;
  /** Show table skeleton */
  showTable?: boolean;
  /** Number of table rows */
  tableRows?: number;
  /** Show action cards skeleton */
  showCards?: boolean;
  /** Number of action cards */
  cardsCount?: number;
}

export function AdminPageSkeleton({
  showStats = true,
  statsCount = 4,
  showTable = false,
  tableRows = 5,
  showCards = true,
  cardsCount = 4,
}: AdminPageSkeletonProps) {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-end gap-2 mb-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats grid skeleton */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          {Array.from({ length: statsCount }).map((_, i) => (
            <Card key={i} className="border-l-4 border-l-muted">
              <CardHeader className="pb-0 sm:pb-1 md:pb-2 p-2 sm:p-3 md:p-6">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-12 mt-2" />
              </CardHeader>
              <CardContent className="p-2 sm:p-3 md:p-6 pt-0">
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table skeleton */}
      {showTable && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Table header */}
              <div className="flex gap-4 pb-3 border-b">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
              {/* Table rows */}
              {Array.from({ length: tableRows }).map((_, i) => (
                <div key={i} className="flex gap-4 py-3 border-b last:border-0">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16 ml-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action cards skeleton */}
      {showCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: cardsCount }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-4 w-48 mt-1" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Convenience exports for common page types
export function DashboardSkeleton() {
  return <AdminPageSkeleton showStats showCards cardsCount={4} />;
}

export function TablePageSkeleton() {
  return <AdminPageSkeleton showStats={false} showTable tableRows={8} showCards={false} />;
}

export function ManagementPageSkeleton() {
  return <AdminPageSkeleton showStats statsCount={3} showTable tableRows={6} showCards={false} />;
}
