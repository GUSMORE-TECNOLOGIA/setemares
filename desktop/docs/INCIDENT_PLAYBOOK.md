# 🚨 Playbook de Incidentes - 7Mares Cotador

Guia de resposta rápida para incidentes e problemas comuns no sistema.

## 📋 Checklist de Resposta Rápida

### ⚡ Incidente Crítico (Sistema Indisponível)

**Tempo de Resposta: < 5 minutos**

1. **Identificar o Problema**
   - [ ] Verificar status do servidor backend (porta 3001)
   - [ ] Verificar status do frontend (porta 5173)
   - [ ] Verificar conexão com Supabase
   - [ ] Verificar logs do console do navegador

2. **Ações Imediatas**
   - [ ] Reiniciar servidor backend: `npm run server`
   - [ ] Reiniciar frontend: `npm run dev`
   - [ ] Verificar variáveis de ambiente
   - [ ] Limpar cache do navegador

3. **Comunicação**
   - [ ] Notificar equipe via Slack/WhatsApp
   - [ ] Atualizar status page (se disponível)
   - [ ] Documentar incidente

### 🔧 Problemas de Performance

**Tempo de Resposta: < 15 minutos**

1. **Diagnóstico**
   ```bash
   # Verificar uso de memória
   npm run build:analyze
   
   # Verificar logs de performance
   console.log(performance.getEntriesByType('measure'))
   ```

2. **Ações**
   - [ ] Verificar chunks grandes no bundle
   - [ ] Otimizar imports desnecessários
   - [ ] Limpar cache do browser
   - [ ] Verificar queries lentas no Supabase

## 🐛 Problemas Comuns e Soluções

### 1. Erro de Conexão com Supabase

**Sintomas:**
- Erro "Failed to fetch" no console
- Dados não carregam
- Status badge vermelho

**Soluções:**
```bash
# 1. Verificar variáveis de ambiente
cat .env | grep VITE_SUPABASE

# 2. Testar conexão
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
supabase.from('cities').select('count').then(console.log);
"

# 3. Verificar RLS policies
node scripts/database-migration.js list
```

### 2. PDF Não Gera

**Sintomas:**
- Botão "Gerar PDF" não funciona
- Erro "Cannot read property of undefined"
- PDF em branco

**Soluções:**
```bash
# 1. Verificar dados do PNR
console.log('PNR Data:', pnrText);
console.log('Parsed Options:', parsedOptions);

# 2. Verificar componentes PDF
# No console do navegador:
import('./src/lib/MultiStackedPdfDocument').then(console.log);

# 3. Limpar cache do PDF
localStorage.removeItem('pdf-cache');
```

### 3. PNR Não Processa

**Sintomas:**
- PNR não é reconhecido
- Erro de parsing
- Dados incorretos

**Soluções:**
```bash
# 1. Verificar formato do PNR
# PNR deve ter formato específico com segmentos de voo

# 2. Testar com PNR de exemplo
# Use o botão "Importar Exemplo" para testar

# 3. Verificar logs de parsing
# No console: logger.debug('PNR Parsing', context);
```

### 4. Problemas de Performance

**Sintomas:**
- Aplicação lenta
- Bundle muito grande
- Carregamento demorado

**Soluções:**
```bash
# 1. Analisar bundle
npm run bundle:analyze

# 2. Verificar lazy loading
# PDF components devem carregar sob demanda

# 3. Otimizar imports
# Verificar imports desnecessários
npm run lint
```

### 5. Erros de TypeScript

**Sintomas:**
- Build falha
- Erros de tipo
- IDE mostra erros

**Soluções:**
```bash
# 1. Verificar tipos
npm run typecheck

# 2. Corrigir automaticamente
npm run fix

# 3. Verificar dependências
npm install
```

## 🔍 Ferramentas de Debug

### Logs Estruturados
```javascript
// Ativar logs detalhados
localStorage.setItem('debug', 'true');

// Ver logs de performance
logger.performance('Operation', duration, context);

// Ver logs de erro
logger.error('Error message', error, context);
```

### Console do Navegador
```javascript
// Verificar estado da aplicação
window.__APP_STATE__ = { /* dados atuais */ };

// Verificar performance
performance.getEntriesByType('measure');

// Verificar memória
performance.memory;
```

### Supabase Dashboard
1. Acesse o dashboard do Supabase
2. Verifique logs de API
3. Monitore queries lentas
4. Verifique RLS policies

## 📊 Monitoramento

### Métricas Importantes
- **Tempo de carregamento inicial**: < 3s
- **Tempo de processamento de PNR**: < 2s
- **Tempo de geração de PDF**: < 5s
- **Uso de memória**: < 100MB
- **Tamanho do bundle**: < 2MB

### Alertas Automáticos
- [ ] Erro de conexão com Supabase
- [ ] PDF generation > 10s
- [ ] PNR parsing > 5s
- [ ] Bundle size > 2MB

## 🚀 Procedimentos de Deploy

### Deploy de Emergência
```bash
# 1. Backup do estado atual
git stash

# 2. Aplicar fix rápido
git checkout hotfix/critical-fix

# 3. Build e deploy
npm run build
npm run vercel-build

# 4. Verificar deploy
curl -I https://your-app.vercel.app
```

### Rollback
```bash
# 1. Identificar versão estável
git log --oneline -10

# 2. Reverter para versão anterior
git checkout <commit-hash>

# 3. Deploy da versão anterior
npm run build
npm run vercel-build
```

## 📞 Contatos de Emergência

### Equipe Técnica
- **Dev Lead**: [Nome] - [Telefone]
- **DevOps**: [Nome] - [Telefone]
- **DBA**: [Nome] - [Telefone]

### Escalação
1. **Nível 1**: Desenvolvedor responsável
2. **Nível 2**: Tech Lead
3. **Nível 3**: CTO/Diretor

### Comunicação
- **Slack**: #incidents-7mares
- **WhatsApp**: Grupo de Emergência
- **Email**: incidents@7mares.com

## 📝 Template de Incidente

```markdown
## 🚨 Incidente: [Título]

**Data/Hora**: [YYYY-MM-DD HH:MM]
**Severidade**: [Crítica/Alta/Média/Baixa]
**Responsável**: [Nome]

### 📋 Descrição
[Descrição detalhada do problema]

### 🔍 Impacto
- [ ] Sistema indisponível
- [ ] Funcionalidade específica afetada
- [ ] Performance degradada
- [ ] Usuários afetados: [Número]

### 🛠️ Ações Tomadas
- [ ] Ação 1
- [ ] Ação 2
- [ ] Ação 3

### ✅ Resolução
[Como foi resolvido]

### 📚 Lições Aprendidas
[O que pode ser melhorado]

### 🔄 Follow-up
- [ ] Implementar monitoramento
- [ ] Documentar processo
- [ ] Treinar equipe
```

## 🔧 Manutenção Preventiva

### Diária
- [ ] Verificar logs de erro
- [ ] Monitorar performance
- [ ] Verificar status do Supabase

### Semanal
- [ ] Analisar bundle size
- [ ] Verificar dependências desatualizadas
- [ ] Revisar logs de performance

### Mensal
- [ ] Atualizar dependências
- [ ] Revisar RLS policies
- [ ] Backup do banco de dados
- [ ] Teste de disaster recovery

---

**Última atualização**: [Data]
**Versão**: 1.0
**Responsável**: Equipe de Desenvolvimento 7Mares
