import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsplit';

mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    const parth = await db.collection('users').findOne({ email: 'parthsaarthiesharma2005@gmail.com' });
    const garv = await db.collection('users').findOne({ email: 'goelgarv99@gmail.com' });
    
    console.log("Parth's friends:", parth.friends);
    console.log("Garv's _id:", garv._id);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
