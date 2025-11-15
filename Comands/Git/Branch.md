# Gerenciamento de Branches

## Objetivo

Padronizar a criação, nomenclatura e gerenciamento de branches para manter o repositório organizado e facilitar o trabalho em equipe.

## Quando usar

**SEMPRE** que for:
- Iniciar uma nova funcionalidade
- Corrigir um bug
- Fazer manutenção/refatoração
- Trabalhar em qualquer mudança no código

**NUNCA** trabalhe diretamente na branch `main`!

## Referências

- Consulte @Git/Sync.md antes de criar branch (sincronizar main primeiro)
- Consulte @Git/Workflow.md para fluxo completo de trabalho
- Consulte @Git/PR.md quando branch estiver pronto para merge

## Convenções de Nomenclatura

### Formato Padrão

```
tipo/descricao-curta
```

### Tipos de Branch

- **`feat/`** - Nova funcionalidade
  - Exemplo: `feat/adicionar-login`, `feat/importacao-alunos`

- **`fix/`** - Correção de bug
  - Exemplo: `fix/corrigir-validacao-email`, `fix/bug-importacao`

- **`chore/`** - Tarefas de manutenção
  - Exemplo: `chore/atualizar-dependencias`, `chore/limpeza-codigo`

- **`refactor/`** - Refatoração de código
  - Exemplo: `refactor/organizar-componentes`, `refactor/melhorar-api`

- **`docs/`** - Documentação
  - Exemplo: `docs/atualizar-readme`, `docs/adicionar-exemplos`

- **`test/`** - Testes
  - Exemplo: `test/adicionar-testes-login`, `test/cobertura-api`

- **`style/`** - Formatação (sem mudança de lógica)
  - Exemplo: `style/formatar-codigo`, `style/corrigir-indentacao`

### Regras de Nomenclatura

1. **Use letras minúsculas**
   - ✅ Correto: `feat/adicionar-login`
   - ❌ Errado: `feat/Adicionar-Login`

2. **Use hífens para separar palavras**
   - ✅ Correto: `feat/adicionar-login-usuario`
   - ❌ Errado: `feat/adicionar_login_usuario`

3. **Seja descritivo mas conciso**
   - ✅ Correto: `feat/importacao-alunos-csv`
   - ❌ Errado: `feat/novo` ou `feat/adicionar-funcionalidade-completa-de-importacao-de-alunos-via-csv-com-validacao`

4. **Evite caracteres especiais**
   - ✅ Correto: `fix/corrigir-bug-401`
   - ❌ Errado: `fix/corrigir-bug#401`

## Como executar (ordem obrigatória)

### 1) SINCRONIZAR MAIN PRIMEIRO

**CRÍTICO**: Sempre sincronize a main antes de criar branch!

```bash
# Verificar branch atual
git branch --show-current

# Se não estiver em main, voltar para main
git checkout main

# Sincronizar com remoto
git pull origin main
```

Consulte @Git/Sync.md para detalhes completos.

### 2) VERIFICAR STATUS

```bash
# Verificar se não há mudanças não commitadas
git status
```

**Se houver mudanças:**
- Fazer commit ou stash antes de criar branch
- Consulte @Git/Sync.md para opções

### 3) CRIAR BRANCH

```bash
# Criar e mudar para o novo branch
git checkout -b tipo/nome-do-branch

# Exemplos:
git checkout -b feat/adicionar-login
git checkout -b fix/corrigir-validacao-email
git checkout -b chore/atualizar-dependencias
```

### 4) VERIFICAR BRANCH CRIADO

```bash
# Verificar que está no branch correto
git branch --show-current

# Deve mostrar: tipo/nome-do-branch
```

### 5) TRABALHAR NO BRANCH

Agora você pode fazer suas alterações normalmente. Consulte @Git/Workflow.md para fluxo completo.

## Gerenciamento de Branches

### Listar Branches

```bash
# Listar branches locais
git branch

# Listar todos os branches (locais e remotos)
git branch -a

# Listar apenas branches remotos
git branch -r
```

### Mudar de Branch

```bash
# Mudar para outro branch
git checkout nome-do-branch

# OU (Git 2.23+)
git switch nome-do-branch
```

### Renomear Branch

