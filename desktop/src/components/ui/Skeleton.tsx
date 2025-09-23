import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
}

export function Skeleton({ className = "", lines = 1, height = "h-4" }: SkeletonProps) {
  if (lines === 1) {
    return (
      <div className={`animate-pulse bg-white/10 rounded ${height} ${className}`} />
    );
  }

  return (
    <div className="space-y-2">
      {[...Array(lines)].map((_, i) => (
        <div 
          key={i} 
          className={`animate-pulse bg-white/10 rounded ${height} ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          } ${className}`} 
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="glass-card p-6">
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        
        {/* Search skeleton */}
        <Skeleton className="h-10 w-full" />
        
        {/* Table skeleton */}
        <div className="space-y-3">
          {/* Table header */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {[...Array(columns)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          
          {/* Table rows */}
          {[...Array(rows)].map((_, rowIndex) => (
            <div 
              key={rowIndex} 
              className="grid gap-4 py-2" 
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {[...Array(columns)].map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className={`h-4 w-full ${
                    colIndex === columns - 1 ? 'w-3/4' : 'w-full'
                  }`} 
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
