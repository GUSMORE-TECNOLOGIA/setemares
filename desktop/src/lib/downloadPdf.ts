import { pdf } from "@react-pdf/renderer";
import PdfDocument, { type PdfData } from "./PdfDocument";

export async function downloadPdf(data: PdfData) {
  const instance = pdf(PdfDocument({ data }));
  const blob = await instance.toBlob();
  const filename = `Cotacao_7Mares_${new Date().toISOString().slice(0,10)}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
