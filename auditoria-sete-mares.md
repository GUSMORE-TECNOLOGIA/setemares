# Auditoria Técnica — Projeto Sete Mares

**Data:** 2025-09-24  
**Escopo:** Frontend, Backend, Integrações, DB, Segurança, DevOps, UX/UI, Docs.

## Sumário Executivo
- Pontuação geral (média ponderada): 4.7/10
- Top 5 riscos:
  - Falta de RLS no Supabase (tabelas públicas sem políticas) — alto risco de exposição de dados.
  - App Web (Vite/React) com >150 erros de TypeScript e componente "God" (`desktop/src/app/App.tsx:1`) dificultando manutenção e confiabilidade.
  - Servidor Express de PDF (`desktop/server.cjs:1`) sem headers de segurança (Helmet), sem rate limiting e CORS permissivo.
  - Secrets/Config em repositório: `.env.local` commitado (`desktop/.env.local:1`) e fallback de chave Supabase em código (`desktop/src/lib/supabase.ts:4`).
  - Ausência de CI (lint+types+tests+build+scan) para prevenir regressões.
- Quick wins (≤ 1 dia):
  - Adicionar CI básico (GitHub Actions) com lint, typecheck, pytest e build.
  - Remover/ignorar `desktop/src/app/App-broken.tsx:1` e instalar `@types/fontkit` para sanar erros TS iniciais.
  - Adicionar Helmet, rate-limit e CORS restrito no `server.cjs:1`.
  - Mover chaves Supabase para variáveis de ambiente e gitignore de `.env.local`.
  - Habilitar knip/depcheck e remover dependências não usadas.

## Matriz de Notas (Módulos)
| Módulo | Nota 0–10 | Observações |
|---|---:|---|
| Frontend | 5.0 | Vite/React ok, mas TS com muitos erros e componente enorme. |
| Backend | 3.0 | Apenas `server.cjs` auxiliar sem segurança básica. |
| Integrações | 6.0 | Supabase, Playwright e pnrsh integrados; chaves expostas. |
| Banco de Dados | 4.0 | Schema SQL presente; ausência de RLS e migrações automatizadas. |
| Segurança | 3.5 | Headers, rate limit, secrets e supply chain a melhorar. |
| DevOps/CI | 4.0 | Sem pipeline; scripts parciais. Tests Python ok. |
| UX/UI | 6.0 | UI PySide6 com temas; A11y web não verificada. |
| Qualidade de Código | 6.0 | Python modular com testes; TS precisa saneamento. |
| Documentação | 5.0 | README útil mas com encoding corrompido; docs DB boas.

## Grupos de Validações (Notas)
| Grupo | Nota 0–10 | Gaps |
|---|---:|---|
| Higiene de Código | 6.0 | TS erros, deps não usadas, falta ESLint. |
| Arquitetura & Padrões | 5.0 | Componente "God" no web, camadas backend ausentes. |
| Segurança | 3.5 | Sem Helmet/limit, env no repo, CSP ausente. |
| Dados/DB | 4.0 | Falta RLS e migrações versionadas. |
| Performance | 5.0 | Import monolítico de libs pesadas; sem code-splitting. |
| UX/UI & A11y | 5.5 | Estados ok; A11y/teclado/contraste a revisar. |
| Confiabilidade | 4.0 | Sem logs/metrics/tracing no serviço Node. |
| DevEx | 5.0 | Sem CI, sem templates de PR; scripts melhoráveis. |

## Achados por Frente
### 1. Higiene de Código
- Dead code: `desktop/src/app/App-broken.tsx:1` (arquivo não referenciado e com múltiplos erros TS).
- Duplicações: Dois componentes `QuotePreview` em stacks diferentes (decoder vs quote) podem conflitar no naming; considerar consolidar (`desktop/src/components/decoder/QuotePreview.tsx:1`, `desktop/src/components/quote/QuotePreview.tsx:1`).
- Dependências não usadas (depcheck): `@radix-ui/*` (ícones/slot/tooltip/scroll-area/separator), `framer-motion`, `@types/jspdf`, dev: `ts-node`, `autoprefixer`, `postcss`, `tailwindcss` — revisar uso real.
- Complexidade: `desktop/src/app/App.tsx:1` com ~1353 linhas indica componente "God" com múltiplas responsabilidades; alto acoplamento e difícil testabilidade.
- Python: módulos coesos e testados (`tests/test_*.py:1`), seguindo responsabilidades separadas (parser, rules, pdf, ui).
- Ferramentas sugeridas: knip, ts-prune, depcheck para identificar exports/arquivos não usados.

