// src/utils/db.ts
// import mongoose, { ConnectOptions } from "mongoose";

// const connectDB = async () => {
//   try {
//     await mongoose.connect(
//       "mongodb+srv://nzemba48:KrjaECTCuSSwKdFS@cluster0.cxgzddn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
//       {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//       } as ConnectOptions
//     );
//     console.log("Database is connected");
//   } catch (error: any) {
//     console.log(error.message);
//   }
// };
// 
// mongodb+srv://saintshubapp:3m3YzqTKZFPSTOho@cluster0.wwquqs3.mongodb.net/?retryWrites=true&w=majority

// export default connectDB;
import mongoose, { ConnectOptions } from "mongoose";

const MONGODB_URI = "mongodb+srv://saintshubapp:3m3YzqTKZFPSTOho@cluster0.wwquqs3.mongodb.net/?retryWrites=true&w=majority";

const connectDB = async () => {
  try {
    await mongoose.connect(
      MONGODB_URI,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      } as ConnectOptions
    );
    console.log("Database is connected");
  } catch (error: any) {
    console.log('Database not connected: ', error.message);
  }
};

export default connectDB;
