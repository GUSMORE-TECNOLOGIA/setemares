import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

// Modelo oficial Sete Mares - PDF 2
export type PdfData = {
  header: { 
    title: string;           // "COTAÇÃO Lisbon, Portugal"
    subtitle: string;        // "Melhor valor com a TAP Air Portugal"
    departureLabel: string;  // "Saída: 22 de Setembro"
    logoSrc?: string;
  };
  flights: Array<{ 
    flightCode: string;      // "LATAM Airlines 8084"
    fromAirport: string;     // "GUARULHOS INTERNATIONAL AIRPORT (GRU), SÃO PAULO, BRAZIL"
    toAirport: string;       // "HUMBERTO DELGADO AIRPORT (LIS), LISBON, PORTUGAL"
    departureDateTime: string; // "22/11/2025 23:15"
    arrivalDateTime: string;   // "23/11/2025 12:30"
  }>;
  fareBlock: { 
    classLabel: string;      // "Classe Executiva"
    totalUSD: number;        // 2404.00
  };
  footer: {
    baggage: string;         // "2 peças de até 23kg por bilhete"
    payment: string;         // "Em até 4x no cartão de crédito, taxas à vista"
    penalty: string;         // "USD 250.00 + diferença tarifária, caso houver."
    refundable: string;      // "Bilhete não reembolsável."
  };
};

