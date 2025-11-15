# Checklists Git/GitHub

## Objetivo

Fornecer checklists completos para garantir que todos os processos sejam executados corretamente, evitando erros e conflitos.

## Quando usar

Antes de executar operações críticas:
- Antes de criar Pull Request
- Antes de fazer merge
- Ao sincronizar
- Ao criar branch

## Referências

- @Git/Workflow.md - Fluxo completo de trabalho
- @Git/PR.md - Criação de Pull Requests
- @Git/Sync.md - Sincronização
- @Git/Branch.md - Criação de branches
- @Commit.md - Protocolo de commit

## Checklist: Antes de Criar Pull Request

### Preparação do Branch

- [ ] Estou no branch correto (`git branch --show-current`)
- [ ] Sincronizei branch com main (`git fetch origin` + `git merge origin/main`)
- [ ] Resolvi todos os conflitos (se houver)
- [ ] Fiz push do branch atualizado (`git push origin feat/branch`)

### Validação do Código

- [ ] Código compila sem erros
- [ ] Testes passam (se houver testes)
- [ ] Funcionalidade foi testada manualmente
- [ ] Não quebrou funcionalidades existentes
- [ ] Lint passa (se aplicável)
- [ ] Não há console.logs ou código de debug esquecido

### Commits

- [ ] Commits têm mensagens descritivas
- [ ] Commits são lógicos (um commit por mudança)
- [ ] Não há commits de arquivos temporários
- [ ] Não há commits de arquivos de configuração local (.env, etc)
- [ ] Encoding verificado - SEM MOJIBAKE

### Descrição do PR

- [ ] Título do PR é claro e descritivo
- [ ] Descrição explica o "por quê" e não apenas o "o quê"
- [ ] Lista todas as mudanças principais
- [ ] Inclui instruções de como testar
- [ ] Inclui screenshots se houver mudanças visuais
- [ ] Referencia issues relacionadas (se houver)

### Verificações Finais

- [ ] Branch está atualizado com main
- [ ] Não há conflitos pendentes
- [ ] Todos os arquivos necessários foram commitados
- [ ] PR está pronto para revisão

## Checklist: Antes de Fazer Merge

### Validações do PR

- [ ] PR foi aprovado por pelo menos um revisor
- [ ] Todos os comentários foram respondidos
- [ ] Todas as solicitações de mudança foram atendidas
- [ ] CI/CD passou (se aplicável)
- [ ] Não há conflitos no PR

### Verificações Locais

- [ ] Main local está sincronizada (`git pull origin main`)
- [ ] Entendi todas as mudanças que serão mergeadas
- [ ] Testei localmente (se necessário)

### Após Merge

- [ ] Merge foi feito no GitHub
- [ ] Main local foi sincronizada (`git pull origin main`)
- [ ] Branch local foi deletado (`git branch -d feat/branch`)
- [ ] Branch remoto foi deletado (se necessário)

## Checklist: Sincronização

### Antes de Sincronizar

- [ ] Verifiquei em qual branch estou
- [ ] Verifiquei se há mudanças não commitadas (`git status`)
- [ ] Decidi o que fazer com mudanças não commitadas:
  - [ ] Fazer commit
  - [ ] Fazer stash
  - [ ] Descartar (se não importantes)

### Durante Sincronização

- [ ] Executei `git fetch origin`
- [ ] Verifiquei diferenças (`git log HEAD..origin/main`)
- [ ] Executei `git pull origin main`
- [ ] Resolvi conflitos se houver (consulte @Git/Conflitos.md)

### Após Sincronização

- [ ] Verifiquei que está sincronizado (`git status`)
- [ ] Testei que o código ainda funciona
- [ ] Posso continuar trabalhando

## Checklist: Criação de Branch

### Antes de Criar Branch

- [ ] Sincronizei main (`git pull origin main`)
- [ ] Verifiquei que não há mudanças não commitadas
- [ ] Escolhi nome descritivo seguindo convenções
- [ ] Decidi o tipo correto (feat/fix/chore/etc)

### Ao Criar Branch

- [ ] Criei branch a partir da main atualizada
- [ ] Verifiquei que estou no branch correto
- [ ] Posso começar a trabalhar

## Checklist: Resolução de Conflitos

### Antes de Resolver

- [ ] Entendi o que causou o conflito
- [ ] Analisei ambas as versões do código
- [ ] Decidi a estratégia de resolução

### Durante Resolução

- [ ] Removi todos os marcadores de conflito (`<<<<<<<`, `=======`, `>>>>>>>`)
- [ ] Testei que o código resolvido funciona
- [ ] Verifiquei que não quebrei funcionalidades

### Após Resolução

- [ ] Adicionei arquivo ao stage (`git add arquivo.ts`)
- [ ] Verifiquei status (`git status`)
- [ ] Finalizei merge/rebase
- [ ] Testei que tudo funciona

## Checklist: Início do Dia

### Preparação

- [ ] Sincronizei main (`git checkout main` + `git pull origin main`)
- [ ] Verifiquei branches locais (`git branch`)
- [ ] Limpei branches remotos deletados (`git fetch --prune`)
- [ ] Decidi o trabalho do dia

### Se Vai Continuar Branch Existente

