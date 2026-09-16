export interface NetBalance {
  userId: string;
  name?: string;
  netAmount: number; // positive means they are owed, negative means they owe
}

export interface Settlement {
  from: string;
  fromName?: string;
  to: string;
  toName?: string;
  amount: number;
}

export function calculateSettlements(balances: NetBalance[]): Settlement[] {
  const debtors = balances.filter(b => b.netAmount < -0.01).map(b => ({ ...b }));
  const creditors = balances.filter(b => b.netAmount > 0.01).map(b => ({ ...b }));
  
  // Sort by largest amounts first to minimize transactions
  debtors.sort((a, b) => a.netAmount - b.netAmount); // most negative first
  creditors.sort((a, b) => b.netAmount - a.netAmount); // most positive first

  const settlements: Settlement[] = [];
  let dIndex = 0;
  let cIndex = 0;

  while (dIndex < debtors.length && cIndex < creditors.length) {
    const debtor = debtors[dIndex];
    const creditor = creditors[cIndex];

    const amountToSettle = Math.min(Math.abs(debtor.netAmount), creditor.netAmount);

    if (amountToSettle > 0.01) {
      settlements.push({
        from: debtor.userId,
        fromName: debtor.name,
        to: creditor.userId,
        toName: creditor.name,
        amount: Number(amountToSettle.toFixed(2))
      });
    }

    debtor.netAmount += amountToSettle;
    creditor.netAmount -= amountToSettle;

    if (Math.abs(debtor.netAmount) < 0.01) dIndex++;
    if (creditor.netAmount < 0.01) cIndex++;
  }

  return settlements;
}
