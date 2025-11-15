# Plano de Correção de Qualidade de Código

**Protocolo**: @Atualizar.md  
**Data**: 2025-01-XX  
**Objetivo**: Corrigir erros TypeScript, remover código morto, otimizar imports

---

## 1) DELTA

### O que muda:
- **Imports não usados removidos** (TS6133) - ~30 ocorrências
- **Tipos implícitos `any` corrigidos** (TS7006) - ~15 ocorrências  
- **Caminhos de import corrigidos** (TS2307) - 5 arquivos com `shared/types`
- **Propriedades de tipos corrigidas** (TS2339, TS2353) - ~20 ocorrências
- **Variáveis não atribuídas corrigidas** (TS2454) - 1 arquivo (`validation.ts`)

### Invariantes (mantidos):
- ✅ APIs públicas dos hooks (`useBookingsController`, `useSupabaseData`, etc.)
- ✅ Props de componentes React
- ✅ Contratos de funções exportadas
- ✅ Estrutura de tipos em `shared/types.ts`
- ✅ Comportamento funcional existente

---

## 2) MAPA DE IMPACTO

### Arquivos a modificar:

#### **Alvos principais** (erros críticos):
1. `desktop/src/app/features/bookings/utils/error-handling.ts` - Import incorreto
2. `desktop/src/app/features/bookings/utils/parsing-helpers.ts` - Import incorreto + código morto
3. `desktop/src/app/features/bookings/utils/pricing-helpers.ts` - Import incorreto + tipos any
4. `desktop/src/app/features/bookings/utils/pdf-builders.ts` - Import incorreto + código morto
5. `desktop/src/lib/validation.ts` - Variáveis não atribuídas

#### **Arquivos secundários** (limpeza):
6. `desktop/src/app/features/bookings/hooks/useBookingsController.ts` - Imports não usados
7. `desktop/src/components/decoder/CorrectionPopover.tsx` - Tipos incorretos
8. `desktop/src/components/catalog/*.tsx` - Props incorretas
9. ~20 outros arquivos com imports React não usados

### Consumidores (não precisam mudar):
- ✅ `BookingsPage.tsx` - Usa hook, não precisa mudar
- ✅ Componentes que usam os utils - APIs mantidas
- ✅ Outros hooks - Contratos preservados

---

## 3) REUSO-FIRST

### Símbolos a reutilizar (não duplicar):

#### **Tipos** (de `app/shared/types.ts`):
```typescript
// ✅ Usar caminho correto: @/app/shared/types ou ../../../shared/types
- SimpleBookingSummary
- ExtendedParsedOption  
- BookingDecodeError
- BookingFlight
- BookingControllerReturn
```

#### **Funções utilitárias** (já existentes):
```typescript
// ✅ Manter em módulos existentes
- parseBaggageString (parsing-helpers.ts)
- formatDateTimeParts (parsing-helpers.ts)
- mapPricingResult (pricing-helpers.ts)
```

#### **Constantes**:
```typescript
// ✅ Não duplicar
- SAMPLE_PNR (useBookingsController.ts)
```

---

## 4) PLANO (Passos)

### Fase 1: Corrigir imports de `shared/types` (5 arquivos)
1. Corrigir caminho em `error-handling.ts`: `../../../../shared/types` → `../../../shared/types`
2. Corrigir caminho em `parsing-helpers.ts`: `../../../../shared/types` → `../../../shared/types`
3. Corrigir caminho em `pricing-helpers.ts`: `../../../../shared/types` → `../../../shared/types`
4. Corrigir caminho em `pdf-builders.ts`: `../../../../shared/types` → `../../../shared/types`
5. Verificar se `useBookingsController.ts` está correto (já usa `../../../shared/types`)

### Fase 2: Corrigir tipos e variáveis (críticos)
6. Corrigir variáveis não atribuídas em `validation.ts` (linhas 140-145)
7. Adicionar tipos explícitos em `pricing-helpers.ts` (parâmetros `sum`, `fare`)
8. Adicionar tipos explícitos em `pdf-builders.ts` (parâmetros `segment`, `bag`, `fare`)
9. Corrigir tipos em `CorrectionPopover.tsx` (`id: number` → `id: string`)

### Fase 3: Remover código morto
10. Remover imports não usados em `useBookingsController.ts`
11. Remover imports React não usados (~15 arquivos)
12. Remover variáveis não usadas em vários componentes
13. Remover funções não usadas em `parsing-helpers.ts`, `pdf-builders.ts`

