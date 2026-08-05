import { motion } from "framer-motion";

export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-200 rounded-lg p-4 space-y-3"
    >
      <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse" />
      <div className="h-8 bg-gray-300 rounded animate-pulse" />
    </motion.div>
  );
}

export function SkeletonLine() {
  return <div className="h-4 bg-gray-300 rounded animate-pulse" />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-300 rounded animate-pulse"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
