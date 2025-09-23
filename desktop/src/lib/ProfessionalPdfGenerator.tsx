// Gerador de PDF Profissional para Cotações de Aéreos
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Usar fontes padrão do sistema para evitar erros de DataView
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2'
// });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
    color: '#333333'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottom: '2px solid #E5E7EB',
    paddingBottom: 20
  },
  headerLeft: {
    flex: 1
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10
  },
  companyInfo: {
    fontSize: 9,
    color: '#6B7280',
    lineHeight: 1.3
  },
  logo: {
    width: 80,
    height: 40,
    marginLeft: 20
  },
  option: {
    marginBottom: 40,
    pageBreakInside: 'avoid'
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 4
  },
  flightTable: {
    marginBottom: 15,
    border: '1px solid #D1D5DB',
    borderRadius: 4
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 9
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #E5E7EB'
  },
  tableCell: {
    padding: 8,
    flex: 1,
    fontSize: 9
  },
  tableCellVoo: {
    padding: 8,
    width: 80,
    fontSize: 9
  },
  tableCellAirport: {
    padding: 8,
    width: 120,
    fontSize: 9
  },
  tableCellTime: {
    padding: 8,
    width: 60,
    fontSize: 9,
    textAlign: 'center'
  },
  pricingSection: {
    marginBottom: 15
  },
  pricingTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8
  },
  pricingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    padding: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 3
  },
  pricingClass: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    flex: 1
  },
  pricingDetails: {
    fontSize: 9,
    color: '#6B7280',
    flex: 2
  },
  pricingTotal: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#DC2626',
    flex: 1,
    textAlign: 'right'
  },
  infoSection: {
    marginBottom: 10
  },
  infoTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 3
  },
  infoText: {
    fontSize: 9,
    color: '#6B7280',
    lineHeight: 1.3
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1px solid #E5E7EB',
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 1.4
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 50
  }
});

interface FlightSegment {
  carrier: string;
  flight: string;
  depAirport: string;
  arrAirport: string;
  depTime: string;
  arrTime: string;
  depDate: string;
  arrDate: string;
}

interface PricingCategory {
  fareClass: string;
  paxType?: string;
  baseFare: number;
  baseTaxes: number;
  total: number;
}

interface OptionData {
  label: string;
  segments: FlightSegment[];
  pricing: PricingCategory[];
  baggage: string;
  payment: string;
  penalty: string;
  notes?: string;
}

interface ProfessionalPdfData {
  options: OptionData[];
  companyInfo: {
    name: string;
    phone: string;
    address: string;
    website: string;
  };
}

