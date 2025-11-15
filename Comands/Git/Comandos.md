# Referência Rápida de Comandos Git

## Objetivo

Fornecer referência rápida de comandos Git mais usados, organizados por categoria, para consulta durante o trabalho.

## Quando usar

Sempre que precisar de um comando Git específico durante o trabalho diário.

## Referências

- @Git/Workflow.md - Fluxo completo que usa estes comandos
- @Git/Sync.md - Comandos de sincronização
- @Git/Branch.md - Comandos de branches
- @Git/Conflitos.md - Comandos para conflitos

## Comandos por Categoria

### Status e Informações

```bash
# Ver status do repositório
git status

# Ver branch atual
git branch --show-current

# Ver histórico de commits
git log

# Ver histórico resumido (uma linha por commit)
git log --oneline

# Ver histórico com gráfico
git log --oneline --graph --all

# Ver diferenças não commitadas
git diff

# Ver diferenças de arquivo específico
git diff arquivo.ts

# Ver diferenças no stage
git diff --staged

# Ver commits diferentes entre branches
git log branch1..branch2 --oneline
```

### Branches

```bash
# Listar branches locais
git branch

# Listar todos os branches (locais e remotos)
git branch -a

# Listar apenas branches remotos
git branch -r

# Criar branch
git branch nome-do-branch

# Criar e mudar para branch
git checkout -b nome-do-branch

# Mudar de branch
git checkout nome-do-branch

# OU (Git 2.23+)
git switch nome-do-branch

# Renomear branch atual
git branch -m novo-nome

# Deletar branch local
git branch -d nome-do-branch

# Forçar deleção de branch local
git branch -D nome-do-branch

# Deletar branch remoto
git push origin --delete nome-do-branch
```

### Sincronização

```bash
# Buscar mudanças do remoto (sem aplicar)
git fetch origin

# Buscar e aplicar mudanças
git pull origin main

# Enviar commits para remoto
git push origin nome-do-branch

# Enviar e configurar upstream (primeira vez)
git push -u origin nome-do-branch

# Forçar push (CUIDADO - use apenas se necessário)
git push --force-with-lease origin nome-do-branch

# Limpar referências de branches remotos deletados
git fetch --prune
```

### Commits

```bash
# Adicionar arquivo ao stage
git add arquivo.ts

# Adicionar todos os arquivos modificados
git add .

# Adicionar arquivos por padrão
git add *.ts

# Remover arquivo do stage
git reset arquivo.ts

# Fazer commit
git commit -m "mensagem do commit"

# Fazer commit com mensagem multi-linha
git commit -m "Título

Descrição detalhada
- Item 1
- Item 2"

# Corrigir último commit (mensagem ou adicionar arquivos)
git commit --amend

# Desfazer último commit (mantém mudanças)
git reset --soft HEAD~1

# Desfazer último commit (remove mudanças)
git reset --hard HEAD~1
```

### Desfazer Mudanças

```bash
# Descartar mudanças em arquivo não commitado
git restore arquivo.ts

# OU (versão antiga)
git checkout -- arquivo.ts

# Descartar todas as mudanças não commitadas
git restore .

# Remover arquivo do stage
git restore --staged arquivo.ts

# Desfazer último commit mantendo mudanças
git reset --soft HEAD~1

# Desfazer últimos N commits mantendo mudanças
git reset --soft HEAD~N
```

### Stash (Guardar Temporariamente)

```bash
# Guardar mudanças temporariamente
git stash push -m "descrição"

# OU simplesmente
git stash

# Listar stashes
git stash list

# Aplicar último stash
git stash pop

# Aplicar stash específico
git stash apply stash@{0}

# Deletar stash
git stash drop stash@{0}

# Limpar todos os stashes
git stash clear
```

### Merge e Rebase

```bash
# Fazer merge de branch
git merge nome-do-branch

# Fazer merge de remoto
git merge origin/main

# Abortar merge em andamento
git merge --abort

# Fazer rebase
git rebase nome-do-branch

# Fazer rebase interativo (últimos N commits)
git rebase -i HEAD~N

# Continuar rebase após resolver conflitos
git rebase --continue

# Abortar rebase
git rebase --abort
```

### Conflitos

```bash
# Ver arquivos com conflito
git status

# Listar apenas arquivos com conflito
git diff --name-only --diff-filter=U

# Aceitar versão local (seu código)
git checkout --ours arquivo.ts

# Aceitar versão remota (código do outro)
git checkout --theirs arquivo.ts

# Verificar conflitos
git diff --check
```

