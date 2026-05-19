'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 m-4">
      {/* Header Skeleton */}
      <Card className="p-0 rounded-2xl">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-24 h-3" />
            </div>
          </div>
          <Skeleton className="w-40 h-8 rounded-full" />
        </div>
      </Card>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-0">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets Panel Skeleton - 2 columns */}
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-48" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-6 h-6 rounded-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Live Conversation Skeleton - 1 column */}
        <div>
          <Card className="p-0 overflow-hidden h-full">
            <div className="px-4 py-3 border-b border-border">
              <Skeleton className="h-5 w-40" />
            </div>
            <CardContent className="pt-4 space-y-4">
              {/* Messages area */}
              <div className="space-y-3 h-80">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={i % 2 === 0 ? 'flex justify-end' : 'flex justify-start'}>
                    <Skeleton className="h-10 w-32 rounded-lg" />
                  </div>
                ))}
              </div>

              {/* Input area */}
              <div className="pt-4 border-t border-border space-y-2">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
