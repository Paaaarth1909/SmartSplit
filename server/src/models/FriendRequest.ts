import mongoose, { Document, Schema } from "mongoose";

export interface IFriendRequest extends Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
}

const FriendRequestSchema = new Schema<IFriendRequest>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

FriendRequestSchema.index({ sender: 1, recipient: 1 });
FriendRequestSchema.index({ recipient: 1, status: 1 });
FriendRequestSchema.index({ sender: 1, status: 1 });

export const FriendRequest = mongoose.model<IFriendRequest>(
  "FriendRequest",
  FriendRequestSchema
);
