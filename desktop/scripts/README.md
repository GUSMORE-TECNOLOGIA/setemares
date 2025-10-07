# 🗄️ Sistema de Migrações do Banco de Dados

Este diretório contém scripts para gerenciar migrações do banco de dados Supabase de forma automatizada e segura.

## 📁 Estrutura de Pastas

```
scripts/
├── README.md                           # Este arquivo
├── database-migration.js               # Script principal de migração
├── migrations/                         # Arquivos de migração (.sql)
│   └── enable_rls_and_add_indexes.sql  # Migração aplicada
└── rollbacks/                          # Arquivos de rollback (.sql)
    └── enable_rls_and_add_indexes_rollback.sql
```

## 🚀 Como Usar

### 1. Listar Migrações Disponíveis

```bash
node scripts/database-migration.js list
```

### 2. Aplicar uma Migração

```bash
node scripts/database-migration.js apply <nome-da-migracao>
```

**Exemplo:**
```bash
node scripts/database-migration.js apply enable_rls_and_add_indexes
```

### 3. Fazer Rollback de uma Migração

```bash
node scripts/database-migration.js rollback <nome-da-migracao>
```

**Exemplo:**
```bash
node scripts/database-migration.js rollback enable_rls_and_add_indexes
```

### 4. Criar um Template de Nova Migração

```bash
node scripts/database-migration.js create <nome-da-migracao>
```

**Exemplo:**
```bash
node scripts/database-migration.js create add_new_table
```

## 📋 Migrações Aplicadas

### ✅ `enable_rls_and_add_indexes` (2024-12-19)

**Descrição:** Habilitou Row Level Security (RLS) e adicionou índices críticos em todas as tabelas do Supabase.

**O que foi feito:**
- ✅ Habilitou RLS em 11 tabelas
- ✅ Criou políticas de segurança (leitura pública para catálogos, escrita autenticada)
- ✅ Adicionou 25+ índices para otimizar consultas
- ✅ Documentou tabelas com comentários

**Políticas de Segurança:**
- **Tabelas de Catálogo** (`cities`, `airports`, `airlines`, `baggage_catalog`): Leitura pública, escrita autenticada
- **Tabelas de Sistema** (`code_overrides`, `codes_unknown`): Leitura pública, escrita autenticada  
- **Tabelas de Cotações** (`quotes`, `quote_segments`, etc.): Acesso restrito a usuários autenticados

**Índices Adicionados:**
- Códigos IATA/ICAO para busca rápida
- Campos de status e flags booleanos
- Chaves estrangeiras para joins otimizados
- Campos de data para ordenação

## 🔒 Segurança Implementada

### Row Level Security (RLS)

O RLS foi implementado com as seguintes políticas:

1. **Leitura Pública** para catálogos (cities, airports, airlines, baggage_catalog)
2. **Escrita Autenticada** para todas as tabelas
3. **Acesso Restrito** para dados de cotações (apenas usuários autenticados)

### Políticas por Tabela

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `cities` | ✅ Público | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado |
| `airports` | ✅ Público | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado |
| `airlines` | ✅ Público | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado |
| `baggage_catalog` | ✅ Público | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado |
| `code_overrides` | ✅ Público | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado |
| `codes_unknown` | ✅ Público | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado |
| `quotes` | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado |
| `quote_segments` | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado |
| `quote_options` | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado |
| `option_segments` | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado |
| `option_fares` | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado | 🔐 Autenticado |

**Legenda:**
- ✅ Público = Qualquer pessoa pode ler
- 🔐 Autenticado = Apenas usuários autenticados

## 📊 Performance

### Índices Criados

**Cities (3 índices):**
- `idx_cities_iata3` - Busca por código IATA
- `idx_cities_country` - Busca por país
- `idx_cities_active` - Filtro por status ativo

**Airports (5 índices):**
- `idx_airports_iata3` - Busca por código IATA
- `idx_airports_icao4` - Busca por código ICAO
- `idx_airports_city_iata` - Relacionamento com cidades
- `idx_airports_country` - Busca por país
- `idx_airports_active` - Filtro por status ativo

**Airlines (5 índices):**
- `idx_airlines_iata2` - Busca por código IATA
- `idx_airlines_icao3` - Busca por código ICAO
- `idx_airlines_country` - Busca por país
- `idx_airlines_active` - Filtro por status ativo
- `idx_airlines_verified` - Filtro por verificação

**E mais 12 índices** para tabelas de cotações e sistema.

## ⚠️ Importante

### Execução Manual

⚠️ **ATENÇÃO:** Este script **NÃO executa automaticamente** no Supabase. Ele apenas prepara os SQLs para execução manual.

**Para aplicar migrações:**
1. Execute o script para obter o SQL
2. Copie o SQL gerado
3. Cole no Supabase Dashboard (SQL Editor)
4. Execute manualmente

### Rollback

Sempre mantenha arquivos de rollback para poder reverter mudanças se necessário. O rollback da migração `enable_rls_and_add_indexes` remove:
- Todas as políticas RLS
- Todos os índices criados
- Desabilita RLS em todas as tabelas

## 🔄 Próximos Passos

1. **Integração com API:** Modificar o script para executar automaticamente via API do Supabase
2. **Testes:** Criar testes automatizados para migrações
3. **Backup:** Implementar backup automático antes de migrações
4. **Logs:** Adicionar logging detalhado das operações

## 📚 Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Supabase API Documentation](https://supabase.com/docs/reference/javascript)

---

**Última atualização:** 2024-12-19  
**Versão:** 1.0.0
