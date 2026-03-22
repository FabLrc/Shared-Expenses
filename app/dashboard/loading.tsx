function Bone({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-zinc-200 dark:bg-zinc-700 ${className}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Bone className="h-6 w-32" />
          <div className="flex items-center gap-3">
            <Bone className="h-4 w-16" />
            <Bone className="h-8 w-8 rounded-full" />
            <Bone className="h-8 w-24" />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Title row */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Bone className="h-8 w-40" />
            <Bone className="h-4 w-20" />
          </div>
          <Bone className="h-10 w-36" />
        </div>

        {/* Session cards */}
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 space-y-3"
              style={{ opacity: 1 - i * 0.2 }}
            >
              <div className="flex items-center justify-between">
                <Bone className="h-5 w-36" />
                <Bone className="h-5 w-14 rounded-full" />
              </div>
              <Bone className="h-4 w-28" />
              <div className="flex items-center justify-between pt-1">
                <Bone className="h-4 w-20" />
                <Bone className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
