import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

const participantSchema = z.object({
  userId: objectId,
  amount: z.number().positive().optional(),
  percentage: z.number().min(0).max(100).optional(),
  shares: z.number().positive().optional(),
});

const splitTypeSchema = z.enum(["equal", "exact", "percentage", "shares"]);

export const createExpenseSchema = z.object({
  body: z.object({
    groupId: objectId,
    description: z.string().trim().min(1).max(200),
    amount: z.number().positive(),
    category: z.string().trim().max(50).optional(),
    paidBy: objectId,
    splitType: splitTypeSchema,
    participants: z.array(participantSchema).min(1),
    receiptUrl: z.string().url().optional(),
    aiGenerated: z.boolean().optional(),
    date: z.coerce.date().optional(),
    /** Perceptual hash from OCR duplicate detection */
    imageHash: z.string().optional(),
    /** Merchant name extracted by OCR */
    receiptMerchant: z.string().optional(),
    /** Receipt date (YYYY-MM-DD) from OCR */
    receiptDate: z.string().optional(),
    /** Skip duplicate check (user confirmed override) */
    forceCreate: z.boolean().optional(),
  }),
});

export const updateExpenseSchema = z.object({
  params: z.object({ expenseId: objectId }),
  body: z.object({
    description: z.string().trim().min(1).max(200).optional(),
    amount: z.number().positive().optional(),
    category: z.string().trim().max(50).optional(),
    paidBy: objectId.optional(),
    splitType: splitTypeSchema.optional(),
    participants: z.array(participantSchema).min(1).optional(),
  }),
});

export const expenseIdParamSchema = z.object({
  params: z.object({ expenseId: objectId }),
});

export const groupIdParamSchema = z.object({
  params: z.object({ groupId: objectId }),
});

export const previewSplitSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    splitType: splitTypeSchema,
    participants: z.array(participantSchema).min(1),
  }),
});
