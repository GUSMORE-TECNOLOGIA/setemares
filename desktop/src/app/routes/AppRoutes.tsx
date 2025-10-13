import { CatalogPage } from "@/components/catalog/CatalogPage";
import { UnknownCodesPage } from "@/components/decoder/UnknownCodesPage";
import { BookingsPage } from "../features/bookings/pages/BookingsPage";
import { ConciergePage } from "../features/concierge/pages/ConciergePage";
import { useAppState } from "../shared/hooks/useAppState";

export function AppRoutes() {
  const { currentPage } = useAppState();

  if (currentPage === 'catalog') {
    return <CatalogPage />;
  }

  if (currentPage === 'unknown-codes') {
    return <UnknownCodesPage />;
  }

  if (currentPage === 'concierge') {
    return <ConciergePage />;
  }

  return <BookingsPage />;
}
