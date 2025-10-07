import { useCallback, useState } from 'react';
import { 
  LazyPdfDocument, 
  LazyMultiStackedPdfDocument,
  LazyUnifiedPdfGenerator,
  LazyProfessionalPdfGenerator,
  PdfLoadingFallback 
} from '@/components/pdf/LazyPdfComponents';
import { Suspense } from 'react';

type PdfComponentType = 'simple' | 'multi' | 'unified' | 'professional';

interface UseLazyPdfReturn {
  loadPdfComponent: (type: PdfComponentType) => Promise<React.ComponentType<any>>;
  isPdfLoaded: boolean;
  pdfError: string | null;
  PdfComponent: React.ComponentType<any> | null;
}

export function useLazyPdf(): UseLazyPdfReturn {
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [PdfComponent, setPdfComponent] = useState<React.ComponentType<any> | null>(null);

  const loadPdfComponent = useCallback(async (type: PdfComponentType): Promise<React.ComponentType<any>> => {
    try {
      setIsPdfLoaded(false);
      setPdfError(null);

      let Component: React.ComponentType<any>;

      switch (type) {
        case 'simple':
          Component = LazyPdfDocument;
          break;
        case 'multi':
          Component = LazyMultiStackedPdfDocument;
          break;
        case 'unified':
          Component = LazyUnifiedPdfGenerator;
          break;
        case 'professional':
          Component = LazyProfessionalPdfGenerator;
          break;
        default:
          throw new Error(`Tipo de componente PDF não suportado: ${type}`);
      }

      // Simular carregamento assíncrono para mostrar loading
      await new Promise(resolve => setTimeout(resolve, 100));

      setPdfComponent(Component);
      setIsPdfLoaded(true);
      
      return Component;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar componente PDF';
      setPdfError(errorMessage);
      setIsPdfLoaded(false);
      throw error;
    }
  }, []);

  return {
    loadPdfComponent,
    isPdfLoaded,
    pdfError,
    PdfComponent
  };
}

// Hook para pré-carregar componentes PDF
export function usePdfPreloader() {
  const [preloadedComponents, setPreloadedComponents] = useState<Set<PdfComponentType>>(new Set());

  const preloadPdfComponent = useCallback(async (type: PdfComponentType) => {
    if (preloadedComponents.has(type)) {
      return;
    }

    try {
      switch (type) {
        case 'simple':
          await import('@/lib/PdfDocument');
          break;
        case 'multi':
          await import('@/lib/MultiStackedPdfDocument');
          break;
        case 'unified':
          await import('@/lib/UnifiedPdfGenerator');
          break;
        case 'professional':
          await import('@/lib/ProfessionalPdfGenerator');
          break;
      }

      setPreloadedComponents(prev => new Set([...prev, type]));
    } catch (error) {
      console.warn(`Erro ao pré-carregar componente PDF ${type}:`, error);
    }
  }, [preloadedComponents]);

  const preloadAllPdfComponents = useCallback(async () => {
    const types: PdfComponentType[] = ['simple', 'multi', 'unified', 'professional'];
    await Promise.all(types.map(preloadPdfComponent));
  }, [preloadPdfComponent]);

  return {
    preloadPdfComponent,
    preloadAllPdfComponents,
    preloadedComponents: Array.from(preloadedComponents)
  };
}
