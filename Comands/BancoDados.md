# Objetivo
Realizar uma **análise profissional do banco de dados Supabase** deste projeto, gerando uma visão clara e organizada sobre:

- Estrutura (schemas, tabelas, colunas, FKs, índices)
- Segurança (RLS, permissões, auth)
- Uso real pelo sistema (tabelas/colunas usadas vs. mortas/legadas)
- Qualidade do modelo (normalização, duplicações, sobreposição de funções)
- Performance e manutenção

O foco é produzir um **relatório de diagnóstico + plano de saneamento**, NÃO executar DDL/migrações automaticamente.

Para executar essa tarefa, use o MCP supabase10x

---

# Escopo

- Banco: Supabase (Postgres)
- Incluir:
  - schemas relevantes (ex.: `public`, outros usados pelo app)
  - tabelas, views, funções relevantes ao app
  - políticas de RLS e regras de auth
- Sem aplicar mudanças reais: apenas **propor** migrações/ajustes.

---

# Fontes de informação

Quando analisar, buscar informações em:

- Pastas Supabase: `supabase/`, `supabase/migrations/**`, `supabase/seed.sql`, etc.
- Clients no código: uso de `createClient` do Supabase, chamadas SQL, `from('tabela')`, RPCs, etc.
- Tipos/ORM (se houver): schemas TS/Prisma/Zod que representam tabelas.
- Código do app: queries diretas, filtros, joins, uso de colunas.

Se não conseguir confirmar algo **pelo código/migrations**, NÃO inventar: marcar como PENDENTE e, se útil, sugerir hipótese.

---

# Classificações que devem ser usadas

Para **tabelas**:
- `[CORE]` – Tabela central do domínio (ex.: alunos, matrículas, contratos)
- `[SUPPORT]` – Suporte/configuração (ex.: lookup, enum, logs internos)
- `[LEGACY]` – Legado, em uso parcial, com plano de substituição
- `[CANDIDATE_ARCHIVE]` – Pode ir para um schema/DB de arquivo histórico
- `[CANDIDATE_DROP]` – Forte candidato a remoção (sem uso aparente)
- `[REVIEW]` – Precisa de validação manual (uso indireto, integração externa)

Para **colunas**:
- `[USED]` – uso claro no app ou em constraints
- `[SUSPECT]` – não aparece em uso direto, mas pertence a tabela [CORE]/[SUPPORT]
- `[DEAD]` – sem uso aparente, sem FK/índice relevante, sem referência no código
- `[DUPLICATE]` – repete informação que já existe em outra coluna/tabela
- `[SENSITIVE]` – dados sensíveis (PII, financeiro, auth, tokens etc.)

---

# Como agir (passo a passo)

## 1) Sumário executivo
Entregar primeiro um resumo de 5–10 linhas:

- Principal finalidade do banco (do ponto de vista de negócio)
- Quantidade de tabelas e visão geral de saúde: OK / Alertas / Crítico
- Principais riscos (segurança, bagunça de schema, performance)
- Visão geral: “modelo coeso” vs “muito remendo/legado”

---

## 2) Inventário de Schemas e Tabelas

Para cada schema relevante (começando por `public`):

- Listar **todas as tabelas**, com:
  - Nome da tabela
  - Classificação: `[CORE] / [SUPPORT] / [LEGACY] / [CANDIDATE_ARCHIVE] / [CANDIDATE_DROP] / [REVIEW]`
  - Descrição em linguagem de negócio (o que essa tabela representa)

Se possível, agrupar por “domínios” (ex.: Alunos, Financeiro, Conteúdo, Relacionamento).

---

## 3) Estrutura interna (colunas, chaves, FKs, índices)

Para cada tabela importante (especialmente as marcadas como [CORE]):

- **Visão de colunas**:
  - Nome, tipo lógico (negócio), obrigatoriedade (NOT NULL?), defaults
  - Classificação: `[USED] / [SUSPECT] / [DEAD] / [DUPLICATE] / [SENSITIVE]`
- **Chaves e integridade**:
  - PK, FKs (para quais tabelas, o que representam)
  - UNIQUE, CHECKs importantes
- **Índices**:
  - Quais colunas têm índice
  - Se parecem alinhados com joins/filtros usados no app
- **Observações**:
  - Decisões estranhas (ex.: juntar várias responsabilidades na mesma tabela)
  - Colunas que deveriam estar em outra tabela (violação óbvia de normalização)
  - Falta de colunas que claramente aparecem no app (gap de modelo)

---

## 4) Uso real pelo app (tabelas/colunas mortas)

Fazer o “cruzamento” entre o banco e o código:

- Para cada tabela:
  - Onde ela é usada no código (queries Supabase, SQL, RPC)
  - Se existe usage em testes apenas, ou apenas em migrations
