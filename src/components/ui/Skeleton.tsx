import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`}
      {...props}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 5 
}) => {
  return (
    <div className="w-full flex flex-col gap-4">
      {/* Table Head Skeleton */}
      <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/80">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`head-${i}`} className={`h-5 ${i === 0 ? 'w-1/4' : 'flex-1'}`} />
        ))}
      </div>
      
      {/* Table Body Rows Skeleton */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`row-${r}`} className="flex gap-4 p-4 border border-slate-100/50 dark:border-slate-800/30 rounded-xl items-center">
            {Array.from({ length: cols }).map((_, c) => {
              if (c === 0) {
                // Column 1 resembles name with small profile avatar
                return (
                  <div key={`col-${r}-${c}`} className="w-1/4 flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                );
              }
              return (
                <Skeleton key={`col-${r}-${c}`} className="h-4 flex-1" />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardGridSkeleton: React.FC<{ cards?: number }> = ({ cards = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 bg-white dark:bg-slate-900/50 flex flex-col gap-4">
          <Skeleton className="w-full h-44 rounded-xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full animate-pulse" />
          <Skeleton className="h-4 w-5/6 animate-pulse" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-8 flex-1 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const StatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 bg-white dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  );
};
export default Skeleton;
