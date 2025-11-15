# Objetivo
Padronizar o processo de merge para garantir commits limpos, profissionais e eficientes, sem arquivos desnecessários ou temporários, mantendo o repositório organizado e o sistema funcionando perfeitamente. **SEMPRE criar Pull Request (PR) antes de fazer merge.**

# Quando usar
Antes de fazer merge de qualquer branch para `main` ou branch de produção, especialmente quando:
- Há arquivos temporários, scripts one-off ou documentação pessoal no repositório
- É necessário consolidar mudanças de múltiplos branches
- Preparar o código para deploy em produção
- Migrar de repositório pessoal para repositório oficial da organização

# Referências
- Consulte @Git/Workflow.md para fluxo completo de trabalho
- Consulte @Git/Sync.md antes de sincronizar
- Consulte @Git/Branch.md para criação de branches
- Consulte @Git/PR.md para criação de Pull Requests
- Consulte @Git/Checklist.md para checklist completo antes de PR
- Consulte @Git/Conflitos.md se houver conflitos
- Consulte @Limpeza.md para inventário e remoção segura de arquivos
- Siga @Validar.md para validação completa antes do merge
- Use @Seguranca.md para checagens de segurança
- Alinhe com @Padroes.md para consistência de código

# Como executar (ordem obrigatória)

## 1) PREPARAÇÃO DO BRANCH DE LIMPEZA
**CRÍTICO**: Se estiver no branch `main`, criar branch imediatamente antes de qualquer commit.

- Verificar branch atual: `git branch --show-current`
  - Se estiver em `main`: `git checkout -b chore/cleanup-pre-merge-YYYYMMDD`
  - Se já estiver em branch próprio: continuar no branch atual
- Criar branch dedicado se necessário: `chore/cleanup-pre-merge-YYYYMMDD` a partir do branch atual
- Verificar status: `git status` — garantir que não há mudanças não commitadas
- Verificar remoto: `git remote -v` — confirmar repositório oficial

## 2) INVENTÁRIO DE ARQUIVOS TEMPORÁRIOS
Gerar lista completa de arquivos candidatos à remoção:

### 2.1 Scripts temporários (one-off)
- Scripts de análise/automação pontuais (`*-asana-*.js`, `analyze-*.js`, `create-*.js`, `fix-*.js`, `organize-*.js`, `update-*.js`, `remove-*.js`, `redistribute-*.js`, `add-*.js`, `configure-*.js`)
- Scripts Python temporários (`temp_*.py`)
- Verificar: `find . -maxdepth 1 -name "*-asana-*.js" -o -name "analyze-*.js" -o -name "create-*.js" | grep -v node_modules`

### 2.2 Arquivos de resultado/análise
- JSONs de resultado (`*-analysis.json`, `*-results.json`, `*-configuration.json`)
- Arquivos temporários (`*_temp.txt`, `commit_msg_temp.txt`)
- Verificar: `find . -maxdepth 1 -name "*-analysis.json" -o -name "*-results.json" | grep -v node_modules`

### 2.3 Documentação temporária na raiz
- Relatórios temporários (`AUDITORIA_*.md`, `DIAGNOSTICO_*.md`, `RELATORIO_*.md`)
- Progressos/status (`PROGRESSO_*.md`, `STATUS_*.md`)
- Guias temporários (`GUIA_*.md`, `INSTRUCOES_*.md`, `MAPEAMENTO_*.md`, `ORGANIZAR_*.md`, `SOLUCAO_*.md`)
- Verificar: `find . -maxdepth 1 -name "AUDITORIA_*.md" -o -name "RELATORIO_*.md" | grep -v node_modules`

