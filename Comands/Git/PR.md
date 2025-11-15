# Pull Requests (PR)

## Objetivo

Padronizar a criação, revisão e merge de Pull Requests para garantir que todas as mudanças sejam revisadas adequadamente antes de entrar na main.

## Quando usar

**SEMPRE** antes de fazer merge de qualquer branch para `main`. **NUNCA** faça merge direto sem PR!

## Referências

- @Git/Workflow.md - Fluxo completo de trabalho
- @Git/Sync.md - Sincronização (fazer antes de criar PR)
- @Git/Checklist.md - Checklist completo antes de PR
- @Commit.md - Protocolo de commit e merge
- @Git/Conflitos.md - Se houver conflitos

## Como executar (ordem obrigatória)

### 1) PREPARAR BRANCH PARA PR

#### 1.1 Sincronizar Branch com Main

**CRÍTICO**: Sempre sincronize seu branch com a main antes de criar PR!

```bash
# 1. Garantir que está no seu branch
git checkout feat/seu-branch

# 2. Buscar mudanças
git fetch origin

# 3. Trazer mudanças da main
git merge origin/main

# OU usar rebase (mais limpo):
git rebase origin/main
```

**Se houver conflitos:**
- Consulte @Git/Conflitos.md para resolver

#### 1.2 Resolver Conflitos (se houver)

```bash
# Resolver conflitos normalmente
# ... editar arquivos ...

git add arquivo-resolvido.ts
git commit -m "fix: resolver conflitos com main"
```

#### 1.3 Testar Tudo

Antes de criar PR, certifique-se de que:
- [ ] Código compila sem erros
- [ ] Testes passam (se houver)
- [ ] Funcionalidade funciona como esperado
- [ ] Não quebrou funcionalidades existentes
- [ ] Lint passa (se aplicável)

#### 1.4 Push do Branch

```bash
# Enviar branch atualizado para GitHub
git push origin feat/seu-branch

# Se já existe no remoto e você fez rebase:
git push --force-with-lease origin feat/seu-branch
```

**⚠️ CUIDADO**: Use `--force-with-lease` apenas se necessário e com cuidado!

### 2) VERIFICAR CHECKLIST

Consulte @Git/Checklist.md e verifique todos os itens antes de criar PR.

### 3) CRIAR PULL REQUEST

#### 3.1 Via GitHub Web Interface (Recomendado)

1. **Acesse o repositório no GitHub**
   - URL: `https://github.com/global-educacao-tech/organizacao10x`

2. **GitHub detectará automaticamente**
   - Aparecerá banner: "feat/seu-branch had recent pushes"
   - Clique em "Compare & pull request"

3. **OU acesse diretamente**
   - Clique em "Pull requests" → "New pull request"
   - Selecione:
     - **Base**: `main`
     - **Compare**: `feat/seu-branch`

4. **Preencher formulário do PR**

#### 3.2 Via GitHub CLI (se instalado)

```bash
gh pr create \
  --title "feat: adicionar funcionalidade X" \
  --body "Descrição do PR" \
  --base main \
  --head feat/seu-branch
```

### 4) PREENCHER DESCRIÇÃO DO PR

Use o template abaixo:

```markdown
## Objetivo
Descrição clara do que foi feito e por quê.

## Mudanças
- Mudança 1
- Mudança 2
- Mudança 3

## Como testar?
1. Passo 1 para testar
2. Passo 2 para testar
3. Passo 3 para testar

## Screenshots (se aplicável)
[Adicionar screenshots se houver mudanças visuais]

## Checklist
- [ ] Código compila sem erros
- [ ] Testes passam (se houver)
- [ ] Funcionalidade foi testada
- [ ] Não quebrou funcionalidades existentes
- [ ] Lint passa
- [ ] Sincronizei branch com main
- [ ] Resolvi todos os conflitos
```

### 5) AGUARDAR REVISÃO

- **NÃO faça merge sem aprovação**
- Responda comentários prontamente
- Faça ajustes se solicitado
- Seja educado e profissional

### 6) FAZER AJUSTES (se necessário)

Se houver feedback que requer mudanças:

```bash
# 1. Fazer alterações
# ... editar arquivos ...

# 2. Commit
git add .
git commit -m "fix: ajustar conforme feedback do PR"

# 3. Push
git push origin feat/seu-branch

# PR será atualizado automaticamente
```

### 7) APÓS APROVAÇÃO

#### 7.1 Merge do PR

Após receber aprovação:

1. **No GitHub**, clique em "Merge pull request"
2. **Escolha método de merge**:
   - **Merge commit**: Cria commit de merge (recomendado)
   - **Squash and merge**: Junta todos commits em um
   - **Rebase and merge**: Aplica commits linearmente
3. **Confirme merge**

**Detalhes completos**: Consulte @Commit.md

#### 7.2 Sincronizar Main Local

