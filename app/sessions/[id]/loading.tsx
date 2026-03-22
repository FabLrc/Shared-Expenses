function Bone({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-zinc-200 dark:bg-zinc-700 ${className}`}
    />
  );
}

export default function SessionLoading() {
  return (
    <div className="min-h-screen dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Bone className="h-5 w-4 shrink-0" />
            <Bone className="h-4 w-2 shrink-0" />
            <Bone className="h-5 w-32" />
            <Bone className="h-5 w-14 rounded-full shrink-0" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Bone className="h-8 w-8 rounded-full" />
            <Bone className="h-8 w-20" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {/* Partner info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bone className="h-4 w-20" />
            <Bone className="h-4 w-24" />
          </div>
          <Bone className="h-4 w-28" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-700 gap-4 pb-px">
          <div className="flex-1 pb-3 border-b-2 border-zinc-900 dark:border-zinc-100">
            <Bone className="h-4 w-20 mx-auto" />
          </div>
          <div className="flex-1 pb-3">
            <Bone className="h-4 w-16 mx-auto" />
          </div>
        </div>

        {/* Add expense button */}
        <Bone className="h-10 w-full" />

        {/* Search */}
        <Bone className="h-10 w-full" />

        {/* Section header */}
        <div className="flex items-center justify-between">
          <Bone className="h-4 w-24" />
          <Bone className="h-4 w-16" />
        </div>

        {/* Expense items */}
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3"
              style={{ opacity: 1 - i * 0.18 }}
            >
              <div className="flex-1 space-y-2">
                <Bone className="h-4 w-32" />
                <Bone className="h-3 w-20" />
              </div>
              <div className="text-right space-y-2 shrink-0">
                <Bone className="h-4 w-16 ml-auto" />
                <Bone className="h-3 w-24 ml-auto" />
              </div>
              <Bone className="h-9 w-9 rounded-lg shrink-0" />
              <Bone className="h-9 w-9 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
