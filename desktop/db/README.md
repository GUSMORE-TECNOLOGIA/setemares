# 7Mares Cotador - Banco de Dados

## Setup do Supabase

### 1. Configurar Variáveis de Ambiente

Edite o arquivo `.env.local` na raiz do projeto desktop:

```bash
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### 2. Executar Schema no Supabase Dashboard

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Vá para **SQL Editor**
3. Execute o conteúdo do arquivo `sql/001_create_tables.sql`
4. Verifique se as tabelas foram criadas corretamente

### 3. Testar Conexão

Execute o projeto desktop:

```bash
npm run dev
```

Verifique se o indicador "Supabase OK" aparece no header da aplicação.

## Estrutura do Banco

### Tabelas Principais

- **cities** - Cidades (SAO, RIO, LIS, etc.)
- **airports** - Aeroportos (GRU, CGH, LHR, etc.)
- **airlines** - Companhias aéreas (LA, TP, BA, etc.)

### Tabelas de Sistema

- **code_overrides** - Correções manuais de códigos
- **codes_unknown** - Telemetria de códigos não reconhecidos
- **quotes** - Histórico de cotações
- **quote_segments** - Segmentos de voo das cotações

## Próximos Passos

1. ✅ Setup básico concluído
2. 🔄 Implementar UI do catálogo
3. 🔄 Implementar Decoder v2
4. 🔄 Implementar tela de pendências
5. 🔄 Importar dados iniciais
