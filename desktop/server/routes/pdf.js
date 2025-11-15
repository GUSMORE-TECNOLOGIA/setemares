/**
 * Rotas de geração de PDF
 */

const { chromium } = require("playwright");

/**
 * Registra as rotas de PDF no app Express
 */
function registerPdfRoutes(app, pdfLimiter, validatePdfGeneration) {
  app.post("/api/generate-pdf", pdfLimiter, validatePdfGeneration, async (req, res, next) => {
    try {
      // Body já foi validado pelo middleware, usar diretamente
      const { html, htmlContent, filename, options } = req.body;
      const content = html || htmlContent; // Aceitar ambos os formatos
      const pdfFilename = filename || options?.filename || 'quote.pdf';

      if (!content) {
        const error = new Error("Missing html or htmlContent");
        error.status = 400;
        throw error;
      }

      const browser = await chromium.launch();
      const page = await browser.newPage();

      await page.setContent(content);

      const pdfOptions = options || {};
      const pdfBuffer = await page.pdf({
        format: pdfOptions.format || "A4",
        margin: pdfOptions.margin || { top: "18mm", right: "18mm", bottom: "18mm", left: "18mm" },
        printBackground: true,
      });

      await browser.close();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${pdfFilename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  });
}

module.exports = {
  registerPdfRoutes
};