### Histórico

```bash
# Ver histórico completo
git log

# Ver histórico resumido
git log --oneline

# Ver histórico com gráfico
git log --graph --oneline --all

# Ver histórico de arquivo específico
git log -- arquivo.ts

# Ver commits diferentes entre branches
git log branch1..branch2

# Ver commits que causaram conflito
git log --merge

# Ver mudanças de um commit
git show hash-do-commit
```

### Remoto

```bash
# Ver remotos configurados
git remote -v

# Adicionar remoto
git remote add nome url

# Remover remoto
git remote remove nome

# Atualizar URL do remoto
git remote set-url nome nova-url
```

### Tags

```bash
# Listar tags
git tag

# Criar tag
git tag v1.0.0

# Criar tag anotada
git tag -a v1.0.0 -m "Release versão 1.0.0"

# Enviar tag para remoto
git push origin v1.0.0

# Enviar todas as tags
git push origin --tags

# Deletar tag local
git tag -d v1.0.0

# Deletar tag remota
git push origin --delete v1.0.0
```

### Configuração

```bash
# Ver configurações
git config --list

# Configurar nome
git config --global user.name "Seu Nome"

# Configurar email
git config --global user.email "seu@email.com"

# Configurar editor padrão
git config --global core.editor "code --wait"

# Configurar ferramenta de merge
git config --global merge.tool vscode
```

### Limpeza

```bash
# Limpar arquivos não rastreados
git clean -n  # Preview (dry-run)
git clean -f  # Forçar limpeza

# Limpar arquivos e diretórios
git clean -fd

# Limpar referências
git gc --prune=now
```

## Sequências de Comandos Comuns

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
git status
git diff
git add .
git commit -m "feat: descrição"
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

### Resolver Conflito

```bash
# Durante merge/rebase
# ... editar arquivos ...
git add arquivo-resolvido.ts
git commit -m "fix: resolver conflitos"
# OU se for rebase:
git rebase --continue
```

## Atalhos Úteis

### Aliases (Configurar uma vez)

```bash
# Configurar aliases úteis
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'
```

**Depois pode usar**:
```bash
git st    # ao invés de git status
git co    # ao invés de git checkout
git br    # ao invés de git branch
git ci    # ao invés de git commit
```

### Comandos Rápidos

```bash
# Ver último commit
git log -1

# Ver mudanças do último commit
git show

# Ver quem modificou arquivo
git blame arquivo.ts

# Ver diferenças entre dois commits
git diff hash1 hash2

# Ver arquivos de um commit
git show --name-only hash
```

## Comandos por Situação

### "Preciso ver o que mudei"

```bash
git status
git diff
```

### "Preciso desfazer mudanças"

```bash
git restore arquivo.ts        # Descartar mudanças
git restore --staged arquivo.ts  # Remover do stage
```

### "Preciso pausar trabalho atual"

```bash
git stash push -m "trabalho em progresso"
# Trabalhar em outra coisa
git stash pop
```

### "Preciso ver histórico"

```bash
git log --oneline
git log --graph --all
```

### "Preciso sincronizar"

```bash
git fetch origin
git pull origin main
```

### "Preciso criar branch"

```bash
git checkout -b feat/nome-branch
```

### "Preciso ver diferenças entre branches"

```bash
git diff branch1..branch2
git log branch1..branch2 --oneline
```

## Comandos Avançados (Use com Cuidado)

```bash
# Reset completo (CUIDADO - apaga tudo)
git reset --hard origin/main

# Force push (CUIDADO - pode sobrescrever trabalho de outros)
git push --force origin branch

# Force push seguro (recomendado)
git push --force-with-lease origin branch

# Rebase interativo (avançado)
git rebase -i HEAD~N

# Cherry-pick (aplicar commit específico)
git cherry-pick hash-do-commit
```

## Dicas

1. **Use `git status` frequentemente** - Mantém você informado
2. **Use `git diff` antes de commit** - Veja o que vai commitar
3. **Use `--dry-run` quando disponível** - Veja o que vai acontecer
4. **Use `git log` para entender histórico** - Ajuda a entender mudanças
5. **Configure aliases** - Acelera trabalho diário

## Próximos Passos

- Para fluxo completo: Consulte @Git/Workflow.md
- Para sincronização: Consulte @Git/Sync.md
- Para branches: Consulte @Git/Branch.md
- Para conflitos: Consulte @Git/Conflitos.md

