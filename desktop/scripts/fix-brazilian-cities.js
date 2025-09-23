import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mapeamento de correções para cidades brasileiras
const cityCorrections = {
  'Araxa': 'Araxá',
  'Aripuana': 'Aripuanã',
  'Aracatuba': 'Araçatuba',
  'Araguaina': 'Araguaína',
  'Araracuara': 'Araraquara',
  'Sao Paulo': 'São Paulo',
  'Sao Paulo': 'São Paulo',
  'Rio de Janeiro': 'Rio de Janeiro',
  'Brasilia': 'Brasília',
  'Belo Horizonte': 'Belo Horizonte',
  'Salvador': 'Salvador',
  'Fortaleza': 'Fortaleza',
  'Recife': 'Recife',
  'Porto Alegre': 'Porto Alegre',
  'Curitiba': 'Curitiba',
  'Belem': 'Belém',
  'Goiania': 'Goiânia',
  'Guarulhos': 'Guarulhos',
  'Campinas': 'Campinas',
  'Sao Luis': 'São Luís',
  'Maceio': 'Maceió',
  'Natal': 'Natal',
  'Joao Pessoa': 'João Pessoa',
  'Aracaju': 'Aracaju',
  'Teresina': 'Teresina',
  'Campo Grande': 'Campo Grande',
  'Cuiaba': 'Cuiabá',
  'Florianopolis': 'Florianópolis',
  'Vitoria': 'Vitória',
  'Manaus': 'Manaus',
  'Macapa': 'Macapá',
  'Boa Vista': 'Boa Vista',
  'Rio Branco': 'Rio Branco',
  'Palmas': 'Palmas',
  'Porto Velho': 'Porto Velho',
  'Santarem': 'Santarém',
  'Maraba': 'Marabá',
  'Imperatriz': 'Imperatriz',
  'Sao Jose dos Campos': 'São José dos Campos',
  'Ribeirao Preto': 'Ribeirão Preto',
  'Uberlandia': 'Uberlândia',
  'Sorocaba': 'Sorocaba',
  'Niteroi': 'Niterói',
  'Caxias do Sul': 'Caxias do Sul',
  'Campos dos Goytacazes': 'Campos dos Goytacazes',
  'Jundiai': 'Jundiaí',
  'Sao Joao de Meriti': 'São João de Meriti',
  'Santo Andre': 'Santo André',
  'Osasco': 'Osasco',
  'Jaboatao dos Guararapes': 'Jaboatão dos Guararapes',
  'Sao Bernardo do Campo': 'São Bernardo do Campo',
  'Sao Jose do Rio Preto': 'São José do Rio Preto',
  'Ribeirao das Neves': 'Ribeirão das Neves',
  'Contagem': 'Contagem',
  'Aracaju': 'Aracaju',
  'Sao Jose dos Pinhais': 'São José dos Pinhais',
  'Cuiaba': 'Cuiabá',
  'Aparecida de Goiania': 'Aparecida de Goiânia',
  'Feira de Santana': 'Feira de Santana',
  'Joinville': 'Joinville',
  'Londrina': 'Londrina',
  'Nova Iguacu': 'Nova Iguaçu',
  'Sao Goncalo': 'São Gonçalo',
  'Duque de Caxias': 'Duque de Caxias',
  'Sao Luis': 'São Luís',
  'Maceio': 'Maceió',
  'Natal': 'Natal',
  'Teresina': 'Teresina',
  'Campo Grande': 'Campo Grande',
  'Joao Pessoa': 'João Pessoa',
  'Jaboatao dos Guararapes': 'Jaboatão dos Guararapes',
  'Sao Bernardo do Campo': 'São Bernardo do Campo',
  'Sao Jose do Rio Preto': 'São José do Rio Preto',
  'Ribeirao das Neves': 'Ribeirão das Neves',
  'Sao Jose dos Pinhais': 'São José dos Pinhais',
  'Aparecida de Goiania': 'Aparecida de Goiânia',
  'Nova Iguacu': 'Nova Iguaçu',
  'Sao Goncalo': 'São Gonçalo',
  'Sao Luis': 'São Luís',
  'Jaboatao dos Guararapes': 'Jaboatão dos Guararapes',
  'Sao Bernardo do Campo': 'São Bernardo do Campo',
  'Sao Jose do Rio Preto': 'São José do Rio Preto',
  'Ribeirao das Neves': 'Ribeirão das Neves',
  'Sao Jose dos Pinhais': 'São José dos Pinhais',
  'Aparecida de Goiania': 'Aparecida de Goiânia',
  'Nova Iguacu': 'Nova Iguaçu',
  'Sao Goncalo': 'São Gonçalo'
};

// Função para atualizar nomes das cidades
async function updateCityNames() {
    console.log('🇧🇷 Iniciando correção dos nomes das cidades brasileiras...');
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const [oldName, newName] of Object.entries(cityCorrections)) {
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

// Função para verificar resultados
async function verifyResults() {
    console.log('\n🔍 Verificando resultados...');
    
    const { data: cities, error } = await supabase
        .from('cities')
        .select('iata3, name, country')
        .eq('country', 'Brazil')
        .order('iata3')
        .limit(20);
    
    if (error) {
        console.error('❌ Erro ao verificar:', error);
        return;
    }
    
    console.log('📋 Amostra de cidades brasileiras:');
    cities.forEach(city => {
        console.log(`   ${city.iata3}: ${city.name}`);
    });
}

// Função principal
async function main() {
    try {
        await updateCityNames();
        await verifyResults();
        console.log('\n🎉 Correção concluída!');
    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

main();
