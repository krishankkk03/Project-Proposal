const mongoose = require("mongoose");

const verifiedSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  verifiedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Verified", verifiedSchema);