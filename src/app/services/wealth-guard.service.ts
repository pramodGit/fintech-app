import { Injectable, signal, computed } from '@angular/core';

export interface AgentLogEntry {
  time: string;
  message: string;
  type: 'info' | 'alert' | 'ok';
}

export interface AllocationItem {
  label: string;
  pct: number;
  color: string;
}

export interface RebalancingRow {
  asset: string;
  current: string;
  target: string;
  action: string;
  actionType: 'sell' | 'buy' | 'none';
}

export type AgentStatus = 'monitoring' | 'scanning' | 'alert';

@Injectable({ providedIn: 'root' })
export class WealthGuardService {
  private _status = signal<AgentStatus>('alert');
  private _thinking = signal(false);
  private _thinkingLabel = signal('');
  private _agentVisible = signal(true);
  private _toolsDone = signal(true);
  private _execSuccess = signal(false);
  private _techExposure = signal(65);
  private _riskScore = signal(7.4);
  private _volatility = signal(18.2);

  private _log = signal<AgentLogEntry[]>([
    { time: '09:00', message: 'Agent started. Monitoring portfolio.', type: 'ok' },
    { time: '09:01', message: 'Fetched market data feed.', type: 'info' },
    { time: '09:03', message: 'Called getPortfolioAllocation()', type: 'info' },
    { time: '09:04', message: 'Called getRiskProfile(userId)', type: 'info' },
    { time: '09:05', message: '⚠ Tech exposure 65% > threshold 50%', type: 'alert' },
    { time: '09:05', message: '⚠ Market volatility elevated', type: 'alert' },
    { time: '09:06', message: 'Generating rebalancing plan…', type: 'info' },
  ]);

  private _allocation = signal<AllocationItem[]>([
    { label: 'Tech',        pct: 65, color: '#E24B4A' },
    { label: 'Bonds',       pct: 5,  color: '#1D9E75' },
    { label: 'Equities',    pct: 18, color: '#378ADD' },
    { label: 'Commodities', pct: 7,  color: '#BA7517' },
    { label: 'Cash',        pct: 5,  color: '#888780' },
  ]);

  readonly rebalancingPlan: RebalancingRow[] = [
    { asset: 'Tech (FAANG ETF)',  current: '65%', target: '50%', action: '↓ Sell $42,675',  actionType: 'sell' },
    { asset: 'Bonds (AGG)',       current: '5%',  target: '20%', action: '↑ Buy $42,675',   actionType: 'buy'  },
    { asset: 'Equities (S&P 500)',current: '18%', target: '18%', action: '— No change',      actionType: 'none' },
    { asset: 'Commodities',       current: '7%',  target: '7%',  action: '— No change',      actionType: 'none' },
    { asset: 'Cash',              current: '5%',  target: '5%',  action: '— No change',      actionType: 'none' },
  ];

  readonly status = this._status.asReadonly();
  readonly thinking = this._thinking.asReadonly();
  readonly thinkingLabel = this._thinkingLabel.asReadonly();
  readonly agentVisible = this._agentVisible.asReadonly();
  readonly toolsDone = this._toolsDone.asReadonly();
  readonly execSuccess = this._execSuccess.asReadonly();
  readonly log = this._log.asReadonly();
  readonly allocation = this._allocation.asReadonly();
  readonly techExposure = this._techExposure.asReadonly();
  readonly riskScore = this._riskScore.asReadonly();
  readonly volatility = this._volatility.asReadonly();

  private now(): string {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  private addLog(message: string, type: AgentLogEntry['type'] = 'info') {
    this._log.update(prev => [...prev, { time: this.now(), message, type }]);
  }

  private sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

  async runAgent() {
    this._status.set('scanning');
    this._thinking.set(true);
    this._agentVisible.set(false);
    this._execSuccess.set(false);
    this._toolsDone.set(false);

    const steps = [
      { label: 'Calling getPortfolioAllocation()…',       log: 'Called getPortfolioAllocation()',                         type: 'info' as const },
      { label: 'Fetching getMarketVolatility("NASDAQ")…', log: 'Called getMarketVolatility("NASDAQ") → 18.2%',            type: 'info' as const },
      { label: 'Fetching getRiskProfile(user_id)…',       log: 'Called getRiskProfile() → conservative threshold 50%',    type: 'info' as const },
      { label: 'Running computeRebalancingPlan()…',        log: 'Called computeRebalancingPlan() → rebalance ready',       type: 'ok'   as const },
    ];

    for (const step of steps) {
      this._thinkingLabel.set(step.label);
      this.addLog(step.log, step.type);
      await this.sleep(900);
    }

    this._toolsDone.set(true);
    this._status.set('alert');
    this.addLog('⚠ Risk threshold exceeded. Drafting recommendation.', 'alert');
    this._thinking.set(false);
    this._agentVisible.set(true);
  }

  simulateVolatility() {
    this.addLog('NASDAQ spike detected: +4.2% intraday swing', 'alert');
    this._volatility.set(22.7);
    this._riskScore.set(8.1);
    this.addLog('Risk score updated to 8.1. Re-running analysis.', 'alert');
    setTimeout(() => this.runAgent(), 600);
  }

  executeTrade() {
    this.addLog('Executing: SELL $42,675 FAANG ETF', 'alert');
    this.addLog('Executing: BUY $42,675 AGG Bonds', 'ok');

    setTimeout(() => {
      this._allocation.update(prev => prev.map(a =>
        a.label === 'Tech'  ? { ...a, pct: 50, color: '#1D9E75' } :
        a.label === 'Bonds' ? { ...a, pct: 20 } : a
      ));
      this._techExposure.set(50);
      this._riskScore.set(5.1);
      this._execSuccess.set(true);
      this._agentVisible.set(false);
      this._status.set('monitoring');
      this.addLog('✓ Trade executed. Portfolio rebalanced.', 'ok');
    }, 1800);
  }
}