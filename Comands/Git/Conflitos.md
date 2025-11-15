# Resolução de Conflitos

## Objetivo

Padronizar o processo de identificação e resolução de conflitos durante merge ou rebase, garantindo que as mudanças de todos os desenvolvedores sejam preservadas corretamente.

## Quando usar

Sempre que o Git reportar conflitos durante:
- `git merge`
- `git rebase`
- `git pull`
- Qualquer operação que tente combinar mudanças

## Referências

- @Git/Sync.md - Sincronização (onde conflitos geralmente aparecem)
- @Git/Workflow.md - Fluxo completo de trabalho
- @Git/Branch.md - Gerenciamento de branches

## Como Identificar Conflitos

### Durante Merge

```bash
git merge origin/main
```

**Saída indicando conflito**:
```
Auto-merging arquivo.ts
CONFLICT (content): Merge conflict in arquivo.ts
Automatic merge failed; fix conflicts and then commit the result.
```

### Durante Rebase

```bash
git rebase origin/main
```

**Saída indicando conflito**:
```
error: could not apply abc1234... commit message
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
```

### Verificar Arquivos com Conflito

```bash
# Ver status (arquivos com conflito aparecem como "both modified")
git status

# Listar apenas arquivos com conflito
git diff --name-only --diff-filter=U
```

## Como Resolver Conflitos

### Passo 1: Entender o Conflito

Abra o arquivo com conflito. Você verá marcadores especiais:

```typescript
<<<<<<< HEAD
// Seu código aqui (código do seu branch)
console.log("Minha mudança");
=======
// Código da main (ou outro branch)
console.log("Mudança de outra pessoa");
>>>>>>> origin/main
```

**Estrutura dos marcadores**:
- `<<<<<<< HEAD` - Início do seu código
- `=======` - Separador
- `>>>>>>> origin/main` - Fim do código do outro branch

### Passo 2: Decidir o que Manter

Você tem 4 opções:

#### Opção A: Manter Seu Código

Remova os marcadores e mantenha apenas seu código:

```typescript
// Resultado final
console.log("Minha mudança");
```

#### Opção B: Manter Código do Outro Branch

Remova os marcadores e mantenha apenas o código do outro branch:

```typescript
// Resultado final
console.log("Mudança de outra pessoa");
```

#### Opção C: Combinar Ambos

Mantenha ambos os códigos de forma lógica:

```typescript
// Resultado final
console.log("Minha mudança");
console.log("Mudança de outra pessoa");
```

#### Opção D: Reescrever Completamente

Crie uma solução melhor que combine as intenções:

```typescript
// Resultado final
console.log("Solução melhorada que combina ambas as mudanças");
```

### Passo 3: Remover Marcadores

**CRÍTICO**: Remova TODOS os marcadores de conflito (`<<<<<<<`, `=======`, `>>>>>>>`).

**Antes**:
```typescript
<<<<<<< HEAD
seu código
=======
código do outro
>>>>>>> origin/main
```

**Depois**:
```typescript
código resolvido
```

### Passo 4: Marcar como Resolvido

#### Se estiver fazendo Merge

```bash
# 1. Adicionar arquivo resolvido
git add arquivo-resolvido.ts

# 2. Verificar que não há mais conflitos
git status

# 3. Finalizar merge
git commit -m "fix: resolver conflitos com main"
```

#### Se estiver fazendo Rebase

```bash
# 1. Adicionar arquivo resolvido
git add arquivo-resolvido.ts

# 2. Continuar rebase
git rebase --continue

# Se houver mais conflitos, repita o processo
```

### Passo 5: Verificar Resolução

```bash
# Verificar que não há mais conflitos
git status

# Deve mostrar: "All conflicts fixed but you are still merging"
# (ou similar, dependendo da operação)
```

## Estratégias de Resolução

### Estratégia 1: Aceitar Mudanças Locais (Seu Código)

```bash
# Para um arquivo específico
git checkout --ours arquivo.ts
git add arquivo.ts

# Para todos os arquivos
git checkout --ours .
git add .
```

### Estratégia 2: Aceitar Mudanças Remotas (Código do Outro)

```bash
# Para um arquivo específico
git checkout --theirs arquivo.ts
git add arquivo.ts

# Para todos os arquivos
git checkout --theirs .
git add .
```

### Estratégia 3: Resolução Manual (Recomendado)

1. Abrir arquivo no editor
2. Analisar ambas as mudanças
3. Decidir o que manter/combinar
4. Remover marcadores
5. Adicionar ao stage

### Estratégia 4: Usar Ferramenta de Merge

```bash
# Abrir ferramenta visual de merge
git mergetool

# Configurar ferramenta (exemplo para VS Code)
git config --global merge.tool vscode
git config --global mergetool.vscode.cmd 'code --wait $MERGED'
```

