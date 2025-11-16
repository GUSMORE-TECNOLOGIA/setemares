/**
 * Validação server-side usando Zod
 * Aplica validação em todos os endpoints que recebem dados do cliente
 */

const { z } = require('zod');

// Schema para geração de relatório Concierge
const conciergeFormSchema = z.object({
  clientName: z.string()
    .min(1, 'Nome do cliente é obrigatório')
    .max(200, 'Nome do cliente muito longo'),
  
  destination: z.string()
    .min(1, 'Destino é obrigatório')
    .max(200, 'Destino muito longo'),
  
  checkin: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de check-in deve estar no formato YYYY-MM-DD'),
  
  checkout: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de check-out deve estar no formato YYYY-MM-DD'),
  
  travelType: z.enum(['lua_de_mel', 'familia', 'negocios', 'aventura', 'cultural', 'relaxamento'], {
    errorMap: () => ({ message: 'Tipo de viagem inválido' })
  }),
  
  budget: z.enum(['economico', 'medio', 'alto', 'luxo'], {
    errorMap: () => ({ message: 'Orçamento inválido' })
  }),
  
  adults: z.number()
    .int('Número de adultos deve ser inteiro')
    .min(1, 'Deve haver pelo menos 1 adulto')
    .max(20, 'Número máximo de adultos é 20'),
  
  children: z.number()
    .int('Número de crianças deve ser inteiro')
    .min(0, 'Número de crianças não pode ser negativo')
    .max(20, 'Número máximo de crianças é 20')
    .optional()
    .default(0),
  
  interests: z.array(z.string())
    .optional()
    .default([]),
  
  specialRequests: z.string()
    .max(1000, 'Solicitações especiais muito longas')
    .optional()
    .default('')
});

// Schema para geração de PDF
// Aceita tanto o formato novo (html) quanto o antigo (htmlContent) para compatibilidade
const pdfGenerationSchema = z.object({
  html: z.string()
    .min(1, 'HTML é obrigatório')
    .max(5000000, 'HTML muito grande (máximo 5MB)')
    .optional(),
  htmlContent: z.string()
    .min(1, 'HTML é obrigatório')
    .max(5000000, 'HTML muito grande (máximo 5MB)')
    .optional(),
  filename: z.string()
    .min(1, 'Nome do arquivo é obrigatório')
    .max(255, 'Nome do arquivo muito longo')
    .optional()
    .default('quote.pdf'),
  options: z.object({
    format: z.enum(['A4', 'Letter']).optional().default('A4'),
    margin: z.object({
      top: z.string().optional(),
      right: z.string().optional(),
      bottom: z.string().optional(),
      left: z.string().optional()
    }).optional()
  }).optional()
}).refine((data) => data.html || data.htmlContent, {
  message: 'html ou htmlContent é obrigatório'
});

// Middleware de validação genérico
function validateRequest(schema) {
  return (req, res, next) => {
    try {
      // Validar body
      const validated = schema.parse(req.body);
      
      // Substituir body pelo objeto validado (sanitizado)
      req.body = validated;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      // Erro inesperado
      console.error('Erro de validação:', error);
      return res.status(500).json({
        error: 'Erro interno de validação'
      });
    }
  };
}

// Middleware específico para Concierge
const validateConciergeForm = validateRequest(conciergeFormSchema);

// Middleware específico para PDF
const validatePdfGeneration = validateRequest(pdfGenerationSchema);

// Validação adicional para datas (checkout > checkin)
function validateDateRange(req, res, next) {
  if (req.body.checkin && req.body.checkout) {
    const checkin = new Date(req.body.checkin);
    const checkout = new Date(req.body.checkout);
    
    if (checkout <= checkin) {
      return res.status(400).json({
        error: 'Data de check-out deve ser posterior à data de check-in'
      });
    }
    
    // Validar que as datas são futuras (opcional, pode ser removido se necessário)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkin < today) {
      return res.status(400).json({
        error: 'Data de check-in não pode ser no passado'
      });
    }
  }
  
  next();
}

module.exports = {
  validateConciergeForm,
  validatePdfGeneration,
  validateDateRange,
  conciergeFormSchema,
  pdfGenerationSchema
};

