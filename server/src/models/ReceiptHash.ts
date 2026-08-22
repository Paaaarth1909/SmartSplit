import { Schema, model, Document, Types } from "mongoose";

export interface IReceiptHash extends Document {
  expense: Types.ObjectId;
  group: Types.ObjectId;
  imageHash: string;
  merchant: string;
  total: number;
  receiptDate: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const receiptHashSchema = new Schema<IReceiptHash>(
  {
    expense: {
      type: Schema.Types.ObjectId,
      ref: "Expense",
      required: true,
      unique: true,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    imageHash: { type: String, default: "" },
    merchant: { type: String, default: "", lowercase: true, trim: true },
    total: { type: Number, required: true },
    receiptDate: { type: String, default: "" },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Fast lookup for image-hash duplicate checks scoped to a group
receiptHashSchema.index({ group: 1, imageHash: 1 });

// Metadata fingerprint lookups: (group, merchant, total, date)
receiptHashSchema.index({ group: 1, merchant: 1, total: 1, receiptDate: 1 });

export const ReceiptHash = model<IReceiptHash>("ReceiptHash", receiptHashSchema);
