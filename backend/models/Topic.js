const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({
  title: String,
  language: String,
  facultyId: mongoose.Schema.Types.ObjectId,
  isAssigned: {
  type: Boolean,
  default: false
}   
});

module.exports = mongoose.model("Topic", topicSchema);