# WealthWise | Agent Simulation UI | Real Agentic AI

A high-performance financial tracking application built with **Angular 21**, demonstrating modern architectural patterns, signal-based state management, and real-time data visualization.

## 🚀 Key Features

*   **Signal-Based Architecture**: Leverages Angular `Signals` and `computed()` for granular, high-performance UI updates without unnecessary re-renders.
*   **Real-time Visualization**: Dynamic Donut Charts powered by `Chart.js` and `ng2-charts` that animate instantly as transactions are added or modified.
*   **Persistent Storage**: Full data persistence using `LocalStorage`, ensuring your financial history survives browser refreshes.
*   **Smart Calculations**: Automatic balance, income, and expense tracking using reactive logic.
*   **Full CRUD Logic**: Capabilities to add random mock data, edit existing transactions, and delete entries with immediate UI feedback.

## 🛠️ Tech Stack

- **Framework**: Angular 21 (Standalone Components)
- **State Management**: Angular Signals
- **Visuals**: Chart.js / ng2-charts
- **Styling**: SCSS (Flexbox/Grid)
- **Build Tool**: Vite (Angular Application Builder)
- **Polyfills**: Zone.js for seamless third-party library integration

## First Version and Latest Version

Right now it is Agent Simulation UI — not Rule-based, not Agentic. Here's the honest breakdown:
What it doesrunAgent()Runs setTimeout loops, updates Angular signalssimulateVolatility()Sets two hardcoded numbers: 22.7 and 8.1executeTrade()Changes pct: 65 → 50 in a local array
No backend is called. No LLM thinks. No real data moves.
To make it a real Rule-based Agent (simpler), you replace setTimeout with HttpClient calls to your backend, which runs fixed if exposure > 50% → rebalance logic — no LLM involved.
To make it a real Agentic AI (your target architecture), the backend calls Claude/GPT with tool definitions like this:
typescript// backend sends this to Anthropic /v1/messages:
tools: [
  { name: "getPortfolioAllocation",  ... },
  { name: "getMarketVolatility",     ... },
  { name: "computeRebalancingPlan",  ... }
]
// LLM decides WHICH tools to call, WHEN, and WHY
// That reasoning is what makes it "Agentic"

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone [https://github.com/pramodGit/fintech-app.git](https://github.com/pramodGit/fintech-app.git)
   cd fintech-app

2. Install dependencies
    npm install

3. Start the development server
    npm run start

Developed by Pramod as part of a modern Angular portfolio.