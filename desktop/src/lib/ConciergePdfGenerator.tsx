// Gerador de PDF Premium para Relatórios de Concierge
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#333333'
  },
  // Header com gradiente simulado
  header: {
    flexDirection: 'column',
    backgroundColor: '#FF7A1A',
    marginLeft: -30,
    marginRight: -30,
    marginTop: -30,
    padding: 30,
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.5
  },
  headerMeta: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.95,
    marginBottom: 6
  },
  headerClient: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.85
  },
  // Seções
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF7A1A',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '2px solid #FF7A1A'
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 8
  },
  text: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.6,
    marginBottom: 6
  },
  // Informações do Cliente
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8
  },
  infoItem: {
    width: '50%',
    marginBottom: 8,
    paddingRight: 10
  },
  infoLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2
  },
  infoValue: {
    fontSize: 10,
    color: '#1e293b',
    fontWeight: 'bold'
  },
  // Highlight boxes
  highlightBox: {
    backgroundColor: '#FFF7ED',
    borderLeft: '4px solid #FF7A1A',
    padding: 12,
    marginBottom: 12,
    borderRadius: 4
  },
  tipBox: {
    backgroundColor: '#EFF6FF',
    borderLeft: '3px solid #3B82F6',
    padding: 10,
    marginBottom: 10,
    borderRadius: 3
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderLeft: '3px solid #F59E0B',
    padding: 10,
    marginBottom: 10,
    borderRadius: 3
  },
  // Itinerário diário
  dayCard: {
    marginBottom: 15,
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    overflow: 'hidden'
  },
  dayHeader: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderBottom: '1px solid #e2e8f0'
  },
  dayTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4
  },
  dayWeather: {
    fontSize: 9,
    color: '#64748b'
  },
  dayBody: {
    padding: 10
  },
  timeSlot: {
    marginBottom: 10
  },
  timeLabel: {
    fontSize: 9,
    color: '#FF7A1A',
    fontWeight: 'bold',
    marginBottom: 4
  },
  activityName: {
    fontSize: 10,
    color: '#1e293b',
    marginBottom: 2
  },
  activityDetails: {
    fontSize: 8,
    color: '#64748b',
    marginLeft: 8
  },
  // Restaurantes e Vida Noturna
  placeCard: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    border: '1px solid #e5e7eb'
  },
  placeName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 3
  },
  placeAddress: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 2
  },
  placeInfo: {
    fontSize: 8,
    color: '#6b7280',
    fontStyle: 'italic'
  },
  // Lista de items
  list: {
    marginBottom: 8
  },
  listItem: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 4,
    paddingLeft: 12
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    borderTop: '1px solid #e2e8f0',
    paddingTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerText: {
    fontSize: 8,
    color: '#64748b'
  },
  footerBrand: {
    fontSize: 8,
    color: '#FF7A1A',
    fontWeight: 'bold'
  },
  // Tabela
  table: {
    marginBottom: 12,
    border: '1px solid #e5e7eb',
    borderRadius: 4
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    minHeight: 25
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    fontWeight: 'bold'
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
    flex: 1
  },
  tableCellBold: {
    padding: 6,
    fontSize: 9,
    fontWeight: 'bold',
    flex: 1
  }
});

interface ConciergeReportData {
  clientName: string;
  destination: string;
  checkin: string;
  checkout: string;
  travelType: string;
  budget: string;
  adults: number;
  children: number;
  hotel?: string;
  address?: string;
  interests: string[];
  summary?: string;
  dailyItinerary?: any[];
  restaurants?: any[];
  nightlife?: any[];
  events?: any[];
  practicalInfo?: any;
  consulate?: any;
  safetyTips?: string[];
  culturalTips?: string[];
}

const TRAVEL_TYPE_LABELS: Record<string, string> = {
  lua_de_mel: 'Lua de Mel',
  familia: 'Família',
  negocios: 'Negócios',
  aventura: 'Aventura',
  cultural: 'Cultural',
  gastronomico: 'Gastronômico',
  relaxamento: 'Relaxamento'
};