```bash
# Renomear branch atual
git branch -m novo-nome

# Renomear branch específico
git branch -m nome-antigo novo-nome
```

### Deletar Branch

#### Deletar Branch Local

```bash
# Deletar branch (apenas se já foi mergeado)
git branch -d nome-do-branch

# Forçar deleção (mesmo se não foi mergeado)
git branch -D nome-do-branch
```

#### Deletar Branch Remoto

```bash
# Deletar branch no GitHub
git push origin --delete nome-do-branch
```

### Ver Diferenças Entre Branches

```bash
# Ver commits diferentes entre branches
git log branch1..branch2 --oneline

# Ver diferenças de arquivos
git diff branch1..branch2
```

## Problemas Comuns

### Problema: "Fiz commit na main por engano"

**Solução**: Mover commit para um branch

```bash
# 1. Criar branch a partir do commit atual
git checkout -b feat/correcao

# 2. Voltar main para o estado anterior
git checkout main
git reset --hard origin/main

# 3. Continuar trabalhando no branch correto
git checkout feat/correcao
```

### Problema: "Criei branch com nome errado"

**Solução**: Renomear branch

```bash
# Renomear branch atual
git branch -m nome-correto

# Se já fez push, deletar remoto e enviar novamente
git push origin --delete nome-errado
git push -u origin nome-correto
```

### Problema: "Preciso trabalhar em outro branch urgentemente"

**Solução**: Stash (guardar mudanças temporariamente)

```bash
# 1. Guardar mudanças atuais
git stash push -m "trabalho em progresso"

# 2. Mudar para outro branch
git checkout outro-branch

# 3. Trabalhar no outro branch

# 4. Voltar e recuperar mudanças
git checkout branch-original
git stash pop
```

### Problema: "Branch remoto foi deletado mas ainda aparece localmente"

**Solução**: Limpar referências

```bash
# Limpar referências de branches remotos deletados
git fetch --prune

# OU
git remote prune origin
```

## Boas Práticas

1. **Sempre crie branch a partir da main atualizada**
   - Sincronize antes de criar branch
   - Consulte @Git/Sync.md

2. **Use nomes descritivos**
   - Facilita identificação do propósito
   - Ajuda na organização

3. **Um branch por funcionalidade/bug**
   - Não misture múltiplas funcionalidades
  - Facilita revisão e rollback

4. **Delete branches após merge**
   - Mantém repositório limpo
   - Evita confusão

5. **Não trabalhe em branch de outra pessoa**
   - Crie seu próprio branch
   - Evita conflitos

6. **Mantenha branches atualizados**
   - Sincronize com main regularmente
   - Consulte @Git/Sync.md

## Checklist de Criação de Branch

Antes de criar branch:
- [ ] Sincronizei a main (`git pull origin main`)
- [ ] Verifiquei que não há mudanças não commitadas
- [ ] Escolhi nome descritivo seguindo convenções
- [ ] Decidi o tipo correto (feat/fix/chore/etc)

Ao criar branch:
- [ ] Criei branch a partir da main atualizada
- [ ] Verifiquei que estou no branch correto
- [ ] Posso começar a trabalhar

## Exemplos Práticos

### Exemplo 1: Nova Funcionalidade

```bash
# 1. Sincronizar
git checkout main
git pull origin main

# 2. Criar branch
git checkout -b feat/adicionar-login

# 3. Verificar
git branch --show-current
# Saída: feat/adicionar-login

# 4. Trabalhar...
```

### Exemplo 2: Correção de Bug

```bash
# 1. Sincronizar
git checkout main
git pull origin main

# 2. Criar branch
git checkout -b fix/corrigir-validacao-email

# 3. Trabalhar na correção...
```

### Exemplo 3: Limpeza Após Merge

```bash
# 1. Voltar para main
git checkout main

# 2. Sincronizar
git pull origin main

# 3. Deletar branch local
git branch -d feat/funcionalidade-mergeada

# 4. Deletar branch remoto (se ainda existir)
git push origin --delete feat/funcionalidade-mergeada
```

## Próximos Passos

Após criar branch:
- Consulte @Git/Workflow.md para fluxo completo de trabalho
- Consulte @Git/PR.md quando branch estiver pronto
- Consulte @Git/Conflitos.md se encontrar conflitos