- Identificar:
  - Tabelas sem nenhuma referência no app → candidatas a `[CANDIDATE_ARCHIVE]` ou `[CANDIDATE_DROP]`
  - Colunas da tabela que nunca aparecem em SELECT/INSERT/UPDATE → candidatas a `[DEAD]`
  - Tabelas que parecem duplicar ou sobrepor o papel de outra (ex.: `alunos` vs `students`)

Se houver dúvida (ex.: usada por integração externa, script manual), marcar como `[REVIEW]` e explicar o motivo.

---

## 5) RLS (Row Level Security) e segurança de acesso

Para cada tabela **acessível pelo cliente** (via Supabase client, APIs públicas, etc.):

- Informar se o RLS está **ON** ou **OFF**
- Listar políticas por tabela:
  - Quem pode **select/insert/update/delete** e sob quais condições
- Avaliar:
  - Se o RLS está coerente com o modelo de negócio (ex.: usuário só enxerga seus próprios registros)
  - Se há tabelas expostas **sem RLS** que deveriam estar protegidas
  - Se há furos, como políticas muito amplas (ex.: `true` pra tudo)

Classificar risco de cada tabela sensível:
- Baixo / Médio / Alto, com comentário curto.

---

## 6) Auth / relacionamento com usuários

Analisar o uso de Supabase Auth (schema `auth` e tabelas relacionadas) e tabelas de perfis/usuários no `public`:

- Como o usuário “lógico” do sistema se relaciona com `auth.users` (ex.: tabela `profiles` ligada via FK `user_id`)
- Campos sensíveis (email, telefone, documentos) marcados como `[SENSITIVE]`
- Regras para anonimização/remoção/soft delete (se houver)
- Se há dados de auth misturados em outras tabelas de forma duplicada ou insegura

Apontar incoerências e riscos: duplicidade de dados pessoais, falta de ligação clara entre auth e domínio, ausência de colunas de auditoria (created_by, updated_by, etc. quando fizer sentido).

---

## 7) Qualidade de modelo (design, normalização, duplicidade)

Avaliar o desenho geral:

- Domínios bem separados vs. tudo misturado
- Tabelas que fazem “coisas demais”
- Tabelas muito parecidas (duplicidade funcional)
- Campos que repetem informação que já existe em outro lugar
- Uso (ou ausência) de tabelas de referência/lookup
- Decisões estranhas de tipo (ex.: guardar JSON onde claramente seria uma relação)

Sugerir melhorias como:
- extração de tabelas auxiliares,
- unificação de tabelas duplicadas,
- renomeação para nomes mais claros de negócio.

---

## 8) Performance (índices, consultas, volume potencial)

Com base nas queries que aparecem no código:

- Colunas usadas em filtros/joins **sem índice** → sugerir índices necessários
- Índices aparentemente inúteis (nunca usados nas queries)
- Riscos de N+1 no lado do banco (muitos selects pequenos ao invés de join adequado)
- Campos grandes (JSON/texto) usados em filtros/ordenções frequentes

Sugerir:
- índices compostos,
- ajustes de chaves,
- eventuais materialized views só se fizer sentido.

---

## 9) Plano de saneamento do banco

Transformar o diagnóstico em um **plano de ações** organizado:

- Lista de **tabelas** por categoria:
  - Manter (CORE, SUPPORT)
  - Refatorar (LEGACY)
  - Arquivar (CANDIDATE_ARCHIVE)
  - Avaliar para remoção (CANDIDATE_DROP, REVIEW)
- Lista de **colunas** candidatas a remoção ou refatoração
- Ajustes de RLS e Auth recomendados
- Ajustes de índice/estrutura de modelo

Para cada item crítico, sugerir o tipo de migração (DDL) em alto nível, sem escrever scripts finais se não for solicitado.

---

## 10) Perguntas pendentes

Ao final, consolidar todas as **dúvidas que dependem de negócio/cliente** em uma lista numerada, por exemplo:

1. A tabela `X` ainda é usada por algum processo manual ou sistema externo?
2. A tabela `Y` e `Z` representam fases diferentes do mesmo processo ou módulos distintos?
3. É permitido arquivar/anonimizar registros antigos de `alunos` com mais de N anos?

---

# Regras gerais

- Não executar nem assumir migrações: apenas sugerir.
- Não “adivinhar” uso externo que não esteja no código; em caso de dúvida, marcar `[REVIEW]` e registrar pergunta.
- Tratar dados sensíveis com cuidado, marcando `[SENSITIVE]`, sem expor exemplos reais.
- Sempre usar linguagem clara e de negócio nas descrições.
- Não tocar/alterar nada relacionado à pasta `Comands/` no app; aqui o foco é **banco**, não código, mas a estrutura de comandos deve ser preservada como referência.

---

# Formato de saída (títulos principais)

### Sumário

### Inventário de Schemas e Tabelas

### Estrutura Interna (colunas, FKs, índices)

### Uso Real pelo App (tabelas/colunas mortas)

### RLS e Segurança

### Auth e Usuários

### Qualidade do Modelo de Dados

### Performance

### Plano de Saneamento do Banco

### Perguntas Pendentes para Negócio/Time
