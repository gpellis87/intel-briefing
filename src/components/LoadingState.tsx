"use client";

export function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-navy-900/80 rounded-xl border border-navy-700 overflow-hidden animate-pulse"
          >
            <div className="h-40 bg-navy-800" />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-20 bg-navy-700 rounded" />
                <div className="h-4 w-12 bg-navy-700 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-navy-700 rounded" />
                <div className="h-4 w-3/4 bg-navy-700 rounded" />
              </div>
              <div className="h-3 w-full bg-navy-800 rounded" />
              <div className="h-3 w-2/3 bg-navy-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
