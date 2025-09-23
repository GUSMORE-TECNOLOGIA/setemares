// Gerador de PDF Elegante para Cotações de Aéreos - Sete Mares Turismo
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

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
  optionBlock: {
    marginBottom: 40,
    pageBreakInside: 'avoid'
  },
  optionHeader: {
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 15
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  optionSubtitle: {
    fontSize: 12,
    opacity: 0.9
  },
  contextBar: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    padding: 15,
    marginBottom: 20,
    borderRadius: 6
  },
  contextText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  flightTable: {
    marginBottom: 20
  },
  tableHeader: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    padding: 8
  },
  tableHeaderCell: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 9,
    flex: 1,
    textAlign: 'center'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #E5E7EB',
    padding: 8
  },
  tableCell: {
    fontSize: 9,
    flex: 1,
    textAlign: 'center',
    color: '#374151'
  },
  pricingSection: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 6,
    marginBottom: 15
  },
  pricingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  fareClass: {
    fontSize: 10,
    color: '#374151'
  },
  fareValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '2px solid #E5E7EB',
    paddingTop: 8,
    marginTop: 8
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626'
  },
  footer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 6,
    marginTop: 15
  },
  footerText: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 3
  },
  separator: {
    height: 20,
    borderBottom: '2px solid #E5E7EB',
    marginBottom: 20
  }
});

interface Flight {
  flightCode: string;
  fromAirport: string;
  toAirport: string;
  departureDateTime: string;
  arrivalDateTime: string;
}

interface Fare {
  class: string;
  baseFare: number;
  baseTaxes: number;
  total: number;
}

interface Block {
  header: {
    title: string;
    subtitle: string;
    departureLabel: string;
    logoSrc: string;
  };
  flights: Flight[];
  fareBlock: {
    classLabel: string;
    totalUSD: number;
    fares: Fare[];
  };
  footer: {
    baggage: string;
    payment: string;
    penalty: string;
    refundable: string;
  };
}

interface UnifiedPdfData {
  blocks: Block[];
  companyInfo: {
    name: string;
    phone: string;
    address: string;
    website: string;
  };
}

const FlightTable: React.FC<{ flights: Flight[] }> = ({ flights }) => (
  <View style={styles.flightTable}>
    <View style={styles.tableHeader}>
      <Text style={styles.tableHeaderCell}>VOO</Text>
      <Text style={styles.tableHeaderCell}>AEROPORTO PARTIDA</Text>
      <Text style={styles.tableHeaderCell}>AEROPORTO CHEGADA</Text>
      <Text style={styles.tableHeaderCell}>HORÁRIO DE PARTIDA</Text>
      <Text style={styles.tableHeaderCell}>HORÁRIO DE CHEGADA</Text>
    </View>
    {flights.map((flight, index) => (
      <View key={index} style={styles.tableRow}>
        <Text style={styles.tableCell}>{flight.flightCode}</Text>
        <Text style={styles.tableCell}>{flight.fromAirport}</Text>
        <Text style={styles.tableCell}>{flight.toAirport}</Text>
        <Text style={styles.tableCell}>{flight.departureDateTime}</Text>
        <Text style={styles.tableCell}>{flight.arrivalDateTime}</Text>
      </View>
    ))}
  </View>
);

const PricingSection: React.FC<{ fareBlock: Block['fareBlock'] }> = ({ fareBlock }) => (
  <View style={styles.pricingSection}>
    <Text style={styles.pricingTitle}>Valor por bilhete — {fareBlock.classLabel}:</Text>
    {fareBlock.fares.map((fare, index) => (
      <View key={index} style={styles.fareRow}>
        <Text style={styles.fareClass}>
          {fare.class}: Tarifa USD {fare.baseFare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + USD {fare.baseTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} taxas.
        </Text>
        <Text style={styles.fareValue}>
          TOTAL USD {fare.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Text>
      </View>
    ))}
    <View style={styles.totalRow}>
      <Text style={styles.totalLabel}>TOTAL GERAL:</Text>
      <Text style={styles.totalValue}>
        USD {fareBlock.totalUSD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </Text>
    </View>
  </View>
);

const FooterSection: React.FC<{ footer: Block['footer'] }> = ({ footer }) => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>Franquia de bagagem: {footer.baggage}</Text>
    <Text style={styles.footerText}>Forma de pagamento: {footer.payment}</Text>
    <Text style={styles.footerText}>Multa para alteração: {footer.penalty}</Text>
    <Text style={styles.footerText}>{footer.refundable}</Text>
  </View>
);

const QuoteBlock: React.FC<{ block: Block; isLast: boolean }> = ({ block, isLast }) => (
  <View style={styles.optionBlock}>
    <View style={styles.optionHeader}>
      <Text style={styles.optionTitle}>{block.header.title}</Text>
      <Text style={styles.optionSubtitle}>
        {block.header.subtitle} • {block.header.departureLabel}
      </Text>
    </View>
    
    <View style={styles.contextBar}>
      <Text style={styles.contextText}>
        {block.header.title} • {block.header.subtitle} • {block.header.departureLabel}
      </Text>
    </View>
    
    <FlightTable flights={block.flights} />
    
    <PricingSection fareBlock={block.fareBlock} />
    
    <FooterSection footer={block.footer} />
    
    {!isLast && <View style={styles.separator} />}
  </View>
);

export const UnifiedPdfDocument: React.FC<{ data: UnifiedPdfData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>COTAÇÃO DE AÉREOS</Text>
          <Text style={styles.companyInfo}>
            {data.companyInfo.name}
          </Text>
          <Text style={styles.companyInfo}>
            {data.companyInfo.phone} • {data.companyInfo.website}
          </Text>
          <Text style={styles.companyInfo}>
            {data.companyInfo.address}
          </Text>
        </View>
        <View style={styles.logo}>
          <Text style={styles.companyInfo}>SETE MARES TURISMO</Text>
        </View>
      </View>
      
      {data.blocks.map((block, index) => (
        <QuoteBlock 
          key={index} 
          block={block} 
          isLast={index === data.blocks.length - 1} 
        />
      ))}
    </Page>
  </Document>
);
