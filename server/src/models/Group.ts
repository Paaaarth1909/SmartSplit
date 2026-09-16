import mongoose, { Schema, Document } from "mongoose";

export interface IMember {
  _id?: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  role: "admin" | "member";
  joinedAt: Date;
}

export interface IGroup extends Document {
  name: string;
  description?: string;
  currency: string;
  members: IMember[];
  createdBy?: string;
  createdAt: Date;
}

const MemberSchema = new Schema<IMember>({
  name: { type: String, required: true, trim: true },
  email: { type: String, default: "", lowercase: true, trim: true },
  phone: { type: String, default: "", trim: true },
  role: { type: String, enum: ["admin", "member"], default: "member" },
  joinedAt: { type: Date, default: Date.now }
});

const GroupSchema = new Schema<IGroup>({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  currency: { type: String, default: "INR", uppercase: true, trim: true },
  members: [MemberSchema],
  createdBy: { type: String, default: "system" },
  createdAt: { type: Date, default: Date.now }
});

export const Group = mongoose.model<IGroup>("Group", GroupSchema);
