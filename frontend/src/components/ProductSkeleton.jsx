export default function ProductSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-xl p-4 shadow">
      <div className="h-40 bg-gray-200 rounded mb-4" />
      <div className="h-4 bg-gray-200 rounded mb-2" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
    </div>
  );
}
