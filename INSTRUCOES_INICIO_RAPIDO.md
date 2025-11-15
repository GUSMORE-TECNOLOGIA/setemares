# 🚀 Instruções de Início Rápido - 7Mares Cotador

## ✅ Setup Concluído!

O ambiente de desenvolvimento foi configurado com sucesso. Agora você pode iniciar o projeto.

## 📋 Resumo do que foi instalado

- ✅ Node.js v22.18.0
- ✅ Python 3.11.9  
- ✅ Dependências Python (venv)
- ✅ Dependências Node.js (raiz e desktop)
- ✅ Playwright instalado
- ✅ Arquivos .env criados

## 🎯 Como Iniciar o Projeto

### Método 1: Script Automático (Mais Fácil)

Abra um terminal PowerShell e execute:

```powershell
cd desktop
.\start-dev.ps1
```

Este script inicia automaticamente backend e frontend.

### Método 2: Manual (2 Terminais)

**Terminal 1 - Backend:**
```powershell
cd desktop
npm run server
```

Aguarde ver a mensagem: `Server up on :3001`

**Terminal 2 - Frontend:**
```powershell
cd desktop
npm run dev
```

Aguarde ver a mensagem com a URL do Vite (geralmente `http://localhost:5173`)

## 🌐 Acessar a Aplicação

Após iniciar ambos os servidores:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## ✅ Validar que está funcionando

1. **Frontend carrega**: Abra http://localhost:5173 no navegador
2. **Backend responde**: Acesse http://localhost:3001/health (deve retornar `{"ok":true}`)
3. **Interface aparece**: Você deve ver a interface do 7Mares Cotador
4. **Teste básico**: 
   - Clique em "Importar Exemplo" para carregar um PNR de teste
   - Clique em "Processar" para decodificar
   - Verifique se os dados aparecem corretamente

## ⚙️ Configurações Importantes

### Variáveis de Ambiente

O arquivo `desktop\.env` foi criado com valores padrão. Se necessário, edite com suas credenciais:

```env
VITE_SUPABASE_URL=https://dgverpbhxtslmfrrcwwj.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
OPENAI_API_KEY=sua-chave-openai-aqui (opcional)
```

### Banco de Dados

As migrações do banco precisam ser executadas manualmente no Supabase Dashboard:

1. Acesse seu projeto no Supabase
2. Vá em SQL Editor
3. Execute as migrações (veja SQL em `desktop/scripts/migrations/`)

Ou use o script para ver o SQL:
```powershell
cd desktop
node scripts\database-migration.js apply enable_rls_and_add_indexes
```

## 🔧 Comandos Úteis

### Desenvolvimento
```powershell
cd desktop

# Iniciar servidores
npm run server    # Backend
npm run dev       # Frontend

# Verificar código
npm run typecheck  # TypeScript
npm run lint       # ESLint
npm run fix         # Corrigir problemas de lint
```

### Build
```powershell
cd desktop
npm run build          # Build de produção
npm run build:analyze  # Análise de bundle
npm run preview        # Preview do build
```

## ⚠️ Problemas Comuns

### Porta já em uso
```powershell
# Ver processos nas portas
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Ou use outra porta
$env:PORT=3002; npm run server
```

### Erros de dependências
```powershell
# Limpar e reinstalar
cd desktop
Remove-Item -Recurse -Force node_modules
npm install
```

### Erros de TypeScript
Os erros de TypeScript não bloqueiam a execução. Para desenvolvimento, você pode:
- Ignorar temporariamente
- Corrigir gradualmente
- Ou ajustar `tsconfig.json` para ser menos restritivo

## 📝 Próximos Passos

1. ✅ Iniciar o projeto (backend + frontend)
2. ✅ Validar que está funcionando
3. ⚠️ Configurar banco de dados (migrações)
4. ⚠️ Configurar credenciais reais no .env
5. 🚀 Começar a desenvolver!

## 📚 Documentação Adicional

- `SETUP_COMPLETO.md` - Detalhes completos do setup
- `desktop/README.md` - Documentação do projeto
- `desktop/docs/SETUP_GUIDE.md` - Guia de setup detalhado

---

**Status**: ✅ Ambiente configurado e pronto para uso!

Se encontrar problemas, verifique os logs no console ou consulte a documentação.

