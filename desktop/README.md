# 7Mares Cotador - Sistema de Cotações Aéreas

Sistema moderno para processamento e geração de cotações aéreas com base em PNRs (Passenger Name Records).

## 🚀 Características Principais

- **Processamento de PNR**: Suporte a PNRs simples e complexos com múltiplas opções
- **Geração de PDF**: Criação automática de PDFs profissionais com layout otimizado
- **Engine de Preços**: Cálculo automático de RAV e taxas
- **Interface Moderna**: Design system com tema claro/escuro e acessibilidade completa
- **Performance**: Code-splitting, lazy loading e otimizações de bundle
- **Segurança**: RLS (Row Level Security) no Supabase e headers de segurança

## 🛠️ Tecnologias

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Node.js
- **Database**: Supabase (PostgreSQL)
- **PDF**: @react-pdf/renderer
- **UI**: Radix UI, Lucide React
- **Validação**: Zod, React Hook Form

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Supabase

### Setup Rápido (≤ 30 min)

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd desktop
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   ```
   
   Edite o `.env` com suas credenciais:
   ```env
   VITE_SUPABASE_URL=sua_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```

4. **Configure o banco de dados**
   ```bash
   # Execute as migrações
   node scripts/database-migration.js apply enable_rls_and_add_indexes
   ```

5. **Execute o projeto**
   ```bash
   # Desenvolvimento
   npm run dev
   
   # Servidor backend
   npm run server
   ```

6. **Acesse a aplicação**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## 🎯 Como Usar

### Processamento de PNR

1. **Cole o PNR** no editor principal
2. **Clique em "Processar"** para decodificar
3. **Ajuste os parâmetros** de preço se necessário
4. **Gere o PDF** com um clique

### Tipos de PNR Suportados

- **PNR Simples**: Uma única opção de voo
- **PNR Complexo**: Múltiplas opções separadas por `=====` ou `OU`

### Exemplo de PNR
```
LH 507 11APR GRUFRA HS1 1815 #1050
LH 716 12APR FRAHND HS1 1400 #0950
LX 161 03MAY NRTZRH HS1 1055 1820
LX 92 03MAY ZRHGRU HS1 2240 #0525

TARIFA USD 12945.00 + TXS USD 130.00 *Primeira
TARIFA USD 6949.00 + TXS USD 130.00 *Exe

pagto 10x
```

## 📊 Performance e Monitoramento

### Bundle Analysis
```bash
npm run bundle:analyze
```
Gera relatório em `dist/bundle-analysis.html`

### Logs Estruturados
- Logs automáticos de todas as operações
- Métricas de performance (PNR parsing, PDF generation)
- Rastreamento de erros com contexto

### Code Splitting
- PDF components carregados sob demanda
- Chunks otimizados por categoria de dependência
- Lazy loading para componentes pesados

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run server           # Inicia servidor backend

# Build e Deploy
npm run build            # Build de produção
npm run build:analyze    # Build com análise de bundle
npm run preview          # Preview do build

# Qualidade de Código
npm run lint             # ESLint
npm run typecheck        # TypeScript check
npm run fix              # Corrige problemas de lint

# Banco de Dados
node scripts/database-migration.js list     # Lista migrações
node scripts/database-migration.js apply    # Aplica migrações
node scripts/database-migration.js rollback # Reverte migrações
```

## 🏗️ Arquitetura

### Estrutura de Pastas
```
src/
├── app/                    # Aplicação principal
│   ├── features/          # Funcionalidades por domínio
│   ├── layout/            # Componentes de layout
│   └── shared/            # Componentes compartilhados
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes base de UI
│   ├── pdf/              # Componentes PDF
│   └── catalog/          # Catálogos de dados
├── lib/                   # Utilitários e bibliotecas
│   ├── types/            # Definições de tipos
│   └── validations/      # Schemas de validação
└── hooks/                # Hooks customizados
```

### Principais Componentes

- **BookingsPage**: Página principal de processamento
- **PnrEditor**: Editor de PNR com validação
- **AdvancedPricingEngine**: Engine de cálculos de preço
- **MultiStackedPdfDocument**: Gerador de PDF profissional
- **SimpleSummary**: Resumo da cotação

## 🔐 Segurança

- **RLS (Row Level Security)** habilitado em todas as tabelas
- **Headers de segurança** com Helmet
- **Rate limiting** para APIs
- **CORS** configurado adequadamente
- **Validação** com Zod em todos os inputs

## 🎨 Design System

### Temas
- **Tema Escuro**: Padrão com alto contraste
- **Tema Claro**: Alternativa clara
- **Transições suaves** entre temas

### Acessibilidade
- **Contraste ≥ 4.5:1** em todos os elementos
- **Navegação por teclado** completa
- **ARIA labels** e roles apropriados
- **Screen reader** friendly

### Tokens de Design
- Cores centralizadas em CSS variables
- Tipografia consistente (Inter)
- Espaçamentos padronizados
- Componentes acessíveis

## 🐛 Troubleshooting

### Problemas Comuns

**Erro de conexão com Supabase**
- Verifique as variáveis de ambiente
- Confirme se o projeto Supabase está ativo

**PDF não gera**
- Verifique se o PNR foi processado corretamente
- Confirme se há dados suficientes para o PDF

**Performance lenta**
- Use `npm run bundle:analyze` para identificar chunks grandes
- Verifique os logs no console para operações lentas

### Logs de Debug
```bash
# Ative logs detalhados no console
localStorage.setItem('debug', 'true')
```

## 📈 Roadmap

### Próximas Funcionalidades
- [ ] Sistema de múltiplas cotações
- [ ] Cache de aeroportos e companhias
- [ ] Exportação para Excel/CSV
- [ ] Histórico de cotações
- [ ] Notificações em tempo real

### Melhorias Técnicas
- [ ] Testes automatizados (Jest/Vitest)
- [ ] CI/CD pipeline
- [ ] Monitoramento com Sentry
- [ ] PWA capabilities

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo `LICENSE` para detalhes.

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Abra uma issue no repositório
- Consulte a documentação do Supabase
- Verifique os logs estruturados para debugging

---

**7Mares Turismo** - Sistema de Cotações Aéreas Profissional
