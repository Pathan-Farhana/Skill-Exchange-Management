// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 8000;

// ✅ CORS Middleware
app.use(cors()); // Allow all origins for dev
app.options("*", cors()); // Handle preflight requests

// ✅ Body parser
app.use(express.json());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Schema
const userSchema = new mongoose.Schema({
  clerkId: String,
  fullName: String,
  age: Number,
  gender: String,
  skills: [String],
  learnSkills: [String],
  rating: { type: Number, default: 2 },
});

const User = mongoose.model("User", userSchema);

// ✅ Save or update user profile
app.post("/api/users", async (req, res) => {
  try {
    const { clerkId, fullName, age, gender, skills, learnSkills,rating } = req.body;

    const user = await User.findOneAndUpdate(
      { clerkId },
      { fullName, age, gender, skills, learnSkills,rating: rating || 2 },
      { upsert: true, new: true }
    );
    console.log(`📝 Updated user [${clerkId}]:`, user);
    res.status(201).json({ message: "✅ User saved", user });
  } catch (error) {
    console.error("❌ Save error:", error);
    res.status(500).json({ message: "❌ Failed to save user" });
  }
});





// ✅ Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error("❌ Fetch users error:", error);
    res.status(500).json({ message: "❌ Failed to fetch users" });
  }
});



app.post("/api/feedback", async (req, res) => {
  try {
    const { clerkId, newRating } = req.body;

    if (!clerkId || typeof newRating !== "number" || newRating < 1 || newRating > 5) {
      return res.status(400).json({ message: "❌ Rating must be a number between 1 and 5" });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: "❌ User not found" });
    }

    // Optional: average the rating with previous one
    user.rating = Math.round((user.rating + newRating) / 2);

    await user.save();
    console.log(`⭐ Feedback saved for ${clerkId}: New rating is ${user.rating}`);

    res.json({ message: "✅ Feedback submitted", rating: user.rating });
  } catch (error) {
    console.error("❌ Feedback error:", error);
    res.status(500).json({ message: "❌ Failed to submit feedback" });
  }
});



// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
