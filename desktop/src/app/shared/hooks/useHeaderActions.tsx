import type { ReactNode } from "react";
import { createContext, useContext, useEffect } from "react";

interface HeaderActionsContextValue {
  setHeaderActions: (actions: ReactNode | null) => void;
}

export const HeaderActionsContext = createContext<HeaderActionsContextValue | undefined>(undefined);

export function useHeaderActions(actions: ReactNode | null) {
  const context = useContext(HeaderActionsContext);

  if (!context) {
    throw new Error('useHeaderActions must be used within HeaderActionsContext provider');
  }

  useEffect(() => {
    context.setHeaderActions(actions);
    return () => context.setHeaderActions(null);
  }, [actions, context]);
}
