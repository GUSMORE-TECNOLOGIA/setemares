import { pdf } from "@react-pdf/renderer";
import MultiStackedPdfDocument, { type MultiStackedPdfData } from "./MultiStackedPdfDocument";

export async function downloadMultiPdf(data: MultiStackedPdfData) {
  const instance = pdf(MultiStackedPdfDocument({ data }));
  const blob = await instance.toBlob();
  const filename = `Cotacao_Multi_7Mares_${new Date().toISOString().slice(0,10)}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; 
  a.download = filename; 
  document.body.appendChild(a); 
  a.click(); 
  a.remove();
  URL.revokeObjectURL(url);
}
