import { Schema, model, Document, Types } from "mongoose";

export interface IGroupMessage extends Document {
  group: Types.ObjectId;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: Date;
}

const groupMessageSchema = new Schema<IGroupMessage>(
  {
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    message: { type: String, required: true, trim: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

groupMessageSchema.index({ group: 1, createdAt: 1 });

export const GroupMessage = model<IGroupMessage>("GroupMessage", groupMessageSchema);
