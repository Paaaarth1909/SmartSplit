import mongoose, { Schema, Document } from "mongoose";

export interface ILinkedAccount {
  username: string;
  connected: boolean;
}

export interface IUser extends Document {
  clerkId?: string;
  fullName: string;
  preferredName: string;
  email: string;
  phone: string;
  isPhoneVerified: boolean;
  avatar: string;
  linkedAccounts: {
    venmo: ILinkedAccount;
    cashApp: ILinkedAccount;
    paypal: ILinkedAccount;
    upi: ILinkedAccount;
  };
  security: {
    twoFactorEnabled: boolean;
    passwordLastChangedAt: Date;
  };
  preferences: {
    currency: string;
    aiProfileOptimized: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const LinkedAccountSchema = new Schema<ILinkedAccount>(
  {
    username: { type: String, default: "", trim: true },
    connected: { type: Boolean, default: false }
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, default: "", index: true },
    fullName: { type: String, required: true, trim: true },
    preferredName: { type: String, default: "", trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    isPhoneVerified: { type: Boolean, default: false },
    avatar: { type: String, default: "" },
    linkedAccounts: {
      venmo: { type: LinkedAccountSchema, default: () => ({ username: "", connected: false }) },
      cashApp: { type: LinkedAccountSchema, default: () => ({ username: "", connected: false }) },
      paypal: { type: LinkedAccountSchema, default: () => ({ username: "", connected: false }) },
      upi: { type: LinkedAccountSchema, default: () => ({ username: "", connected: false }) }
    },
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      passwordLastChangedAt: { type: Date, default: Date.now }
    },
    preferences: {
      currency: { type: String, default: "USD" },
      aiProfileOptimized: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
