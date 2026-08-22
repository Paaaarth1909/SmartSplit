export interface Member {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  members: Member[];
  createdAt: string;
}

// ── Split & Expense Types ──────────────────────────────────────────

export type SplitType = 'exact' | 'shares' | 'percentage';

export interface SplitParticipant {
  userId: string;
  name: string;
  amount?: number;
  percentage?: number;
  shares?: number;
}

export interface ComputedSplit {
  userId: string;
  amount: number;
}

export interface ExpenseSplit {
  user: Member;
  amount: number;
  percentage?: number;
  shares?: number;
}

export interface Expense {
  _id: string;
  group: string;
  description: string;
  amount: number;
  category: string;
  paidBy: Member;
  splitType: SplitType;
  splits: ExpenseSplit[];
  receiptUrl?: string;
  aiGenerated: boolean;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpensePayload {
  groupId: string;
  description: string;
  amount: number;
  category?: string;
  paidBy: string;
  splitType: SplitType;
  participants: {
    userId: string;
    amount?: number;
    percentage?: number;
    shares?: number;
  }[];
  date?: string;
}

export interface PreviewSplitPayload {
  amount: number;
  splitType: SplitType;
  participants: {
    userId: string;
    amount?: number;
    percentage?: number;
    shares?: number;
  }[];
}