```bash
# 1. Voltar para main
git checkout main

# 2. Sincronizar
git pull origin main

# 3. Verificar que seu merge está lá
git log --oneline -5
```

#### 7.3 Limpar Branches

```bash
# Deletar branch local
git branch -d feat/seu-branch

# Deletar branch remoto (GitHub pode fazer automaticamente)
git push origin --delete feat/seu-branch
```

## Template Completo de Descrição de PR

```markdown
## Objetivo
[Descrição clara do que foi feito e por quê]

## Contexto
[Por que essa mudança é necessária? Qual problema resolve?]

## Mudanças
- [Mudança 1 - descrição detalhada]
- [Mudança 2 - descrição detalhada]
- [Mudança 3 - descrição detalhada]

## Arquivos Modificados
- `caminho/arquivo1.ts` - [o que mudou]
- `caminho/arquivo2.tsx` - [o que mudou]

## Como testar?
1. [Passo 1 para testar]
2. [Passo 2 para testar]
3. [Passo 3 para testar]

## Screenshots (se aplicável)
[Adicionar screenshots se houver mudanças visuais]

## Checklist
- [ ] Código compila sem erros
- [ ] Testes passam (se houver)
- [ ] Funcionalidade foi testada manualmente
- [ ] Não quebrou funcionalidades existentes
- [ ] Lint passa
- [ ] Sincronizei branch com main
- [ ] Resolvi todos os conflitos
- [ ] Encoding verificado - SEM MOJIBAKE
- [ ] Commits têm mensagens descritivas

## Impacto
- **Funcionalidade**: [Como isso afeta a funcionalidade?]
- **Performance**: [Impacto na performance?]
- **Segurança**: [Considerações de segurança?]
- **Breaking Changes**: [Há breaking changes?]

## Referências
- Issue relacionada: #[número]
- Documentação: [links]
- Outros PRs relacionados: #[número]
```

## Boas Práticas

### 1. PRs Pequenos e Focados

- Um PR por funcionalidade/bug
- Facilita revisão
- Facilita rollback se necessário

### 2. Descrições Claras

- Explique o "por quê", não apenas o "o quê"
- Inclua contexto necessário
- Seja específico sobre mudanças

### 3. Commits Organizados

- Commits lógicos e descritivos
- Facilita revisão
- Facilita histórico

### 4. Testes Incluídos

- Teste manualmente antes de criar PR
- Inclua testes automatizados se aplicável
- Documente como testar

### 5. Resposta Rápida

- Responda comentários prontamente
- Faça ajustes rapidamente
- Seja colaborativo

## Processo de Revisão

### Como Revisar um PR

1. **Ler descrição completa**
2. **Revisar código**
   - Lógica está correta?
   - Segue padrões do projeto?
   - Há problemas de segurança?
3. **Testar localmente** (se necessário)
4. **Dar feedback construtivo**
5. **Aprovar ou solicitar mudanças**

### Tipos de Feedback

- **Aprovação**: Tudo OK, pode fazer merge
- **Solicitar mudanças**: Há problemas que precisam ser corrigidos
- **Comentários**: Sugestões ou dúvidas

## Regras Obrigatórias

- **SEMPRE** crie PR antes de fazer merge
- **SEMPRE** sincronize branch com main antes de criar PR
- **SEMPRE** teste antes de criar PR
- **SEMPRE** aguarde aprovação antes de merge
- **NUNCA** faça merge sem PR
- **NUNCA** force push na main
- **SEMPRE** sincronize main após merge

## Troubleshooting

### Problema: "PR mostra conflitos"

**Solução**:
```bash
# Sincronizar branch com main
git checkout feat/seu-branch
git fetch origin
git merge origin/main
# Resolver conflitos
git push origin feat/seu-branch
```

### Problema: "PR foi fechado sem merge"

**Solução**:
- Se foi fechado por engano, pode reabrir
- Se foi fechado intencionalmente, criar novo branch se necessário

### Problema: "Preciso atualizar PR após feedback"

**Solução**:
```bash
# Fazer alterações
git add .
git commit -m "fix: ajustar conforme feedback"
git push origin feat/seu-branch
# PR será atualizado automaticamente
```

### Problema: "PR está muito grande para revisar"

**Solução**:
- Dividir em múltiplos PRs menores
- Fazer PR incremental
- Documentar bem as mudanças

## Checklist Antes de Criar PR

Consulte @Git/Checklist.md para checklist completo.

Resumo rápido:
- [ ] Sincronizei branch com main
- [ ] Resolvi todos os conflitos
- [ ] Testei tudo
- [ ] Código compila
- [ ] Lint passa
- [ ] Commits são descritivos
- [ ] Descrição do PR está completa

## Próximos Passos

Após criar PR:
- Aguardar revisão
- Responder comentários
- Fazer ajustes se necessário
- Após aprovação: Consulte @Commit.md para merge

Após merge:
- Sincronizar main local
- Limpar branches
- Continuar com próximo trabalho

