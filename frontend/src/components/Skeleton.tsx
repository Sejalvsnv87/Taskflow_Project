export default function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="mb-3 h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mb-2 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

export function SkeletonBoard() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonColumn() {
  return (
    <div className="w-72 shrink-0 space-y-3">
      <div className="h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      ))}
    </div>
  );
}