### Fase 4: Corrigir props e tipos de componentes
14. Corrigir props de `Badge` em `UnknownCodesPage.tsx`
15. Corrigir props de `Modal` em `CodeCorrectionModal.tsx`
16. Corrigir tipos em `AirportsCatalog.tsx` (propriedade `tz`)
17. Corrigir tipos em `AirlinesCatalog.tsx` (ZodError.errors)

---

## 5) PATCH (Alterações Mínimas)

### Arquivo 1: `desktop/src/app/features/bookings/utils/error-handling.ts`
```typescript
// ANTES:
import type { BookingDecodeError } from "../../../../shared/types";

// DEPOIS:
import type { BookingDecodeError } from "../../../shared/types";
```

### Arquivo 2: `desktop/src/lib/validation.ts` (linhas 135-145)
```typescript
// ANTES:
const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
return date.getFullYear() === parseInt(year) &&
       date.getMonth() === parseInt(month) - 1 &&
       date.getDate() === parseInt(day);

// DEPOIS:
const parsedYear = parseInt(year);
const parsedMonth = parseInt(month);
const parsedDay = parseInt(day);
const date = new Date(parsedYear, parsedMonth - 1, parsedDay);
return date.getFullYear() === parsedYear &&
       date.getMonth() === parsedMonth - 1 &&
       date.getDate() === parsedDay;
```

### Arquivo 3: `desktop/src/app/features/bookings/hooks/useBookingsController.ts`
```typescript
// REMOVER imports não usados:
- import type { ParsedBaggage } from "@/lib/types/email-parser";
- import { parseBaggageString } from "../utils/parsing-helpers";
- import { formatDateTimeParts } from "../utils/parsing-helpers";
- import { getBaggageAllowanceByClass } from "../utils/parsing-helpers";
- import { calculateIndividualPricing } from "../utils/pricing-helpers";

// REMOVER função não usada:
- function parseDateForLabel(value?: string | null): Date | null { ... }
```

### Arquivo 4: `desktop/src/components/decoder/CorrectionPopover.tsx`
```typescript
// ANTES:
const results: SearchResult[] = [
  ...airports.map(item => ({
    id: item.id,  // number
    ...
  }))
];

// DEPOIS:
const results: SearchResult[] = [
  ...airports.map(item => ({
    id: String(item.id),  // string
    city: item.city_iata || '',  // usar city_iata
    ...
  })),
  ...airlines.map(item => ({
    id: String(item.id),  // string
    city: item.city || '',  // manter city se existir
    ...
  }))
];
```

---

## 6) TESTES & VALIDAÇÃO

### Testes Automatizados:
```bash
# Executar typecheck após correções
npm run typecheck

# Executar lint
npm run lint

# Verificar build
npm run build
```

### Validação Manual:
1. ✅ Testar fluxo de bookings (parse PNR → decode → pricing)
2. ✅ Testar correção de códigos desconhecidos
3. ✅ Testar geração de PDF
4. ✅ Verificar que não há regressões visuais

---

## 7) LIMPEZA & ROTAS

### Código Morto a Remover:
- Imports React não usados (~15 arquivos)
- Variáveis não usadas (`optionIndex`, `resetTrigger`, etc.)
- Funções não usadas (`parseDateForLabel`, `extractCodes`, etc.)
- Props não usadas (`tokenKind`, `onReportGenerated`, etc.)

### Rotas/Imports:
- ✅ Nenhuma rota precisa mudar
- ✅ Apenas corrigir caminhos relativos de imports
- ✅ Manter estrutura de diretórios

---

## 8) RISCOS & ROLLBACK

### Riscos Identificados:
1. **Baixo Risco**: Correções são principalmente tipos e imports
2. **Médio Risco**: Mudança de `id: number` → `id: string` pode afetar comparações
3. **Baixo Risco**: Remoção de código morto não afeta funcionalidade

### Plano de Rollback:
- ✅ Manter branch de backup antes das mudanças
- ✅ Commits atômicos por arquivo/fase
- ✅ Testes após cada fase

### Feature Flags:
- ❌ Não necessário (mudanças são de qualidade, não funcionalidade)

---

## Próximos Passos

1. Executar Fase 1 (corrigir imports)
2. Executar Fase 2 (corrigir tipos críticos)
3. Executar Fase 3 (limpeza)
4. Executar Fase 4 (props de componentes)
5. Validar com `npm run typecheck`
6. Testar funcionalidades manualmente

