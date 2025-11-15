# Sistema de Cache de Catálogos

## Visão Geral

O sistema de cache de catálogos implementa cache local em `localStorage` para aeroportos e companhias aéreas, reduzindo significativamente as chamadas ao Supabase e melhorando a performance da aplicação.

## Funcionalidades

- ✅ Cache automático com TTL configurável (padrão: 24 horas)
- ✅ Invalidação automática por versão
- ✅ Fallback para cache expirado em caso de erro de rede
- ✅ Limpeza automática se localStorage estiver cheio
- ✅ Invalidação automática após operações CRUD
- ✅ Estatísticas de cache disponíveis

## Uso Básico

### Carregar Dados com Cache

```typescript
import { getAirports, getAirlines } from '@/lib/catalog-cache';

// Carregar aeroportos (usa cache se disponível)
const airports = await getAirports();

// Carregar companhias (usa cache se disponível)
const airlines = await getAirlines();

// Forçar refresh (ignorar cache)
const airports = await getAirports(true);
const airlines = await getAirlines(true);
```

### Invalidar Cache

```typescript
import { invalidateCache, clearCache, clearAllCache } from '@/lib/catalog-cache';

// Invalidar cache específico
invalidateCache('airports');
invalidateCache('airlines');

// Limpar cache específico
clearCache('airports');

// Limpar todo o cache
clearAllCache();
```

### Verificar Estatísticas

```typescript
import { getCacheStats } from '@/lib/catalog-cache';

const stats = getCacheStats();
console.log(stats);
// {
//   airports: { cached: true, ageMinutes: 120.5, itemCount: 1500 },
//   airlines: { cached: true, ageMinutes: 45.2, itemCount: 350 }
// }
```

## Integração Automática

O cache é automaticamente invalidado quando dados são modificados através dos hooks CRUD:

```typescript
import { useSupabaseCRUD } from '@/hooks/useSupabase';

const { create, update, remove } = useSupabaseCRUD<AirportRow>('airports');

// Após criar, atualizar ou remover, o cache é automaticamente invalidado
await create(newAirport);
await update(airportId, updates);
await remove(airportId);
```

## Configuração

O cache usa configuração padrão, mas pode ser ajustada:

```typescript
// Configuração padrão
{
  ttlMinutes: 60 * 24, // 24 horas
  version: '1.0.0'     // Incrementar quando estrutura mudar
}
```

Para alterar a versão (invalidar todo cache existente), edite `DEFAULT_CONFIG.version` em `catalog-cache.ts`.

## Estrutura do Cache

O cache armazena dados no formato:

```typescript
interface CachedCatalog<T> {
  data: T[];
  timestamp: number;  // Unix timestamp em ms
  version: string;    // Versão do cache
}
```

## Chaves do localStorage

- `7mares_cache_airports` - Cache de aeroportos
- `7mares_cache_airlines` - Cache de companhias
- `7mares_cache_config` - Configuração do cache

## Tratamento de Erros

O sistema implementa fallback robusto:

1. **Cache válido**: Retorna dados do cache imediatamente
2. **Cache expirado**: Carrega do Supabase e atualiza cache
3. **Erro de rede**: Tenta retornar cache expirado como fallback
4. **localStorage cheio**: Limpa cache antigo e tenta novamente

## Exemplo de Uso em Componente

```typescript
import { useState, useEffect } from 'react';
import { getAirports } from '@/lib/catalog-cache';
import type { AirportRow } from '@/types/db';

export function AirportSelector() {
  const [airports, setAirports] = useState<AirportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAirports = async () => {
      try {
        setLoading(true);
        // Usa cache automaticamente
        const data = await getAirports();
        setAirports(data);
      } catch (error) {
        console.error('Erro ao carregar aeroportos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAirports();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <select>
      {airports.map(airport => (
        <option key={airport.id} value={airport.iata3}>
          {airport.name} ({airport.iata3})
        </option>
      ))}
    </select>
  );
}
```

## Performance

### Benefícios

- **Redução de chamadas ao Supabase**: Até 90% menos requisições
- **Tempo de resposta**: Respostas instantâneas quando cache hit
- **Experiência do usuário**: Interface mais responsiva
- **Economia de recursos**: Menos carga no banco de dados

### Métricas Esperadas

- **Cache Hit Rate**: 80-95% em uso normal
- **Tempo de resposta (cache hit)**: < 10ms
- **Tempo de resposta (cache miss)**: 200-500ms (depende da rede)

## Manutenção

### Quando Invalidar Cache Manualmente

- Após importação em massa de dados
- Após correções de dados críticos
- Após mudanças estruturais nos dados

### Monitoramento

Use `getCacheStats()` para monitorar:
- Taxa de cache hit/miss
- Idade do cache
- Tamanho dos dados em cache

## Limitações

1. **localStorage**: Limitado a ~5-10MB (depende do navegador)
2. **Sincronização**: Cache não é sincronizado entre abas
3. **TTL fixo**: Não há TTL por item individual

## Próximas Melhorias

- [ ] Cache distribuído (IndexedDB para volumes maiores)
- [ ] Sincronização entre abas (BroadcastChannel API)
- [ ] TTL por item individual
- [ ] Métricas detalhadas de performance
- [ ] Compressão de dados em cache