### 2.4 Documentação temporária em docs/
**IMPORTANTE**: A pasta `docs/` deve conter apenas documentação essencial:
- **MANTER**: `docs/arquitetura/` (ADRs - Architecture Decision Records)
- **MANTER**: `docs/CODE_REVIEW_CHECKLIST.md` (checklist de revisão)
- **MANTER**: `docs/ASANA_MCP_CONFIGURATION.md` (configuração MCP se aplicável)
- **IGNORAR/REMOVER**: Tudo em `docs/temporarios/`
- **IGNORAR/REMOVER**: Tudo em `docs/db/` (análises temporárias, CSVs, relatórios)
- **IGNORAR/REMOVER**: Arquivos de análise (`ANALISE_*.md`)
- **IGNORAR/REMOVER**: Arquivos de auditoria (`audit-*.md`, `audit-*.csv`, `audit-*.html`)
- **IGNORAR/REMOVER**: Arquivos de diagnóstico (`DIAGNOSTICO_*.md`, `DEBUG_*.md`)
- **IGNORAR/REMOVER**: Arquivos de progresso (`PROGRESSO_*.md`, `STATUS_*.md`, `RESUMO_*.md`)
- **IGNORAR/REMOVER**: Arquivos de troubleshooting (`TROUBLESHOOTING_*.md`)
- **IGNORAR/REMOVER**: Outros arquivos temporários (`EXCLUSAO_*.md`, `DELETE_*.md`, `COMPLETE_*.md`, `MIGRATION_*.md`, `RECUPERACAO_*.md`, `APLICAR_*.md`, `CONTRATO_*.md`, `FUNCIONAMENTO_*.md`, `EMAIL_*.md`, `SEEDS_*.md`)

### 2.5 Pastas temporárias/pessoais
- `governanca/` — remover completamente se não for estrutura oficial
- `Comands/` — adicionar ao `.gitignore` (manter localmente, não versionar)
- Verificar conteúdo: `ls -la governanca/` e `ls -la Comands/`

## 3) ATUALIZAÇÃO DO .gitignore
Atualizar `.gitignore` para ignorar arquivos temporários (evitar commits futuros):

```gitignore
# Pasta de comandos pessoais (manter localmente)
Comands/

# Scripts temporários do Asana
*-asana-*.js
analyze-*.js
create-*.js
fix-*.js
organize-*.js
update-*.js
remove-*.js
redistribute-*.js
add-*.js
configure-*.js
identify-*.js

# Arquivos Python temporários
temp_*.py

# Arquivos JSON de análise/resultado
*-analysis.json
*-results.json
*-configuration.json
*-removal-results.json

# Arquivos temporários
*_temp.txt
commit_msg_temp.txt

# Documentação temporária na raiz
AUDITORIA_*.md
DIAGNOSTICO_*.md
EXPLICACAO_*.md
GUIA_*.md
INSTRUCOES_*.md
INSTRUCOES_*.txt
MAPEAMENTO_*.md
ORGANIZAR_*.md
OUTRAS_*.md
PLANO_*.md
PROGRESSO_*.md
RELATORIO_*.md
SOLUCAO_*.md
STATUS_*.md
asana-setup-structure.md
COMO_OBTER_*.md

# Pasta governanca temporária (se não for oficial)
governanca/

# Documentação temporária em docs/ (reorganizada)
docs/temporarios/

# Arquivos de análise e auditoria temporários em docs/
docs/ANALISE_*.md
docs/audit-*.md
docs/audit-*.csv
docs/audit-*.html
docs/DIAGNOSTICO_*.md
docs/DEBUG_*.md
docs/PROGRESSO_*.md
docs/STATUS_*.md
docs/RESUMO_*.md
docs/TROUBLESHOOTING_*.md
docs/EXCLUSAO_*.md
docs/DELETE_*.md
docs/COMPLETE_*.md
docs/MIGRATION_*.md
docs/RECUPERACAO_*.md
docs/APLICAR_*.md
docs/CONTRATO_*.md
docs/FUNCIONAMENTO_*.md
docs/EMAIL_*.md
docs/SEEDS_*.md

# Pasta db/ com análises temporárias (CSVs, relatórios)
docs/db/
```

## 4) REMOÇÃO DE ARQUIVOS TEMPORÁRIOS
**IMPORTANTE**: Usar `git rm` para remover arquivos já rastreados pelo Git.

### 4.1 Remover scripts temporários
```bash
# Scripts JavaScript temporários do Asana
git rm add-priority-tags-to-tasks.js analyze-asana-project.js analyze-asana-structure.js analyze-tasks-descriptions.js configure-task-dependencies.js configure-task-due-dates.js create-asana-project.js create-complete-asana-tasks.js create-hotmart-bug-task.js fix-asana-assignments.js fix-asana-issues.js fix-priority-tags-exp2024.js identify-duplicate-tasks.js organize-asana-final.js organize-asana-mcp.js organize-asana-oauth-flow.js organize-asana-oauth.js organize-asana-tasks.js redistribute-all-due-dates-and-assignments.js remove-duplicate-tasks.js update-asana-enrollment-contract.js update-asana-rls-tasks.js update-asana-saneamento-tasks.js update-task-descriptions.js

# Scripts Python temporários
git rm temp_find_fase1_tasks.py
```

