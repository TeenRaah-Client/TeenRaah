import mongoose from "mongoose";

/**
 * Connects to MongoDB (Atlas or local) using the URI in MONGO_URI.
 * Mongoose keeps a connection pool internally, so this only needs to
 * run once when the server boots.
 */
export const connectDB = async () => {
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes("your_mongodb")) {
    console.warn(
      "⚠️  MONGO_URI is not set. Add a real MongoDB Atlas URI to backend/.env — see README.md."
    );
  }

  mongoose.connection.on("connected", () => {
    console.log("🍃 MongoDB connected:", mongoose.connection.host);
  });

  mongoose.connection.on("error", (err) => {
    console.error("🍃 MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("🍃 MongoDB disconnected");
  });

  await mongoose.connect(process.env.MONGO_URI, {
    // Modern mongoose (8.x) no longer needs useNewUrlParser/useUnifiedTopology,
    // they are defaults now — kept out intentionally.
  });
};

export default connectDB;
