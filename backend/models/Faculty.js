const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  specialization: [String],
  
  isAvailable: { type: Boolean, default: true } 
});

module.exports = mongoose.model("Faculty", facultySchema);