- [ ] Mudei para o branch (`git checkout feat/branch`)
- [ ] Sincronizei branch com main (`git merge origin/main`)
- [ ] Resolvi conflitos se houver
- [ ] Posso continuar trabalhando

### Se Vai Criar Novo Branch

- [ ] Sincronizei main
- [ ] Criei branch (`git checkout -b feat/nome`)
- [ ] Verifiquei que estou no branch correto
- [ ] Posso começar a trabalhar

## Checklist: Durante o Trabalho

### Antes de Fazer Commit

- [ ] Verifiquei o que mudou (`git status`)
- [ ] Revisei as mudanças (`git diff`)
- [ ] Escolhi apenas arquivos relevantes para commit
- [ ] Não incluí arquivos temporários ou de configuração local

### Ao Fazer Commit

- [ ] Mensagem de commit é clara e descritiva
- [ ] Commit é lógico (uma mudança por commit)
- [ ] Adicionei arquivos ao stage (`git add`)
- [ ] Fiz commit (`git commit -m "mensagem"`)

### Verificações Periódicas

- [ ] Verifico status frequentemente (`git status`)
- [ ] Faço commits pequenos e frequentes
- [ ] Mantenho branch atualizado com main (periodicamente)

## Checklist: Final do Dia

### Antes de Encerrar

- [ ] Fiz commit de todo trabalho importante
- [ ] Fiz push do branch (`git push origin feat/branch`)
- [ ] Ou fiz stash se trabalho não está pronto (`git stash`)
- [ ] Anotei o que estava fazendo (para continuar depois)

### Se Branch Está Pronto para PR

- [ ] Sincronizei branch com main
- [ ] Resolvi todos os conflitos
- [ ] Testei tudo
- [ ] Criei PR (consulte @Git/PR.md)

## Checklist: Encoding (Mojibake)

### Antes de Commit

- [ ] Mensagem de commit não contém mojibake
- [ ] Arquivos modificados não contêm mojibake
- [ ] Terminal está configurado para UTF-8
- [ ] Git está configurado para usar UTF-8

### Verificação de Mojibake

```bash
# Verificar mensagem de commit
git log -1 --pretty=format:"%s" | grep -E "(Ã|Â|â€)" && echo "MOJIBAKE!" || echo "OK"

# Verificar arquivos
git diff --cached | grep -E "(Ã|Â|â€)" && echo "MOJIBAKE!" || echo "OK"
```

### Se Mojibake For Detectado

- [ ] **NÃO fazer commit**
- [ ] Corrigir encoding dos arquivos
- [ ] Verificar novamente
- [ ] Fazer commit apenas após correção

## Checklist: Após Merge de PR

### Sincronização

- [ ] Voltei para main (`git checkout main`)
- [ ] Sincronizei main (`git pull origin main`)
- [ ] Verifiquei que meu merge está lá (`git log --oneline -5`)

### Limpeza

- [ ] Deletei branch local (`git branch -d feat/branch`)
- [ ] Deletei branch remoto se necessário (`git push origin --delete feat/branch`)
- [ ] Limpei referências (`git fetch --prune`)

### Próximo Trabalho

- [ ] Decidi próximo trabalho
- [ ] Posso começar novo branch ou continuar trabalho existente

## Checklist: Validações de Segurança

### Antes de Commit

- [ ] Não commitei credenciais ou senhas
- [ ] Não commitei arquivos `.env` com dados sensíveis
- [ ] Não commitei chaves privadas
- [ ] Não commitei tokens de API

### Antes de Push

- [ ] Revisei commits que serão enviados (`git log origin/branch..HEAD`)
- [ ] Não há informações sensíveis nos commits
- [ ] Posso fazer push com segurança

## Checklist: Validações de Qualidade

### Código

- [ ] Código segue padrões do projeto
- [ ] Não há código comentado desnecessário
- [ ] Não há console.logs esquecidos
- [ ] Código está bem formatado

### Testes

- [ ] Testes passam (se houver)
- [ ] Cobertura de testes adequada (se aplicável)
- [ ] Testes manuais foram executados

### Documentação

- [ ] Código está documentado (se necessário)
- [ ] README atualizado (se aplicável)
- [ ] Comentários explicam lógica complexa

## Checklist Resumido: Fluxo Completo

### Início → PR

- [ ] Sync main
- [ ] Criar branch
- [ ] Trabalhar
- [ ] Commits frequentes
- [ ] Sync branch com main
- [ ] Resolver conflitos
- [ ] Testar tudo
- [ ] Push branch
- [ ] Criar PR

### PR → Merge

- [ ] PR aprovado
- [ ] Comentários respondidos
- [ ] Mudanças feitas (se necessário)
- [ ] Merge no GitHub
- [ ] Sync main local
- [ ] Limpar branches

## Regras de Ouro

1. **NUNCA** pule itens do checklist
2. **SEMPRE** verifique antes de commitar
3. **SEMPRE** teste antes de criar PR
4. **SEMPRE** sincronize antes de trabalhar
5. **SEMPRE** aguarde aprovação antes de merge

## Próximos Passos

- Para fluxo completo: Consulte @Git/Workflow.md
- Para criar PR: Consulte @Git/PR.md
- Para sincronizar: Consulte @Git/Sync.md
- Para branches: Consulte @Git/Branch.md

