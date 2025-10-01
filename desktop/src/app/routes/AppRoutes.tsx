import { CatalogPage } from "@/components/catalog/CatalogPage";
import { UnknownCodesPage } from "@/components/decoder/UnknownCodesPage";
import { BookingsPage } from "../features/bookings/pages/BookingsPage";
import { useAppState } from "../shared/hooks/useAppState";

export function AppRoutes() {
  const { currentPage } = useAppState();

  if (currentPage === 'catalog') {
    return <CatalogPage />;
  }

  if (currentPage === 'unknown-codes') {
    return <UnknownCodesPage />;
  }

  return <BookingsPage />;
}
