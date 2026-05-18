import { Component, inject, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FinanceService } from '../services/finance.service';
import { WealthGuardService } from '../services/wealth-guard.service';
import { Transaction } from '../models/transaction.model';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements AfterViewChecked {
  private financeService = inject(FinanceService);
  readonly agent = inject(WealthGuardService);

  @ViewChild('logArea') logArea!: ElementRef<HTMLDivElement>;
  private prevLogLength = 0;

  // Finance signals
  transactions = this.financeService.allTransactions;
  totalBalance  = this.financeService.totalBalance;

  // Portfolio metrics (static for now — wire to live data service as needed)
  portfolioValue = 284500;

  // Derived
  riskScoreDisplay = computed(() => this.agent.riskScore().toFixed(1) + ' / 10');
  riskScoreClass   = computed(() => this.agent.riskScore() >= 7 ? 'danger' : this.agent.riskScore() >= 5 ? 'warn' : 'ok');
  techExposureClass = computed(() => this.agent.techExposure() > 55 ? 'danger' : 'ok');
  volatilityDisplay = computed(() => '±' + this.agent.volatility().toFixed(1) + '%');

  statusLabel = computed(() => {
    const s = this.agent.status();
    return s === 'monitoring' ? 'Monitoring' : s === 'scanning' ? 'Scanning' : 'Alert';
  });

  ngAfterViewChecked() {
    const log = this.agent.log();
    if (this.logArea && log.length !== this.prevLogLength) {
      this.prevLogLength = log.length;
      const el = this.logArea.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  // Agent actions
  runAgent()           { this.agent.runAgent(); }
  simulateVolatility() { this.agent.simulateVolatility(); }
  executeTrade()       { this.agent.executeTrade(); }

  // Finance actions
  generateMockTransaction() {
    const isIncome = Math.random() > 0.5;
    const amount = isIncome
      ? Math.floor(Math.random() * 500) + 100
      : -(Math.floor(Math.random() * 200) + 20);

    this.financeService.addTransaction({
      id: Math.random().toString(36).substring(2, 9),
      date: new Date(),
      amount,
      merchant: isIncome ? 'Freelance Client' : 'Retail Store',
      category: isIncome ? 'Income' : 'Expense',
      status: 'Completed'
    });
  }

  deleteTransaction(id: string) {
    if (confirm('Delete this transaction?')) {
      this.financeService.deleteTransaction(id);
    }
  }

  toggleTransactionType(item: Transaction) {
    const updated: Transaction = {
      ...item,
      amount: item.amount * -1,
      category: item.amount > 0 ? 'Expense' : 'Income'
    };
    this.financeService.updateTransaction(updated);
  }
}