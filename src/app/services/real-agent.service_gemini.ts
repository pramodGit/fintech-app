import { Injectable, signal } from '@angular/core';

// ── Types (Migrated for Gemini Schema Specifications) ──────────────────────────

export interface GeminiPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, any>;
  };
  functionResponse?: {
    name: string;
    response: any;
  };
}

export interface AgentMessage {
  role: 'user' | 'model' | 'function'; // Gemini roles standard format
  parts: GeminiPart[];
}

export interface ToolCallLog {
  id: string; // Map tracking ID for the UI
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

// ── Mock Market Data (Unchanged Functional Implementations) ───────────────────

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
    userId: userId ?? 'USR-992',
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
    symbol: symbol ?? 'NASDAQ',
    volatility30d: data[symbol] ?? 15.0,
    trend: data[symbol] > 15 ? 'elevated' : 'normal',
    timestamp: new Date().toISOString(),
  };
}

function mockGetRiskProfile(userId: string) {
  return {
    userId: userId ?? 'USR-992',
    profileType: 'conservative',
    maxSectorExposure: MOCK_PORTFOLIO.riskThreshold,
    maxRiskScore: 5.5,
    currentRiskScore: MOCK_PORTFOLIO.riskScore,
    breached: MOCK_PORTFOLIO.riskScore > 5.5,
  };
}

function mockComputeRebalancingPlan(currentAllocation: any, targetRiskScore: number) {
  return {
    feasible: true,
    targetRiskScore: targetRiskScore ?? 5.5,
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
    trades: trades ?? [
      { asset: 'Tech (FAANG ETF)', action: 'SELL', amount: 42675 },
      { asset: 'Bonds (AGG)', action: 'BUY', amount: 42675 }
    ],
    newRiskScore: 5.1,
    newAllocation: { Tech: 50, Bonds: 20, Equities: 18, Commodities: 7, Cash: 5 },
  };
}

// ── Gemini Declared Global Tool Registry ──────────────────────────────────────

export const GEMINI_TOOL_DEFINITIONS = [
  {
    name: 'getPortfolioAllocation',
    description: 'Retrieves the user current asset distribution and portfolio breakdown by sectors.',
    parameters: { type: 'OBJECT', properties: {} }
  },
  {
    name: 'getMarketVolatility',
    description: 'Checks the current market volatility index or standard deviation for a specific stock symbol.',
    parameters: {
      type: 'OBJECT',
      properties: {
        symbol: { type: 'STRING', description: 'The ticker symbol or index to evaluate volatility for (e.g. "NASDAQ").' }
      },
      required: ['symbol']
    }
  },
  {
    name: 'getUserRiskProfile',
    description: "Fetches the user's declared financial risk tolerance threshold values.",
    parameters: { type: 'OBJECT', properties: {} }
  },
  {
    name: 'computeRebalancingPlan',
    description: 'Computes a portfolio asset rebalancing allocation layout map configuration based on current parameters.',
    parameters: {
      type: 'OBJECT',
      properties: {
        currentAllocation: { type: 'OBJECT', description: 'Current allocation key-value distribution.' },
        targetRiskScore: { type: 'NUMBER', description: 'The safe target numeric risk index limit.' }
      },
      required: ['currentAllocation', 'targetRiskScore']
    }
  },
  {
    name: 'executeTrade',
    description: 'Executes a functional financial portfolio asset balancing trade layout modification array.',
    parameters: {
      type: 'OBJECT',
      properties: {
        trades: {
          type: 'ARRAY',
          description: 'The array payload block configuration listing the targeted rebalancing items.',
          items: { type: 'OBJECT' }
        }
      },
      required: ['trades']
    }
  }
];

function executeTool(name: string, input: Record<string, any>): any {
  switch (name) {
    case 'getPortfolioAllocation':
      return mockGetPortfolioAllocation(input['userId']);
    case 'getMarketVolatility':
      return mockGetMarketVolatility(input['symbol']);
    case 'getUserRiskProfile':
      return mockGetRiskProfile(input['userId']);
    case 'computeRebalancingPlan':
      return mockComputeRebalancingPlan(input['currentAllocation'], input['targetRiskScore']);
    case 'executeTrade':
      return mockExecuteTrade(input['trades']);
    default:
      return { error: `Unknown tool engine target configuration line: ${name}` };
  }
}

