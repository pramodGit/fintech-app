# WealthWise — Agentic AI FinTech Platform

A modern Angular application demonstrating the **full spectrum of Agentic AI** — from a polished UI simulation to a real LLM-powered agent loop using gemini-2.5-flash/Claude claude-sonnet-4-20250514 with live tool calls.

---

## What's Inside

| Route | Mode | Description |
|---|---|---|
| `/dashboard` | Agent Simulation UI | Signals, hardcoded data, `setTimeout` animations |
| `/real-agent` | Real Agentic AI · `tool_use` loop · live reasoning trace |

Both routes share the same Angular architecture so you can see exactly what changes when you go from simulation to real intelligence.

---

## Architecture Comparison

```
SIMULATION (what you see on /dashboard)
────────────────────────────────────────
Angular UI (Signals)
    ↓
WealthGuardService
    ↓  setTimeout / hardcoded values
Fake tool call animation
    ↓
Static data (65%, 7.4/10 — written in code)

No backend. No LLM. No real data.


REAL AGENTIC AI (what you see on /real-agent)
──────────────────────────────────────────────
Angular UI (Signals + HttpClient)
    ↓
RealAgentService.agentLoop()
    ↓  POST /v1/messages + tool definitions
Gemini gemini-2.5-flash || Claude claude-sonnet-4-20250514 (LLM)
    ↓  returns { type: "tool_use", name: "getPortfolioAllocation" }
Tool executor (mock → swap for real broker API)
    ↓  returns { type: "tool_result", content: "..." }
LLM reasons → next tool or final answer
    ↓  stop_reason: "end_turn"
Final recommendation rendered in UI
```

---

## What "Agentic" Actually Means

The three simulation actions vs. what replaces them in the real agent:

| Simulation | What it does | Real agent equivalent |
|---|---|---|
| `runAgent()` | `setTimeout` loop, updates signals | POST to `/v1/messages` → LLM decides which tools to call |
| `simulateVolatility()` | Sets `22.7` and `8.1` in memory | `getMarketVolatility("NASDAQ")` → live API data returned to LLM |
| `executeTrade()` | Changes `pct: 65 → 50` in array | `executeTrade()` tool called **only if LLM decides** after reasoning |

The key difference: in a real agent, the **LLM decides** which tools to call, when, and in what order — based on what it finds at each step. That reasoning loop is what makes it Agentic.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21+ (Standalone Components) |
| State | Angular Signals · `computed()` · `effect()` |
| Routing | Angular Router (lazy-loaded routes) |
| Styling | SCSS · CSS custom properties · Flexbox/Grid |
| Fonts | DM Mono · Fraunces (dashboard) · JetBrains Mono · Syne (agent) |
| LLM via `/v1/messages` |
| Tool calling | `tool_use` / `tool_result` multi-turn loop |
| Persistence | `localStorage` (transactions) |
| Build | Angular Application Builder (Vite) |

> **Removed**: `ng2-charts` and `Chart.js` — the donut chart is now a pure SVG arc,
> no library dependency needed.

---

## Project Structure

```
src/
├── main.ts                          ← bootstraps AppShellComponent
└── app/
    ├── app.config.ts                ← provideRouter setup
    ├── app.routes.ts                ← /dashboard and /real-agent routes
    ├── app-shell.component.ts       ← sticky nav + <router-outlet>
    │
    ├── app.component.ts             ← Simulation dashboard component
    ├── app.component.html
    ├── app.component.scss
    │
    ├── real-agent/
    │   ├── real-agent.component.ts  ← Real Agentic AI component
    │   ├── real-agent.component.html
    │   ├── real-agent.component.scss
    │   └── real-agent.service.ts    ← agentLoop(), tool executor, signals
    │
    ├── services/
    │   ├── finance.service.ts       ← transactions signal + localStorage
    │   └── wealth-guard.service.ts  ← simulation agent signals
    │
    └── models/
        └── transaction.model.ts
```

---

## 📦 Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/pramodGit/fintech-app.git
cd fintech-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run start
```

Open [http://localhost:4200](http://localhost:4200) — you'll land on the simulation dashboard.
Navigate to [http://localhost:4200/real-agent](http://localhost:4200/real-agent) for the real agent.

---

## Going to Production

The `real-agent.service.ts` has mock functions for each tool:

```typescript
// Current — mock data
function mockGetPortfolioAllocation(userId: string) {
  return { totalValue: 284500, allocation: { Tech: 65, Bonds: 5 ... } };
}

// Production — real broker API
async function getPortfolioAllocation(userId: string) {
  return this.http.get(`/api/portfolio/${userId}`).toPromise();
}
```

Replace each `mock*` function body with a real `HttpClient` call to your broker API (Alpaca, Interactive Brokers, Bloomberg) and the full agentic loop works with live data — no other changes needed.

---

## Key Features

- **Signal-based architecture** — `signal()`, `computed()`, `effect()` throughout; no RxJS, no NgRx
- **Wealth Guard dashboard** — portfolio metrics, allocation bars, live agent log, animated tool chips
- **Real agent loop** — multi-turn `tool_use` → `tool_result` cycle with LLM, visible in the tool call inspector
- **Side-by-side learning** — both routes are intentionally structured so you can diff the simulation vs. real implementation
- **Full CRUD** — add, flip, delete transactions with immediate reactive UI updates
- **Persistent storage** — transactions survive browser refresh via `localStorage`
- **Responsive** — works at 480px+

---

## Routes

```
localhost:4200/             → redirects to /dashboard
localhost:4200/dashboard    → Simulation UI  (Mock badge)
localhost:4200/real-agent   → Real Agentic AI (Live badge)
```

---

*Developed by Pramod · Angular + Agentic AI portfolio project*
