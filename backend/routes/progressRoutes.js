const router = require("express").Router();
const Student = require("../models/Student");

router.post("/update-progress", async (req, res) => {
  try {
    const { studentEmail, field, value } = req.body;

    await Student.updateOne(
      { email: studentEmail },
      { $set: { [`progress.${field}`]: value } }
    );

    res.json({ msg: "Progress updated successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error updating progress" });
  }
});

module.exports = router;