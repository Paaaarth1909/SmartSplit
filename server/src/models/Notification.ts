import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId | string;
  sender: mongoose.Types.ObjectId | string;
  group?: mongoose.Types.ObjectId | string;
  type: "GROUP_INVITE" | "GROUP_JOINED";
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.Mixed, required: true },
  sender: { type: Schema.Types.Mixed, required: true },
  group: { type: Schema.Types.Mixed },
  type: { type: String, enum: ["GROUP_INVITE", "GROUP_JOINED"], required: true },
  status: { type: String, enum: ["PENDING", "ACCEPTED", "REJECTED"], default: "PENDING" },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
