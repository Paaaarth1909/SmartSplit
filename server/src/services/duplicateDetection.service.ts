import { Types } from "mongoose";
import { ReceiptHash } from "../models/ReceiptHash.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchType: "image" | "metadata" | null;
  matchedExpenseId: string | null;
  confidence: number;
}

export interface DuplicateCheckParams {
  groupId: string;
  imageHash?: string;
  merchant?: string;
  total?: number;
  receiptDate?: string;
}

export interface StoreReceiptHashParams {
  expenseId: string;
  groupId: string;
  imageHash?: string;
  merchant?: string;
  total: number;
  receiptDate?: string;
  createdBy: string;
}

// ---------------------------------------------------------------------------
// Perceptual hash helpers
// ---------------------------------------------------------------------------

/**
 * Compute a perceptual hash (pHash) for an image buffer.
 *
 * Uses the `imghash` library (backed by `sharp`) to produce a 16-char hex
 * string representing a 64-bit hash. This runs entirely locally — no AI cost.
 */
export const computeImageHash = async (
  imageBuffer: Buffer,
): Promise<string> => {
  // Dynamic import so the native `sharp` dependency is only loaded when needed
  const imghash = await import("imghash");
  // ESM default export is an object with { hash, hashRaw, hexToBinary, binaryToHex }
  const hashFn = imghash.default?.hash ?? (imghash as any).hash;
  const hash: string = await hashFn(imageBuffer, 16);
  return hash;
};

/**
 * Compute the Hamming distance between two equal-length hex hash strings.
 * Each differing *bit* counts as 1 unit of distance.
 */
export const hammingDistance = (a: string, b: string): number => {
  if (a.length !== b.length) {
    // If lengths differ we can't meaningfully compare — treat as no match
    return Infinity;
  }

  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    // XOR the hex digits to find differing bits
    const xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    // Count set bits (popcount for a 4-bit value)
    distance += popcount4(xor);
  }
  return distance;
};

/** Popcount for a 4-bit integer (0–15). */
const popcount4 = (n: number): number => {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
};

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

const DEFAULT_HASH_THRESHOLD = 10; // max Hamming distance to consider a match

/**
 * Check whether a receipt is a duplicate of an already-logged expense.
 *
 * Layer 1 — Image hash: query all hashes in the same group and compare via
 *           Hamming distance (threshold configurable via DUPLICATE_HASH_THRESHOLD).
 * Layer 2 — Metadata fingerprint: match on (group, merchant, total ±1%, date ±1 day).
 */
export const checkForDuplicates = async (
  params: DuplicateCheckParams,
): Promise<DuplicateCheckResult> => {
  const { groupId, imageHash, merchant, total, receiptDate } = params;
  const threshold = Number(process.env.DUPLICATE_HASH_THRESHOLD) || DEFAULT_HASH_THRESHOLD;

  // --- Layer 1: Image hash comparison ---
  if (imageHash) {
    const candidates = await ReceiptHash.find({
      group: groupId,
      imageHash: { $ne: "" },
    })
      .select("imageHash expense")
      .lean();

    for (const candidate of candidates) {
      const dist = hammingDistance(imageHash, candidate.imageHash);
      if (dist <= threshold) {
        const confidence = Math.max(0, 1 - dist / 64);
        return {
          isDuplicate: true,
          matchType: "image",
          matchedExpenseId: candidate.expense.toString(),
          confidence: parseFloat(confidence.toFixed(2)),
        };
      }
    }
  }

  // --- Layer 2: Metadata fingerprint ---
  if (merchant && total != null && receiptDate) {
    const normalisedMerchant = merchant.toLowerCase().trim();
    const tolerance = total * 0.01; // ±1%

    // Build date window: ±1 day from the receipt date
    const d = new Date(receiptDate);
    const dayBefore = new Date(d);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayAfter = new Date(d);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const dateStrings = [
      formatDateStr(dayBefore),
      formatDateStr(d),
      formatDateStr(dayAfter),
    ];

    const metadataMatch = await ReceiptHash.findOne({
      group: groupId,
      merchant: normalisedMerchant,
      total: { $gte: total - tolerance, $lte: total + tolerance },
      receiptDate: { $in: dateStrings },
    })
      .select("expense")
      .lean();

    if (metadataMatch) {
      return {
        isDuplicate: true,
        matchType: "metadata",
        matchedExpenseId: metadataMatch.expense.toString(),
        confidence: 0.85,
      };
    }
  }

  return {
    isDuplicate: false,
    matchType: null,
    matchedExpenseId: null,
    confidence: 0,
  };
};

// ---------------------------------------------------------------------------
// CRUD for receipt hashes
// ---------------------------------------------------------------------------

/**
 * Persist a receipt hash record after a successful expense creation.
 */
export const storeReceiptHash = async (
  params: StoreReceiptHashParams,
): Promise<void> => {
  await ReceiptHash.create({
    expense: new Types.ObjectId(params.expenseId),
    group: new Types.ObjectId(params.groupId),
    imageHash: params.imageHash ?? "",
    merchant: (params.merchant ?? "").toLowerCase().trim(),
    total: params.total,
    receiptDate: params.receiptDate ?? "",
    createdBy: new Types.ObjectId(params.createdBy),
  });
};

/**
 * Remove the hash record when its parent expense is deleted.
 */
export const removeReceiptHash = async (expenseId: string): Promise<void> => {
  await ReceiptHash.deleteOne({ expense: new Types.ObjectId(expenseId) });
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a Date as YYYY-MM-DD. */
const formatDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
