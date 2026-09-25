import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { Group, generateInviteCode } from "../models/Group.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("No MONGODB_URI in .env");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB for migration");

  const groups = await Group.find({});
  const existingCodes = new Set(groups.map(g => g.inviteCode).filter(Boolean));

  let updatedCount = 0;
  for (const group of groups) {
    if (!group.inviteCode || group.inviteCode.trim() === "") {
      let code = generateInviteCode();
      while (existingCodes.has(code)) {
        code = generateInviteCode();
      }
      existingCodes.add(code);
      group.inviteCode = code;
      await group.save();
      console.log(`Assigned code ${code} to group "${group.name}"`);
      updatedCount++;
    }
  }

  console.log(`Migration finished. Updated ${updatedCount} groups.`);
  const allGroups = await Group.find({}, "name inviteCode");
  console.log("Current groups:");
  allGroups.forEach(g => console.log(`- ${g.name}: ${g.inviteCode}`));

  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
