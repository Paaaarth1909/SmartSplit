import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

const memberInputSchema = z.object({
  name: z.string().trim().min(1, "Member name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  role: z.enum(["admin", "member"]).optional(),
});

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Group name is required").max(100),
    description: z.string().trim().max(500).optional(),
    initialMembers: z.array(memberInputSchema).optional(),
  }),
});

export const addMemberSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    name: z.string().trim().min(1, "Member name is required"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    role: z.enum(["admin", "member"]).optional(),
  }),
});

export const removeMemberSchema = z.object({
  params: z.object({
    id: objectId,
    memberId: objectId,
  }),
});

export const getGroupSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const deleteGroupSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});