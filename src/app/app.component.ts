import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from './services/finance.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Transaction } from './models/transaction.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private financeService = inject(FinanceService);

  // Expose signals to the template
  transactions = this.financeService.allTransactions;
  totalBalance = this.financeService.totalBalance;

  // Add these to your AppComponent class
  deleteTransaction(id: string) {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.financeService.deleteTransaction(id);
    }
  }

  // Basic edit: Just toggles the amount between positive and negative for testing
  toggleTransactionType(item: Transaction) {
    const updated = { ...item, amount: item.amount * -1, category: item.amount > 0 ? 'Expense' : 'Income' as any };
    this.financeService.updateTransaction(updated);
  }

  // Transform transactions into Donut Chart data
  chartData = computed<ChartData<'doughnut'>>(() => {
    const data = this.transactions();
    const income = data
      .filter(t => t.category === 'Income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expense = Math.abs(
      data.filter(t => t.category === 'Expense')
      .reduce((acc, t) => acc + t.amount, 0)
    );

    return {
      labels: ['Income', 'Expenses'],
      datasets: [{
        data: [income, expense],
        backgroundColor: ['#00e676', '#ff5252'],
        hoverBackgroundColor: ['#00c853', '#ff1744'],
        borderWidth: 0
      }]
    };
  });

  chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  generateMockTransaction() {
    const isIncome = Math.random() > 0.5;
    const amount = isIncome ? Math.floor(Math.random() * 500) + 100 : -(Math.floor(Math.random() * 200) + 20);
    
    this.financeService.addTransaction({
      id: Math.random().toString(36).substring(2, 9),
      date: new Date(),
      amount: amount,
      merchant: isIncome ? 'Freelance Client' : 'Retail Store',
      category: isIncome ? 'Income' : 'Expense',
      status: 'Completed'
    });
  }
}