### 2. Backend/API
- Serviço auxiliar: `desktop/server.cjs:1` (Express) expõe `/api/generate-pdf` sem Helmet, sem rate limiting e CORS aberto. Não há autenticação, auditoria ou logs estruturados.
- CORS: `cors()` sem origem restrita (permitindo todas); restringir a `localhost` no dev e domínio oficial em prod.
- Contratos: Sem OpenAPI; contrato simples (HTML -> PDF). Adotar validação de input (zod) e timeouts.
- Observabilidade: Sem logs estruturados, métricas ou tracing; adicionar pino/winston e pino-http.

### 3. Frontend
- Stack: Vite + React + TS + Tailwind. `vite.config.ts:1` com alias `@`.
- Typecheck: `npm run typecheck` falha com >150 erros TS (tipos faltantes e imports quebrados); instalar `@types/fontkit`, remover arquivo "broken" e adequar tipos.
- Bundles: Import estático de libs pesadas (`@react-pdf/renderer`, Supabase). Sugerir lazy import/dynamic import nos fluxos que usam PDF.
- Estados: Componentes mostram estados loading/empty em alguns trechos (`desktop/src/components/quote/QuotePreview.tsx:1`), mas padronização pode melhorar.
- A11y/i18n: Não há i18n; A11y não sistematizada (sem checagem automática). Adotar `eslint-plugin-jsx-a11y` e testes de teclado.

### 4. Banco de Dados & RLS
- Supabase: SQLs de schema/limpeza presentes (`desktop/db/sql/*.sql:1`). Tabelas para airlines/airports/aliases/overrides/telemetria (`014_create_decoder_v2_tables.sql:1`).
- RLS: Não há políticas definidas nos scripts. Propor RLS mínima por papel (anon/auth/service):
  - Catálogos (airlines/airports): SELECT para `anon`/`authenticated`; mutações somente `service_role`.
  - Overrides/telemetria: RLS com `user_id = auth.uid()` para INSERT/UPDATE/DELETE; SELECT por proprietário ou administradores.
- Índices: Já há índices úteis (`code_aliases(kind, alias)`, `decode_events(created_at)`), sugerir mais em campos de lookup frequentes (e.g., `decoder_overrides(token_kind, token)`).

### 5. Segurança
- Segredos e config: `.env.local` commitado (`desktop/.env.local:1`). Mover para variáveis de ambiente e adicionar ao `.gitignore`.
- Chaves Supabase: Fallback em código com anon key (`desktop/src/lib/supabase.ts:4`). Embora anon key não seja secreto, evite logar no console e diferencie ambientes.
- Headers & CSP: `server.cjs:1` sem Helmet/CSP. Adicionar `helmet` e `cors` configurado por origem, e rate limiting.
- Supply chain: `npm audit` retornou sem vulnerabilidades, mas incluir auditorias no CI (npm/pnpm audit, trivy filesystem).
- Entrada/Saída: Validar payloads do endpoint com zod/yup; sanitizar HTML se for aceito de fontes externas.

### 6. DevOps/CI-CD
- Sem pipelines: Não há `.github/workflows` ou equivalente. Incluir workflow com lint → typecheck → tests (pytest) → build (vite + PyInstaller opcional) → scans (gitleaks/audit).
- Coverage: Não há relatório. Tests Python (13) passam localmente.
- Versionamento: Sem Conventional Commits, CHANGELOG e releases automatizados.
- Pré-PR: Não há templates de PR/Issue; sem preview env configurado para Vercel via PR.

### 7. UX/UI
- PySide6: UI com temas e tokens via QSS dinâmico (`ui/app.py:1`), boa base para consistência.
- Heurísticas: Melhorar visibilidade de estados (loading/success/error), microcopy e confirmações em ações destrutivas.
- Web (desktop/): Aferir contraste AA, foco visível e navegação por teclado.
- Quick wins: Skeletons padronizados, títulos e hierarquia visual, feedback imediato no parse/decodificação e geração de PDF.

## Plano de Ação por **GATES**
- **GATE 0 — Descoberta & Baseline**
  - Objetivos: Relatórios gerados; configurar knip/ts-prune/depcheck/eslint/tsc/pytest/gitleaks.
  - Atividades: Adicionar scripts NPM e GitHub Actions; criar `.eslint.config.js` e regras básicas.
  - Critérios de aceite: Pipelines rodam com status; relatórios anexados ao CI.
- **GATE 1 — Higiene de Código & Tipos**
  - Objetivos: Zerar erros TS críticos; remover dead code; alinhar aliases e tipos.
  - Atividades: Instalar `@types/fontkit`; remover `App-broken.tsx`; ajustar tipos em decoder v2; ativar `eslint-plugin-unused-imports`.
  - Aceite: `npm run typecheck` e `eslint` limpos; depcheck/knip sem críticos.
- **GATE 2 — Arquitetura & Segurança**
  - Objetivos: Segurança mínima no `server.cjs`; segregação de responsabilidades no App.
  - Atividades: Helmet, rate-limit, CORS restrito; validação de payload zod; logs estruturados; separar páginas/features do `App.tsx`.
  - Aceite: Testes de segurança básicos e checklist ok.
