import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

// Tipo para dados de múltiplas opções
export type MultiStackedPdfData = {
  header: { 
    title: string;           // "COTAÇÃO Lisbon, Portugal"
    subtitle: string;        // "Opção com a TAP Air Portugal"
    departureLabel: string;  // "Saída: 22 de Setembro"
    quoteDate: string;       // "Data da Cotação: 18 de Janeiro de 2025"
    logoSrc?: string;
  };
  metadata?: {
    family?: string;         // "Família Silva"
    observation?: string;    // "Cliente VIP, preferência por assentos na janela"
  };
  options: Array<{
    index: number;           // 1, 2, 3, 4...
    flights: Array<{ 
      flightCode: string;      // "LATAM Airlines 8084"
      fromAirport: string;     // "GUARULHOS INTERNATIONAL AIRPORT (GRU), SÃO PAULO, BRAZIL"
      toAirport: string;       // "HUMBERTO DELGADO AIRPORT (LIS), LISBON, PORTUGAL"
      departureDateTime: string; // "22/11/2025 23:15"
      arrivalDateTime: string;   // "23/11/2025 12:30"
    }>;
    fareDetails?: Array<{
      classLabel: string;      // "Executiva", "Premium", "Economy"
      baseFare: number;        // 2999.00
      taxes: number;           // 90.00 (inclui RAV, FII, etc.)
      total: number;           // 3089.00
    }>;
    footer: {
      baggage: string;         // "2 peças de até 23kg por bilhete"
      payment: string;         // "Em até 4x no cartão de crédito, taxas à vista"
      penalty: string;         // "USD 250.00 + diferença tarifária, caso houver."
      refundable: string;      // "Bilhete não reembolsável."
    };
  }>;
};

