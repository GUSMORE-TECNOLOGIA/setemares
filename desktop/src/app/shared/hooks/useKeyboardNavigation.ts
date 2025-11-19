import { useEffect } from 'react';

interface UseKeyboardNavigationProps {
    onNext: () => void;
    onPrev: () => void;
    enabled?: boolean;
}

/**
 * Hook para navegação por teclado usando setas ← →
 * 
 * @param onNext - Callback chamado quando pressiona →
 * @param onPrev - Callback chamado quando pressiona ←
 * @param enabled - Habilita/desabilita a escuta (default: true)
 * 
 * @example
 * ```tsx
 * useKeyboardNavigation({
 *   onNext: () => setIndex(prev => prev + 1),
 *   onPrev: () => setIndex(prev => prev - 1),
 *   enabled: options.length > 1
 * });
 * ```
 */
export function useKeyboardNavigation({
    onNext,
    onPrev,
    enabled = true
}: UseKeyboardNavigationProps) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignorar se estiver digitando em um input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                onNext();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onPrev();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNext, onPrev, enabled]);
}
