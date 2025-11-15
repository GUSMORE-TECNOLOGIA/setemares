/**
 * Rotas de Concierge
 * 
 * Módulo crítico - extrai apenas as rotas. As funções de geração
 * permanecem no server.cjs por enquanto e podem ser extraídas depois.
 */

/**
 * Registra as rotas de Concierge no app Express
 * 
 * NOTA: As funções generatePremiumPipeline, generateConciergeReportEnriched
 * e premiumWrapper ainda estão no server.cjs e precisam ser passadas aqui
 * ou extraídas para um módulo separado.
 */
function registerConciergeRoutes(
  app,
  supabase,
  conciergeLimiter,
  validateConciergeForm,
  validateDateRange,
  generatePremiumPipeline,
  generateConciergeReportEnriched,
  FEATURE_USE_AI
) {
  // Regeneração parcial
  app.post("/api/concierge/regenerate", conciergeLimiter, async (req, res, next) => {
    try {
      const { reportId, type, date } = req.body || {};
      if (!reportId) return res.status(400).json({ error: true, message: 'reportId é obrigatório' });

      const { data: existing, error: fetchError } = await supabase
        .from('concierge_reports')
        .select('*')
        .eq('id', reportId)
        .single();
      if (fetchError || !existing) return res.status(404).json({ error: true, message: 'Relatório não encontrado' });

      // reconstruir formData mínimo a partir do contexto salvo
      let ctx = existing.enriched_json?.context || {};
      const formData = {
        clientName: existing.client_name || 'Cliente',
        destination: ctx.destination || existing.destination,
        checkin: ctx.checkin || existing.checkin,
        checkout: ctx.checkout || existing.checkout,
        travelType: ctx.travelType || existing.travel_type,
        budget: ctx.budget || existing.budget,
        adults: existing.adults || 1,
        children: existing.children || 0,
        hotel: existing.hotel || undefined,
        address: existing.address || undefined,
        interests: Array.isArray(existing.interests) ? existing.interests : [],
        observations: existing.observations || undefined,
      };

      const result = await generatePremiumPipeline(formData);

      // atualizar registro
      const { data: updated, error: updError } = await supabase
        .from('concierge_reports')
        .update({
          report_content: result.report.content,
          report_html: result.report.html,
          processing_time_ms: result.report.metadata.processingTime,
          openai_model: result.report.metadata.model,
          openai_tokens_used: result.report.metadata.tokensUsed,
          enriched_json: result.enriched_json,
          data_sources: result.sources,
          updated_at: new Date().toISOString(),
          status: 'generated'
        })
        .eq('id', reportId)
        .select()
        .single();
      if (updError) return res.status(500).json({ error: true, message: 'Erro ao atualizar relatório' });

      res.json({ success: true, report: {
        id: updated.id,
        content: result.report.content,
        html: result.report.html,
        metadata: result.report.metadata
      }, enriched: result.enriched_json });
    } catch (error) {
      console.error('Erro na regeneração:', error);
      next(error);
    }
  });

  // Endpoint para gerar relatório de Concierge
  app.post("/api/concierge/generate", conciergeLimiter, validateConciergeForm, validateDateRange, async (req, res, next) => {
    try {
      console.log('=== REQUEST BODY (VALIDADO) ===');
      console.log(JSON.stringify(req.body, null, 2));
      console.log('===================');
      
      const {
        clientName,
        destination,
        checkin,
        checkout,
        travelType,
        budget,
        adults,
        children,
        hotel,
        address,
        interests,
        observations,
        agentName
      } = req.body;

      let report, enriched_json, sources;
      console.log('=== FEATURE_USE_AI ===', FEATURE_USE_AI);
      
      if (FEATURE_USE_AI) {
        try {
          console.log('=== TENTANDO PIPELINE IA ===');
          const result = await generatePremiumPipeline({
            clientName,
            destination,
            checkin,
            checkout,
            travelType,
            budget,
            adults: adults || 1,
            children: children || 0,
            hotel,
            address,
            interests: interests || [],
            observations
          });
          console.log('=== PIPELINE IA SUCESSO ===', {
            hasReport: !!result.report,
            hasEnriched: !!result.enriched_json,
            enrichedKeys: result.enriched_json ? Object.keys(result.enriched_json) : 'null'
          });
          
          if (!result.enriched_json || Object.keys(result.enriched_json).length === 0) {
            console.warn('=== PIPELINE IA RETORNOU ENRICHED VAZIO, USANDO FALLBACK ===');
            throw new Error('Pipeline IA retornou enriched_json vazio');
          }
          
          report = result.report;
          enriched_json = result.enriched_json;
          sources = result.sources;
        } catch (aiError) {
          console.warn('=== PIPELINE IA FALHOU ===', aiError.message);
          console.warn('Stack trace:', aiError.stack);
          console.log('=== USANDO FALLBACK LOCAL ===');
          const localResult = generateConciergeReportEnriched({
            clientName,
            destination,
            checkin,
            checkout,
            travelType,
            budget,
            adults: adults || 1,
            children: children || 0,
            hotel,
            address,
            interests: interests || [],
            observations
          });
          console.log('=== FALLBACK LOCAL SUCESSO ===', {
            hasReport: !!localResult.report,
            hasEnriched: !!localResult.enriched_json,
            enrichedKeys: localResult.enriched_json ? Object.keys(localResult.enriched_json) : 'null'
          });
          report = localResult.report;
          enriched_json = localResult.enriched_json;
          sources = localResult.sources;
        }
      } else {
        const localResult = generateConciergeReportEnriched({
          clientName,
          destination,
          checkin,
          checkout,
          travelType,
          budget,
          adults: adults || 1,
          children: children || 0,
          hotel,
          address,
          interests: interests || [],
          observations
        });
        report = localResult.report;
        enriched_json = localResult.enriched_json;
        sources = localResult.sources;
      }

      // Salvar no Supabase (com fallback sem DB)
      let reportId = null;
      try {
        const { data, error } = await supabase
          .from('concierge_reports')
          .insert({
            agent_name: agentName,
            client_name: clientName,
            destination,
            checkin,
            checkout,
            travel_type: travelType,
            budget,
            adults: adults || 1,
            children: children || 0,
            hotel,
            address,
            interests: interests || [],
            observations,
            report_content: report.content,
            report_html: report.html,
            processing_time_ms: report.metadata.processingTime,
            openai_model: report.metadata.model,
            openai_tokens_used: report.metadata.tokensUsed,
            status: 'generated',
            enriched_json: enriched_json || null,
            data_sources: sources || null
          })
          .select()
          .single();
        if (error) throw error;
        reportId = data?.id || null;
      } catch (dbErr) {
        console.error('=== ERRO SUPABASE (fallback sem DB) ===');
        console.error(dbErr);
        try {
          const { randomUUID } = require('crypto');
          reportId = randomUUID();
        } catch {
          reportId = `${Date.now()}`;
        }
      }

      console.log('=== RESPONSE FINAL ===', {
        hasReport: !!report,
        hasEnriched: !!enriched_json,
        enrichedKeys: enriched_json ? Object.keys(enriched_json) : 'null',
        enrichedType: typeof enriched_json
      });
      
      res.json({
        success: true,
        report: {
          id: reportId,
          content: report.content,
          html: report.html,
          metadata: report.metadata
        },
        enriched: enriched_json || null
      });

    } catch (error) {
      console.error('Erro no endpoint concierge:', error);
      next(error);
    }
  });

  // Endpoint para buscar histórico de relatórios
  app.get("/api/concierge/history", async (req, res, next) => {
    try {
      const { limit = 10 } = req.query;
      
      const { data, error } = await supabase
        .from('concierge_reports')
        .select('id, created_at, client_name, destination, travel_type, budget, status')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (error) {
        console.error('Erro ao buscar histórico:', error);
        return res.status(500).json({
          error: true,
          message: "Erro ao buscar histórico de relatórios"
        });
      }

      res.json({
        success: true,
        reports: data || []
      });

    } catch (error) {
      console.error('Erro no endpoint histórico:', error);
      next(error);
    }
  });

  // Endpoint para buscar relatório específico
  app.get("/api/concierge/report/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('concierge_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar relatório:', error);
        return res.status(404).json({
          error: true,
          message: "Relatório não encontrado"
        });
      }

      res.json({
        success: true,
        report: data
      });

    } catch (error) {
      console.error('Erro no endpoint relatório:', error);
      next(error);
    }
  });
}

module.exports = {
  registerConciergeRoutes
};

