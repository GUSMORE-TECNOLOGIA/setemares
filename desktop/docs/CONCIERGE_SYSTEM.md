# Sistema Concierge IA - Documentação

## Visão Geral

O Sistema Concierge IA é uma funcionalidade premium que automatiza a criação de relatórios de viagem personalizados para agentes de viagem. Utiliza inteligência artificial (GPT-4) para gerar conteúdo detalhado e profissional baseado nas preferências e necessidades específicas de cada cliente.

## Funcionalidades Principais

### 1. Formulário Inteligente
- **Informações do Cliente**: Nome, destino, datas de viagem
- **Configurações da Viagem**: Tipo (lua de mel, família, negócios, etc.), orçamento
- **Detalhes Opcionais**: Hotel, endereço, interesses específicos
- **Validação em Tempo Real**: Datas, campos obrigatórios, lógica de negócio

### 2. Geração por IA
- **Modelo**: GPT-4 da OpenAI
- **Processamento**: 2-10 segundos (dependendo da complexidade)
- **Personalização**: Conteúdo adaptado ao perfil do cliente
- **Estrutura**: 7 seções principais do relatório

### 3. Relatório Completo
- **Resumo Executivo**: Overview personalizado da viagem
- **Informações do Destino**: Clima, moeda, fuso horário, idioma
- **Roteiro Dia-a-Dia**: Atividades balanceadas e logística
- **Recomendações Gastronômicas**: Categorizadas por orçamento
- **Atrações Imperdíveis**: Baseadas nos interesses selecionados
- **Experiências Exclusivas**: Únicas do destino e tipo de viagem
- **Informações Práticas**: Transporte, segurança, documentação

### 4. Histórico e Gestão
- **Armazenamento**: Banco de dados Supabase com RLS
- **Histórico**: Lista dos últimos relatórios gerados
- **Busca**: Por destino, cliente, data
- **Status**: Gerado, editado, enviado, arquivado

### 5. Exportação
- **PDF**: Geração automática com layout profissional
- **HTML**: Visualização em navegador
- **Texto**: Cópia para área de transferência

## Arquitetura Técnica

### Backend (Express.js)
```
/api/concierge/generate     - POST: Gerar novo relatório
/api/concierge/history      - GET: Listar histórico
/api/concierge/report/:id   - GET: Buscar relatório específico
/api/concierge/regenerate   - POST: Regerar relatório (parcial ou completo)
/api/generate-pdf           - POST: Gerar PDF a partir de HTML
```

### Frontend (React + TypeScript)
```
src/app/features/concierge/
├── pages/
│   └── ConciergePage.tsx           # Página principal
├── components/
│   ├── ConciergeForm.tsx           # Formulário de entrada
│   ├── ConciergeReport.tsx         # Visualização do relatório
│   └── ConciergeHistory.tsx        # Histórico de relatórios
└── hooks/
    └── useConciergeController.ts   # Lógica de controle
```

### Banco de Dados (Supabase)
```sql
concierge_reports (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  client_name TEXT,
  destination TEXT,
  checkin DATE,
  checkout DATE,
  travel_type TEXT,
  budget TEXT,
  adults INTEGER,
  children INTEGER,
  hotel TEXT,
  interests JSONB,
  observations TEXT,
  report_content TEXT,
  report_html TEXT,
  status TEXT,
  processing_time_ms INTEGER,
  openai_model TEXT,
  openai_tokens_used INTEGER
)
```

## Configuração

### Variáveis de Ambiente
```env
# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Concierge
GOOGLE_MAPS_API_KEY=your-google-places-key
EVENTBRITE_TOKEN=your-eventbrite-token
USE_AI_CONCIERGE=true
CACHE_TTL_MIN=360
```

### Migração do Banco
```bash
# Aplicar migração base
node scripts/database-migration.js apply create_concierge_table

# Executar migração de enriquecimento e cache
# (ou abra o arquivo no Supabase SQL Editor e execute o SQL)
# desktop/scripts/migrations/add_concierge_enriched_and_cache.sql

# Rollback (se necessário)
node scripts/database-migration.js rollback create_concierge_table
```