const S = StyleSheet.create({
  // Página A4, fundo branco, margens 28/32
  page: { 
    backgroundColor: "#ffffff", 
    color: "#111827", 
    paddingTop: 28, 
    paddingHorizontal: 32, 
    paddingBottom: 28, 
    fontSize: 11, 
    lineHeight: 1.35,
    fontFamily: "Helvetica"
  },
  
  // Cabeçalho (card) - compacto
  headerCard: { 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: "#E5E7EB", 
    backgroundColor: "#FFFFFF", 
    padding: 12, 
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  headerContent: {
    flex: 1
  },
  headerLogo: {
    height: 65,
    width: 180,
    marginLeft: 16
  },
  logo: {
    height: 65,
    width: 180
  },
  headerTitle: { fontSize: 18, fontWeight: 700, marginBottom: 6, color: "#111827" },
  headerLocation: { fontSize: 12, color: "#374151", marginBottom: 8 },
  headerSeparator: { height: 1, backgroundColor: "#E5E7EB", marginBottom: 6 },
  headerSubtitle: { fontSize: 10, color: "#374151", marginBottom: 2 },
  headerCompany: { fontSize: 10, fontWeight: 700, color: "#111827", marginBottom: 4 },
  headerDeparture: { fontSize: 9, color: "#374151", marginBottom: 2 },
  headerDate: { fontSize: 9, fontWeight: 700, color: "#111827" },
  
  // Tabela (card único)
  tableCard: { 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: "#E5E7EB", 
    overflow: "hidden", 
    marginBottom: 14 
  },
  
  // Cabeçalho da tabela
  tableHeader: { 
    backgroundColor: "#0F172A", 
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    minHeight: 45
  },
  thText: { 
    color: "#FFFFFF", 
    fontSize: 12, 
    fontWeight: 700,
    textTransform: "uppercase",
    textAlign: "center",
    lineHeight: 1.3
  },
  
  // Linhas da tabela
  tableRow: { 
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    minHeight: 45
  },
  tableRowZebra: { backgroundColor: "#F9FAFB" },
  
  // Colunas (larguras: [80, 180, 180, 100, 100])
  col1: { width: 80, fontSize: 11, fontWeight: 700, paddingRight: 8 },
  col2: { width: 180, fontSize: 10, lineHeight: 1.2, paddingRight: 8, paddingLeft: 12 },
  col3: { width: 180, fontSize: 10, lineHeight: 1.2, paddingRight: 8, paddingLeft: 12 },
  col4: { width: 100, fontSize: 10, textAlign: "center", paddingRight: 4 },
  col5: { width: 100, fontSize: 10, textAlign: "center" },
  
  // Box de total (card)
  totalCard: { 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: "#E5E7EB", 
    backgroundColor: "#F9FAFB", 
    padding: 14, 
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  totalLabel: { fontSize: 11 },
  totalPill: { 
    backgroundColor: "#FF7A1A", 
    color: "#0b0b0b", 
    borderRadius: 10, 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    fontSize: 14, 
    fontWeight: 700 
  },
  
  // Informações da cotação (logo após o valor)
  quoteInfo: {
    marginBottom: 20
  },
  quoteInfoText: { 
    fontSize: 11, 
    color: "#111827", 
    marginBottom: 4,
    lineHeight: 1.4
  },
  
  // Disclaimer centralizado no final da página
  disclaimerContainer: {
    position: "absolute",
    bottom: 28,
    left: 32,
    right: 32
  },
  footerDisclaimer: { 
    fontSize: 9, 
    color: "#6B7280", 
    marginBottom: 8,
    lineHeight: 1.3,
    textAlign: "center"
  },
  footerSeparator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 8
  },
  footerContact: {
    textAlign: "right"
  },
  footerContactLine: {
    fontSize: 9,
    color: "#6B7280",
    lineHeight: 1.3,
    marginBottom: 2
  }
});

const fUSD = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function PdfDocument({ data }: { data: PdfData }) {
  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Cabeçalho Premium */}
        <View style={S.headerCard}>
          <View style={S.headerContent}>
            <Text style={S.headerTitle}>COTAÇÃO DE AÉREOS</Text>
            <Text style={S.headerLocation}>{data.header.title}</Text>
            <View style={S.headerSeparator} />
            <Text style={S.headerSubtitle}>Opção com: <Text style={S.headerCompany}>{data.header.subtitle}</Text></Text>
            <Text style={S.headerDeparture}>Saída: <Text style={S.headerDate}>{data.header.departureLabel}</Text></Text>
          </View>
                <View style={S.headerLogo}>
                  <Image src={data.header.logoSrc} style={S.logo} />
                </View>
        </View>

        {/* Tabela de voos */}
        <View style={S.tableCard}>
          {/* Cabeçalho da tabela */}
          <View style={S.tableHeader}>
            <View style={S.col1}><Text style={S.thText}>VOO</Text></View>
            <View style={S.col2}><Text style={S.thText}>AEROPORTO{"\n"}PARTIDA</Text></View>
            <View style={S.col3}><Text style={S.thText}>AEROPORTO{"\n"}CHEGADA</Text></View>
            <View style={S.col4}><Text style={S.thText}>HORÁRIO DE{"\n"}PARTIDA</Text></View>
            <View style={S.col5}><Text style={S.thText}>HORÁRIO DE{"\n"}CHEGADA</Text></View>
          </View>
          
          {/* Linhas de voos */}
          {data.flights.map((flight, i) => (
            <View key={i} style={[S.tableRow, i % 2 === 1 ? S.tableRowZebra : {}]}>
              <View style={S.col1}>
                <Text style={{fontWeight: 700, fontSize: 10, lineHeight: 1.2}}>
                  {flight.flightCode.split(' ')[0]}
                </Text>
                <Text style={{fontSize: 9, color: "#6B7280", lineHeight: 1.1}}>
                  {flight.flightCode.split(' ').slice(1).join(' ')}
                </Text>
              </View>
              <View style={S.col2}>
                <Text style={{fontSize: 9, lineHeight: 1.2, color: "#374151"}}>
                  {typeof flight.fromAirport === 'string' ? flight.fromAirport.split('(')[0].trim() : flight.fromAirport || ''}
                </Text>
                <Text style={{fontSize: 8, color: "#6B7280", lineHeight: 1.1}}>
                  {typeof flight.fromAirport === 'string' ? flight.fromAirport.split('(')[1]?.replace(')', '') || '' : ''}
                </Text>
              </View>
              <View style={S.col3}>
                <Text style={{fontSize: 9, lineHeight: 1.2, color: "#374151"}}>
                  {typeof flight.toAirport === 'string' ? flight.toAirport.split('(')[0].trim() : flight.toAirport || ''}
                </Text>
                <Text style={{fontSize: 8, color: "#6B7280", lineHeight: 1.1}}>
                  {typeof flight.toAirport === 'string' ? flight.toAirport.split('(')[1]?.replace(')', '') || '' : ''}
                </Text>
              </View>
              <View style={S.col4}>
                <Text style={{fontSize: 9, textAlign: "center", fontWeight: 600, color: "#111827"}}>
                  {typeof flight.departureDateTime === 'string' ? flight.departureDateTime.split(' ')[0] : flight.departureDateTime || ''}
                </Text>
                <Text style={{fontSize: 8, textAlign: "center", color: "#6B7280"}}>
                  {typeof flight.departureDateTime === 'string' ? flight.departureDateTime.split(' ')[1] || '' : ''}
                </Text>
              </View>
              <View style={S.col5}>
                <Text style={{fontSize: 9, textAlign: "center", fontWeight: 600, color: "#111827"}}>
                  {typeof flight.arrivalDateTime === 'string' ? flight.arrivalDateTime.split(' ')[0] : flight.arrivalDateTime || ''}
                </Text>
                <Text style={{fontSize: 8, textAlign: "center", color: "#6B7280"}}>
                  {typeof flight.arrivalDateTime === 'string' ? flight.arrivalDateTime.split(' ')[1] || '' : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Box de total */}
        <View style={S.totalCard}>
          <Text style={S.totalLabel}>Valor por bilhete — {data.fareBlock.classLabel}:</Text>
          <Text style={S.totalPill}>TOTAL {fUSD(data.fareBlock.totalUSD)}</Text>
        </View>

        {/* Informações da cotação - logo após o valor */}
        <View style={S.quoteInfo}>
          <Text style={S.quoteInfoText}>Franquia de bagagem: {data.footer.baggage}</Text>
          <Text style={S.quoteInfoText}>Forma de pagamento: {data.footer.payment}</Text>
          <Text style={S.quoteInfoText}>Multa para alteração: {data.footer.penalty}</Text>
          <Text style={S.quoteInfoText}>{data.footer.refundable}</Text>
        </View>

        {/* Disclaimer centralizado no final da página */}
        <View style={S.disclaimerContainer}>
          <Text style={S.footerDisclaimer}>
            Valores somente cotados, nenhuma reserva foi efetuada. Valores e disponibilidade sujeitos a alteração até o momento da emissão das reservas.
          </Text>
          
          {/* Separador */}
          <View style={S.footerSeparator} />
          
          {/* Rodapé - 3 linhas alinhadas à direita */}
          <View style={S.footerContact}>
            <Text style={S.footerContactLine}>www.setemaresturismo.com.br</Text>
            <Text style={S.footerContactLine}>Tel: (+5511) 3121-2888</Text>
            <Text style={S.footerContactLine}>Rua Dr. Renato Paes de Barros, 33 - 1º andar - Itaim Bibi - SP 04530-001</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
