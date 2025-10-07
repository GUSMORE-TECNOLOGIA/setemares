# 🚀 Guia de Setup Rápido - 7Mares Cotador

Setup completo em **≤ 30 minutos** para desenvolvimento local.

## ⚡ Setup Express (5 minutos)

### 1. Pré-requisitos
- [ ] Node.js 18+ instalado
- [ ] Git configurado
- [ ] Conta Supabase criada

### 2. Clone e Instalação
```bash
# Clone o repositório
git clone <repository-url>
cd desktop

# Instale dependências
npm install
```

### 3. Configuração Básica
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite com suas credenciais Supabase
nano .env  # ou code .env
```

## 🗄️ Configuração do Banco (10 minutos)

### 1. Crie Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Anote URL e chave anônima

### 2. Configure Variáveis
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Execute Migrações
```bash
# Aplique migrações principais
node scripts/database-migration.js apply enable_rls_and_add_indexes

# Verifique se aplicou corretamente
node scripts/database-migration.js list
```

### 4. Importe Dados Iniciais
```bash
# Importe dados de aeroportos e companhias
node scripts/import-complete-data.js
```

## 🏃‍♂️ Executar o Projeto (5 minutos)

### 1. Inicie o Backend
```bash
# Terminal 1 - Backend
npm run server
```

### 2. Inicie o Frontend
```bash
# Terminal 2 - Frontend
npm run dev
```

### 3. Acesse a Aplicação
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## ✅ Verificação Rápida (5 minutos)

### 1. Teste de Conexão
- [ ] Frontend carrega sem erros
- [ ] Status badge verde (Supabase conectado)
- [ ] Não há erros no console

### 2. Teste de Funcionalidade
- [ ] Cole um PNR de exemplo
- [ ] Clique em "Importar Exemplo"
- [ ] Processe o PNR
- [ ] Gere um PDF

### 3. Teste de Performance
```bash
# Verifique bundle size
npm run bundle:analyze
```

## 🔧 Troubleshooting Rápido

### Erro de Conexão Supabase
```bash
# Verifique variáveis
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Teste conexão
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
supabase.from('cities').select('count').then(console.log);
"
```

### Porta Ocupada
```bash
# Mate processos nas portas
npx kill-port 3001 5173

# Ou use portas diferentes
PORT=3002 npm run server
npm run dev -- --port 5174
```

### Dependências
```bash
# Limpe cache e reinstale
rm -rf node_modules package-lock.json
npm install
```

## 📋 Checklist Final

### ✅ Ambiente Funcionando
- [ ] Frontend acessível em http://localhost:5173
- [ ] Backend rodando em http://localhost:3001
- [ ] Supabase conectado (badge verde)
- [ ] PNR de exemplo processa corretamente
- [ ] PDF gera sem erros

### ✅ Desenvolvimento Pronto
- [ ] ESLint configurado (`npm run lint`)
- [ ] TypeScript funcionando (`npm run typecheck`)
- [ ] Hot reload ativo
- [ ] Logs estruturados funcionando

### ✅ Banco de Dados
- [ ] Tabelas criadas
- [ ] RLS habilitado
- [ ] Índices aplicados
- [ ] Dados iniciais importados

## 🚀 Próximos Passos

### Para Desenvolvimento
1. **Explore o código**: Comece por `src/app/features/bookings/`
2. **Teste funcionalidades**: Use diferentes PNRs
3. **Monitore performance**: Use `npm run bundle:analyze`
4. **Implemente features**: Siga a estrutura existente

### Para Produção
1. **Configure CI/CD**: GitHub Actions ou similar
2. **Setup monitoramento**: Sentry, LogRocket
3. **Configure backup**: Automatize backup do Supabase
4. **Teste de carga**: Verifique performance com dados reais

## 📚 Recursos Úteis

### Documentação
- [README.md](./README.md) - Documentação completa
- [INCIDENT_PLAYBOOK.md](./INCIDENT_PLAYBOOK.md) - Resolução de problemas
- [Supabase Docs](https://supabase.com/docs) - Documentação do banco

### Comandos Úteis
```bash
# Desenvolvimento
npm run dev              # Frontend
npm run server           # Backend
npm run lint             # Verificar código
npm run fix              # Corrigir código

# Build
npm run build            # Build produção
npm run build:analyze    # Análise de bundle
npm run preview          # Preview build

# Banco
node scripts/database-migration.js list     # Ver migrações
node scripts/database-migration.js apply    # Aplicar
node scripts/database-migration.js rollback # Reverter
```

### Estrutura Importante
```
src/
├── app/features/bookings/    # Funcionalidade principal
├── components/ui/           # Componentes base
├── lib/                     # Utilitários
└── hooks/                   # Hooks customizados
```

## 🆘 Suporte

### Problemas Comuns
1. **Erro de porta**: Use `npx kill-port 3001 5173`
2. **Dependências**: `rm -rf node_modules && npm install`
3. **Banco**: Verifique credenciais Supabase
4. **Build**: `npm run build:analyze` para debug

### Contato
- **Issues**: Abra issue no repositório
- **Documentação**: Consulte README.md
- **Logs**: Verifique console do navegador

---

**Tempo Total**: ≤ 30 minutos
**Última Atualização**: [Data]
**Versão**: 1.0
