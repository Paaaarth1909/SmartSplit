import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsplit';

mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    console.log("USERS:", users.map(u => ({ id: u._id, fullName: u.fullName, email: u.email, clerkId: u.clerkId })));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
