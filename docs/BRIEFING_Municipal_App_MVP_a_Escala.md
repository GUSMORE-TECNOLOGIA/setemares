### Guia de Aplicativo Municipal: MVP à Escala — Briefing Detalhado

Este documento organiza, em formato operacional, o conteúdo do “Guia de Aplicativo Municipal: MVP à Escala”, destacando objetivos, escopo, arquitetura, conformidade e próximos passos para execução acelerada com segurança e governança.

### 1) Objetivo e Benefícios
- **Objetivo**: Facilitar o relacionamento cidadão–prefeitura com um canal único multi-dispositivos.
- **Benefícios para o cidadão**: abrir solicitações de zeladoria com foto/geo; consultar e pagar tributos (Pix); acessar serviços/ofícios; participar (ouvidoria/LAI, orçamento participativo); receber alertas; acompanhar status em tempo real.
- **Benefícios para a prefeitura**: eficiência operacional (painel, SLA, métricas); integrações com sistemas legados; redução de filas/chamadas; dados para auditoria; conformidade com LGPD/acessibilidade.

### 2) Personas
- **Cidadão (18–70+)**: registra demandas, consulta tributos, recebe avisos.
- **Atendente 156/Protocolo**: triagem, cadastro assistido, respostas padrão.
- **Gestor de Secretaria** (Obras, Limpeza, Iluminação, Saúde, Fazenda): filas, prazos, equipes, OS.
- **Controladoria/Ouvidoria**: LAI, manifestações, prazos legais, relatórios.
- **Administrador de TI**: usuários, perfis, integrações, auditoria e observabilidade.

### 3) MVP (0–90 dias)
- **Zeladoria Urbana**: abertura com foto/geo (offline-friendly), status e avaliação.
- **Ouvidoria/LAI**: protocolo, prazos, templates de resposta, anexos (e-SIC compatível).
- **Tributos**: consulta 2ª via (IPTU/ISS/ITBI) e pagamento Pix (QR estático/dinâmico) com baixa automática via webhook.
- **Notícias/Alertas**: push segmentado por bairro/tema; Defesa Civil/saúde.
- **Transparência/Diário Oficial**: links e busca mobile-friendly.
- Fora do MVP imediato: agendamentos, saúde (e-SUS), mapas de obras, orçamento participativo completo, chat/assistente, turismo/eventos.

### 4) Roadmap sugerido (12 semanas)
- **Sem 1–2 — Descoberta & Setup**: validação de categorias/SLAs; acesso a sistemas fiscais/SEI/1Doc; provisionamento cloud; CI/CD; SSO gov.br (OIDC) bronze+ fallback CPF+SMS.
- **Sem 3–6 — Zeladoria 360 + Ouvidoria/LAI**: apps citizen (Expo/Flutter) + web admin (Next.js); triagem; OS; prazos; templates.
- **Sem 7–9 — Tributos + Pix + Conteúdo**: consulta/segunda via; Pix dinâmico c/ webhook; CMS leve; push notifications.
- **Sem 10–11 — End-to-end & Hardening**: testes e2e; observabilidade; backup/restore; RLS; auditoria; A11y (WCAG 2.1 AA).
- **Sem 12 — Piloto & Go-live**: piloto controlado, métricas e correções rápidas.

### 5) Arquitetura de Referência
- **Apps**: Mobile (React Native/Expo ou Flutter); Web Admin (Next.js/React).
- **Backend**: Node.js (NestJS) REST/GraphQL; **PostgreSQL** com RLS e auditoria; Storage S3-compatible; filas/jobs (Redis + BullMQ).
- **Autenticação**: OpenID Connect (gov.br bronze/prata/ouro) + fallback CPF+SMS.
- **Notificações**: FCM/APNs, e-mail SMTP, SMS.
- **Infra**: Docker; Terraform; métricas (Prometheus/Grafana); erros (Sentry); logs estruturados; CDN para ativos públicos.
- **Multi-tenant**: schema por município OU coluna `tenant_id` + políticas RLS. Auditoria por tenant e usuário.

### 6) Segurança, LGPD e Acessibilidade
- **Papéis LGPD**: Prefeitura (Controladora); Fornecedor/Produto (Operador).
- **Base legal**: execução de políticas públicas/interesse legítimo; consentimento apenas para marketing/opcional.
- **Princípios**: minimização, retenção, acesso, correção, portabilidade, eliminação.
- **Recursos**: gestão de consentimento; trilhas de auditoria; DPO/encarregado; PIA; registros ROPA; política de incidentes; criptografia at-rest/in-transit.
- **Assinatura Digital**: ICP-Brasil quando aplicável (LAI/atos oficiais).
- **A11y**: WCAG 2.1 AA (contraste, foco, labels/aria, leitura por voz, Libras orientativa, formulários curtos, offline-first onde aplicável).

