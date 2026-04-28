const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    roomId:      { type: String, required: true }, // = request._id
    senderEmail: { type: String, required: true },
    senderRole:  { type: String, enum: ["student", "faculty"], required: true },
    senderName:  { type: String, default: "" },
    message:     { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
