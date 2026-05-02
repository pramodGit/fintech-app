import { Injectable, signal, computed, effect } from '@angular/core';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private STORAGE_KEY = 'wealthwise_transactions';

  // 1. Initialize Signal with data from LocalStorage (or defaults if empty)
  private transactions = signal<Transaction[]>(this.loadFromStorage());

  constructor() {
    // 2. Use an 'effect' to automatically save to storage whenever the signal changes
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.transactions()));
    });
  }

  readonly allTransactions = this.transactions.asReadonly();
  
  readonly totalBalance = computed(() => 
    this.transactions().reduce((acc, t) => acc + t.amount, 0)
  );

  addTransaction(t: Transaction) {
    this.transactions.update(prev => [t, ...prev]); // [t, ...prev] puts new ones at the top!
  }

  // Add these to your FinanceService class
  deleteTransaction(id: string) {
    this.transactions.update(prev => prev.filter(t => t.id !== id));
  }

  updateTransaction(updated: Transaction) {
    this.transactions.update(prev => 
      prev.map(t => t.id === updated.id ? updated : t)
    );
  }

  // 3. Helper to pull data from the browser
  private loadFromStorage(): Transaction[] {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : [
      { id: '1', date: new Date(), amount: 1500.50, category: 'Income', merchant: 'Initial Balance', status: 'Completed' }
    ];
  }
}