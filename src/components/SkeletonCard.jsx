export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100 animate-pulse">
      <div className="w-full h-52 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
        <div className="h-5 w-3/4 bg-gray-200 rounded" />
        <div className="flex gap-3">
          <div className="h-3 w-10 bg-gray-200 rounded" />
          <div className="h-3 w-14 bg-gray-200 rounded" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
        </div>
        <div className="h-3 w-1/2 bg-gray-200 rounded" />
        <div className="h-3 w-24 bg-gray-200 rounded-full" />
        <div className="h-7 w-24 bg-gray-200 rounded mt-2" />
        <div className="flex gap-2 mt-1">
          <div className="h-10 flex-1 bg-gray-200 rounded-lg" />
          <div className="h-10 flex-1 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
