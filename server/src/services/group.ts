import { Group, IGroup } from "../models/Group.js";
import { AppError } from "../middleware/error.middleware.js";

interface MemberInput {
  name: string;
  email?: string;
  phone?: string;
  role?: "admin" | "member";
}

interface CreateGroupInput {
  name: string;
  description?: string;
  initialMembers?: MemberInput[];
}

export const createGroup = async ({
  name,
  description,
  initialMembers = [],
}: CreateGroupInput): Promise<IGroup> => {
  const members = initialMembers.map((m) => ({
    name: m.name,
    email: m.email || "",
    phone: m.phone || "",
    role: m.role || "member" as const,
    joinedAt: new Date(),
  }));

  const group = await Group.create({
    name,
    description: description || "",
    members,
  });

  return group;
};

export const getGroups = async (): Promise<IGroup[]> => {
  return Group.find().sort({ createdAt: -1 });
};

export const getGroupById = async (groupId: string): Promise<IGroup> => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError("Group not found", 404);
  }
  return group;
};

export const deleteGroup = async (groupId: string): Promise<void> => {
  const deletedGroup = await Group.findByIdAndDelete(groupId);
  if (!deletedGroup) {
    throw new AppError("Group not found", 404);
  }
};

interface AddMemberInput {
  groupId: string;
  name: string;
  email?: string;
  phone?: string;
  role?: "admin" | "member";
}

export const addMember = async ({
  groupId,
  name,
  email,
  phone,
  role,
}: AddMemberInput): Promise<IGroup> => {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);

  const newMember = {
    name,
    email: email || "",
    phone: phone || "",
    role: (role === "admin" ? "admin" : "member") as "admin" | "member",
    joinedAt: new Date(),
  };

  group.members.push(newMember);
  await group.save();

  return group;
};

export const removeMember = async (
  groupId: string,
  memberId: string
): Promise<IGroup> => {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError("Group not found", 404);

  const initialLength = group.members.length;
  group.members = group.members.filter(
    (member) => member._id && member._id.toString() !== memberId
  );

  if (group.members.length === initialLength) {
    throw new AppError("Member not found in group", 404);
  }

  await group.save();
  return group;
};