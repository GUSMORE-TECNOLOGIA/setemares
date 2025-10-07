#!/usr/bin/env node

/**
 * Script de Migração Automatizada para Supabase
 * 
 * Este script facilita a aplicação e rollback de migrações no banco de dados Supabase.
 * 
 * Uso:
 *   node scripts/database-migration.js apply <nome-da-migracao>
 *   node scripts/database-migration.js rollback <nome-da-migracao>
 *   node scripts/database-migration.js list
 * 
 * Exemplo:
 *   node scripts/database-migration.js apply enable_rls_and_add_indexes
 *   node scripts/database-migration.js rollback enable_rls_and_add_indexes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const ROLLBACKS_DIR = path.join(__dirname, 'rollbacks');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ERRO: ${message}`, colors.red);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Verificar se as pastas existem
function ensureDirectories() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    logInfo(`Criada pasta de migrações: ${MIGRATIONS_DIR}`);
  }
  
  if (!fs.existsSync(ROLLBACKS_DIR)) {
    fs.mkdirSync(ROLLBACKS_DIR, { recursive: true });
    logInfo(`Criada pasta de rollbacks: ${ROLLBACKS_DIR}`);
  }
}

// Listar migrações disponíveis
function listMigrations() {
  logInfo('📋 Migrações Disponíveis:');
  console.log('');
  
  const migrations = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  if (migrations.length === 0) {
    logWarning('Nenhuma migração encontrada.');
    return;
  }
  
  migrations.forEach((file, index) => {
    const name = file.replace('.sql', '');
    const rollbackExists = fs.existsSync(path.join(ROLLBACKS_DIR, `${name}_rollback.sql`));
    const rollbackStatus = rollbackExists ? '✅' : '❌';
    
    console.log(`  ${index + 1}. ${name} ${rollbackStatus} (rollback)`);
  });
  
  console.log('');
  logInfo('Legenda: ✅ = rollback disponível, ❌ = rollback não encontrado');
}

// Aplicar migração
async function applyMigration(migrationName) {
  const migrationFile = path.join(MIGRATIONS_DIR, `${migrationName}.sql`);
  
  if (!fs.existsSync(migrationFile)) {
    logError(`Migração não encontrada: ${migrationName}`);
    logInfo('Execute "node scripts/database-migration.js list" para ver migrações disponíveis.');
    process.exit(1);
  }
  
  logInfo(`Aplicando migração: ${migrationName}`);
  
  try {
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Aqui você integraria com a API do Supabase
    // Por enquanto, apenas exibimos o SQL
    logInfo('SQL da migração:');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    
    logWarning('⚠️  ATENÇÃO: Este script não executa automaticamente no Supabase.');
    logWarning('⚠️  Copie o SQL acima e execute manualmente no Supabase Dashboard.');
    logWarning('⚠️  Ou integre com a API do Supabase usando as credenciais do projeto.');
    
    logSuccess(`Migração "${migrationName}" preparada para execução!`);
    
  } catch (error) {
    logError(`Erro ao ler arquivo de migração: ${error.message}`);
    process.exit(1);
  }
}

// Rollback de migração
async function rollbackMigration(migrationName) {
  const rollbackFile = path.join(ROLLBACKS_DIR, `${migrationName}_rollback.sql`);
  
  if (!fs.existsSync(rollbackFile)) {
    logError(`Arquivo de rollback não encontrado: ${migrationName}`);
    logInfo('Execute "node scripts/database-migration.js list" para ver rollbacks disponíveis.');
    process.exit(1);
  }
  
  logWarning(`⚠️  ATENÇÃO: Executando ROLLBACK da migração: ${migrationName}`);
  logWarning('⚠️  Esta operação pode ser destrutiva!');
  
  try {
    const sql = fs.readFileSync(rollbackFile, 'utf8');
    
    logInfo('SQL do rollback:');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    
    logWarning('⚠️  ATENÇÃO: Este script não executa automaticamente no Supabase.');
    logWarning('⚠️  Copie o SQL acima e execute manualmente no Supabase Dashboard.');
    logWarning('⚠️  OU integre com a API do Supabase usando as credenciais do projeto.');
    
    logSuccess(`Rollback da migração "${migrationName}" preparado para execução!`);
    
  } catch (error) {
    logError(`Erro ao ler arquivo de rollback: ${error.message}`);
    process.exit(1);
  }
}

// Criar template de migração
function createMigrationTemplate(migrationName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}_${migrationName}.sql`;
  const migrationFile = path.join(MIGRATIONS_DIR, filename);
  
  const template = `-- =============================================
-- MIGRAÇÃO: ${migrationName.replace(/_/g, ' ').toUpperCase()}
-- Data: ${new Date().toISOString()}
-- Descrição: [Descreva o que esta migração faz]
-- =============================================

-- [Seu SQL aqui]

-- =============================================
-- FIM DA MIGRAÇÃO
-- =============================================`;

  fs.writeFileSync(migrationFile, template);
  logSuccess(`Template de migração criado: ${filename}`);
  
  // Criar template de rollback
  const rollbackFile = path.join(ROLLBACKS_DIR, `${migrationName}_rollback.sql`);
  const rollbackTemplate = `-- =============================================
-- ROLLBACK: ${migrationName.replace(/_/g, ' ').toUpperCase()}
-- Data: ${new Date().toISOString()}
-- Descrição: Rollback da migração ${migrationName}
-- =============================================

-- [Seu SQL de rollback aqui]

-- =============================================
-- FIM DO ROLLBACK
-- =============================================`;

  fs.writeFileSync(rollbackFile, rollbackTemplate);
  logSuccess(`Template de rollback criado: ${migrationName}_rollback.sql`);
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
${colors.bright}🚀 Script de Migração Automatizada para Supabase${colors.reset}

${colors.cyan}Uso:${colors.reset}
  node scripts/database-migration.js <comando> [argumentos]

${colors.cyan}Comandos:${colors.reset}
  ${colors.green}list${colors.reset}                           - Listar migrações disponíveis
  ${colors.green}apply <nome>${colors.reset}                  - Aplicar migração
  ${colors.green}rollback <nome>${colors.reset}               - Fazer rollback de migração
  ${colors.green}create <nome>${colors.reset}                 - Criar template de migração

${colors.cyan}Exemplos:${colors.reset}
  node scripts/database-migration.js list
  node scripts/database-migration.js apply enable_rls_and_add_indexes
  node scripts/database-migration.js rollback enable_rls_and_add_indexes
  node scripts/database-migration.js create add_new_table

${colors.yellow}Nota:${colors.reset} Este script prepara os SQLs para execução manual.
Para execução automática, integre com a API do Supabase.
`);
    process.exit(0);
  }
  
  const command = args[0];
  
  ensureDirectories();
  
  switch (command) {
    case 'list':
      listMigrations();
      break;
      
    case 'apply':
      if (args.length < 2) {
        logError('Nome da migração é obrigatório.');
        logInfo('Uso: node scripts/database-migration.js apply <nome-da-migracao>');
        process.exit(1);
      }
      await applyMigration(args[1]);
      break;
      
    case 'rollback':
      if (args.length < 2) {
        logError('Nome da migração é obrigatório.');
        logInfo('Uso: node scripts/database-migration.js rollback <nome-da-migracao>');
        process.exit(1);
      }
      await rollbackMigration(args[1]);
      break;
      
    case 'create':
      if (args.length < 2) {
        logError('Nome da migração é obrigatório.');
        logInfo('Uso: node scripts/database-migration.js create <nome-da-migracao>');
        process.exit(1);
      }
      createMigrationTemplate(args[1]);
      break;
      
    default:
      logError(`Comando desconhecido: ${command}`);
      logInfo('Execute sem argumentos para ver a ajuda.');
      process.exit(1);
  }
}

// Executar se for chamado diretamente
main().catch(error => {
  logError(`Erro inesperado: ${error.message}`);
  process.exit(1);
});

export {
  applyMigration,
  rollbackMigration,
  listMigrations,
  createMigrationTemplate
};
