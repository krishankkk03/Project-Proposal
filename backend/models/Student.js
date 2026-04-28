const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  email: String,
  groupDetails: Array,

  isLocked: { type: Boolean, default: false },
  

  assignedTopic: String,
  facultyEmail: String,   // ✅ ADD THIS

  progress: {
    synopsis: { type: Boolean, default: false },
    presentation: { type: Boolean, default: false },
    submission: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model("Student", studentSchema);