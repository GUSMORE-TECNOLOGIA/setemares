# MIG – Metodologia de Implantação Global (visão para a IA)

## O que é a MIG
A MIG é o **padrão interno de documentação de projetos** de desenvolvimento de sistemas da empresa.
Ela é inspirada na metodologia TOTVS (MIT), especialmente no MIT041 (Especificação de Processos).

Para você, IA, sempre que eu falar em MIG, entenda como:
> Um documento “guia do projeto” em **linguagem de negócio**, que descreve
> COMO os processos vão funcionar no sistema, do ponto de vista do cliente,
> e que serve de base para configuração, desenvolvimento, testes e implantação.

A MIG:
- centraliza tudo em **um documento de referência**;
- é focada em **processos de negócio**, não em código;
- compara quando preciso o **as-is** (como é hoje) e o **to-be** (como será implantado);
- é reutilizável para vários projetos, mudando só o conteúdo, não a estrutura.

---

## Princípios da MIG (sempre seguir)

1) **Linguagem de negócio, não técnica**
   - Falar como o usuário fala (Aluno, Matrícula, Personal, Financeiro…).
   - Evitar nomes de tabelas, colunas, funções técnicas.
   - Se citar algo técnico, TRADUZIR para o que aquilo significa no processo.

2) **Foco em processos e fluxos**
   - Explicar o que acontece do ponto de vista do negócio:
     - quem faz o quê,
     - em que ordem,
     - com quais dados,
     - para chegar em qual resultado.
   - O código é só fonte de informação para entender o processo.

3) **Visão “to-be” (como será implantado)**
   - A MIG descreve o processo **como deve funcionar** no sistema implantado.
   - Pode mencionar o “como é hoje” (as-is) só para comparação, quando ajudar.

4) **Documento único e vivo**
   - A MIG é o **roteiro oficial** do projeto:
     - base para configurar o sistema,
     - base para criar cenários de teste,
     - base para treinar usuários.
   - Se o processo mudar, a MIG deve ser atualizada.

5) **Clareza e simplicidade**
   - Focar no **fluxo ideal (happy path)**.
   - Exceções importantes podem ser citadas, mas sem poluir o fluxo principal.
   - Textos curtos, objetivos e organizados em seções numeradas.

---

## Estrutura padrão da MIG (visão geral)

Quando eu pedir MIG (ou esqueleto de MIG), considere que o documento final terá, em geral, estas seções:

1. **Identificação do Projeto e Contexto**  
   – Quem é o projeto, para quem é, por quê existe, qual problema resolve.

2. **Objetivos e Escopo do Projeto**  
   – O que o projeto pretende atingir (objetivos de negócio) e o que está dentro/fora do escopo.

3. **Visão Geral dos Processos de Negócio**  
   – Resumo em alto nível do fluxo “do início ao fim”.

4. **Detalhamento dos Processos de Negócio**  
   – Cada processo com suas etapas, entradas, saídas, regras, integrações e papéis envolvidos.

5. **Cadastros e Configurações Principais**  
   – Quais cadastros/configs são necessários para o sistema funcionar (alunos, planos, parâmetros financeiros, etc.).

6. **Integrações Previstas**  
   – Com quais sistemas/módulos o projeto conversa, para quê, quando e com quais dados de negócio.

7. **Cronograma Resumido do Projeto**  
   – Visão macro de fases e marcos (levantamento, MIG, desenvolvimento, testes, go-live).

8. **Papéis e Responsabilidades da Equipe**  
   – Quem são os papéis (não necessariamente pessoas) e o que cada um responde no projeto.

9. **Referências e Anexos**  
   – Outros docs, diagramas, planilhas, prints, etc. que complementam a MIG.

Nos prompts específicos (ex.: `@doc_modulo`) eu posso pedir apenas um **esqueleto por módulo**, mas
SEM perder essa lógica de MIG.

---

## Como você (IA) deve usar essa visão

Quando eu mencionar MIG e usar este arquivo em conjunto com outro (ex.: `@doc_modulo`):

- Pense sempre em **documento de negócios**, não em especificação técnica.
- Use o código do sistema apenas como fonte para:
  - descobrir processos,
  - descobrir cadastros,
  - descobrir integrações,
  - descobrir regras de negócio.
- Entregue o resultado com:
  - seções numeradas,
  - texto em português claro,
  - exemplos em linguagem simples.

Se algo importante não puder ser deduzido pelo código:
- NÃO inventar.
- Marcar como **PENDENTE** e transformar em **pergunta objetiva** que eu possa responder depois.

---

## Limites

- Não gerar MIG “completa” fingindo que conhece o cliente: respeitar o que o código mostra.
- Não transformar MIG em manual técnico de API ou descrição de tabelas.
- Não misturar detalhes demais de UX/UI – citar apenas o necessário para explicar o processo de negócio.