const S = StyleSheet.create({
  // Página A4, fundo branco, margens 28/32
  page: { 
    backgroundColor: "#ffffff", 
    color: "#111827", 
    paddingTop: 28, 
    paddingHorizontal: 32, 
    paddingBottom: 28, // Volta ao padrão - rodapé será posicionado corretamente
    fontSize: 12, 
    lineHeight: 1.35,
    fontFamily: "Helvetica"
  },
  
  // Cabeçalho (card) - compacto
  headerCard: { 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: "#E5E7EB", 
    backgroundColor: "#FFFFFF", 
    padding: 10, 
    marginBottom: 8,
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
    marginLeft: 8
  },
  logo: {
    height: 65,
    width: 180
  },
  headerTitle: { fontSize: 18, fontWeight: 700, marginBottom: 4, color: "#111827" },
  headerClient: { 
    fontSize: 11, 
    fontWeight: 300, 
    fontStyle: 'italic',
    color: "#6B7280", 
    marginBottom: 4,
    letterSpacing: 0.3
  },
  headerSeparator: { height: 1, backgroundColor: "#E5E7EB", marginBottom: 6 },
  headerSubtitle: { fontSize: 10, color: "#374151", marginBottom: 2 },
  headerCompany: { fontSize: 10, fontWeight: 700, color: "#111827", marginBottom: 4 },
  headerDeparture: { fontSize: 9, color: "#374151", marginBottom: 2 },
  headerQuoteDate: { fontSize: 9, color: "#374151", marginBottom: 2 },
  headerDate: { fontSize: 9, fontWeight: 700, color: "#111827" },
  
  // Metadados da cotação
  metadataCard: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    padding: 8,
    marginBottom: 12
  },
  metadataTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 4
  },
  metadataItem: {
    fontSize: 9,
    color: "#4B5563",
    marginBottom: 2,
    flexDirection: "row"
  },
  metadataLabel: {
    fontWeight: 600,
    width: 60,
    color: "#374151"
  },
  metadataValue: {
    flex: 1,
    color: "#111827"
  },
  
  // Título da opção
  optionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: "#FF7A1A",
    marginBottom: 6,
    marginTop: 8,
    textAlign: "left",
    backgroundColor: "#FFF7ED",
    padding: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#FED7AA"
  },
  
  // Tabela (card único)
  tableCard: { 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: "#E5E7EB", 
    overflow: "hidden", 
    marginBottom: 8
  },
  
  // Cabeçalho da tabela
  tableHeader: { 
    backgroundColor: "#0F172A", 
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    minHeight: 24
  },
  thText: { 
    color: "#FFFFFF", 
    fontSize: 9, 
    fontWeight: 700,
    textTransform: "uppercase",
    textAlign: "center",
    lineHeight: 1.2
  },
  
  // Linhas da tabela
  tableRow: { 
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    minHeight: 35,
    pageBreakInside: "avoid"
  },
  tableRowZebra: { backgroundColor: "#F9FAFB" },
  
  // Colunas (larguras: [80, 180, 180, 100, 100])
  col1: { width: 80, fontSize: 10, fontWeight: 700, paddingRight: 8 },
  col2: { width: 180, fontSize: 9, lineHeight: 1.2, paddingRight: 8, paddingLeft: 12 },
  col3: { width: 180, fontSize: 9, lineHeight: 1.2, paddingRight: 8, paddingLeft: 12 },
  col4: { width: 100, fontSize: 9, textAlign: "center", paddingRight: 4 },
  col5: { width: 100, fontSize: 9, textAlign: "center" },
  
  // Valores por cabine (layout horizontal compacto)
  fareDetailsCard: { 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: "#E5E7EB", 
    backgroundColor: "#F3F4F6", 
    padding: 10, 
    marginBottom: 8,
    pageBreakInside: "avoid"
  },
  fareDetailsTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#FF7A1A",
    marginBottom: 8,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#FFF7ED",
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#FED7AA",
    minHeight: 28,
    pageBreakInside: "avoid"
  },
  fareInfo: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    paddingRight: 8
  },
  fareClassLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 2
  },
  fareBreakdown: {
    fontSize: 9,
    color: "#6B7280",
    lineHeight: 1.2
  },
  fareTotal: {
    fontSize: 11,
    fontWeight: 700,
    color: "#FF7A1A",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FED7AA",
    textAlign: "center",
    minWidth: 90,
    alignSelf: "center"
  },
  
  // Informações da cotação (design premium)
  quoteInfoCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    pageBreakInside: "avoid"
  },
  quoteInfoTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  quoteInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8
  },
  quoteInfoItem: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
    pageBreakInside: "avoid"
  },
  quoteInfoLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3
  },
  quoteInfoValue: {
    fontSize: 10,
    color: "#111827", 
    lineHeight: 1.3
  },
  quoteInfoObservation: {
    width: "100%",
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: 6,
    padding: 10,
    marginTop: 4
  },
  quoteInfoObservationLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: "#92400E",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3
  },
  quoteInfoObservationValue: {
    fontSize: 10,
    color: "#92400E",
    lineHeight: 1.3,
    fontStyle: "italic"
  },
  
  // Separador entre opções
  optionSeparator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
    borderRadius: 1
  },
  
  // Rodapé normal (não fixo) - posicionado no final do conteúdo
  disclaimerContainer: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB"
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