### 4.2 Remover arquivos JSON de resultado
```bash
git rm asana-structure-analysis.json dependencies-configuration.json due-dates-configuration.json duplicate-removal-results.json duplicate-tasks-analysis.json fix-priority-tags-results.json priority-tags-results.json redistribution-results.json tasks-analysis.json
```

### 4.3 Remover documentação temporária da raiz
```bash
git rm AUDITORIA_TENANT_ID_ORG_ID_FINAL.md DIAGNOSTICO_HOTMART_401.md EXPLICACAO_SECAO_DESCOBERTA.md GUIA_AUTENTICACAO_ASANA.md INSTRUCOES_ORGANIZAR_ASANA.md INSTRUCOES_RAPIDAS.txt MAPEAMENTO_DEPENDENCIAS_ASANA.md ORGANIZAR_TAREFAS_ASANA.md OUTRAS_TAREFAS_DISPONIVEIS.md PLANO_ATUALIZACAO_ASANA_MATRICULA_CONTRATO.md PROGRESSO_PLANO_ASANA_ATUALIZADO.md PROGRESSO_PLANO_ASANA.md RELATORIO_ANALISE_ASANA.md RELATORIO_ESTRUTURA_ASANA.md RELATORIO_FINAL_TENANT_ID_ORG_ID.md SOLUCAO_RAPIDA_OAUTH.md STATUS_PLANO_DESCRICOES.md asana-setup-structure.md COMO_OBTER_PERSONAL_ACCESS_TOKEN.md commit_msg_temp.txt
```

### 4.4 Remover pasta governanca/ (se não for oficial)
```bash
git rm -r governanca/
```

## 5) REORGANIZAÇÃO DA DOCUMENTAÇÃO (OPCIONAL)
Se necessário reorganizar `docs/` em subpastas:

### 5.1 Criar estrutura de subpastas
```bash
mkdir -p docs/temporarios docs/auditorias docs/migrations docs/arquitetura docs/troubleshooting
```

### 5.2 Mover arquivos para subpastas apropriadas
- Progresso/Status → `docs/temporarios/`
- Auditorias → `docs/auditorias/`
- Migrations → `docs/migrations/`
- ADRs → `docs/arquitetura/`
- Troubleshooting → `docs/troubleshooting/`

### 5.3 Adicionar `docs/temporarios/` ao .gitignore

## 6) VALIDAÇÃO PRÉ-COMMIT
Executar validações obrigatórias antes de fazer commit:

### 6.1 Verificar status do Git
```bash
git status
# Deve mostrar apenas mudanças esperadas (remoções e .gitignore)
```

### 6.2 Verificar que arquivos ignorados não aparecem
```bash
git status --ignored
# Verificar que Comands/ e outros temporários estão sendo ignorados
```

### 6.3 Executar lint
```bash
npm run lint:web
# Deve passar sem erros
```

### 6.4 Executar build
```bash
npm run build:web
# Deve compilar com sucesso
```

### 6.5 Verificar que não há referências quebradas
```bash
# Buscar imports quebrados (se aplicável)
grep -r "import.*removido" web/ || echo "Nenhuma referência quebrada encontrada"
```

### 6.6 Verificar encoding e mojibake (OBRIGATÓRIO)
**CRÍTICO**: Sempre verificar se há problemas de encoding (mojibake) em commits e PRs.

#### Sinais de mojibake:
- Caracteres especiais aparecem incorretamente (ex: `obrigatÃ³ria` em vez de `obrigatória`)
- Acentos e cedilhas aparecem como sequências estranhas (ex: `Ã§` em vez de `ç`, `Ã£` em vez de `ã`)
- Caracteres Unicode aparecem como `?` ou símbolos estranhos