### 7) Domínios & Fluxos (alto nível)
- **Zeladoria 360**: catálogo de serviços; abertura com foto/geo; anti-duplicidade (“Juntar-se”); triagem (OCR poste/risco); execução com OS; encerramento com avaliação; reabertura; omnicanal (App/Web/WhatsApp/156/totens).
- **Ouvidoria/LAI**: manifestações e PAI com prazos legais, templates e relatórios.
- **Tributos + Pix**: consulta por inscrição/CPF/CNPJ; Pix dinâmico; conciliação via webhook; histórico.
- **Notícias/Alertas**: CMS e push com quiet hours.

### 8) Modelo de Dados (base)
- Núcleo multi-tenant: `tenant`, `user`, `role`, `audit_log`.
- Cidadão e protocolo: `citizen`, `request`, `request_comment`, `attachment`, `category`, `department`.
- Zeladoria 360: `crew`, `work_order`, `duplicate_cluster`, `pickup_booking`, `external_forward`.
- Tributos/Pagamentos: `tax_bill`, `payment`, `payment_webhook_log`.
- Regras: habilitar **RLS por `tenant_id`** e papéis; índices por chaves naturais; soft-delete onde aplicável.

### 9) API & Web Admin
- **API REST/GraphQL**: auth; categorias; solicitações (abrir, listar, comentar, anexar); tributos (consulta, gerar Pix, webhook); notícias/alertas.
- **Admin Web**: visão geral (heatmap/contagens); fila por secretaria (kanban); OS (checklists/fotos); Ouvidoria/LAI (prazos); Tributos (arrecadação Pix); Conteúdo; Admin (usuários/perfis/auditoria/integradores).

### 10) Integrações
gov.br (OIDC), OpenStreetMap/Mapbox, SEI/1Doc, fiscal municipal, e-mail/SMS/WhatsApp Business, Defesa Civil.

### 11) OKRs (exemplos)
- **Eficiência**: redução do TMA por categoria; >80% no SLA priorizado.
- **Adoção**: MAU/WAU; cadastros por bairro; taxa de abertura por push.
- **Satisfação**: CSAT/NPS pós-atendimento.
- **Economia**: redução de ligações 156/filas.

### 12) Governança, Operação e Licenciamento
- CAT/SLAs; catálogo de serviços; janelas de manutenção; pentest semestral; backup diário; DR; DPA; ROPA; trilhas de auditoria; treinamento.
- **Licenciamento sugerido**: SaaS por faixa populacional + implantação; serviços adicionais (integrações/migrações/suporte premium).

### 13) Termo de Referência (rascunho)
- Objeto: solução digital integrada (módulos do MVP, LGPD, A11y, relatórios, SLA 99,5%/mês).
- Critérios de medição e níveis de serviço alinhados a SLAs e OKRs.

### 14) UI/UX e Backlog inicial
- **Telas essenciais**: Onboarding/consentimento LGPD; Home; Abrir Solicitação (fluxo guiado); Minha Solicitação (linha do tempo/avaliação); Tributos; Notícias/Alertas.
- **Backlog técnico**: monorepo; Auth OIDC; Zeladoria/LAI; Tributos/Pix; push; CMS; observabilidade; backups; testes e2e.

### 15) Critérios de Aceite (MVP)
- Zeladoria: abrir em <30s com foto/geo; status público com número de protocolo; avaliação pós-encerramento; anti-duplicidade.
- LAI: prazos legais por tipo; templates versionados; export CSV/JSON por período.
- Tributos: gerar Pix dinâmico; registrar confirmação em <3s após webhook; conciliação visível no admin.
- Push: segmentação por bairro/tema; opt-in/opt-out; quiet hours configuráveis.
- LGPD/A11y: consentimentos rastreáveis; WCAG AA validada em páginas-chave; auditoria por evento sensível.

### 16) Riscos & Mitigações
- Integrações fiscais/governamentais atrasadas → contrato prevendo sandbox e cronograma; mocks temporários.
- Adoção baixa → campanhas com QR em pontos da cidade; gamificação leve; métricas de engajamento.
- Carga sazonal (tributos) → autoscaling; filas; cache; testes de carga.

### 17) Observabilidade e SRE
- Métricas (Prometheus/Grafana); erros (Sentry); tracing distribuído; logs estruturados por tenant; playbooks de incidente; RTO/RPO; testes de backup/restore.

### 18) Próximos Passos Ação
- Selecionar prefeitura piloto e confirmar catálogo/SLAs.
- Definir provedor Pix e acesso ao sistema fiscal.
- Mapear integrações (SEI/1Doc/e-SIC) e obter credenciais.
- Provisionar dev/stage/prod com CI/CD; repositório inicial; ADRs para escolhas críticas.
- Iniciar execução conforme roadmap 12 semanas.


