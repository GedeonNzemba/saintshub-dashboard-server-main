// src/utils/db.ts
import mongoose, { ConnectOptions } from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("FATAL ERROR: MONGODB_URI environment variable is not defined.");
    process.exit(1); // Exit the application if DB URI is missing
  }

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions);
    console.log("Database is connected successfully.");
  } catch (error: any) {
    console.error("Database connection failed:", error.message);
    // Optionally, rethrow the error or exit if the DB connection is critical
    // process.exit(1);
  }
};

export default connectDB;
