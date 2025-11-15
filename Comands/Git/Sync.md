# Sincronização com Remoto (Sync)

## Objetivo

Sincronizar seu repositório local com o repositório remoto (GitHub) para garantir que você está trabalhando com a versão mais recente do código e evitar conflitos.

## Quando usar

**OBRIGATÓRIO** nas seguintes situações:
- **Início do dia**: Antes de começar qualquer trabalho
- **Antes de criar branch**: Garantir que está partindo da main mais recente
- **Antes de criar PR**: Sincronizar seu branch com a main atualizada
- **Após merge de PR**: Atualizar sua main local
- **Final do dia**: Antes de encerrar o trabalho

## Referências

- Consulte @Git/Workflow.md para fluxo completo de trabalho
- Consulte @Git/Branch.md antes de criar novos branches
- Consulte @Git/PR.md antes de criar Pull Requests
- Consulte @Git/Conflitos.md se encontrar problemas durante sync

## Como executar (ordem obrigatória)

### 1) VERIFICAR BRANCH ATUAL

```bash
# Ver em qual branch você está
git branch --show-current
```

**Se estiver em um branch de feature:**
- Decida: continuar no branch ou voltar para main
- Se for voltar para main, pule para o passo 2

**Se estiver em main:**
- Continue para o passo 2

### 2) VERIFICAR STATUS DO REPOSITÓRIO

```bash
# Verificar se há mudanças não commitadas
git status
```

**Se houver mudanças não commitadas:**
- **Opção A**: Fazer commit das mudanças
  ```bash
  git add .
  git commit -m "feat: descrição das mudanças"
  ```

- **Opção B**: Guardar mudanças temporariamente (stash)
  ```bash
  git stash push -m "trabalho em progresso"
  ```

- **Opção C**: Descartar mudanças (CUIDADO!)
  ```bash
  git restore .
  ```

**Se não houver mudanças:**
- Continue para o passo 3

### 3) BUSCAR MUDANÇAS DO REMOTO

```bash
# Buscar todas as mudanças do GitHub (sem aplicar)
git fetch origin
```

Este comando apenas **baixa** as informações, não modifica seus arquivos locais.

### 4) VERIFICAR DIFERENÇAS

```bash
# Ver o que mudou na main remota
git log HEAD..origin/main --oneline

# Ver diferenças detalhadas
git diff HEAD origin/main
```

**Se não houver diferenças:**
- Você já está sincronizado! Pode continuar trabalhando.

**Se houver diferenças:**
- Continue para o passo 5

### 5) APLICAR MUDANÇAS (PULL)

#### Opção A: Merge (Recomendado para iniciantes)

```bash
# Aplicar mudanças da main remota na sua main local
git pull origin main
```

**Se não houver conflitos:**
- Sincronização concluída!

**Se houver conflitos:**
- Consulte @Git/Conflitos.md para resolver

#### Opção B: Reset Hard (CUIDADO - apenas se não tiver mudanças locais)

```bash
# Descartar todas as mudanças locais e igualar à main remota
git reset --hard origin/main
```

**⚠️ ATENÇÃO**: Este comando **apaga** todas as mudanças locais não commitadas!

**Use apenas se:**
- Você não tem mudanças locais importantes
- Você quer descartar tudo e começar do zero
- Você tem certeza do que está fazendo

### 6) VERIFICAR SINCRONIZAÇÃO

```bash
# Verificar se está sincronizado
git status

# Deve mostrar: "Your branch is up to date with 'origin/main'"
```

## Sincronização de Branch de Feature

Se você está em um branch de feature e quer sincronizar com a main:

```bash
# 1. Garantir que está no seu branch
git checkout feat/seu-branch

# 2. Buscar mudanças
git fetch origin

# 3. Trazer mudanças da main para seu branch
git merge origin/main

# OU usar rebase (mais limpo, mas requer cuidado):
git rebase origin/main
```

**Se houver conflitos:**
- Consulte @Git/Conflitos.md

**Após resolver conflitos:**
```bash
# Se usou merge:
git commit -m "fix: resolver conflitos com main"

# Se usou rebase:
# (não precisa fazer commit, rebase já aplica)
```

## Comandos Rápidos

