import { AppLayout } from "./layout/AppLayout";
import { AppRoutes } from "./routes/AppRoutes";
import { AppStateProvider } from "./shared/hooks/useAppState";

export default function App() {
  return (
    <AppStateProvider>
      <AppLayout>
        <AppRoutes />
      </AppLayout>
    </AppStateProvider>
  );
}
