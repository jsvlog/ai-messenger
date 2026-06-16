export default function LeadsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f0] via-[#fff5eb] to-[#fef3e6]">
      <div className="border-b border-orange-200/50 bg-white/70 h-14" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl bg-white/80 border border-orange-100 p-4">
              <div className="h-3 w-16 skeleton rounded mb-2" />
              <div className="h-8 w-12 skeleton rounded-lg" />
            </div>
          ))}
        </div>
        <div className="warm-card p-6">
          <div className="h-5 w-40 skeleton rounded-lg mb-6" />
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 w-full skeleton rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
