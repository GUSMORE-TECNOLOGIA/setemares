const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cors = require("cors");
const { chromium } = require("playwright");

const app = express();

// Logs básicos
app.use(morgan("combined"));

// Segurança de headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Rate limit (ajuste por necessidade)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS restrito
const ALLOWED_ORIGINS = [
  "https://sete-mares.app.br",
  "http://localhost:5173",
];
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("CORS not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/generate-pdf", async (req, res, next) => {
  try {
    const { htmlContent, filename } = req.body ?? {};

    if (!htmlContent || !filename) {
      const error = new Error("Missing htmlContent or filename");
      error.status = 400;
      throw error;
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.setContent(htmlContent);

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "18mm", right: "18mm", bottom: "18mm", left: "18mm" },
      printBackground: true,
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const code = err.status || 500;
  res.status(code).json({ error: true, message: err.message || "Server error" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server up on :${PORT}`);
});
