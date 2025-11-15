# Fluxo de Trabalho Diário

## Objetivo

Padronizar o fluxo de trabalho diário completo, desde o início do dia até a criação de Pull Request, garantindo que todos os desenvolvedores sigam a mesma sequência e evitem conflitos.

## Quando usar

**SEMPRE** que for trabalhar no projeto. Este é o protocolo principal que orquestra todos os outros.

## Referências

- @Git/Sync.md - Sincronização com remoto
- @Git/Branch.md - Criação de branches
- @Git/Conflitos.md - Resolução de conflitos
- @Git/PR.md - Criação de Pull Requests
- @Git/Checklist.md - Checklists antes de PR
- @Commit.md - Protocolo de commit

## Fluxo Completo (Visão Geral)

```
┌─────────────────────────────────────────────────────────┐
│  SEQUÊNCIA COMPLETA DO INÍCIO AO FIM                    │
└─────────────────────────────────────────────────────────┘

1. INÍCIO DO DIA
   ├── Sync com remoto
   └── Verificar branches

2. INICIAR NOVA FUNCIONALIDADE
   ├── Sync main
   ├── Criar branch
   └── Começar a trabalhar

3. DURANTE O TRABALHO
   ├── Fazer alterações
   ├── Commits frequentes
   └── Verificar status

4. ANTES DE CRIAR PR
   ├── Sync branch com main
   ├── Resolver conflitos
   ├── Testar tudo
   └── Push do branch

5. CRIAR PR
   ├── Criar Pull Request
   ├── Aguardar revisão
   └── Fazer ajustes

6. APÓS APROVAÇÃO
   ├── Merge do PR
   ├── Sync main local
   └── Limpar branches
```

## 1. INÍCIO DO DIA

### 1.1 Sincronizar com Remoto

```bash
# 1. Verificar branch atual
git branch --show-current

# 2. Voltar para main se necessário
git checkout main

# 3. Sincronizar
git pull origin main
```

**Detalhes completos**: Consulte @Git/Sync.md

### 1.2 Verificar Branches

```bash
# Ver branches locais
git branch

# Ver branches remotos
git branch -r

# Limpar branches remotos deletados
git fetch --prune
```

### 1.3 Decidir o Trabalho do Dia

- Continuar branch existente?
- Iniciar nova funcionalidade?
- Corrigir bug?
- Revisar PRs?

## 2. INICIAR NOVA FUNCIONALIDADE

### 2.1 Sincronizar Main

```bash
# Garantir que está em main
git checkout main

# Sincronizar
git pull origin main
```

**Detalhes completos**: Consulte @Git/Sync.md

### 2.2 Criar Branch

```bash
# Criar branch seguindo convenções
git checkout -b feat/nome-da-funcionalidade

# Exemplos:
# git checkout -b feat/adicionar-login
# git checkout -b fix/corrigir-bug-importacao
# git checkout -b chore/atualizar-dependencias
```

**Detalhes completos**: Consulte @Git/Branch.md

### 2.3 Verificar Branch

```bash
# Confirmar que está no branch correto
git branch --show-current
```

## 3. DURANTE O TRABALHO

### 3.1 Fazer Alterações

Trabalhe normalmente nos arquivos. Use seu editor/IDE preferido.

### 3.2 Verificar Status Frequentemente

```bash
# Ver o que mudou
git status

# Ver diferenças detalhadas
git diff

# Ver diferenças de arquivos específicos
git diff arquivo.ts
```

### 3.3 Commits Frequentes e Pequenos

**Regra de Ouro**: Faça commits pequenos e frequentes, não um commit gigante no final.

```bash
# 1. Adicionar arquivos ao stage
git add arquivo1.ts arquivo2.ts

# OU adicionar todos os arquivos modificados
git add .

# 2. Verificar o que está no stage
git status

# 3. Fazer commit com mensagem descritiva
git commit -m "feat: adicionar validação de email

- Implementar regex para validação
- Adicionar mensagens de erro
- Criar testes unitários"
```

**Boas práticas de commit**:
- Mensagens claras e descritivas
- Um commit por mudança lógica
- Não commitar arquivos temporários
- Não commitar arquivos de configuração local (.env, etc)

**Detalhes completos**: Consulte @Commit.md

### 3.4 Verificar Histórico

```bash
# Ver commits do branch
git log --oneline

# Ver commits diferentes da main
git log main..HEAD --oneline
```

## 4. ANTES DE CRIAR PR

### 4.1 Sincronizar Branch com Main

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

### 4.2 Resolver Conflitos (se houver)

```bash
# Git avisará sobre conflitos
# Abrir arquivos e resolver manualmente
# Depois:

git add arquivo-resolvido.ts
git commit -m "fix: resolver conflitos com main"
```

**Detalhes completos**: Consulte @Git/Conflitos.md

### 4.3 Testar Tudo

Antes de criar PR, certifique-se de que:
- [ ] Código compila sem erros
- [ ] Testes passam (se houver)
- [ ] Funcionalidade funciona como esperado
- [ ] Não quebrou funcionalidades existentes

### 4.4 Push do Branch

```bash
# Enviar branch para GitHub
git push origin feat/seu-branch

# Se for primeira vez, use:
git push -u origin feat/seu-branch
```

### 4.5 Verificar Checklist

Consulte @Git/Checklist.md antes de criar PR.

## 5. CRIAR PR

### 5.1 Criar Pull Request no GitHub

