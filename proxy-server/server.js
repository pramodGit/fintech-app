// proxy-server/server.js
// Run: node server.js
// This sits between your Angular app and api.anthropic.com

const express  = require('express');
const cors     = require('cors');
const fetch    = require('node-fetch');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json({ limit: '2mb' }));

// Allow requests from Angular dev server
app.use(cors({
  origin: [
    'http://localhost:4200',   // Angular dev server
    'http://localhost:4000',   // Angular SSR (if used)
    process.env.FRONTEND_URL, // production frontend URL
  ].filter(Boolean),
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Main proxy endpoint ───────────────────────────────────────────────────────
// Angular calls POST /api/agent
// This server forwards it to Anthropic and returns the response

app.post('/api/agent', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY not set in .env file'
    });
  }

  try {
    // const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type':         'application/json',
    //     'x-api-key':            apiKey,
    //     'anthropic-version':    '2023-06-01',
    //   },
    //   body: JSON.stringify(req.body), // forward exactly what Angular sent
    // });

    // const data = await anthropicRes.json();

    // if (!anthropicRes.ok) {
    //   return res.status(anthropicRes.status).json(data);
    // }

    // res.json(data);

    // 1. Extract the model parameter and the rest of the payload from Angular
    const { model, ...geminiPayload } = req.body;

    // Make the actual request to the official Google Developer API endpoint
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

    // 4. Return Google's response directly back to your Angular app
    return res.status(googleResponse.status).json(data);

  } catch (err) {
    console.error('[proxy] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅  Proxy running at http://localhost:${PORT}`);
  console.log(`    Angular  →  POST http://localhost:${PORT}/api/agent`);
  console.log(`    Proxy    →  POST https://api.anthropic.com/v1/messages`);
});