import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId | string;
  sender: mongoose.Types.ObjectId | string;
  group?: mongoose.Types.ObjectId | string;
  type: "GROUP_INVITE" | "GROUP_INVITE_ACCEPTED" | "GROUP_JOINED" | "FRIEND_REQUEST" | "FRIEND_ACCEPTED";
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "PENDING_ADD" | "COMPLETED";
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  group: { type: Schema.Types.ObjectId, ref: "Group" },
  type: {
    type: String,
    enum: ["GROUP_INVITE", "GROUP_INVITE_ACCEPTED", "GROUP_JOINED", "FRIEND_REQUEST", "FRIEND_ACCEPTED"],
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "ACCEPTED", "REJECTED", "PENDING_ADD", "COMPLETED"],
    default: "PENDING",
  },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

NotificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
