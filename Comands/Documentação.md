# Objetivo
A partir do código e arquivos do projeto, produzir um **esqueleto de documento MIG apenas para um módulo específico**, em linguagem de negócio, com as seções 1 a 9 preenchidas no que for possível, e listar o que falta como **perguntas objetivas**.

Não é para gerar o documento final, e sim um **raio-X do módulo** para eu colar e completar na MIG.

---

# Escopo
- O **módulo-alvo** será informado na solicitação (nome + caminho, ex.: `Cadastro de Aluno – web/app/(aluno)/cadastro`).
- Focar a análise nesse módulo e nos pontos de integração dele com outros módulos/sistemas.
- Só citar o resto do sistema quando for relevante como integração ou dependência.

---

# Como agir (ordem obrigatória)

1) ENTENDIMENTO DO MÓDULO
   - Identificar:
     - Que “parte do negócio” esse módulo atende (ex.: cadastro, matrícula, financeiro, relacionamento).
     - Quem usa esse módulo (ex.: aluno, atendente, gestor, financeiro).
   - Basear-se em:
     - Rotas/páginas do módulo.
     - Componentes de UI do módulo.
     - Services/use-cases diretamente ligados ao módulo.
     - Schemas de dados usados por esse módulo.

2) LINGUAGEM
   - Escrever em **português (BR)** e em **linguagem de negócio**, não técnica.
   - Evitar nome de tabela/campo; quando precisar, traduzir: “validação de CPF”, “registro de matrícula”, etc.

3) PERGUNTAS
   - Tudo que depender de definição do cliente/negócio vira **pergunta objetiva**, curta.
   - Máx. **10 perguntas** por execução.

---

# Estrutura de saída (sempre estes títulos)

### 1. Identificação do Módulo e Contexto
- Nome do módulo (ex.: Cadastro de Aluno, Linha Editorial, Financeiro – Boletos).
- Caminho no projeto (pasta/rota principal).
- Usuários/áreas que parecem usar este módulo.
- Resumo do contexto de negócio (2–4 linhas): o que esse módulo resolve.

**Perguntas pendentes (se houver):**
- Ex.: Este módulo é usado por quais perfis (aluno, recepção, gestor, etc.)?
- Ex.: Ele é usado em todas as unidades/negócios ou só em parte?

---

### 2. Objetivos e Escopo do Módulo
**Objetivos de negócio inferidos (apenas deste módulo)**
- [ ] Objetivo 1…
- [ ] Objetivo 2…

**Escopo IN (coisas que o módulo claramente faz)**
- …

**Escopo OUT (coisas que não parecem ser responsabilidade dele)**
- …

**Perguntas pendentes:**
- Existem objetivos que o cliente considera críticos para este módulo?
- Algo que hoje é feito fora do sistema mas deveria vir para este módulo?

---

### 3. Visão Geral dos Processos de Negócio (do módulo)
Descrever em alto nível, em 1–3 parágrafos:
- Como o módulo é usado do começo ao fim.
- Ex.: “O atendente acessa o módulo de Cadastro de Aluno, registra dados básicos, associa a um plano, define forma de pagamento e confirma a matrícula...”

Falar **apenas dos processos onde este módulo é protagonista**.

**Perguntas pendentes:**
- Há passos do processo que são feitos fora do sistema (telefone, papel, planilha)?

---

### 4. Detalhamento dos Processos do Módulo
Para cada processo que passa por este módulo (4.1, 4.2, 4.3…):

#### 4.x Nome do Processo – [ex.: Cadastro de Aluno]
- **Descrição geral (negócio):** 2–4 linhas.
- **Etapas principais (happy path):**
  1. …
  2. …
  3. …
- **Entradas:** de onde vêm os dados (formulário, importação, integração).
- **Saídas:** o que fica pronto (registro criado, contrato, status, etc.).
- **Regras de negócio visíveis:** obrigatórios, validações, limites, permissões.
- **Integrações neste processo:** com outros módulos/sistemas.
- **Papéis envolvidos:** quem faz o quê.

Repetir para cada processo principal ligado ao módulo.

**Perguntas pendentes (por processo, se necessário):**
- Existem exceções frequentes (ex.: bloqueio por inadimplência, aluno menor, etc.) que não aparecem no código?

---

### 5. Cadastros e Configurações relacionados ao Módulo
Listar **apenas os cadastros/configs que este módulo usa ou alimenta**, por exemplo:

- Cadastro de Alunos – usado em: Cadastro, Matrícula, Onboarding.
- Planos/Serviços – usados ao definir plano de aluno.
- Tabelas de Categoria/Segmentação – usadas no módulo Linha Editorial.
- Parâmetros financeiros específicos deste módulo.

Para cada cadastro:
- Papel no negócio.
- Em quais processos deste módulo ele aparece.

**Perguntas pendentes:**
- Algum cadastro essencial é mantido fora do sistema (planilhas, ERP, etc.)?

---

### 6. Integrações do Módulo
Somente o que este módulo integra:

Para cada integração:
- **Nome:** Ex.: Módulo Cadastro → Supabase/DB, → ERP, → Gateway.
- **Objetivo de negócio:** ex.: “registrar cobrança recorrente”, “criar contrato no ERP”.
- **Quando acontece:** em qual etapa do processo.
- **Principais dados de negócio enviados/recebidos.**

**Perguntas pendentes:**
- Há integrações planejadas, mas ainda não implementadas, para este módulo?

---

### 7. Cronograma / Marcos deste Módulo (modelo)
Não inventar datas; apenas sugerir como **este módulo** se encaixa nas fases do projeto:

- Quando precisa estar pronto.
- Em que fase é testado com usuário.
- Quando entra em produção.

**Perguntas pendentes:**
- Existe alguma data crítica relacionada a este módulo (ex.: lançamento de campanha, início de semestre)?

---

### 8. Papéis e Responsabilidades relacionados ao Módulo
Listar papéis e responsabilidades **específicos deste módulo**:

- Quem é o “dono” do módulo no negócio.
- Quem opera no dia a dia.
- Quem aprova mudanças nele.
- Quem é responsável por dados e integrações ligados a esse módulo.

**Perguntas pendentes:**
- Quem é o responsável oficial por aprovar mudanças neste módulo?

---

### 9. Referências e Anexos relacionados ao Módulo
Listar:
- Arquivos do repo que podem virar anexo (fluxos, docs, testes que simulam processo real).
- Outras fontes que ajudam a completar a MIG deste módulo (se existirem).

---

### Lista Final de Perguntas para o Negócio (do módulo)
No final, **juntar todas as perguntas pendentes** num bloco único, numeradas, para eu responder com o cliente e depois completar a MIG deste módulo.