### Sincronização Básica (mais comum)

```bash
git checkout main
git pull origin main
```

### Sincronização Completa (recomendado)

```bash
git checkout main
git fetch origin
git pull origin main
```

### Sincronização com Reset (apenas se necessário)

```bash
git checkout main
git fetch origin
git reset --hard origin/main
```

### Sincronizar Branch com Main

```bash
git checkout feat/seu-branch
git fetch origin
git merge origin/main
```

## Troubleshooting

### Problema: "Your branch is ahead of 'origin/main'"

**Causa**: Você tem commits locais que não foram enviados.

**Solução**:
```bash
# Ver seus commits locais
git log origin/main..HEAD --oneline

# Se quiser enviar:
git push origin main

# Se quiser descartar:
git reset --hard origin/main
```

### Problema: "Your branch and 'origin/main' have diverged"

**Causa**: Você e outros desenvolvedores fizeram commits diferentes.

**Solução**:
```bash
# Ver diferenças
git log --oneline --graph --all

# Trazer mudanças e resolver conflitos
git pull origin main

# Se houver conflitos, consulte @Git/Conflitos.md
```

### Problema: "fatal: refusing to merge unrelated histories"

**Causa**: Históricos completamente diferentes.

**Solução**:
```bash
# Permitir merge de históricos não relacionados
git pull origin main --allow-unrelated-histories
```

### Problema: "error: cannot lock ref"

**Causa**: Conflito de referências.

**Solução**:
```bash
# Limpar referências
git gc --prune=now

# Tentar novamente
git pull origin main
```

### Problema: "Permission denied (publickey)"

**Causa**: Problema de autenticação SSH.

**Solução**:
- Verificar chave SSH configurada
- Ou usar HTTPS ao invés de SSH
- Consulte documentação do GitHub sobre autenticação

## Regras Obrigatórias

- **SEMPRE** sincronize antes de começar a trabalhar
- **SEMPRE** sincronize antes de criar PR
- **NUNCA** faça `git reset --hard` sem ter certeza
- **SEMPRE** verifique `git status` antes de sincronizar
- **SEMPRE** resolva conflitos antes de continuar trabalhando

## Checklist de Sincronização

Antes de sincronizar:
- [ ] Verifiquei em qual branch estou
- [ ] Verifiquei se há mudanças não commitadas
- [ ] Decidi o que fazer com mudanças não commitadas (commit/stash/descartar)

Durante sincronização:
- [ ] Executei `git fetch origin`
- [ ] Verifiquei diferenças com `git log HEAD..origin/main`
- [ ] Executei `git pull origin main`
- [ ] Resolvi conflitos se houver (consulte @Git/Conflitos.md)

Após sincronização:
- [ ] Verifiquei que está sincronizado (`git status`)
- [ ] Testei que o código ainda funciona
- [ ] Posso continuar trabalhando

## Exemplos Práticos

### Exemplo 1: Início do Dia

```bash
# 1. Verificar branch
git branch --show-current
# Saída: main

# 2. Verificar status
git status
# Saída: working tree clean

# 3. Sincronizar
git pull origin main
# Saída: Already up to date. (ou baixa mudanças)

# 4. Pronto para trabalhar!
```

### Exemplo 2: Antes de Criar PR

```bash
# 1. Estar no branch de feature
git checkout feat/nova-funcionalidade

# 2. Buscar mudanças
git fetch origin

# 3. Trazer mudanças da main
git merge origin/main

# 4. Resolver conflitos se houver
# ... (consulte @Git/Conflitos.md)

# 5. Push do branch atualizado
git push origin feat/nova-funcionalidade

# 6. Criar PR (consulte @Git/PR.md)
```

### Exemplo 3: Após Merge de PR

```bash
# 1. Voltar para main
git checkout main

# 2. Sincronizar
git pull origin main

# 3. Deletar branch local (opcional)
git branch -d feat/nova-funcionalidade

# 4. Pronto para próximo trabalho!
```

## Próximos Passos

Após sincronizar:
- Se vai começar novo trabalho: Consulte @Git/Branch.md
- Se vai continuar trabalho existente: Consulte @Git/Workflow.md
- Se vai criar PR: Consulte @Git/PR.md

