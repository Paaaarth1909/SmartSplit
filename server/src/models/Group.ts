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
  inviteCode: string;
  members: IMember[];
  createdBy?: string;
  createdAt: Date;
}

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const MemberSchema = new Schema<IMember>({
  name: { type: String, required: true, trim: true },
  email: { type: String, default: "", lowercase: true, trim: true },
  phone: { type: String, default: "", trim: true },
  role: { type: String, enum: ["admin", "member"], default: "member" },
  joinedAt: { type: Date, default: Date.now },
});

const GroupSchema = new Schema<IGroup>({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  currency: { type: String, default: "INR", uppercase: true, trim: true },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true,
    index: true,
    default: generateInviteCode,
  },
  members: [MemberSchema],
  createdBy: { type: String, default: "system" },
  createdAt: { type: Date, default: Date.now },
});

// Automatically ensure unique invite code on save
GroupSchema.pre("save", async function () {
  if (!this.inviteCode || this.inviteCode.trim() === "") {
    let unique = false;
    let newCode = "";
    const GroupModel = (this.constructor as mongoose.Model<IGroup>) || mongoose.models.Group;
    while (!unique) {
      newCode = generateInviteCode();
      const existing = await GroupModel.findOne({ inviteCode: newCode });
      if (!existing || existing._id.equals((this as any)._id)) {
        unique = true;
      }
    }
    this.inviteCode = newCode;
  }
});

export const Group = mongoose.model<IGroup>("Group", GroupSchema);

export async function ensureGroupInviteCode(group: IGroup): Promise<string> {
  if (group.inviteCode && group.inviteCode.trim() !== "") {
    return group.inviteCode;
  }
  let unique = false;
  let newCode = "";
  while (!unique) {
    newCode = generateInviteCode();
    const existing = await Group.findOne({ inviteCode: newCode });
    if (!existing) unique = true;
  }
  group.inviteCode = newCode;
  await group.save();
  return newCode;
}

export async function ensureAllGroupsHaveInviteCodes(): Promise<void> {
  try {
    const groupsWithoutCode = await Group.find({
      $or: [
        { inviteCode: { $exists: false } },
        { inviteCode: null },
        { inviteCode: "" }
      ]
    });

    if (groupsWithoutCode.length === 0) return;

    console.log(`[Auto-Migration] Found ${groupsWithoutCode.length} groups without invite code. Generating...`);
    for (const grp of groupsWithoutCode) {
      await ensureGroupInviteCode(grp);
    }
    console.log(`[Auto-Migration] All ${groupsWithoutCode.length} groups now have unique invite codes.`);
  } catch (error) {
    console.error("[Auto-Migration] Error ensuring invite codes for existing groups:", error);
  }
}
