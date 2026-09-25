import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {

  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;

  linkedAccounts: {
    venmo?: string;
    cashApp?: string;
    paypal?: string;
    upi?: string;
  };

  security: {
    twoFactorEnabled?: boolean;
  };

  preferences: {
    currency?: string;
    theme?: string;
    acousticFeedback?: boolean;
  };
}

const userSchema = new Schema<IUser>(
  {


    fullName: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      default: "",
    },

    avatar: {
      type: String,
      default: "",
    },

    linkedAccounts: {
      venmo: {
        type: String,
        default: "",
      },
      cashApp: {
        type: String,
        default: "",
      },
      paypal: {
        type: String,
        default: "",
      },
      upi: {
        type: String,
        default: "",
      },
    },

    security: {
      twoFactorEnabled: {
        type: Boolean,
        default: false,
      },
    },

    preferences: {
      currency: {
        type: String,
        default: "INR",
      },
      theme: {
        type: String,
        default: "system",
      },
      acousticFeedback: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", userSchema);
