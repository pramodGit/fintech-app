import { Injectable, signal } from '@angular/core';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: any;
}

export interface ToolCallLog {
  id: string;
  name: string;
  input: Record<string, any>;
  result: any;
  durationMs: number;
  timestamp: string;
}

export interface AgentThought {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'final';
  text: string;
  toolLog?: ToolCallLog;
}

export interface PortfolioState {
  totalValue: number;
  techExposure: number;
  riskScore: number;
  volatility: number;
  allocation: Record<string, number>;
  riskThreshold: number;
}

// ── Mock market data (replaces real broker API) ───────────────────────────────
// In production: swap each function body with a real HttpClient call

const MOCK_PORTFOLIO: PortfolioState = {
  totalValue: 284500,
  techExposure: 65,
  riskScore: 7.4,
  volatility: 18.2,
  riskThreshold: 50,
  allocation: {
    Tech: 65,
    Bonds: 5,
    Equities: 18,
    Commodities: 7,
    Cash: 5,
  },
};

function mockGetPortfolioAllocation(userId: string) {
  return {
    userId,
    totalValue: MOCK_PORTFOLIO.totalValue,
    allocation: MOCK_PORTFOLIO.allocation,
    lastUpdated: new Date().toISOString(),
  };
}

function mockGetMarketVolatility(symbol: string) {
  const data: Record<string, number> = {
    NASDAQ: MOCK_PORTFOLIO.volatility,
    'S&P500': 12.4,
    CRYPTO: 42.1,
  };
  return {
    symbol,
    volatility30d: data[symbol] ?? 15.0,
    trend: data[symbol] > 15 ? 'elevated' : 'normal',
    timestamp: new Date().toISOString(),
  };
}

function mockGetRiskProfile(userId: string) {
  return {
    userId,
    profileType: 'conservative',
    maxSectorExposure: MOCK_PORTFOLIO.riskThreshold,
    maxRiskScore: 5.5,
    currentRiskScore: MOCK_PORTFOLIO.riskScore,
    breached: MOCK_PORTFOLIO.riskScore > 5.5,
  };
}

function mockComputeRebalancingPlan(
  currentAllocation: Record<string, number>,
  targetRiskScore: number
) {
  return {
    feasible: true,
    targetRiskScore,
    projectedRiskScore: 5.1,
    trades: [
      { asset: 'Tech (FAANG ETF)', action: 'SELL', pct: 15, amount: 42675 },
      { asset: 'Bonds (AGG)',       action: 'BUY',  pct: 15, amount: 42675 },
    ],
    estimatedTaxImpact: 'minimal',
    settlementDays: 1,
  };
}

function mockExecuteTrade(trades: any[]) {
  return {
    status: 'executed',
    executedAt: new Date().toISOString(),
    trades: trades.map(t => ({ ...t, orderId: Math.random().toString(36).slice(2, 9) })),
    newRiskScore: 5.1,
    newAllocation: { Tech: 50, Bonds: 20, Equities: 18, Commodities: 7, Cash: 5 },
  };
}

// ── Tool registry ─────────────────────────────────────────────────────────────
// This is what we send to the LLM as "available tools"

export const TOOL_DEFINITIONS_ANTHROPIC = [
  {
    name: 'getPortfolioAllocation',
    description: 'Returns the current portfolio allocation and total value for a user.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'The user ID to fetch portfolio for' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'getMarketVolatility',
    description: 'Returns 30-day market volatility for a given symbol (NASDAQ, S&P500, CRYPTO).',
    input_schema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Market symbol to check volatility for' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'getRiskProfile',
    description: 'Returns the risk profile and thresholds for a user, including current breach status.',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'The user ID' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'computeRebalancingPlan',
    description: 'Computes an optimal rebalancing plan given current allocation and target risk score.',
    input_schema: {
      type: 'object',
      properties: {
        currentAllocation: {
          type: 'object',
          description: 'Current portfolio allocation as key-value pairs',
        },
        targetRiskScore: {
          type: 'number',
          description: 'Target risk score to achieve after rebalancing',
        },
      },
      required: ['currentAllocation', 'targetRiskScore'],
    },
  },
  {
    name: 'executeTrade',
    description: 'Executes a list of trades. Only call this after user confirmation.',
    input_schema: {
      type: 'object',
      properties: {
        trades: {
          type: 'array',
          description: 'Array of trade objects with asset, action (BUY/SELL), and amount',
        },
        userId: { type: 'string', description: 'The user ID authorizing the trade' },
      },
      required: ['trades', 'userId'],
    },
  },
];

// ── Tool executor — the bridge between LLM tool_use and real functions ────────