// ── Core Gemini Agentic Service ───────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class RealAgentService {
  readonly isRunning    = signal(false);
  readonly thoughts     = signal<AgentThought[]>([]);
  readonly toolCallLogs = signal<ToolCallLog[]>([]);
  readonly finalAnswer  = signal<string>('');
  readonly errorMsg     = signal<string>('');
  readonly turnCount    = signal(0);
  readonly portfolio    = signal<PortfolioState>({ ...MOCK_PORTFOLIO });

  private conversationHistory: AgentMessage[] = [];

  private addThought(thought: AgentThought) {
    this.thoughts.update(prev => [...prev, thought]);
  }

  private now() {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
  }

  async runAgent(userPrompt: string) {
    this.isRunning.set(true);
    this.thoughts.set([]);
    this.toolCallLogs.set([]);
    this.finalAnswer.set('');
    this.errorMsg.set('');
    this.turnCount.set(0);

    this.conversationHistory.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });

    this.addThought({ type: 'thinking', text: `User: "${userPrompt}"` });

    try {
      await this.agentLoop();
    } catch (err: any) {
      this.errorMsg.set(err.message ?? 'Unknown execution loop error condition.');
    } finally {
      this.isRunning.set(false);
    }
  }

  private async agentLoop() {
    const MAX_TURNS = 10;

    while (this.turnCount() < MAX_TURNS) {
      this.turnCount.update(n => n + 1);
      this.addThought({ type: 'thinking', text: `Turn ${this.turnCount()} — running Gemini AI routing...` });

      // ── Step 1: Request Node Proxy (Configured with Gemini Payload Structural Schemas) ──
      const response = await fetch('http://localhost:3000/api/agent', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          contents: this.conversationHistory,
          tools: [{ functionDeclarations: GEMINI_TOOL_DEFINITIONS }],
          systemInstruction: {
            parts: [{ 
              text: `You are Wealth Guard, an autonomous financial risk management AI agent.
              You have access to tools to inspect a user's portfolio, assess risk, and execute trades.
              Always:
              1. Call getPortfolioAllocation first to understand the current state
              2. Check market volatility for relevant symbols
              3. Get the user's risk profile to understand their thresholds
              4. If risk is breached, compute a rebalancing plan
              5. Only call executeTrade if the user explicitly asks to execute
              Be concise and precise. Use numbers. Explain your reasoning.` 
            }]
          },
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.15
          }
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`API Endpoint Core Failure Response status code ${response.status}: ${JSON.stringify(err)}`);
      }

      const data = await response.json();
      
      const candidate = data.candidates?.[0];
      const modelContent = candidate?.content;

      if (!modelContent) {
        throw new Error('Empty payload candidates returned from internal proxy parser logic.');
      }

      // Sync the conversation context stack safely inside memory array
      this.conversationHistory.push({
        role: 'model',
        parts: modelContent.parts
      });

      // Split responses into text declarations and functional tools
      const textParts = modelContent.parts.filter((p: any) => p.text);
      const functionCallParts = modelContent.parts.filter((p: any) => p.functionCall);

      // Stream current output logic block steps to view signals
      for (const part of textParts) {
        this.addThought({ type: 'thinking', text: part.text });
      }

      // ── Step 2: Final Turn Termination Logic Break Condition Check ──
      if (functionCallParts.length === 0) {
        const finalAnswerMerged = textParts.map((p: any) => p.text).join('\n');
        this.finalAnswer.set(finalAnswerMerged);
        this.addThought({ type: 'final', text: finalAnswerMerged });
        break;
      }

      // ── Step 3: Iterate Function Calls Natively ──
      for (const callPart of functionCallParts) {
        const toolCall = callPart.functionCall;
        const startMs = Date.now();
        const trackingId = `call-${Math.random().toString(36).substring(5)}`;

        this.addThought({
          type: 'tool_call',
          text: `Executing autonomous proxy utility: ${toolCall.name}(${JSON.stringify(toolCall.args)})`,
        });

        const result = executeTool(toolCall.name, toolCall.args);
        const durationMs = Date.now() - startMs;

        // If data mutation occurs (e.g. executing trades), refresh application core signals
        if (toolCall.name === 'executeTrade' && result.status === 'executed') {
          this.portfolio.set({
            totalValue: MOCK_PORTFOLIO.totalValue,
            techExposure: result.newAllocation.Tech,
            riskScore: result.newRiskScore,
            volatility: MOCK_PORTFOLIO.volatility,
            riskThreshold: MOCK_PORTFOLIO.riskThreshold,
            allocation: result.newAllocation
          });
        }

        const log: ToolCallLog = {
          id: trackingId,
          name: toolCall.name,
          input: toolCall.args,
          result,
          durationMs,
          timestamp: this.now(),
        };

        this.toolCallLogs.update(prev => [...prev, log]);
        this.addThought({
          type: 'tool_result',
          text: `${toolCall.name} returned functional response data structural state mapping...`,
          toolLog: log,
        });

        // ── Step 4: Map responses back to standard functional structure ──
        this.conversationHistory.push({
          role: 'function',
          parts: [{
            functionResponse: {
              name: toolCall.name,
              response: result
            }
          }]
        });
      }
    }
  }

  async sendFollowUp(message: string) {
    this.conversationHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });
    this.finalAnswer.set('');
    this.thoughts.update(prev => [
      ...prev,
      { type: 'thinking', text: `Follow-up query string: "${message}"` },
    ]);
    this.isRunning.set(true);
    try {
      await this.agentLoop();
    } finally {
      this.isRunning.set(false);
    }
  }

  reset() {
    this.conversationHistory = [];
    this.thoughts.set([]);
    this.toolCallLogs.set([]);
    this.finalAnswer.set('');
    this.errorMsg.set('');
    this.turnCount.set(0);
    this.isRunning.set(false);
    this.portfolio.set({ ...MOCK_PORTFOLIO });
  }
}