## Uso

### 1. Acesso
- Menu lateral: Clique em "Concierge" (ícone de estrelas)
- Rota: `/concierge` (se implementado)

### 2. Gerar Relatório
1. Preencher formulário com dados do cliente
2. Selecionar interesses relevantes
3. Adicionar observações especiais (opcional)
4. Clicar em "Gerar Relatório com IA"
5. Aguardar processamento (2-10 segundos)
6. Visualizar relatório gerado

### 3. Exportar
- **PDF**: Clique em "Baixar PDF"
- **Nova Aba**: Clique em "Abrir em Nova Aba"
- **Texto**: Clique em "Copiar Texto"

### 4. Histórico
- Aba "Histórico" para ver relatórios anteriores
- Clique em "Ver Relatório" para reabrir

## Tipos de Viagem Suportados

| Tipo | Descrição |
|------|-----------|
| Lua de Mel | Experiências românticas e exclusivas |
| Família | Atividades para todas as idades |
| Negócios | Networking e reuniões profissionais |
| Aventura | Esportes e atividades outdoor |
| Cultural | Museus, história e arte |
| Gastronômico | Culinária local e experiências gastronômicas |
| Relaxamento | Spas, praias e bem-estar |

## Categorias de Orçamento

| Categoria | Descrição |
|-----------|-----------|
| Econômico | Hostels, comida de rua, transporte público |
| Confortável | Hotéis 3-4 estrelas, restaurantes médios |
| Premium | Hotéis 5 estrelas, alta gastronomia |
| Luxo | Hotéis de luxo, experiências exclusivas |

## Interesses Disponíveis

- História e Cultura
- Natureza e Paisagens
- Gastronomia Local
- Arte e Museus
- Aventura e Esportes
- Compras e Mercados
- Vida Noturna
- Spas e Bem-estar
- Fotografia
- Festivais e Eventos

## Métricas e Monitoramento

### Logs Estruturados
- Geração de relatórios
- Tempo de processamento
- Tokens utilizados
- Erros e exceções

### Performance
- Tempo médio de geração: 3-8 segundos
- Tokens médios por relatório: 2000-4000
- Taxa de sucesso: >95%

### Banco de Dados
- RLS (Row Level Security) habilitado
- Índices otimizados para consultas
- Políticas de acesso configuradas

## Troubleshooting

### Erro: "Campos obrigatórios"
- Verificar se todos os campos marcados com * estão preenchidos
- Validar se as datas são futuras e checkout > checkin

### Erro: "Erro na geração do relatório"
- Verificar conexão com OpenAI
- Confirmar API key válida
- Verificar logs do servidor

### Erro: "Relatório não encontrado"
- Verificar se o ID do relatório existe
- Confirmar permissões de acesso ao banco

### Performance lenta
- Verificar conexão com OpenAI
- Monitorar uso de tokens
- Verificar logs de processamento

## Roadmap Futuro

### Fase 2 (Planejada)
- [ ] Edição inline de relatórios
- [ ] Templates customizáveis
- [ ] Integração com email
- [ ] Analytics avançados
- [ ] API pública para terceiros

### Melhorias Técnicas
- [ ] Cache de relatórios similares
- [ ] Otimização de prompts
- [ ] Suporte a múltiplos idiomas
- [ ] Integração com sistemas de reserva

## Segurança

### Dados Sensíveis
- Informações de clientes protegidas por RLS
- API keys em variáveis de ambiente
- Logs sem dados pessoais

### Acesso
- Autenticação via Supabase (futuro)
- Rate limiting no servidor
- CORS configurado

### Compliance
- LGPD: Dados armazenados conforme regulamentação
- Retenção: Configurável por política
- Backup: Automático via Supabase

---

**Versão**: 1.0.0  
**Última Atualização**: Dezembro 2024  
**Mantenedor**: Equipe Sete Mares