function executeTool(name: string, input: Record<string, any>): any {
  switch (name) {
    case 'getPortfolioAllocation':
      return mockGetPortfolioAllocation(input['userId']);
    case 'getMarketVolatility':
      return mockGetMarketVolatility(input['symbol']);
    case 'getRiskProfile':
      return mockGetRiskProfile(input['userId']);
    case 'computeRebalancingPlan':
      return mockComputeRebalancingPlan(input['currentAllocation'], input['targetRiskScore']);
    case 'executeTrade':
      return mockExecuteTrade(input['trades']);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ── Real Agentic AI Service ───────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class RealAgentService {
  // ── Public signals (reactive UI state) ──────────────────────────────────────
  readonly isRunning    = signal(false);
  readonly thoughts     = signal<AgentThought[]>([]);
  readonly toolCallLogs = signal<ToolCallLog[]>([]);
  readonly finalAnswer  = signal<string>('');
  readonly errorMsg     = signal<string>('');
  readonly turnCount    = signal(0);
  readonly portfolio    = signal<PortfolioState>({ ...MOCK_PORTFOLIO });

  // ── Multi-turn conversation history ─────────────────────────────────────────
  private conversationHistory: AgentMessage[] = [];

  private addThought(thought: AgentThought) {
    this.thoughts.update(prev => [...prev, thought]);
  }

  private now() {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
  }

  // ── Core agentic loop ────────────────────────────────────────────────────────
  // This is the real thing:
  //   1. Send user message + tool definitions to Claude
  //   2. If Claude returns tool_use → execute tool → send tool_result back
  //   3. Repeat until Claude returns a final text response (stop_reason = "end_turn")

  async runAgent(userPrompt: string) {
    this.isRunning.set(true);
    this.thoughts.set([]);
    this.toolCallLogs.set([]);
    this.finalAnswer.set('');
    this.errorMsg.set('');
    this.turnCount.set(0);

    // Add user message to history
    this.conversationHistory.push({ role: 'user', content: userPrompt });

    this.addThought({ type: 'thinking', text: `User: "${userPrompt}"` });

    try {
      await this.agentLoop();
    } catch (err: any) {
      this.errorMsg.set(err.message ?? 'Unknown error');
    } finally {
      this.isRunning.set(false);
    }
  }

  private async agentLoop() {
    const MAX_TURNS = 10; // safety limit — prevents infinite loops

    while (this.turnCount() < MAX_TURNS) {
      this.turnCount.update(n => n + 1);
      this.addThought({ type: 'thinking', text: `Turn ${this.turnCount()} — calling Claude...` });

      // ── Step 1: Call Claude API ──────────────────────────────────────────
      const response = await fetch('http://localhost:3000/api/agent', { // proxy — avoids CORS
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: `You are Wealth Guard, an autonomous financial risk management AI agent.
You have access to tools to inspect a user's portfolio, assess risk, and execute trades.
Always:
1. Call getPortfolioAllocation first to understand the current state
2. Check market volatility for relevant symbols
3. Get the user's risk profile to understand their thresholds
4. If risk is breached, compute a rebalancing plan
5. Only call executeTrade if the user explicitly asks to execute
Be concise and precise. Use numbers. Explain your reasoning.`,
          messages: this.conversationHistory,
          tools: TOOL_DEFINITIONS_ANTHROPIC,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`API error ${response.status}: ${err.error?.message}`);
      }

      const data = await response.json();

      // Add Claude's response to conversation history
      this.conversationHistory.push({ role: 'assistant', content: data.content });

      // ── Step 2: Handle response content blocks ───────────────────────────
      const toolUseBlocks = data.content.filter((b: any) => b.type === 'tool_use');
      const textBlocks    = data.content.filter((b: any) => b.type === 'text');

      // Log any text Claude emitted (thinking out loud)
      for (const block of textBlocks) {
        if (block.text?.trim()) {
          this.addThought({ type: 'thinking', text: block.text });
        }
      }

      // ── Step 3: If stop_reason is "end_turn" — we're done ───────────────
      if (data.stop_reason === 'end_turn') {
        const finalText = textBlocks.map((b: any) => b.text).join('\n');
        this.finalAnswer.set(finalText);
        this.addThought({ type: 'final', text: finalText });
        break;
      }

      // ── Step 4: Execute each tool_use block ──────────────────────────────
      if (toolUseBlocks.length === 0) break; // no tools and not end_turn — bail

      const toolResults: any[] = [];

      for (const toolUse of toolUseBlocks) {
        const startMs = Date.now();

        this.addThought({
          type: 'tool_call',
          text: `Calling ${toolUse.name}(${JSON.stringify(toolUse.input)})`,
        });

        // Execute the actual tool (mock or real)
        const result = executeTool(toolUse.name, toolUse.input);
        const durationMs = Date.now() - startMs;

        // Log for the UI
        const log: ToolCallLog = {
          id: toolUse.id,
          name: toolUse.name,
          input: toolUse.input,
          result,
          durationMs,
          timestamp: this.now(),
        };
        this.toolCallLogs.update(prev => [...prev, log]);
        this.addThought({
          type: 'tool_result',
          text: `${toolUse.name} → ${JSON.stringify(result).slice(0, 120)}...`,
          toolLog: log,
        });

        // Build tool_result to send back to Claude
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      // ── Step 5: Send tool results back — continue the loop ───────────────
      this.conversationHistory.push({ role: 'user', content: toolResults });
    }
  }

  // ── Follow-up conversation (maintains history) ───────────────────────────────
  async sendFollowUp(message: string) {
    this.conversationHistory.push({ role: 'user', content: message });
    this.finalAnswer.set('');
    this.thoughts.update(prev => [
      ...prev,
      { type: 'thinking', text: `Follow-up: "${message}"` },
    ]);
    this.isRunning.set(true);
    try {
      await this.agentLoop();
    } finally {
      this.isRunning.set(false);
    }
  }

  // ── Reset for a fresh session ────────────────────────────────────────────────
  reset() {
    this.conversationHistory = [];
    this.thoughts.set([]);
    this.toolCallLogs.set([]);
    this.finalAnswer.set('');
    this.errorMsg.set('');
    this.turnCount.set(0);
    this.isRunning.set(false);
  }
}