## Exemplos Práticos

### Exemplo 1: Conflito Simples em Função

**Arquivo com conflito**:
```typescript
function calcularTotal(preco: number) {
<<<<<<< HEAD
    return preco * 1.1; // Adicionei taxa de 10%
=======
    return preco * 1.2; // Adicionei taxa de 20%
>>>>>>> origin/main
}
```

**Resolução (combinar lógica)**:
```typescript
function calcularTotal(preco: number) {
    // Usar taxa de 20% (mais recente)
    return preco * 1.2;
}
```

### Exemplo 2: Conflito em Importações

**Arquivo com conflito**:
```typescript
<<<<<<< HEAD
import { ComponentA, ComponentB } from './components';
=======
import { ComponentA, ComponentC } from './components';
>>>>>>> origin/main
```

**Resolução (combinar imports)**:
```typescript
import { ComponentA, ComponentB, ComponentC } from './components';
```

### Exemplo 3: Conflito em Arquivo Completo

**Situação**: Arquivo foi modificado de formas incompatíveis.

**Solução**:
1. Analisar ambas as versões
2. Entender a intenção de cada mudança
3. Reescrever combinando as intenções
4. Testar cuidadosamente

## Comandos Úteis

### Ver Conflitos

```bash
# Ver arquivos com conflito
git status

# Ver diferenças
git diff

# Ver apenas conflitos
git diff --check
```

### Abortar Operação

```bash
# Abortar merge
git merge --abort

# Abortar rebase
git rebase --abort
```

### Ver Histórico de Conflitos

```bash
# Ver commits que causaram conflito
git log --merge

# Ver gráfico de branches
git log --oneline --graph --all
```

## Prevenção de Conflitos

### 1. Sincronizar Frequentemente

```bash
# Sincronizar branch com main regularmente
git fetch origin
git merge origin/main
```

Consulte @Git/Sync.md

### 2. Commits Pequenos e Focados

- Um commit por mudança lógica
- Facilita resolução de conflitos
- Facilita revisão

### 3. Comunicação com Equipe

- Avise sobre mudanças grandes
- Coordene mudanças em arquivos compartilhados
- Use issues/PRs para discussão

### 4. Trabalhar em Arquivos Diferentes

- Quando possível, evite modificar os mesmos arquivos
- Divida responsabilidades claramente

## Troubleshooting

### Problema: "Não consigo resolver o conflito"

**Solução**:
1. Abortar operação: `git merge --abort` ou `git rebase --abort`
2. Sincronizar novamente: `git pull origin main`
3. Tentar novamente com mais cuidado
4. Pedir ajuda se necessário

### Problema: "Resolvi mas ainda aparece conflito"

**Solução**:
```bash
# Verificar se marcadores foram removidos
grep -r "<<<<<<< HEAD" arquivo.ts

# Se ainda houver marcadores, removê-los
# Depois adicionar arquivo
git add arquivo.ts
```

### Problema: "Muitos arquivos com conflito"

**Solução**:
1. Resolver um arquivo por vez
2. Testar após cada resolução
3. Fazer commit intermediário se necessário
4. Não tentar resolver tudo de uma vez

### Problema: "Conflito em arquivo binário"

**Solução**:
```bash
# Escolher uma versão
git checkout --ours arquivo.png
# OU
git checkout --theirs arquivo.png

git add arquivo.png
```

### Problema: "Conflito durante rebase"

**Solução**:
```bash
# Resolver conflito normalmente
git add arquivo-resolvido.ts

# Continuar rebase
git rebase --continue

# Se houver mais conflitos, repetir
```

## Checklist de Resolução

Antes de resolver:
- [ ] Entendi o que causou o conflito
- [ ] Analisei ambas as versões do código
- [ ] Decidi a estratégia de resolução

Durante resolução:
- [ ] Removi todos os marcadores de conflito
- [ ] Testei que o código resolve funciona
- [ ] Verifiquei que não quebrei funcionalidades

Após resolução:
- [ ] Adicionei arquivo ao stage (`git add`)
- [ ] Verifiquei status (`git status`)
- [ ] Finalizei merge/rebase
- [ ] Testei que tudo funciona

## Regras Obrigatórias

- **SEMPRE** remova todos os marcadores de conflito
- **SEMPRE** teste após resolver conflitos
- **SEMPRE** entenda ambas as mudanças antes de decidir
- **NUNCA** force uma resolução sem entender
- **SEMPRE** peça ajuda se não tiver certeza

## Próximos Passos

Após resolver conflitos:
- Se estava fazendo merge: Continue com @Git/Workflow.md
- Se estava fazendo rebase: Continue com `git rebase --continue`
- Se vai criar PR: Consulte @Git/PR.md
- Se precisa sincronizar: Consulte @Git/Sync.md

