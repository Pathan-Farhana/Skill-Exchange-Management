const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  fullName: String,
  age: Number,
  gender: String,
  skills: [String],
  learnSkills: [String],
  rating: { type: Number, default: 2 },
});

module.exports = mongoose.model("User", UserSchema);