const BUDGET_LABELS: Record<string, string> = {
  economico: 'Econômico',
  confortavel: 'Confortável',
  premium: 'Premium',
  luxo: 'Luxo'
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
};

const formatDateShort = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { 
    weekday: 'long',
    day: '2-digit', 
    month: 'long'
  });
};

const calculateNights = (checkin: string, checkout: string) => {
  const start = new Date(checkin);
  const end = new Date(checkout);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const ConciergePdfDocument: React.FC<{ data: ConciergeReportData; enriched?: any }> = ({ data, enriched }) => {
  const nights = calculateNights(data.checkin, data.checkout);
  const travelTypeLabel = TRAVEL_TYPE_LABELS[data.travelType] || data.travelType;
  const budgetLabel = BUDGET_LABELS[data.budget] || data.budget;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Relatório de Concierge Premium</Text>
          <Text style={styles.headerMeta}>
            {data.destination} • {travelTypeLabel} • {budgetLabel}
          </Text>
          <Text style={styles.headerClient}>
            Preparado para: {data.clientName}
          </Text>
        </View>

        {/* Informações da Viagem */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações da Viagem</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Destino</Text>
              <Text style={styles.infoValue}>{data.destination}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Período</Text>
              <Text style={styles.infoValue}>
                {formatDate(data.checkin)} a {formatDate(data.checkout)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Duração</Text>
              <Text style={styles.infoValue}>{nights} noite{nights !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Viajantes</Text>
              <Text style={styles.infoValue}>
                {data.adults} adulto{data.adults !== 1 ? 's' : ''}
                {data.children > 0 ? ` e ${data.children} criança${data.children !== 1 ? 's' : ''}` : ''}
              </Text>
            </View>
            {data.hotel && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Hotel</Text>
                <Text style={styles.infoValue}>{data.hotel}</Text>
              </View>
            )}
            {data.address && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Endereço</Text>
                <Text style={styles.infoValue}>{data.address}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Resumo Executivo */}
        {(data.summary || enriched?.summary) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumo Executivo</Text>
            <View style={styles.highlightBox}>
              <Text style={styles.text}>{data.summary || enriched?.summary}</Text>
            </View>
          </View>
        )}

        {/* Informações Práticas */}
        {enriched?.practical && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Práticas</Text>
            {enriched.currency_timezone_language && (
              <View style={styles.infoGrid}>
                {enriched.currency_timezone_language.currency && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Moeda</Text>
                    <Text style={styles.infoValue}>{enriched.currency_timezone_language.currency}</Text>
                  </View>
                )}
                {enriched.currency_timezone_language.timezone && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Fuso Horário</Text>
                    <Text style={styles.infoValue}>{enriched.currency_timezone_language.timezone}</Text>
                  </View>
                )}
                {enriched.currency_timezone_language.language && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Idioma</Text>
                    <Text style={styles.infoValue}>{enriched.currency_timezone_language.language}</Text>
                  </View>
                )}
              </View>
            )}
            <View style={styles.tipBox}>
              {enriched.practical.tipping && (
                <Text style={[styles.text, { marginBottom: 4 }]}>• {enriched.practical.tipping}</Text>
              )}
              {enriched.practical.power && (
                <Text style={styles.text}>• {enriched.practical.power}</Text>
              )}
            </View>
          </View>
        )}

        {/* Footer (primeira página) */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Relatório gerado por <Text style={styles.footerBrand}>IA</Text> • Sete Mares Concierge Premium
          </Text>
          <Text style={styles.footerText}>
            {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </Page>

      {/* Página 2: Itinerário Diário */}
      {enriched?.daily_itinerary && enriched.daily_itinerary.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Roteiro Dia a Dia</Text>
            {enriched.daily_itinerary.slice(0, 4).map((day: any, idx: number) => (
              <View key={idx} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{formatDateShort(day.date)}</Text>
                  {day.weather && (
                    <Text style={styles.dayWeather}>
                      {day.weather.condition} • {day.weather.min}°C - {day.weather.max}°C
                    </Text>
                  )}
                </View>
                <View style={styles.dayBody}>
                  {/* Café da manhã */}
                  {day.hotel_breakfast && (
                    <View style={styles.timeSlot}>
                      <Text style={styles.timeLabel}>🌅 {day.hotel_breakfast.time} - Café da Manhã</Text>
                      {day.hotel_breakfast.items?.map((item: any, i: number) => (
                        <View key={i}>
                          <Text style={styles.activityName}>{item.name}</Text>
                          {item.note && <Text style={styles.activityDetails}>• {item.note}</Text>}
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Manhã */}
                  {day.morning && day.morning.items && day.morning.items.length > 0 && (
                    <View style={styles.timeSlot}>
                      <Text style={styles.timeLabel}>☀️ {day.morning.time} - Manhã</Text>
                      {day.morning.items.map((item: any, i: number) => (
                        <View key={i}>
                          <Text style={styles.activityName}>{item.name}</Text>
                          {item.address && <Text style={styles.activityDetails}>📍 {item.address}</Text>}
                          {item.distanceKm && <Text style={styles.activityDetails}>🚶 {item.distanceKm.toFixed(1)} km</Text>}
                        </View>
                      ))}
                      {day.morning.note && <Text style={styles.activityDetails}>{day.morning.note}</Text>}
                    </View>
                  )}
                  
                  {/* Almoço */}
                  {day.lunch && day.lunch.items && day.lunch.items.length > 0 && (
                    <View style={styles.timeSlot}>
                      <Text style={styles.timeLabel}>🍽️ {day.lunch.time} - Almoço</Text>
                      {day.lunch.items.map((item: any, i: number) => (
                        <View key={i}>
                          <Text style={styles.activityName}>{item.name}</Text>
                          {item.address && <Text style={styles.activityDetails}>📍 {item.address}</Text>}
                          {item.price && <Text style={styles.activityDetails}>💰 Preço: {item.price}</Text>}
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Tarde */}
                  {day.afternoon && day.afternoon.items && day.afternoon.items.length > 0 && (
                    <View style={styles.timeSlot}>
                      <Text style={styles.timeLabel}>🌤️ {day.afternoon.time} - Tarde</Text>
                      {day.afternoon.items.map((item: any, i: number) => (
                        <View key={i}>
                          <Text style={styles.activityName}>{item.name}</Text>
                          {item.note && <Text style={styles.activityDetails}>• {item.note}</Text>}
                          {item.address && <Text style={styles.activityDetails}>📍 {item.address}</Text>}
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Jantar */}
                  {day.dinner && day.dinner.items && day.dinner.items.length > 0 && (
                    <View style={styles.timeSlot}>
                      <Text style={styles.timeLabel}>🌙 {day.dinner.time} - Jantar</Text>
                      {day.dinner.items.map((item: any, i: number) => (
                        <View key={i}>
                          <Text style={styles.activityName}>{item.name}</Text>
                          {item.address && <Text style={styles.activityDetails}>📍 {item.address}</Text>}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Sete Mares Concierge Premium</Text>
            <Text style={styles.footerText}>Página 2</Text>
          </View>
        </Page>
      )}

      {/* Página 3: Gastronomia e Vida Noturna */}
      {((enriched?.restaurants && enriched.restaurants.length > 0) || 
        (enriched?.nightlife && enriched.nightlife.length > 0)) && (
        <Page size="A4" style={styles.page}>
          {/* Gastronomia */}
          {enriched?.restaurants && enriched.restaurants.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gastronomia Recomendada</Text>
              {enriched.restaurants.slice(0, 8).map((restaurant: any, idx: number) => (
                <View key={idx} style={styles.placeCard}>
                  <Text style={styles.placeName}>{restaurant.name}</Text>
                  {restaurant.address && (
                    <Text style={styles.placeAddress}>📍 {restaurant.address}</Text>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {restaurant.rating && (
                      <Text style={styles.placeInfo}>⭐ {restaurant.rating}</Text>
                    )}
                    {restaurant.price && (
                      <Text style={styles.placeInfo}>💰 Preço: {restaurant.price}</Text>
                    )}
                  </View>
                  {restaurant.cuisine && (
                    <Text style={styles.placeInfo}>🍴 {restaurant.cuisine}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Vida Noturna */}
          {enriched?.nightlife && enriched.nightlife.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vida Noturna</Text>
              {enriched.nightlife.slice(0, 6).map((venue: any, idx: number) => (
                <View key={idx} style={styles.placeCard}>
                  <Text style={styles.placeName}>{venue.name}</Text>
                  {venue.address && (
                    <Text style={styles.placeAddress}>📍 {venue.address}</Text>
                  )}
                  {venue.type && (
                    <Text style={styles.placeInfo}>🎵 {venue.type}</Text>
                  )}
                  {venue.vibe && (
                    <Text style={styles.placeInfo}>✨ {venue.vibe}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Sete Mares Concierge Premium</Text>
            <Text style={styles.footerText}>Página 3</Text>
          </View>
        </Page>
      )}

      {/* Página 4: Dicas e Consulado */}
      <Page size="A4" style={styles.page}>
        {/* Dicas de Segurança */}
        {(enriched?.safety_tips || data.summary) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dicas de Segurança</Text>
            <View style={styles.warningBox}>
              <View style={styles.list}>
                {enriched?.safety_tips?.map((tip: string, idx: number) => (
                  <Text key={idx} style={styles.listItem}>• {tip}</Text>
                )) || (
                  <>
                    <Text style={styles.listItem}>• Mantenha documentos em local seguro</Text>
                    <Text style={styles.listItem}>• Use cofres do hotel</Text>
                    <Text style={styles.listItem}>• Evite áreas pouco movimentadas à noite</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Dicas Culturais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dicas Culturais</Text>
          <View style={styles.tipBox}>
            <View style={styles.list}>
              {enriched?.cultural_tips?.map((tip: string, idx: number) => (
                <Text key={idx} style={styles.listItem}>• {tip}</Text>
              )) || (
                <>
                  <Text style={styles.listItem}>• Respeite costumes locais</Text>
                  <Text style={styles.listItem}>• Aprenda cumprimentos básicos no idioma local</Text>
                  <Text style={styles.listItem}>• Vista-se adequadamente ao visitar locais religiosos</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Consulado */}
        {enriched?.consulate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consulado / Embaixada</Text>
            <View style={styles.highlightBox}>
              {enriched.consulate.embassy?.name && (
                <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 4 }]}>
                  {enriched.consulate.embassy.name}
                </Text>
              )}
              {enriched.consulate.embassy?.address && (
                <Text style={styles.text}>📍 {enriched.consulate.embassy.address}</Text>
              )}
              {enriched.consulate.embassy?.phone && (
                <Text style={styles.text}>📞 {enriched.consulate.embassy.phone}</Text>
              )}
              {enriched.consulate.embassy?.email && (
                <Text style={styles.text}>✉️ {enriched.consulate.embassy.email}</Text>
              )}
            </View>
          </View>
        )}

        {/* Interesses do Cliente */}
        {data.interests && data.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interesses do Cliente</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {data.interests.map((interest, idx) => (
                <View 
                  key={idx} 
                  style={{
                    backgroundColor: '#f3f4f6',
                    padding: 6,
                    margin: 3,
                    borderRadius: 4
                  }}
                >
                  <Text style={{ fontSize: 8, color: '#374151' }}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Relatório gerado por <Text style={styles.footerBrand}>IA</Text> • Sete Mares Concierge Premium
          </Text>
          <Text style={styles.footerText}>Página Final</Text>
        </View>
      </Page>
    </Document>
  );
};

