export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  category: 'Investment' | 'Income' | 'Expense' | 'Transfer';
  merchant: string;
  status: 'Completed' | 'Pending' | 'Flagged';
}