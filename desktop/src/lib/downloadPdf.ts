import type { PdfData } from "./PdfDocument";
import type { MultiStackedPdfData } from "./MultiStackedPdfDocument";
import { downloadMultiPdf } from "./downloadMultiPdf";

function mapSimpleToMulti(data: PdfData): MultiStackedPdfData {
  const flights = data.flights.map((flight) => ({
    flightCode: flight.flightCode,
    fromAirport: flight.fromAirport,
    toAirport: flight.toAirport,
    departureDateTime: flight.departureDateTime,
    arrivalDateTime: flight.arrivalDateTime
  }));

  const fareDetails = [
    {
      classLabel: data.fareBlock.classLabel || "Tarifa",
      baseFare: Math.max(data.fareBlock.totalUSD, 0),
      taxes: 0,
      total: Math.max(data.fareBlock.totalUSD, 0)
    }
  ];

  return {
    header: {
      title: data.header.title,
      subtitle: data.header.subtitle,
      departureLabel: data.header.departureLabel,
      quoteDate: data.header.quoteDate || 'Data da Cotação: ' + new Date().toLocaleDateString('pt-BR'),
      logoSrc: data.header.logoSrc
    },
    options: [
      {
        index: 1,
        flights,
        fareDetails,
        footer: {
          baggage: data.footer.baggage,
          payment: data.footer.payment,
          penalty: data.footer.penalty,
          refundable: data.footer.refundable
        }
      }
    ]
  };
}

export async function downloadPdf(data: PdfData) {
  const multiData = mapSimpleToMulti(data);
  await downloadMultiPdf(multiData);
}