#### Como verificar antes do commit:
```bash
# Verificar mensagem de commit antes de fazer commit
git log -1 --pretty=format:"%s" | cat -A
# Procurar por padrões de mojibake comuns
git log -1 --pretty=format:"%s" | grep -E "(Ã|Â|â€|â€™|â€œ|â€)" && echo "MOJIBAKE DETECTADO!" || echo "OK"

# Verificar arquivos modificados
git diff --cached | grep -E "(Ã|Â|â€|â€™|â€œ|â€)" && echo "MOJIBAKE DETECTADO!" || echo "OK"
```

#### Como corrigir mojibake:
1. **No Windows PowerShell:**
   ```powershell
   # Verificar encoding do arquivo
   [System.IO.File]::ReadAllText("arquivo.md", [System.Text.Encoding]::UTF8)
   
   # Salvar com encoding correto (UTF-8 sem BOM)
   $content = Get-Content "arquivo.md" -Raw -Encoding UTF8
   [System.IO.File]::WriteAllText("arquivo.md", $content, [System.Text.UTF8Encoding]::new($false))
   ```

2. **Configurar Git para usar UTF-8:**
   ```bash
   git config --global core.quotepath false
   git config --global i18n.commitencoding utf-8
   git config --global i18n.logoutputencoding utf-8
   ```

3. **Verificar encoding do terminal:**
   ```bash
   # Windows PowerShell
   [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
   
   # Linux/Mac
   export LANG=en_US.UTF-8
   export LC_ALL=en_US.UTF-8
   ```

#### Checklist de verificação de encoding:
- [ ] Mensagem de commit não contém mojibake
- [ ] Arquivos modificados não contêm mojibake
- [ ] Terminal configurado para UTF-8
- [ ] Git configurado para usar UTF-8
- [ ] Editor de texto salva arquivos em UTF-8 sem BOM

**REGRA ABSOLUTA**: Se mojibake for detectado, **NÃO fazer commit** até corrigir completamente.

## 7) COMMIT PROFISSIONAL
Criar commit com mensagem clara e descritiva:

### 7.1 Estrutura da mensagem de commit
```
chore: limpeza pré-merge - remover arquivos temporários

- Remover scripts temporários do Asana (24 arquivos)
- Remover arquivos JSON de análise/resultado (9 arquivos)
- Remover documentação temporária da raiz (19 arquivos)
- Remover pasta governanca/ temporária
- Atualizar .gitignore para ignorar arquivos temporários
- Adicionar Comands/ ao .gitignore (manter localmente)
- Atualizar .gitignore para ignorar documentação temporária em docs/

BREAKING CHANGE: Arquivos temporários removidos. Comands/ não será mais versionado.
```

### 7.2 Fazer commit
```bash
git add .gitignore
git commit -m "chore: limpeza pré-merge - remover arquivos temporários

- Remover scripts temporários do Asana (24 arquivos)
- Remover arquivos JSON de análise/resultado (9 arquivos)
- Remover documentação temporária da raiz (19 arquivos)
- Remover pasta governanca/ temporária
- Atualizar .gitignore para ignorar arquivos temporários
- Adicionar Comands/ ao .gitignore (manter localmente)
- Atualizar .gitignore para ignorar documentação temporária em docs/

BREAKING CHANGE: Arquivos temporários removidos. Comands/ não será mais versionado."
```

### 7.3 Verificar commit
```bash
git log -1 --stat
# Verificar que apenas arquivos esperados foram removidos/adicionados
```

## 8) PUSH DO BRANCH E CRIAÇÃO DO PULL REQUEST
**OBRIGATÓRIO**: Antes de fazer merge, criar Pull Request para revisão.

### 8.1 Push do branch de limpeza
```bash
git push origin chore/cleanup-pre-merge-YYYYMMDD
```

### 8.2 Verificar encoding antes de criar PR (OBRIGATÓRIO)
**CRÍTICO**: Antes de criar o PR, verificar novamente se há mojibake em:
- Título do PR
- Descrição do PR
- Mensagens de commit
- Arquivos modificados

