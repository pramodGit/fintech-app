// proxy-server/server.js
// Run: node server.js
// This sits securely between your Angular app and Google Gemini

const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3003;

// ── Middleware & CORS ──────────────────────────────────────────────────────────

app.use(express.json({ limit: '2mb' }));

const corsOptions = {
  origin: [
    'http://localhost:4200',          // Angular dev server
    'http://localhost:4000',          // Angular SSR (if used)
    'https://fintech.pramod.click',   // Your production deployment domain
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS options globally
app.use(cors(corsOptions));

// Explicitly catch browser preflight OPTIONS requests early
app.options('*', cors(corsOptions));

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Main proxy endpoint ───────────────────────────────────────────────────────

app.post('/fintech-real-agentic', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY not set in .env file'
    });
  }

  try {
    // 1. Deconstruct the payload from your Angular service
    const { model, ...geminiPayload } = req.body;

    console.log(`\n🤖 [${new Date().toLocaleTimeString()}] Proxying Request`);
    console.log(`   Model: ${model}`);

    // 2. Dispatch to the official Google Developer API endpoint
    const googleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(geminiPayload) // Forwards contents, tools, systemInstruction, etc.
      }
    );

    const data = await googleResponse.json();

    // 3. Return Google's response directly back to your Angular app
    return res.status(googleResponse.status).json(data);

  } catch (err) {
    console.error('[proxy] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`✅ Gemini Secure Proxy running at http://localhost:${PORT}`);
  console.log(`   Angular   →   POST http://localhost:${PORT}/api/agent`);
  console.log(`   Proxy     →   POST https://generativelanguage.googleapis.com`);
  console.log(`=================================================`);
});