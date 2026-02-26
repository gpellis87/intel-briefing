"use client";

export function LoadingState() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero skeleton */}
      <div className="bg-surface-secondary rounded-2xl border border-border-primary overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="h-64 lg:h-80 skeleton-shimmer" />
          <div className="p-8 space-y-4">
            <div className="flex gap-3">
              <div className="h-6 w-24 rounded-full skeleton-shimmer" />
              <div className="h-6 w-16 rounded-full skeleton-shimmer" />
            </div>
            <div className="space-y-3 pt-2">
              <div className="h-7 w-full rounded-lg skeleton-shimmer" />
              <div className="h-7 w-4/5 rounded-lg skeleton-shimmer" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full rounded skeleton-shimmer" />
              <div className="h-4 w-3/4 rounded skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-secondary rounded-2xl border border-border-primary overflow-hidden"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="h-44 skeleton-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-20 rounded skeleton-shimmer" style={{ animationDelay: `${i * 100 + 50}ms` }} />
                <div className="h-4 w-12 rounded-full skeleton-shimmer" style={{ animationDelay: `${i * 100 + 100}ms` }} />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full rounded skeleton-shimmer" style={{ animationDelay: `${i * 100 + 150}ms` }} />
                <div className="h-4 w-3/4 rounded skeleton-shimmer" style={{ animationDelay: `${i * 100 + 200}ms` }} />
              </div>
              <div className="h-3 w-full rounded skeleton-shimmer" style={{ animationDelay: `${i * 100 + 250}ms` }} />
              <div className="h-3 w-2/3 rounded skeleton-shimmer" style={{ animationDelay: `${i * 100 + 300}ms` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
