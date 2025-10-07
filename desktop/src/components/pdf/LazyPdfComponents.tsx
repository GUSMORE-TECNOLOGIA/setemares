import { lazy, Suspense } from 'react';

// Lazy imports para componentes PDF pesados
export const LazyPdfDocument = lazy(() => 
  import('@/lib/PdfDocument').then(module => ({ 
    default: module.PdfDocument 
  }))
);

export const LazyMultiStackedPdfDocument = lazy(() => 
  import('@/lib/MultiStackedPdfDocument').then(module => ({ 
    default: module.MultiStackedPdfDocument 
  }))
);

export const LazyUnifiedPdfGenerator = lazy(() => 
  import('@/lib/UnifiedPdfGenerator').then(module => ({ 
    default: module.UnifiedPdfGenerator 
  }))
);

export const LazyProfessionalPdfGenerator = lazy(() => 
  import('@/lib/ProfessionalPdfGenerator').then(module => ({ 
    default: module.ProfessionalPdfGenerator 
  }))
);

// Componente de loading para PDF
export function PdfLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        <p className="text-sm text-slate-400">Carregando gerador de PDF...</p>
      </div>
    </div>
  );
}

// HOC para wrapper com Suspense
export function withPdfSuspense<T extends object>(Component: React.ComponentType<T>) {
  return function SuspendedComponent(props: T) {
    return (
      <Suspense fallback={<PdfLoadingFallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}
