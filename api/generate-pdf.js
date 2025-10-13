// Serverless Function para geração de PDF via Playwright
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: true, message: 'Method not allowed' });
  }

  try {
    const { htmlContent, filename } = req.body;

    if (!htmlContent || !filename) {
      return res.status(400).json({
        error: true,
        message: "Missing htmlContent or filename"
      });
    }

    // Por enquanto, retornar erro informando que PDF via servidor não está disponível
    // O frontend deve usar o gerador de PDF local (@react-pdf/renderer)
    res.status(501).json({
      error: true,
      message: "PDF generation via server is not available. Please use client-side PDF generation."
    });

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Erro interno do servidor'
    });
  }
}