1. Acesse o repositório no GitHub
2. Clique em "Pull requests" → "New pull request"
3. Selecione:
   - **Base**: `main`
   - **Compare**: `feat/seu-branch`
4. Preencha título e descrição
5. Clique em "Create pull request"

**Detalhes completos**: Consulte @Git/PR.md

### 5.2 Aguardar Revisão

- Responda comentários
- Faça ajustes se necessário
- **NÃO faça merge sem aprovação**

### 5.3 Fazer Ajustes (se necessário)

```bash
# 1. Fazer alterações
# ... editar arquivos ...

# 2. Commit
git add .
git commit -m "fix: ajustar conforme feedback"

# 3. Push
git push origin feat/seu-branch

# PR será atualizado automaticamente
```

## 6. APÓS APROVAÇÃO

### 6.1 Merge do PR

Após aprovação, fazer merge no GitHub:
- Clicar em "Merge pull request"
- Escolher método de merge
- Confirmar merge

**Detalhes completos**: Consulte @Commit.md

### 6.2 Sincronizar Main Local

```bash
# 1. Voltar para main
git checkout main

# 2. Sincronizar
git pull origin main

# 3. Verificar que seu merge está lá
git log --oneline -5
```

### 6.3 Limpar Branches

```bash
# Deletar branch local
git branch -d feat/seu-branch

# Deletar branch remoto (se ainda existir)
git push origin --delete feat/seu-branch
```

## Fluxo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    INÍCIO DO DIA                            │
│  git checkout main                                          │
│  git pull origin main                                       │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              INICIAR FUNCIONALIDADE                         │
│  git checkout -b feat/nova-funcionalidade                 │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              DURANTE O TRABALHO                             │
│  - Editar arquivos                                         │
│  - git add .                                               │
│  - git commit -m "mensagem"                                │
│  - (repetir conforme necessário)                           │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            ANTES DE CRIAR PR                                │
│  git fetch origin                                           │
│  git merge origin/main  (ou rebase)                        │
│  - Resolver conflitos se houver                            │
│  - Testar tudo                                             │
│  git push origin feat/nova-funcionalidade                   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              CRIAR PR                                       │
│  - Criar PR no GitHub                                       │
│  - Aguardar revisão                                        │
│  - Fazer ajustes se necessário                             │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            APÓS APROVAÇÃO                                    │
│  - Merge do PR no GitHub                                    │
│  git checkout main                                          │
│  git pull origin main                                       │
│  git branch -d feat/nova-funcionalidade                     │
└─────────────────────────────────────────────────────────────┘
```

## Comandos Rápidos por Situação

### Início do Dia

```bash
git checkout main
git pull origin main
```

### Iniciar Nova Funcionalidade

```bash
git checkout main
git pull origin main
git checkout -b feat/nome-funcionalidade
```

### Durante o Trabalho

```bash
git status                    # Ver o que mudou
git diff                      # Ver diferenças
git add .                     # Adicionar tudo
git commit -m "mensagem"      # Fazer commit
```

### Antes de Criar PR

```bash
git checkout feat/seu-branch
git fetch origin
git merge origin/main
# Resolver conflitos se houver
git push origin feat/seu-branch
```

### Após Merge de PR

```bash
git checkout main
git pull origin main
git branch -d feat/branch-mergeado
```

## Regras de Ouro

1. **SEMPRE** sincronize antes de começar
2. **SEMPRE** crie branch antes de trabalhar
3. **SEMPRE** faça commits frequentes e pequenos
4. **SEMPRE** sincronize branch antes de criar PR
5. **SEMPRE** teste antes de criar PR
6. **SEMPRE** crie PR antes de merge
7. **SEMPRE** aguarde aprovação antes de merge
8. **SEMPRE** sincronize main após merge
9. **SEMPRE** limpe branches após merge

## Troubleshooting

### "Esqueci de sincronizar antes de criar branch"

**Solução**:
```bash
# Sincronizar branch com main
git checkout feat/seu-branch
git fetch origin
git merge origin/main
# Resolver conflitos se houver
```

### "Fiz muitos commits, quero juntar"

**Solução**: Use interactive rebase (avançado)
```bash
git rebase -i HEAD~3  # Juntar últimos 3 commits
```

### "Preciso pausar trabalho atual e trabalhar em outro"

**Solução**: Use stash
```bash
git stash push -m "trabalho em progresso"
git checkout outro-branch
# Trabalhar...
git checkout branch-original
git stash pop
```

## Checklist Diário

### Início do Dia
- [ ] Sincronizei main (`git pull origin main`)
- [ ] Verifiquei branches locais
- [ ] Decidi o trabalho do dia

### Durante o Trabalho
- [ ] Fiz commits frequentes e pequenos
- [ ] Mensagens de commit são descritivas
- [ ] Não commitei arquivos temporários

### Antes de Criar PR
- [ ] Sincronizei branch com main
- [ ] Resolvi todos os conflitos
- [ ] Testei tudo
- [ ] Fiz push do branch
- [ ] Consultei checklist completo (@Git/Checklist.md)

### Após Merge
- [ ] Sincronizei main local
- [ ] Deletei branch local
- [ ] Deletei branch remoto (se necessário)

## Próximos Passos

- **Sincronização**: Consulte @Git/Sync.md
- **Branches**: Consulte @Git/Branch.md
- **Conflitos**: Consulte @Git/Conflitos.md
- **PRs**: Consulte @Git/PR.md
- **Commits**: Consulte @Commit.md

