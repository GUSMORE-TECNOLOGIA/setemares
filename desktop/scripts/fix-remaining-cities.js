import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Correções adicionais para cidades brasileiras
const additionalCorrections = {
  'Sao Paulo de Olivenca': 'São Paulo de Olivença',
  'Sao Carlos': 'São Carlos',
  'Sao Jose Dos Campos': 'São José dos Campos',
  'Sao Gabriel': 'São Gabriel',
  'Sao Jose Do Rio Preto': 'São José do Rio Preto',
  'Sao Miguel do Oeste': 'São Miguel do Oeste',
  'Sao Felix do Araguaia': 'São Félix do Araguaia',
  'Sao Felix do Xingu': 'São Félix do Xingu'
};

// Função para atualizar nomes das cidades
async function updateRemainingCities() {
    console.log('🇧🇷 Corrigindo cidades brasileiras restantes...');
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const [oldName, newName] of Object.entries(additionalCorrections)) {
        try {
            const { error } = await supabase
                .from('cities')
                .update({ name: newName })
                .eq('country', 'Brazil')
                .eq('name', oldName);
            
            if (error) {
                console.error(`❌ Erro ao atualizar ${oldName}:`, error.message);
                errorCount++;
            } else {
                console.log(`✅ ${oldName} → ${newName}`);
                updatedCount++;
            }
        } catch (err) {
            console.error(`❌ Erro ao processar ${oldName}:`, err);
            errorCount++;
        }
    }
    
    console.log(`\n📊 Resumo da correção:`);
    console.log(`   - Cidades atualizadas: ${updatedCount}`);
    console.log(`   - Erros: ${errorCount}`);
}

// Função para verificar se ainda há cidades sem acentos
async function checkRemainingIssues() {
    console.log('\n🔍 Verificando cidades ainda sem acentos...');
    
    const { data: cities, error } = await supabase
        .from('cities')
        .select('iata3, name, country')
        .eq('country', 'Brazil')
        .or('name.like.%Sao%,name.like.%Jose%,name.like.%Joao%,name.like.%Ribeirao%');
    
    if (error) {
        console.error('❌ Erro ao verificar:', error);
        return;
    }
    
    if (cities.length === 0) {
        console.log('✅ Todas as cidades brasileiras estão com acentos corretos!');
    } else {
        console.log('⚠️  Cidades ainda sem acentos:');
        cities.forEach(city => {
            console.log(`   ${city.iata3}: ${city.name}`);
        });
    }
}

// Função principal
async function main() {
    try {
        await updateRemainingCities();
        await checkRemainingIssues();
        console.log('\n🎉 Correção finalizada!');
    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

main();