#### Verificação final de encoding:
```bash
# Verificar todos os commits do branch
git log origin/main..HEAD --pretty=format:"%s" | grep -E "(Ã|Â|â€|â€™|â€œ|â€)" && echo "MOJIBAKE DETECTADO NOS COMMITS!" || echo "Commits OK"

# Verificar arquivos modificados
git diff origin/main..HEAD | grep -E "(Ã|Â|â€|â€™|â€œ|â€)" && echo "MOJIBAKE DETECTADO NOS ARQUIVOS!" || echo "Arquivos OK"

# Verificar mensagens de commit completas
git log origin/main..HEAD --pretty=format:"%B" | grep -E "(Ã|Â|â€|â€™|â€œ|â€)" && echo "MOJIBAKE DETECTADO!" || echo "Mensagens OK"
```

**Se mojibake for detectado:**
1. **NÃO criar o PR**
2. Corrigir o encoding dos arquivos/mensagens
3. Fazer amend do commit ou criar novo commit corrigindo
4. Verificar novamente antes de criar PR

### 8.3 Criar Pull Request no GitHub
**IMPORTANTE**: NUNCA fazer merge direto em `main` sem PR.

#### Opções para criar PR:
1. **Via GitHub Web Interface:**
   - Acessar: `https://github.com/global-educacao-tech/organizacao10x`
   - GitHub detectará automaticamente o branch e mostrará botão "Compare & pull request"
   - Clicar e preencher formulário do PR

2. **Via GitHub CLI (gh):**
   ```bash
   gh pr create --title "chore: limpeza pré-merge - remover arquivos temporários" \
     --body "## Objetivo
   Limpeza de arquivos temporários antes do merge no repositório oficial.

   ## Mudanças
   - Remover scripts temporários do Asana (22 arquivos)
   - Remover arquivos JSON de análise/resultado (9 arquivos)
   - Remover documentação temporária da raiz (20 arquivos)
   - Remover pasta governanca/ temporária (11 arquivos)
   - Atualizar .gitignore para ignorar arquivos temporários
   - Adicionar Comands/ ao .gitignore (manter localmente)
   - Atualizar .gitignore para ignorar documentação temporária em docs/

   ## Validações
   - [x] Lint executado e passou
   - [x] Build executado e passou
   - [x] Arquivos temporários identificados e removidos
   - [x] .gitignore atualizado
   - [x] Encoding verificado - SEM MOJIBAKE

   ## Impacto
   BREAKING CHANGE: Arquivos temporários removidos. Comands/ não será mais versionado." \
     --base main \
     --head chore/cleanup-pre-merge-YYYYMMDD
   ```

3. **Via API do GitHub (curl):**
   ```bash
   curl -X POST https://api.github.com/repos/global-educacao-tech/organizacao10x/pulls \
     -H "Authorization: token SEU_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     -d '{
       "title": "chore: limpeza pré-merge - remover arquivos temporários",
       "body": "Limpeza de arquivos temporários...",
       "head": "chore/cleanup-pre-merge-YYYYMMDD",
       "base": "main"
     }'
   ```

### 8.4 Template de descrição do PR
```markdown
## Objetivo
Limpeza de arquivos temporários antes do merge no repositório oficial.

## Mudanças
- Remover scripts temporários do Asana (22 arquivos)
- Remover arquivos JSON de análise/resultado (9 arquivos)
- Remover documentação temporária da raiz (20 arquivos)
- Remover pasta governanca/ temporária (11 arquivos)
- Atualizar .gitignore para ignorar arquivos temporários
- Adicionar Comands/ ao .gitignore (manter localmente)
- Atualizar .gitignore para ignorar documentação temporária em docs/

## Validações Executadas
- [x] Lint executado e passou (`npm run lint:web`)
- [x] Build executado e passou (`npm run build:web`)
- [x] Arquivos temporários identificados e removidos
- [x] .gitignore atualizado com padrões apropriados
- [x] Nenhuma referência quebrada encontrada
- [x] Encoding verificado - SEM MOJIBAKE

## Impacto
- **BREAKING CHANGE**: Arquivos temporários removidos. Comands/ não será mais versionado.
- Arquivos removidos não afetam funcionalidade do sistema
- .gitignore atualizado previne commits futuros de arquivos temporários

## Checklist de Revisão
- [ ] Arquivos removidos são realmente temporários
- [ ] .gitignore está correto e completo
- [ ] Build e lint passam
- [ ] Nenhuma funcionalidade foi quebrada
- [ ] Documentação importante foi preservada
- [ ] Encoding verificado - SEM MOJIBAKE
```

