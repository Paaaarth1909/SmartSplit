import { Schema, model, Document, Types } from "mongoose";

export interface IBalance extends Document {
  group: Types.ObjectId;
  user: Types.ObjectId;
  netAmount: number;
  updatedAt: Date;
}

const balanceSchema = new Schema<IBalance>(
  {
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    netAmount: { type: Number, required: true, default: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);
balanceSchema.index({ group: 1, user: 1 }, { unique: true });
export const Balance = model<IBalance>("Balance", balanceSchema);