- **GATE 3 — UX/UI & A11y**
  - Objetivos: Acessibilidade AA; navegação por teclado.
  - Atividades: `eslint-plugin-jsx-a11y`, foco visível, landmarks ARIA, revisão de contraste.
  - Aceite: Verificação AA e navegação por teclado atendidas.
- **GATE 4 — Banco de Dados & RLS**
  - Objetivos: Políticas RLS por tabela; índices críticos.
  - Atividades: RLS em airlines/airports/aliases/overrides/decode_events; índices adicionais; scripts de migração.
  - Aceite: Queries p95 ok; RLS revisada.
- **GATE 5 — Performance & Observabilidade**
  - Objetivos: Code-splitting, lazy imports e métricas.
  - Atividades: Lazy `@react-pdf/renderer`; bundle analyzer; logs/métricas no serviço.
  - Aceite: KPIs definidos/coletados.
- **GATE 6 — Documentação & Handover**
  - Objetivos: README/ADRs/playbooks/templates de PR; docs de setup ≤ 30 min.
  - Atividades: Corrigir encoding README; playbook de incidentes; guia de webhooks.
  - Aceite: Onboarding ≤ 30 min com checklist.

## Modo Esteira (Pipeline de Implementação)
- Swimlanes paralelos (Frontend / Backend / DB / DevOps / UX).
- WIP limit por lane: 2. Checkpoints semanais e demo quinzenal.
- DoD: lint+types+tests+build ok; docs atualizadas; evidências anexas.

## Comandos Recomendados
- knip / ts-prune / depcheck / eslint / tsc / vitest ou jest / gitleaks / npm audit / trivy
- Exemplos:
  - Mapear código não usado (TS): `npx knip --production` | `npx ts-prune -p desktop/tsconfig.json` | `npx depcheck`
  - Lint/Tipos/Testes web: `npm --prefix desktop run lint` | `npm --prefix desktop run typecheck`
  - Lint/Tipos/Testes Python: `pytest -q` (ou `.\.venv\Scripts\python.exe -m pytest -q`)
  - Segurança: `npx gitleaks detect --no-git -v` | `npm --prefix desktop audit`
  - Container/Imagem (opcional): `trivy filesystem .`

## Issues Sugeridas (para tickets)
- GATE 0: CI básico com lint+typecheck+pytest+build (owner: DevOps).
- GATE 1: Remover `App-broken.tsx` e instalar `@types/fontkit`; corrigir imports `@/` quebrados.
- GATE 2: Adicionar Helmet, CORS restrito e rate-limit no `server.cjs`; validar payload com zod.
- GATE 3: Adotar `eslint-plugin-jsx-a11y` e revisar foco/contraste.
- GATE 4: Implementar RLS em todas as tabelas; criar migrações reprodutíveis.
- GATE 5: Lazy import de PDF e bundle analyzer; logs estruturados.
- GATE 6: Corrigir encoding `README.md:1`; criar templates de PR/Issues e CHANGELOG.

---

### Mapa do Projeto (Detalhado)
- Workspaces/Refs: `package.json:1` (raiz) delega scripts para `desktop/`. Sem monorepo pnpm/yarn workspaces.
- Apps/Pacotes:
  - Desktop Web (Vite/React): `desktop/` — `vite.config.ts:1`, `src/main.tsx:1`.
  - App Desktop Python (PySide6): `ui/app.py:1`, com gerador de PDF (`pdf/generator.py:1`).
  - CLI/Parser/Rules: `cli/`, `core/parser/*.py`, `core/rules/pricing.py:1`.
  - Serviço Node opcional para PDF: `desktop/server.cjs:1`.
- Dependências principais:
  - Python: `pyside6==6.7.3` (`requirements.txt:1`), `jinja2==3.1.4`, `playwright==1.47.0`.
  - Web: `vite@^7.1.6`, `react@^19.1.1`, `@supabase/supabase-js@^2.57.4`, `@react-pdf/renderer@^4.3.0`, `typescript@^5.9.2` (`desktop/package.json:1`).
- Desatualizadas/Vulneráveis: `npm audit` sem vulnerabilidades reportadas; revisar periodicamente. Para Python, sugerir `pip-audit` no CI.

### Evidências (por arquivo)
- `desktop/.env.local:1` — chaves Supabase commitadas.
- `desktop/src/lib/supabase.ts:4` — fallback de URL/anon key e logs de chave no console.
- `desktop/server.cjs:1` — Express sem Helmet/rate limit e CORS aberto.
- `desktop/src/app/App.tsx:1` — ~1353 linhas, sugerindo refatoração em páginas/rotas.
- `tests/test_pricing.py:1` e `tests/test_parser.py:1` — suíte Python com 13 testes (passando localmente).
- `core/parser/itinerary_decoder.py:1` — regex e regras de overnight implementadas; clara separação.

