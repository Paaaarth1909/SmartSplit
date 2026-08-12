/**
 * Pure split-calculation logic. No DB access here — this makes it trivially
 * unit-testable and reusable for both the "real" create-expense flow and a
 * stateless "preview" endpoint the frontend can call live as the user types.
 */

export type SplitType = "equal" | "exact" | "percentage" | "shares";

export interface SplitParticipantInput {
  userId: string;
  // Only one of these is used, depending on splitType:
  amount?: number; // for "exact"
  percentage?: number; // for "percentage"
  shares?: number; // for "shares" (weighted, e.g. 2 shares vs 1 share)
}

export interface ComputedSplit {
  userId: string;
  amount: number; // always rounded to 2 decimals, sums exactly to totalAmount
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Distributes `totalAmount` across participants per splitType and returns
 * exact per-user amounts that always sum to totalAmount (to the cent).
 * Any rounding remainder (from division) is assigned to the LAST participant
 * so totals reconcile exactly — never lose or invent a paisa/cent.
 */
export function calculateSplit(
  totalAmount: number,
  splitType: SplitType,
  participants: SplitParticipantInput[]
): ComputedSplit[] {
  if (!participants.length) {
    throw new Error("At least one participant is required");
  }
  if (totalAmount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  switch (splitType) {
    case "equal":
      return splitEqual(totalAmount, participants);
    case "exact":
      return splitExact(totalAmount, participants);
    case "percentage":
      return splitPercentage(totalAmount, participants);
    case "shares":
      return splitByShares(totalAmount, participants);
    default:
      throw new Error(`Unknown split type: ${splitType}`);
  }
}

function distributeWithRemainder(
  totalAmount: number,
  rawShares: { userId: string; raw: number }[]
): ComputedSplit[] {
  const rounded = rawShares.map((s) => ({ userId: s.userId, amount: round2(s.raw) }));
  const sum = round2(rounded.reduce((acc, s) => acc + s.amount, 0));
  const remainder = round2(totalAmount - sum);

  if (remainder !== 0) {
    // Push whatever's left (a few cents either way) onto the last participant
    // so the split always sums exactly to totalAmount.
    rounded[rounded.length - 1].amount = round2(
      rounded[rounded.length - 1].amount + remainder
    );
  }

  return rounded;
}

function splitEqual(
  totalAmount: number,
  participants: SplitParticipantInput[]
): ComputedSplit[] {
  const share = totalAmount / participants.length;
  return distributeWithRemainder(
    totalAmount,
    participants.map((p) => ({ userId: p.userId, raw: share }))
  );
}

function splitExact(
  totalAmount: number,
  participants: SplitParticipantInput[]
): ComputedSplit[] {
  const sum = round2(participants.reduce((acc, p) => acc + (p.amount ?? 0), 0));
  if (sum !== round2(totalAmount)) {
    throw new Error(
      `Exact split amounts (${sum}) must sum to the total expense amount (${totalAmount})`
    );
  }
  return participants.map((p) => ({ userId: p.userId, amount: round2(p.amount ?? 0) }));
}

function splitPercentage(
  totalAmount: number,
  participants: SplitParticipantInput[]
): ComputedSplit[] {
  const totalPct = round2(participants.reduce((acc, p) => acc + (p.percentage ?? 0), 0));
  if (totalPct !== 100) {
    throw new Error(`Percentages must sum to 100 (got ${totalPct})`);
  }
  return distributeWithRemainder(
    totalAmount,
    participants.map((p) => ({
      userId: p.userId,
      raw: (totalAmount * (p.percentage ?? 0)) / 100,
    }))
  );
}

function splitByShares(
  totalAmount: number,
  participants: SplitParticipantInput[]
): ComputedSplit[] {
  const totalShares = participants.reduce((acc, p) => acc + (p.shares ?? 0), 0);
  if (totalShares <= 0) {
    throw new Error("Total shares must be greater than zero");
  }
  return distributeWithRemainder(
    totalAmount,
    participants.map((p) => ({
      userId: p.userId,
      raw: (totalAmount * (p.shares ?? 0)) / totalShares,
    }))
  );
}
