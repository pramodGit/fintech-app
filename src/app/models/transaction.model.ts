export type TransactionCategory = 'Income' | 'Expense';
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed';

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  merchant: string;
  category: TransactionCategory;
  status: TransactionStatus;
}