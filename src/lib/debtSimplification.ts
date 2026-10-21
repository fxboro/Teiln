import { User, Expense, Settlement, SimplifiedDebt } from '../types';

export interface GroupBalancesResult {
  netBalances: Record<string, number>;
  simplifiedDebts: SimplifiedDebt[];
  totalGroupSpent: number;
}

/**
 * Calculates net balances and applies a greedy debt simplification algorithm
 * to minimize the number of required settlements across group members.
 */
export function calculateBalances(
  memberIds: string[],
  expenses: Expense[],
  settlements: Settlement[],
  usersMap: Record<string, User>
): GroupBalancesResult {
  const netBalances: Record<string, number> = {};

  // Initialize all members with 0 net balance
  for (const id of memberIds) {
    netBalances[id] = 0;
  }

  let totalGroupSpent = 0;

  // Process expenses
  for (const exp of expenses) {
    totalGroupSpent += exp.amount;

    // The person who paid is credited the full amount
    if (netBalances[exp.paid_by_user_id] === undefined) {
      netBalances[exp.paid_by_user_id] = 0;
    }
    netBalances[exp.paid_by_user_id] += exp.amount;

    // Each member included in splits is debited their share
    if (exp.splits && exp.splits.length > 0) {
      for (const split of exp.splits) {
        if (netBalances[split.user_id] === undefined) {
          netBalances[split.user_id] = 0;
        }
        netBalances[split.user_id] -= split.amount;
      }
    } else {
      // Fallback: split equally among all members if splits array missing
      const perPerson = exp.amount / (memberIds.length || 1);
      for (const id of memberIds) {
        netBalances[id] -= perPerson;
      }
    }
  }

  // Process settlements
  for (const s of settlements) {
    if (netBalances[s.payer_id] === undefined) {
      netBalances[s.payer_id] = 0;
    }
    if (netBalances[s.receiver_id] === undefined) {
      netBalances[s.receiver_id] = 0;
    }
    // Payer sent money -> their balance improves (less debt or more credit)
    netBalances[s.payer_id] += s.amount;
    // Receiver got money -> their credit decreases
    netBalances[s.receiver_id] -= s.amount;
  }

  // Round balances to 2 decimal places to avoid floating point precision artifacts
  for (const id of Object.keys(netBalances)) {
    netBalances[id] = Math.round(netBalances[id] * 100) / 100;
  }

  // Debt Simplification (Minimizing transactions)
  // Split into debtors (< -0.01) and creditors (> 0.01)
  interface BalanceNode {
    id: string;
    amount: number;
  }

  const debtors: BalanceNode[] = [];
  const creditors: BalanceNode[] = [];

  for (const [id, net] of Object.entries(netBalances)) {
    if (net < -0.01) {
      debtors.push({ id, amount: -net }); // amount owed (positive)
    } else if (net > 0.01) {
      creditors.push({ id, amount: net }); // amount due to receive
    }
  }

  // Greedily match the largest debtor with the largest creditor
  const simplifiedDebts: SimplifiedDebt[] = [];

  while (debtors.length > 0 && creditors.length > 0) {
    // Sort debtors descending (largest debt first)
    debtors.sort((a, b) => b.amount - a.amount);
    // Sort creditors descending (largest credit first)
    creditors.sort((a, b) => b.amount - a.amount);

    const debtor = debtors[0];
    const creditor = creditors[0];

    const paymentAmount = Math.min(debtor.amount, creditor.amount);
    const roundedPayment = Math.round(paymentAmount * 100) / 100;

    if (roundedPayment > 0.009) {
      simplifiedDebts.push({
        from_user_id: debtor.id,
        to_user_id: creditor.id,
        amount: roundedPayment,
        from_user: usersMap[debtor.id],
        to_user: usersMap[creditor.id],
      });
    }

    debtor.amount -= paymentAmount;
    creditor.amount -= paymentAmount;

    if (debtor.amount < 0.01) {
      debtors.shift();
    }
    if (creditor.amount < 0.01) {
      creditors.shift();
    }
  }

  return {
    netBalances,
    simplifiedDebts,
    totalGroupSpent: Math.round(totalGroupSpent * 100) / 100,
  };
}
