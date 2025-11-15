# Protocolos Git/GitHub

Guia completo de protocolos para padronizar o fluxo de trabalho com Git/GitHub em equipe.

## Objetivo

Padronizar todos os processos relacionados ao Git/GitHub para garantir:
- Trabalho colaborativo sem conflitos
- Commits limpos e profissionais
- Pull Requests bem estruturados
- Sincronização eficiente entre desenvolvedores
- Resolução adequada de conflitos

## Fluxo de Trabalho Recomendado

```
┌─────────────────────────────────────────────────────────┐
│  SEQUÊNCIA CORRETA (SEMPRE NESTA ORDEM)                 │
└─────────────────────────────────────────────────────────┘

1. SYNC (sincronizar com o remoto)
   ↓ Consulte: @Git/Sync.md
   
2. BRANCH (criar branch a partir da main atualizada)
   ↓ Consulte: @Git/Branch.md
   
3. TRABALHAR (fazer suas alterações)
   ↓ Consulte: @Git/Workflow.md
   
4. COMMIT (salvar suas mudanças localmente)
   ↓ Consulte: @Commit.md
   
5. PUSH (enviar seu branch para o GitHub)
   ↓ Consulte: @Git/Workflow.md
   
6. PULL REQUEST (criar PR no GitHub)
   ↓ Consulte: @Git/PR.md
   
7. REVISÃO (aguardar aprovação)
   ↓ Consulte: @Git/PR.md
   
8. MERGE (após aprovação, merge na main)
   ↓ Consulte: @Commit.md
   
9. SYNC NOVAMENTE (atualizar sua main local)
   ↓ Consulte: @Git/Sync.md
```

## Protocolos Disponíveis

### 1. [Sync.md](Sync.md) - Sincronização com Remoto
**Quando usar**: Sempre antes de começar a trabalhar, ao final do dia, e antes de criar PR.

**O que cobre**:
- Como sincronizar com o remoto
- Verificações pré-sync
- Troubleshooting comum
- Comandos de sincronização

### 2. [Branch.md](Branch.md) - Gerenciamento de Branches
**Quando usar**: Sempre que for iniciar uma nova funcionalidade ou correção.

**O que cobre**:
- Convenções de nomenclatura
- Como criar branches
- Como gerenciar branches
- Quando deletar branches
- Boas práticas

### 3. [Workflow.md](Workflow.md) - Fluxo de Trabalho Diário
**Quando usar**: Guia principal para o dia a dia de desenvolvimento.

**O que cobre**:
- Fluxo completo passo a passo
- Início do dia
- Durante o trabalho
- Final do dia
- Integração com outros protocolos

### 4. [Conflitos.md](Conflitos.md) - Resolução de Conflitos
**Quando usar**: Quando houver conflitos durante merge ou rebase.

**O que cobre**:
- Como identificar conflitos
- Como resolver conflitos
- Estratégias de resolução
- Prevenção de conflitos

### 5. [PR.md](PR.md) - Pull Requests
**Quando usar**: Antes de fazer merge de qualquer branch para main.

**O que cobre**:
- Quando criar PR
- Como criar PR
- Template de descrição
- Processo de revisão
- Após aprovação

### 6. [Comandos.md](Comandos.md) - Referência Rápida
**Quando usar**: Consulta rápida de comandos Git.

**O que cobre**:
- Comandos por categoria
- Exemplos práticos
- Atalhos úteis

### 7. [Checklist.md](Checklist.md) - Checklists
**Quando usar**: Antes de criar PR, antes de fazer merge, ao sincronizar.

**O que cobre**:
- Checklist completo antes de PR
- Checklist de sincronização
- Checklist de merge
- Validações obrigatórias

## Protocolos Relacionados

- **@Commit.md** - Protocolo de commit e merge (na raiz de Comands/)
- **@Validar.md** - Validações antes de merge
- **@Seguranca.md** - Checagens de segurança

## Regras de Ouro

1. **NUNCA** commite diretamente na `main`
2. **SEMPRE** sincronize antes de começar
3. **SEMPRE** crie branch antes de trabalhar
4. **SEMPRE** crie PR antes de merge
5. **SEMPRE** aguarde aprovação antes de merge
6. **SEMPRE** sincronize seu branch antes de criar PR
7. **SEMPRE** teste antes de fazer push
8. **NUNCA** force push na `main`

## Fluxo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB (REMOTO)                          │
│                                                             │
│  main: [A]──[B]──[C]──[D]──[E]                            │
│         ↑                    ↑                             │
│         │                    │                             │
│    (antigo)            (mais recente)                      │
└─────────────────────────────────────────────────────────────┘
         │                    │
         │                    │
         │  git pull          │  git pull
         │                    │
┌────────▼────────────────────▼─────────────────────────────┐
│              SEU COMPUTADOR (LOCAL)                         │
│                                                             │
│  main local: [A]──[B]──[C]──[D]──[E]                     │
│                                                             │
│  seu-branch: [A]──[B]──[C]──[F]──[G]──[H]                 │
│                      ↑                    ↑                │
│                  (criado aqui)      (seus commits)         │
│                                                             │
│  git push → envia [F][G][H] para GitHub                   │
│  PR → solicita merge de [F][G][H] na main                  │
└─────────────────────────────────────────────────────────────┘
```

## Início Rápido

1. **Primeira vez trabalhando no projeto?**
   - Leia: [Workflow.md](Workflow.md)
   - Consulte: [Sync.md](Sync.md)

2. **Vai começar uma nova funcionalidade?**
   - Consulte: [Branch.md](Branch.md)
   - Siga: [Workflow.md](Workflow.md)

3. **Vai criar um PR?**
   - Consulte: [Checklist.md](Checklist.md)
   - Siga: [PR.md](PR.md)

4. **Teve conflito?**
   - Consulte: [Conflitos.md](Conflitos.md)

5. **Precisa de um comando rápido?**
   - Consulte: [Comandos.md](Comandos.md)

## Dúvidas Frequentes

**P: Posso trabalhar diretamente na main?**
R: NÃO. Sempre crie um branch. Consulte [Branch.md](Branch.md).

**P: Com que frequência devo sincronizar?**
R: Sempre antes de começar a trabalhar e antes de criar PR. Consulte [Sync.md](Sync.md).

**P: Como sei se há conflitos?**
R: Git avisará durante merge/rebase. Consulte [Conflitos.md](Conflitos.md).

**P: Posso fazer merge sem PR?**
R: NÃO. Sempre crie PR primeiro. Consulte [PR.md](PR.md).

**P: O que fazer se commitei na main por engano?**
R: Consulte [Branch.md](Branch.md) - seção "Problemas Comuns".

## Contribuindo

Se encontrar problemas ou tiver sugestões para melhorar os protocolos, discuta com a equipe antes de modificar.

