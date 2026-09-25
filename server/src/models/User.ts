import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  fullName: string;
  preferredName?: string;
  email: string;
  password?: string;
  clerkId?: string;
  phone?: string;
  isPhoneVerified?: boolean;
  avatar?: string;
  friends?: mongoose.Types.ObjectId[];
  linkedAccounts?: {
    venmo?: string;
    cashApp?: string;
    paypal?: string;
    upi?: string;
  } | any;
  security?: {
    twoFactorEnabled?: boolean;
    passwordLastChangedAt?: Date;
  } | any;
  preferences?: {
    currency?: string;
    theme?: string;
    acousticFeedback?: boolean;
    compactDensity?: boolean;
    liveForex?: boolean;
  } | any;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    preferredName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      select: false,
    },
    clerkId: {
      type: String,
      default: "",
      index: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: "",
    },
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    linkedAccounts: {
      type: Schema.Types.Mixed,
      default: {},
    },
    security: {
      type: Schema.Types.Mixed,
      default: {},
    },
    preferences: {
      type: Schema.Types.Mixed,
      default: {
        currency: "INR",
        theme: "system",
        acousticFeedback: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving to MongoDB
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Compare password helper method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
