// ============================================================
// Dashboard Loading Skeleton
// ============================================================
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6]">
      {/* Header skeleton */}
      <div className="border-b border-orange-200/50 bg-white/70 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl skeleton" />
            <div>
              <div className="h-5 w-28 skeleton rounded-lg mb-1" />
              <div className="h-3 w-20 skeleton rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-6 w-20 skeleton rounded-full" />
            <div className="h-5 w-16 skeleton rounded-md" />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar skeleton */}
          <div className="lg:col-span-1 space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/80 border border-orange-100 p-4">
                <div className="h-4 w-20 skeleton rounded-md mb-3" />
                <div className="space-y-2">
                  <div className="h-3 w-full skeleton rounded-md" />
                  <div className="h-3 w-3/4 skeleton rounded-md" />
                </div>
              </div>
            ))}
          </div>

          {/* Content skeleton */}
          <div className="lg:col-span-3 space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/80 border border-orange-100 p-6">
                <div className="h-5 w-48 skeleton rounded-lg mb-4" />
                <div className="space-y-3">
                  <div className="h-4 w-full skeleton rounded-md" />
                  <div className="h-4 w-5/6 skeleton rounded-md" />
                  <div className="h-10 w-full skeleton rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
