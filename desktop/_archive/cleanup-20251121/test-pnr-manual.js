// Test manual do parser com o PNR de exemplo
const { parsePNR } = require('./src/lib/parser.ts');

const PNR_TEXT = `
AZ  679   25NOV GRUFCO HS2  2040  #1200
AZ 2038   26NOV FCOLIN HS2  1400   1510
AZ 1462   06DEC VCEFCO HS2  1515   1625
AZ  674   06DEC FCOGRU HS2  2220  #0625

tarifa usd 2529.00 + txs usd 66.00 

pagto 6x - net net

2pc 32kg
Assentos pagos
Fee usd 50.00

==

LA 8072   25NOV GRUMXP HK2  1800  #0915
AZ 1460   06DEC VCEFCO HK2  0615   0725
LA 8121   06DEC FCOGRU HK2  1200   2010

tarifa usd 2996.00 + txs usd 272.00 

pagto 4x - comissão 7%

2pc 23kg
Assentos pagos na AZ
Fee usd 50.00
`;

async function testParser() {
    console.log('='.repeat(80));
    console.log('TESTE DO PARSER - PNR COM MÚLTIPLAS OPÇÕES');
    console.log('='.repeat(80));
    console.log();

    try {
        const result = await parsePNR(PNR_TEXT);

        console.log('📊 RESULTADO DO PARSE:');
        console.log(JSON.stringify(result, null, 2));
        console.log();

        console.log('='.repeat(80));
        console.log('ANÁLISE DETALHADA:');
        console.log('='.repeat(80));
        console.log();

        if (result) {
            console.log('✅ PNR parseado com sucesso!');
            console.log();
            console.log('📌 Informações Principais:');
            console.log(`   - É multi-opção: ${result.is_multi ? 'SIM' : 'NÃO'}`);
            console.log(`   - Número de opções: ${result.quotations?.length || 1}`);
            console.log(`   - Moeda: ${result.currency}`);
            console.log();

            if (result.quotations && result.quotations.length > 0) {
                result.quotations.forEach((quote, idx) => {
                    console.log(`📋 OPÇÃO ${idx + 1}:`);
                    console.log(`   - Tarifa: ${quote.currency || 'USD'} ${quote.tarifa}`);
                    console.log(`   - Taxas: ${quote.currency || 'USD'} ${quote.taxas_base}`);
                    console.log(`   - Fares detectados: ${quote.fares?.length || 0}`);
                    console.log(`   - Trechos: ${quote.trechos?.length || 0}`);
                    console.log(`   - Segments: ${quote.segments?.length || 0}`);
                    console.log(`   - Payment Terms: ${quote.paymentTerms || 'N/A'}`);
                    console.log(`   - Baggage: ${quote.baggage || 'N/A'}`);
                    console.log(`   - Notes: ${quote.notes || 'N/A'}`);
                    console.log(`   - Parcelas: ${quote.numParcelas || 'N/A'}`);
                    console.log(`   - RAV %: ${quote.ravPercent || 0}`);
                    console.log(`   - Incentivo %: ${quote.incentivoPercent || 0}`);
                    console.log(`   - Fee USD: ${quote.feeUSD || 0}`);
                    console.log();
                });
            }

            console.log('='.repeat(80));
            console.log('✅ TESTE CONCLUÍDO COM SUCESSO');
            console.log('='.repeat(80));
        } else {
            console.log('❌ Falha ao parsear PNR - resultado null');
        }
    } catch (error) {
        console.error('❌ ERRO NO TESTE:');
        console.error(error);
    }
}

testParser();