export function ProfessionalPdfDocument({ data }: { data: ProfessionalPdfData }) {
  // Validar dados de entrada
  if (!data || !data.options || data.options.length === 0) {
    console.error('❌ Dados inválidos para PDF:', data);
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.errorText}>Erro: Dados inválidos para gerar PDF</Text>
        </Page>
      </Document>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr || typeof dateStr !== 'string') {
        return 'N/A';
      }
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.warn('⚠️ Erro ao formatar data:', dateStr, error);
      return 'N/A';
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      if (!timeStr || typeof timeStr !== 'string') {
        return 'N/A';
      }
      
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch (error) {
      console.warn('⚠️ Erro ao formatar horário:', timeStr, error);
      return 'N/A';
    }
  };

  const getAirportName = (iataCode: string) => {
    const airports: { [key: string]: string } = {
      'GRU': 'Guarulhos International Airport (GRU), Guarulhos, São Paulo, Brazil',
      'CDG': 'Charles de Gaulle Airport (Roissy Airport) (CDG), Paris, France',
      'GVA': 'Geneva Airport (GVA), Geneva, Switzerland',
      'MAD': 'Adolfo Suárez Madrid-Barajas Airport (MAD), Madrid, Spain',
      'ATL': 'Hartsfield-Jackson Atlanta International Airport (ATL), Atlanta, Georgia, USA',
      'BOS': 'Logan International Airport (BOS), Boston, Massachusetts, USA',
      'LHR': 'London Heathrow Airport (LHR), London, United Kingdom',
      'BCN': 'Barcelona El Prat Airport (BCN), El Prat de Llobregat, Spain',
      'SFO': 'San Francisco International Airport (SFO), San Francisco, California, USA',
      'ORY': 'Orly International Airport (ORY), Paris - Orly, Paris, France',
      'LIS': 'Lisbon Portela Airport (LIS), Lisbon, Portugal'
    };
    return airports[iataCode] || `${iataCode} Airport`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>COTAÇÃO DE AÉREOS</Text>
            <Text style={styles.companyInfo}>
              {data.companyInfo.website}{'\n'}
              Tel: {data.companyInfo.phone}{'\n'}
              {data.companyInfo.address}
            </Text>
          </View>
        </View>

        {/* Options */}
        {data.options.map((option, optionIndex) => (
          <View key={optionIndex} style={styles.option}>
            {/* Option Title */}
            <Text style={styles.optionTitle}>{option.label}:</Text>

            {/* Flight Table */}
            <View style={styles.flightTable}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellVoo}>Voo</Text>
                <Text style={styles.tableCellAirport}>Aeroporto de partida</Text>
                <Text style={styles.tableCellAirport}>Aeroporto de chegada</Text>
                <Text style={styles.tableCellTime}>Horário de partida</Text>
                <Text style={styles.tableCellTime}>Horário de chegada</Text>
              </View>
              
              {option.segments.map((segment, segmentIndex) => (
                <View key={segmentIndex} style={styles.tableRow}>
                  <Text style={styles.tableCellVoo}>
                    {segment.carrier} {segment.flight}
                  </Text>
                  <Text style={styles.tableCellAirport}>
                    {getAirportName(segment.depAirport)}
                  </Text>
                  <Text style={styles.tableCellAirport}>
                    {getAirportName(segment.arrAirport)}
                  </Text>
                  <Text style={styles.tableCellTime}>
                    {formatDate(segment.depDate)} {formatTime(segment.depTime)}
                  </Text>
                  <Text style={styles.tableCellTime}>
                    {formatDate(segment.arrDate)} {formatTime(segment.arrTime)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Pricing Section - Layout igual ao exemplo */}
            <View style={styles.pricingSection}>
              {option.pricing.map((pricing, pricingIndex) => {
                // Calcular RAV, Fee e Incentivo (valores padrão se não especificados)
                const ravPercent = 10; // RAV 10% padrão
                const fee = 0; // Fee padrão
                const incentivo = 0; // Incentivo padrão
                const subtotal = pricing.baseFare + pricing.baseTaxes;
                const ravValue = subtotal * (ravPercent / 100);
                const totalWithRav = subtotal + ravValue + fee + incentivo;
                
                return (
                  <View key={pricingIndex} style={styles.pricingItem}>
                    <Text style={styles.pricingClass}>
                      Valor por pessoa em classe {pricing.fareClass}
                      {pricing.paxType && pricing.paxType !== 'ADT' && ` (${pricing.paxType})`}:
                    </Text>
                    <Text style={styles.pricingDetails}>
                      Tarifa USD {pricing.baseFare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + 
                      USD {pricing.baseTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} taxas.
                    </Text>
                    <Text style={styles.pricingTotal}>
                      TOTAL USD {totalWithRav.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Additional Information */}
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Franquia de bagagem:</Text>
              <Text style={styles.infoText}>{option.baggage}</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Forma de pagamento:</Text>
              <Text style={styles.infoText}>{option.payment}</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Multa para alteração:</Text>
              <Text style={styles.infoText}>{option.penalty}</Text>
            </View>

            {option.notes && (
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Observações:</Text>
                <Text style={styles.infoText}>{option.notes}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Valores somente cotados, nenhuma reserva foi efetuada. Valores e disponibilidade sujeitos à alteração até o momento da emissão das reservas.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
