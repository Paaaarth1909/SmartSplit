import { Schema, model, Document, Types } from "mongoose";
import { SplitType } from "../utils/splitCalculator.js";

export interface IExpenseSplit {
  user: Types.ObjectId;
  amount: number; 
  percentage?: number;
  shares?: number;
}

export interface IExpenseItem {
  name: string;
  price: number;
  assignedTo: Types.ObjectId[];
}

export interface IExpense extends Document {
  group: Types.ObjectId;
  description: string;
  amount: number;
  category: string;
  paidBy: Types.ObjectId;
  splitType: SplitType;
  splits: IExpenseSplit[];
  items?: IExpenseItem[]; 
  receiptUrl?: string;
  aiGenerated: boolean;
  createdBy: Types.ObjectId;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSplitSchema = new Schema<IExpenseSplit>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    percentage: { type: Number },
    shares: { type: Number },
  },
  { _id: false }
);

const expenseItemSchema = new Schema<IExpenseItem>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: false }
);

const expenseSchema = new Schema<IExpense>(
  {
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, default: "General" },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    splitType: {
      type: String,
      enum: ["equal", "exact", "percentage", "shares"],
      required: true,
    },
    splits: {
      type: [expenseSplitSchema],
      validate: {
        validator: (splits: IExpenseSplit[]) => splits.length > 0,
        message: "An expense must have at least one split participant.",
      },
    },
    items: { type: [expenseItemSchema], default: undefined },
    receiptUrl: { type: String },
    aiGenerated: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

expenseSchema.index({ group: 1, date: -1 });

export const Expense = model<IExpense>("Expense", expenseSchema);
