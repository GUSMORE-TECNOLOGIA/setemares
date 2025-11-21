# ✅ Setup Completo - 7Mares Cotador

## Status da Instalação

### ✅ Pré-requisitos Instalados
- Node.js v22.18.0
- Python 3.11.9
- npm 10.9.3

### ✅ Dependências Instaladas
- ✅ Dependências Python (venv criado e ativado)
- ✅ Dependências Node.js (raiz e desktop)
- ✅ Playwright (Node.js) instalado

### ✅ Configuração
- ✅ Arquivos .env criados (raiz e desktop)
- ✅ Scripts de setup criados

### ⚠️ Pendências
- ⚠️ Migrações do banco de dados (executar manualmente no Supabase)
- ⚠️ Erros de TypeScript (não bloqueiam execução, mas devem ser corrigidos)

## 🚀 Como Subir o Projeto

### Opção 1: Script Automático (Recomendado)
```powershell
cd desktop
.\start-dev.ps1
```

### Opção 2: Manual (2 Terminais)

**Terminal 1 - Backend:**
```powershell
cd desktop
npm run server
```

**Terminal 2 - Frontend:**
```powershell
cd desktop
npm run dev
```

### Acessar
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📋 Próximos Passos

### 1. Configurar Banco de Dados

As migrações precisam ser executadas manualmente no Supabase Dashboard:

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Execute as migrações na ordem:

```bash
# Listar migrações disponíveis
cd desktop
node scripts\database-migration.js list

# Ver SQL da migração (copiar e executar no Supabase)
node scripts\database-migration.js apply enable_rls_and_add_indexes
node scripts\database-migration.js apply create_concierge_table
```

### 2. Configurar Variáveis de Ambiente

Edite `desktop\.env` com suas credenciais reais:
- `VITE_SUPABASE_URL` - URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `OPENAI_API_KEY` - (Opcional) Para usar Concierge IA

### 3. Validar Funcionalidades

1. ✅ Frontend carrega sem erros
2. ✅ Backend responde em /health
3. ✅ Conexão com Supabase funciona
4. ✅ Processar um PNR de exemplo
5. ✅ Gerar PDF

## 🔧 Scripts Disponíveis

### Setup
```powershell
# Setup completo
.\setup-complete.ps1

# Iniciar desenvolvimento
cd desktop
.\start-dev.ps1
```

### Desenvolvimento
```powershell
cd desktop

# Frontend
npm run dev

# Backend
npm run server

# TypeScript check
npm run typecheck

# Lint
npm run lint
npm run fix

# Build
npm run build
```

### Banco de Dados
```powershell
cd desktop

# Listar migrações
node scripts\database-migration.js list

# Aplicar migração (mostra SQL para copiar)
node scripts\database-migration.js apply <nome>

# Rollback
node scripts\database-migration.js rollback <nome>
```

## ⚠️ Problemas Conhecidos

### Erros de TypeScript
Há vários erros de TypeScript que não bloqueiam a execução:
- Imports não utilizados (warnings)
- Propriedades faltando em tipos
- Problemas de compatibilidade com @react-pdf/renderer

**Solução**: Corrigir gradualmente ou desabilitar verificações estritas temporariamente.

### Playwright Python
O Playwright para Python não está instalado, mas não é necessário pois o projeto usa o Playwright do Node.js.

### pnrsh.exe
O binário pnrsh.exe não está presente. O sistema funciona com fallback de regex, mas para melhor performance, compile com:
```powershell
.\scripts\build_pnrsh.ps1
```

## 📝 Notas

- As credenciais padrão do Supabase estão no código (valores de fallback)
- Configure suas próprias credenciais no arquivo .env
- O projeto está pronto para desenvolvimento, mas algumas funcionalidades podem precisar de configuração adicional do banco

## ✅ Checklist Final

- [x] Pré-requisitos instalados
- [x] Dependências Python instaladas
- [x] Dependências Node.js instaladas
- [x] Playwright instalado
- [x] Arquivos .env criados
- [ ] Migrações do banco aplicadas
- [ ] Credenciais configuradas
- [ ] Projeto testado e funcionando

---

**Última atualização**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Status**: ✅ Ambiente configurado e pronto para desenvolvimento