export default function MultiStackedPdfDocument({ data }: { data: MultiStackedPdfData }) {
  const totalOptions = data.options.length;
  const hasBuffer = typeof (globalThis as any).Buffer !== 'undefined';
  
  console.log('🔍 MultiStackedPdfDocument - Renderizando:', {
    totalOptions,
    options: data.options.map((o, i) => ({
      index: i,
      flightsCount: o.flights.length,
      fareDetailsCount: o.fareDetails?.length || 0,
      hasManyFlights: o.flights.length > 6
    }))
  });
  
  return (
    <Document>
      {data.options.flatMap((option, optionIndex) => {
        const isLastOption = optionIndex === totalOptions - 1;
        // Para cada opção, verificar se tem mais de 6 voos
        const hasManyFlights = option.flights.length > 6;
        
        console.log(`🔍 Renderizando Opção ${optionIndex + 1}:`, {
          isLastOption,
          flightsCount: option.flights.length,
          hasManyFlights
        });
        
        if (hasManyFlights) {
          // Dividir voos em grupos de 6 para uma única opção
          const flightGroups = [];
          for (let i = 0; i < option.flights.length; i += 6) {
            flightGroups.push(option.flights.slice(i, i + 6));
          }
          
          console.log(`🔍 Opção ${optionIndex + 1} tem ${option.flights.length} voos, dividindo em ${flightGroups.length} grupos`);
          
          // Renderizar múltiplas páginas para esta opção
          return flightGroups.map((flightGroup, groupIndex) => {
            console.log(`🔍 Renderizando grupo ${groupIndex + 1} da opção ${optionIndex + 1} com ${flightGroup.length} voos`);
            return (
            <Page key={`${optionIndex}-${groupIndex}`} size="A4" style={S.page}>
              {/* Cabeçalho Premium - apenas na primeira página da primeira opção */}
              {optionIndex === 0 && groupIndex === 0 && (
        <View style={S.headerCard}>
          <View style={S.headerContent}>
            <Text style={S.headerTitle}>COTAÇÃO DE AÉREOS</Text>
                    <Text style={S.headerClient}>
                      Cliente: {data.metadata?.family || 'A definir'}
                    </Text>
            <View style={S.headerSeparator} />
            <Text style={S.headerSubtitle}>Melhor valor com: <Text style={S.headerCompany}>{data.header.subtitle}</Text></Text>
            <Text style={S.headerDeparture}>Saída: <Text style={S.headerDate}>{data.header.departureLabel}</Text></Text>
          </View>
          <View style={S.headerLogo}>
            {data.header.logoSrc ? (
              <Image src={data.header.logoSrc} style={S.logo} />
            ) : null}
          </View>
        </View>
              )}

              {/* Renderizar a opção com grupo de voos */}
              <View>
            {/* Título da opção */}
            <Text style={S.optionTitle}>OPÇÃO {option.index}</Text>

                {/* Tabela de voos - apenas o grupo atual */}
            <View style={S.tableCard}>
              {/* Cabeçalho da tabela */}
              <View style={S.tableHeader}>
                <View style={S.col1}><Text style={S.thText}>VOO</Text></View>
                <View style={S.col2}><Text style={S.thText}>AEROPORTO PARTIDA</Text></View>
                <View style={S.col3}><Text style={S.thText}>AEROPORTO CHEGADA</Text></View>
                <View style={S.col4}><Text style={S.thText}>PARTIDA</Text></View>
                <View style={S.col5}><Text style={S.thText}>CHEGADA</Text></View>
              </View>
              
                  {/* Linhas de voos - apenas do grupo atual */}
                  {flightGroup.map((flight, i) => (
                <View key={i} style={[S.tableRow, i % 2 === 1 ? S.tableRowZebra : {}]} wrap={false}>
                  <View style={S.col1}>
                    <Text style={{fontWeight: 700, fontSize: 9, lineHeight: 1.2}}>
                      {flight.flightCode.split(' ')[0]}
                    </Text>
                    <Text style={{fontSize: 8, color: "#6B7280", lineHeight: 1.1}}>
                      {flight.flightCode.split(' ').slice(1).join(' ')}
                    </Text>
                  </View>
                  <View style={S.col2}>
                    <Text style={{fontSize: 8, lineHeight: 1.2, color: "#374151"}}>
                      {typeof flight.fromAirport === 'string' ? flight.fromAirport.split('(')[0].trim() : flight.fromAirport || ''}
                    </Text>
                    <Text style={{fontSize: 7, color: "#6B7280", lineHeight: 1.1}}>
                      {typeof flight.fromAirport === 'string' ? flight.fromAirport.split('(')[1]?.replace(')', '') || '' : ''}
                    </Text>
                  </View>
                  <View style={S.col3}>
                    <Text style={{fontSize: 8, lineHeight: 1.2, color: "#374151"}}>
                      {typeof flight.toAirport === 'string' ? flight.toAirport.split('(')[0].trim() : flight.toAirport || ''}
                    </Text>
                    <Text style={{fontSize: 7, color: "#6B7280", lineHeight: 1.1}}>
                      {typeof flight.toAirport === 'string' ? flight.toAirport.split('(')[1]?.replace(')', '') || '' : ''}
                    </Text>
                  </View>
                  <View style={S.col4}>
                    <Text style={{fontSize: 8, textAlign: "center", fontWeight: 600, color: "#111827"}}>
                      {typeof flight.departureDateTime === 'string' ? flight.departureDateTime.split(' ')[0] : flight.departureDateTime || ''}
                    </Text>
                    <Text style={{fontSize: 7, textAlign: "center", color: "#6B7280"}}>
                      {typeof flight.departureDateTime === 'string' ? flight.departureDateTime.split(' ')[1] || '' : ''}
                    </Text>
                  </View>
                  <View style={S.col5}>
                    <Text style={{fontSize: 8, textAlign: "center", fontWeight: 600, color: "#111827"}}>
                      {typeof flight.arrivalDateTime === 'string' ? flight.arrivalDateTime.split(' ')[0] : flight.arrivalDateTime || ''}
                    </Text>
                    <Text style={{fontSize: 7, textAlign: "center", color: "#6B7280"}}>
                      {typeof flight.arrivalDateTime === 'string' ? flight.arrivalDateTime.split(' ')[1] || '' : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Valores por cabine */}
            <View style={S.fareDetailsCard}>
              <Text style={S.fareDetailsTitle}>VALORES POR CABINE</Text>
              {option.fareDetails?.map((fare: any, fareIndex: number) => (
                <View key={fareIndex} style={S.fareRow} wrap={false}>
                  <View style={S.fareInfo}>
                    <Text style={S.fareClassLabel}>{fare.classLabel}</Text>
                    <Text style={S.fareBreakdown}>
                      Tarifa: {fUSD(fare.baseFare)} + Taxas: {fUSD(fare.taxes)}
                    </Text>
                  </View>
                  <Text style={S.fareTotal}>{fUSD(fare.total)}</Text>
                </View>
              ))}
            </View>

            {/* Informações da cotação - renderizar apenas no último grupo da última opção */}
            {isLastOption && groupIndex === flightGroups.length - 1 && (
              <View style={S.quoteInfoCard}>
                <Text style={S.quoteInfoTitle}>INFORMAÇÕES DA COTAÇÃO</Text>
                
                <View style={S.quoteInfoGrid}>
                  <View style={S.quoteInfoItem}>
                    <Text style={S.quoteInfoLabel}>Franquia de bagagem</Text>
                    <Text style={S.quoteInfoValue}>{option.footer.baggage}</Text>
                  </View>
                  
                  <View style={S.quoteInfoItem}>
                    <Text style={S.quoteInfoLabel}>Forma de pagamento</Text>
                    <Text style={S.quoteInfoValue}>{option.footer.payment}</Text>
                  </View>
                  
                  <View style={S.quoteInfoItem}>
                    <Text style={S.quoteInfoLabel}>Multa para alteração</Text>
                    <Text style={S.quoteInfoValue}>{option.footer.penalty}</Text>
                  </View>
                  
                  <View style={S.quoteInfoItem}>
                    <Text style={S.quoteInfoLabel}>Reembolso</Text>
                    <Text style={S.quoteInfoValue}>{option.footer.refundable}</Text>
                  </View>
                </View>
                
                {/* Observação (se houver) */}
                {data.metadata?.observation && (
                  <View style={S.quoteInfoObservation}>
                    <Text style={S.quoteInfoObservationLabel}>Observação</Text>
                    <Text style={S.quoteInfoObservationValue}>{data.metadata.observation}</Text>
                  </View>
                )}
              </View>
            )}

                {/* Disclaimer centralizado no final da página - APENAS NA ÚLTIMA OPÇÃO */}
                {isLastOption && (
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
                )}
              </View>
            </Page>
            );
          });
        } else {
          console.log(`🔍 Opção ${optionIndex + 1} tem ${option.flights.length} voos, renderizando com paginação inteligente`);
          
          // Verificar se precisa de página extra para observações
          const hasObservations = data.metadata?.observation;
          const needsExtraPage = hasObservations && isLastOption;
          
          if (needsExtraPage) {
            console.log(`🔍 Criando página extra para observações + rodapé`);
            // Criar duas páginas: uma para o conteúdo principal, outra para observações + rodapé
            return [
              // Página 1: Conteúdo principal (sem observações)
              <Page key={`${optionIndex}-main`} size="A4" style={S.page}>
              {/* Cabeçalho Premium - apenas na primeira página */}
              {optionIndex === 0 && (
                <View style={S.headerCard}>
                  <View style={S.headerContent}>
                    <Text style={S.headerTitle}>COTAÇÃO DE AÉREOS</Text>
                    <Text style={S.headerClient}>
                      Cliente: {data.metadata?.family || 'A definir'}
                    </Text>
                    <View style={S.headerSeparator} />
                    <Text style={S.headerSubtitle}>Melhor valor com: <Text style={S.headerCompany}>{data.header.subtitle}</Text></Text>
                    <Text style={S.headerDeparture}>Saída: <Text style={S.headerDate}>{data.header.departureLabel}</Text></Text>
                  </View>
                  <View style={S.headerLogo}>
                  {data.header.logoSrc ? (
                    <Image src={data.header.logoSrc} style={S.logo} />
                    ) : null}
                  </View>
                </View>
              )}

              {/* Renderizar a opção atual */}
              <View>
                {/* Título da opção */}
                <Text style={S.optionTitle}>OPÇÃO {option.index}</Text>

                {/* Tabela de voos */}
                <View style={S.tableCard}>
                  {/* Cabeçalho da tabela */}
                  <View style={S.tableHeader}>
                    <View style={S.col1}><Text style={S.thText}>VOO</Text></View>
                    <View style={S.col2}><Text style={S.thText}>AEROPORTO PARTIDA</Text></View>
                    <View style={S.col3}><Text style={S.thText}>AEROPORTO CHEGADA</Text></View>
                    <View style={S.col4}><Text style={S.thText}>PARTIDA</Text></View>
                    <View style={S.col5}><Text style={S.thText}>CHEGADA</Text></View>
                  </View>
                  
                  {/* Linhas de voos */}
                  {option.flights.map((flight, i) => (
                    <View key={i} style={[S.tableRow, i % 2 === 1 ? S.tableRowZebra : {}]} wrap={false}>
                      <View style={S.col1}>
                        <Text style={{fontWeight: 700, fontSize: 9, lineHeight: 1.2}}>
                          {flight.flightCode.split(' ')[0]}
                        </Text>
                        <Text style={{fontSize: 8, color: "#6B7280", lineHeight: 1.1}}>
                          {flight.flightCode.split(' ').slice(1).join(' ')}
                        </Text>
                      </View>
                      <View style={S.col2}>
                        <Text style={{fontSize: 8, lineHeight: 1.2, color: "#374151"}}>
                          {typeof flight.fromAirport === 'string' ? flight.fromAirport.split('(')[0].trim() : flight.fromAirport || ''}
                        </Text>
                        <Text style={{fontSize: 7, color: "#6B7280", lineHeight: 1.1}}>
                          {typeof flight.fromAirport === 'string' ? flight.fromAirport.split('(')[1]?.replace(')', '') || '' : ''}
                        </Text>
                      </View>
                      <View style={S.col3}>
                        <Text style={{fontSize: 8, lineHeight: 1.2, color: "#374151"}}>
                          {typeof flight.toAirport === 'string' ? flight.toAirport.split('(')[0].trim() : flight.toAirport || ''}
                        </Text>
                        <Text style={{fontSize: 7, color: "#6B7280", lineHeight: 1.1}}>
                          {typeof flight.toAirport === 'string' ? flight.toAirport.split('(')[1]?.replace(')', '') || '' : ''}
                        </Text>
                      </View>
                      <View style={S.col4}>
                        <Text style={{fontSize: 8, textAlign: "center", fontWeight: 600, color: "#111827"}}>
                          {typeof flight.departureDateTime === 'string' ? flight.departureDateTime.split(' ')[0] : flight.departureDateTime || ''}
                        </Text>
                        <Text style={{fontSize: 7, textAlign: "center", color: "#6B7280"}}>
                          {typeof flight.departureDateTime === 'string' ? flight.departureDateTime.split(' ')[1] || '' : ''}
                        </Text>
                      </View>
                      <View style={S.col5}>
                        <Text style={{fontSize: 8, textAlign: "center", fontWeight: 600, color: "#111827"}}>
                          {typeof flight.arrivalDateTime === 'string' ? flight.arrivalDateTime.split(' ')[0] : flight.arrivalDateTime || ''}
                        </Text>
                        <Text style={{fontSize: 7, textAlign: "center", color: "#6B7280"}}>
                          {typeof flight.arrivalDateTime === 'string' ? flight.arrivalDateTime.split(' ')[1] || '' : ''}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Valores por cabine */}
                {option.fareDetails && option.fareDetails.length > 0 && (
                  <View style={S.fareDetailsCard}>
                    <Text style={S.fareDetailsTitle}>VALORES POR CABINE</Text>
                    {option.fareDetails.map((fare, fareIndex) => (
                      <View key={fareIndex} style={S.fareRow} wrap={false}>
                        <View style={S.fareInfo}>
                          <Text style={S.fareClassLabel}>{fare.classLabel}</Text>
                          <Text style={S.fareBreakdown}>
                            Tarifa: {fUSD(fare.baseFare)} + Taxas: {fUSD(fare.taxes)}
                          </Text>
                        </View>
                        <Text style={S.fareTotal}>{fUSD(fare.total)}</Text>
          </View>
        ))}
                  </View>
                )}

                {/* Informações da cotação - renderizar apenas na última opção */}
                {isLastOption && (
                  <View style={S.quoteInfoCard}>
                    <Text style={S.quoteInfoTitle}>INFORMAÇÕES DA COTAÇÃO</Text>
                    
                    <View style={S.quoteInfoGrid}>
                      <View style={S.quoteInfoItem}>
                        <Text style={S.quoteInfoLabel}>Franquia de bagagem</Text>
                        <Text style={S.quoteInfoValue}>{option.footer.baggage}</Text>
                      </View>
                      
                      <View style={S.quoteInfoItem}>
                        <Text style={S.quoteInfoLabel}>Forma de pagamento</Text>
                        <Text style={S.quoteInfoValue}>{option.footer.payment}</Text>
                      </View>
                      
                      <View style={S.quoteInfoItem}>
                        <Text style={S.quoteInfoLabel}>Multa para alteração</Text>
                        <Text style={S.quoteInfoValue}>{option.footer.penalty}</Text>
                      </View>
                      
                      <View style={S.quoteInfoItem}>
                        <Text style={S.quoteInfoLabel}>Reembolso</Text>
                        <Text style={S.quoteInfoValue}>{option.footer.refundable}</Text>
                      </View>
                    </View>
                    
                    {/* Observação NÃO incluída na primeira página quando há página extra */}
                  </View>
                )}

                {/* Rodapé NÃO incluído na primeira página quando há página extra */}
              </View>
            </Page>,
            
            // Página 2: Observações + Rodapé
            <Page key={`${optionIndex}-footer`} size="A4" style={S.page}>
              <View>
                {/* Observação */}
                {data.metadata?.observation && (
                  <View style={S.quoteInfoObservation}>
                    <Text style={S.quoteInfoObservationLabel}>Observação</Text>
                    <Text style={S.quoteInfoObservationValue}>{data.metadata.observation}</Text>
                  </View>
                )}
                
                {/* Rodapé no final da página */}
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
              </View>
            </Page>
          ];
          } else {
            // Caso normal: tudo em uma página
            return (
              <Page key={optionIndex} size="A4" style={S.page}>
                {/* Cabeçalho Premium - apenas na primeira página */}
                {optionIndex === 0 && (
                  <View style={S.headerCard}>
                    <View style={S.headerContent}>
                      <Text style={S.headerTitle}>COTAÇÃO DE AÉREOS</Text>
                      <Text style={S.headerClient}>
                        Cliente: {data.metadata?.family || 'A definir'}
                      </Text>
                      <View style={S.headerSeparator} />
                      <Text style={S.headerSubtitle}>Opção com: <Text style={S.headerCompany}>{data.header.subtitle}</Text></Text>
                      <Text style={S.headerDeparture}>Saída: <Text style={S.headerDate}>{data.header.departureLabel}</Text></Text>
                      <Text style={S.headerQuoteDate}>Data da Cotação: <Text style={S.headerDate}>{data.header.quoteDate}</Text></Text>
                    </View>
                    <View style={S.headerLogo}>
                      {data.header.logoSrc ? (
                        <Image src={data.header.logoSrc} style={S.logo} />
                      ) : null}
                    </View>
                  </View>
                )}

                {/* Renderizar a opção atual */}
                <View>
                  {/* Título da opção */}
                  <Text style={S.optionTitle}>OPÇÃO {option.index}</Text>

                  {/* Tabela de voos */}
                  <View style={S.tableCard}>
                    {/* Cabeçalho da tabela */}
                    <View style={S.tableHeader}>
                      <View style={S.col1}><Text style={S.thText}>VOO</Text></View>
                      <View style={S.col2}><Text style={S.thText}>AEROPORTO PARTIDA</Text></View>
                      <View style={S.col3}><Text style={S.thText}>AEROPORTO CHEGADA</Text></View>
                      <View style={S.col4}><Text style={S.thText}>PARTIDA</Text></View>
                      <View style={S.col5}><Text style={S.thText}>CHEGADA</Text></View>
                    </View>
                    
                    {/* Linhas de voos */}
                    {option.flights.map((flight, i) => (
                      <View key={i} style={[S.tableRow, i % 2 === 1 ? S.tableRowZebra : {}]} wrap={false}>
                        <View style={S.col1}>
                          <Text style={{fontWeight: 700, fontSize: 9, lineHeight: 1.2}}>
                            {flight.flightCode.split(' ')[0]}
                          </Text>
                          <Text style={{fontSize: 8, color: "#6B7280", lineHeight: 1.1}}>
                            {flight.flightCode.split(' ').slice(1).join(' ')}
                          </Text>
                        </View>
                        <View style={S.col2}>
                          <Text style={{fontSize: 8, lineHeight: 1.2, color: "#374151"}}>
                            {typeof flight.fromAirport === 'string' ? flight.fromAirport.split('(')[0].trim() : flight.fromAirport || ''}
                          </Text>
                          <Text style={{fontSize: 7, color: "#6B7280", lineHeight: 1.1}}>
                            {typeof flight.fromAirport === 'string' ? flight.fromAirport.split('(')[1]?.replace(')', '') || '' : ''}
                          </Text>
                        </View>
                        <View style={S.col3}>
                          <Text style={{fontSize: 8, lineHeight: 1.2, color: "#374151"}}>
                            {typeof flight.toAirport === 'string' ? flight.toAirport.split('(')[0].trim() : flight.toAirport || ''}
                          </Text>
                          <Text style={{fontSize: 7, color: "#6B7280", lineHeight: 1.1}}>
                            {typeof flight.toAirport === 'string' ? flight.toAirport.split('(')[1]?.replace(')', '') || '' : ''}
                          </Text>
                        </View>
                        <View style={S.col4}>
                          <Text style={{fontSize: 8, textAlign: "center", fontWeight: 600, color: "#111827"}}>
                            {typeof flight.departureDateTime === 'string' ? flight.departureDateTime.split(' ')[0] : flight.departureDateTime || ''}
                          </Text>
                          <Text style={{fontSize: 7, textAlign: "center", color: "#6B7280"}}>
                            {typeof flight.departureDateTime === 'string' ? flight.departureDateTime.split(' ')[1] || '' : ''}
                          </Text>
                        </View>
                        <View style={S.col5}>
                          <Text style={{fontSize: 8, textAlign: "center", fontWeight: 600, color: "#111827"}}>
                            {typeof flight.arrivalDateTime === 'string' ? flight.arrivalDateTime.split(' ')[0] : flight.arrivalDateTime || ''}
                          </Text>
                          <Text style={{fontSize: 7, textAlign: "center", color: "#6B7280"}}>
                            {typeof flight.arrivalDateTime === 'string' ? flight.arrivalDateTime.split(' ')[1] || '' : ''}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Valores por cabine */}
                  {option.fareDetails && option.fareDetails.length > 0 && (
                    <View style={S.fareDetailsCard}>
                      <Text style={S.fareDetailsTitle}>VALORES POR CABINE</Text>
                      {option.fareDetails.map((fare, fareIndex) => (
                        <View key={fareIndex} style={S.fareRow} wrap={false}>
                          <View style={S.fareInfo}>
                            <Text style={S.fareClassLabel}>{fare.classLabel}</Text>
                            <Text style={S.fareBreakdown}>
                              Tarifa: {fUSD(fare.baseFare)} + Taxas: {fUSD(fare.taxes)}
                            </Text>
                          </View>
                          <Text style={S.fareTotal}>{fUSD(fare.total)}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Informações da cotação - renderizar apenas na última opção */}
                {isLastOption && (
                  <View style={S.quoteInfoCard}>
                    <Text style={S.quoteInfoTitle}>INFORMAÇÕES DA COTAÇÃO</Text>
                    
                    <View style={S.quoteInfoGrid}>
                      <View style={S.quoteInfoItem}>
                        <Text style={S.quoteInfoLabel}>Franquia de bagagem</Text>
                        <Text style={S.quoteInfoValue}>{option.footer.baggage}</Text>
                      </View>
                      
                      <View style={S.quoteInfoItem}>
                        <Text style={S.quoteInfoLabel}>Forma de pagamento</Text>
                        <Text style={S.quoteInfoValue}>{option.footer.payment}</Text>
                      </View>
                      
                      <View style={S.quoteInfoItem}>
                        <Text style={S.quoteInfoLabel}>Multa para alteração</Text>
                        <Text style={S.quoteInfoValue}>{option.footer.penalty}</Text>
                      </View>
                      
                      <View style={S.quoteInfoItem}>
                        <Text style={S.quoteInfoLabel}>Reembolso</Text>
                        <Text style={S.quoteInfoValue}>{option.footer.refundable}</Text>
                      </View>
                    </View>
                    
                    {/* Observação (se houver) */}
                    {data.metadata?.observation && (
                      <View style={S.quoteInfoObservation}>
                        <Text style={S.quoteInfoObservationLabel}>Observação</Text>
                        <Text style={S.quoteInfoObservationValue}>{data.metadata.observation}</Text>
                      </View>
                    )}
                  </View>
                )}

                  {/* Rodapé no final da página - APENAS NA ÚLTIMA OPÇÃO */}
                {isLastOption && (
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
                )}
        </View>
      </Page>
          );
          }
        }
      })}
    </Document>
  );
}