## 9) AGUARDAR APROVAÇÃO DO PR
- Aguardar revisão e aprovação do PR
- Responder a comentários e fazer ajustes se necessário
- **NÃO fazer merge até receber aprovação**

## 10) MERGE DO PR (APÓS APROVAÇÃO)
Após aprovação do PR, fazer merge:

### 10.1 Via GitHub Web Interface (Recomendado)
- Clicar em "Merge pull request" no PR aprovado
- Escolher método de merge (squash, merge, rebase)
- Confirmar merge

### 10.2 Via GitHub CLI
```bash
gh pr merge <PR_NUMBER> --merge --delete-branch
```

### 10.3 Validação pós-merge
```bash
git checkout main
git pull origin main
npm run lint:web
npm run build:web
# Garantir que tudo ainda funciona após merge
```

# Regras obrigatórias
- **NUNCA** fazer commit direto no branch `main` - SEMPRE trabalhar em branch próprio
- **NUNCA** fazer merge direto em `main` sem passar por Pull Request
- **SEMPRE** criar branch antes de fazer commits: `git checkout -b tipo/descricao-YYYYMMDD`
- **SEMPRE** criar PR antes de fazer merge
- **SEMPRE** executar validações (lint, build) antes de fazer commit
- **SEMPRE** verificar encoding/mojibake antes de commit e PR (REGRA CRÍTICA)
- **NUNCA** fazer commit ou criar PR com mojibake (caracteres especiais corrompidos)
- **SEMPRE** usar `git rm` para remover arquivos rastreados (não apenas deletar)
- **SEMPRE** atualizar `.gitignore` antes de remover arquivos (evitar commits futuros)
- **NUNCA** remover arquivos sem verificar dependências (usar @Limpeza.md)
- **SEMPRE** criar mensagem de commit descritiva e profissional (sem mojibake)
- **SEMPRE** aguardar aprovação do PR antes de fazer merge
- **SEMPRE** validar pós-merge (lint, build, testes)
- **MANTER** apenas documentação essencial em `docs/` (ADRs, CODE_REVIEW_CHECKLIST)

# Checklist pré-merge (marcar antes de executar)
- [ ] Branch de limpeza criado (`chore/cleanup-pre-merge-YYYYMMDD`)
- [ ] Inventário de arquivos temporários completo
- [ ] `.gitignore` atualizado com padrões de arquivos temporários
- [ ] Scripts temporários removidos (usar `git rm`)
- [ ] Arquivos JSON de resultado removidos
- [ ] Documentação temporária da raiz removida
- [ ] Documentação temporária em `docs/` identificada e ignorada
- [ ] Pasta `governanca/` removida (se não for oficial)
- [ ] `Comands/` adicionado ao `.gitignore`
- [ ] Lint executado e passou (`npm run lint:web`)
- [ ] Build executado e passou (`npm run build:web`)
- [ ] **Encoding verificado - SEM MOJIBAKE** (verificar commits e arquivos)
- [ ] Commit feito com mensagem profissional (sem mojibake)
- [ ] Branch enviado para repositório remoto (`git push`)
- [ ] **Encoding verificado novamente antes de criar PR** (sem mojibake)
- [ ] **Pull Request criado no GitHub** (título e descrição sem mojibake)
- [ ] PR aguardando revisão/aprovação
- [ ] **NÃO fazer merge até aprovação do PR**

# Formato de saída (obrigatório ao seguir este protocolo)
### Inventário
Lista completa de arquivos temporários identificados por categoria.

### Mudanças no .gitignore
Padrões adicionados ao `.gitignore` e justificativa.

### Arquivos removidos
Lista de arquivos removidos com `git rm` e justificativa.

### Validações executadas
Resultados de lint, build e outras validações.

### Commit criado
Hash do commit e mensagem utilizada.

### Pull Request criado
Link do PR criado no GitHub e número do PR.

### Status do PR
Status atual do PR (aberto, em revisão, aprovado, etc.).

### Verificação de Encoding
Resultado da verificação de mojibake em commits, arquivos e PR. Confirmação de que não há problemas de encoding.

### Observações
Decisões tomadas, arquivos mantidos (se houver) e justificativas.

