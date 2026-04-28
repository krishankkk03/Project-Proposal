const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  facultyEmail: String,
  studentEmail: String,
  topicId: String,
  topicTitle: String,
  groupDetails: Array,
  status: { type: String, default: "Pending" } 
});

module.exports = mongoose.model("Request", requestSchema);