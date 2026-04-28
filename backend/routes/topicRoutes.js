const router = require("express").Router();
const Topic = require("../models/Topic");
const Faculty = require("../models/Faculty");

router.post("/add", async (req, res) => {
  try {
    const { title, language, email } = req.body;

    const faculty = await Faculty.findOne({ email });

    if (!faculty) {
      return res.status(404).json({ msg: "Faculty not found" });
    }

    const topic = new Topic({
      title,
      language,
      facultyId: faculty._id
    });

    await topic.save();

    res.json({ msg: "Topic Added Successfully", topic });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});


router.get("/", async (req, res) => {
  try {
    const topics = await Topic.find().populate("facultyId", "email");

    res.json(topics);

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error fetching topics" });
  }
});


router.get("/:email", async (req, res) => {
  try {
    const email = req.params.email;

    console.log("Faculty Email:", email);

    const faculty = await Faculty.findOne({ email });

    if (!faculty) {
      console.log("❌ Faculty not found");
      return res.json([]);
    }

    console.log("✅ Faculty ID:", faculty._id);

    const topics = await Topic.find({ facultyId: faculty._id });

    console.log("✅ Topics Found:", topics);

    res.json(topics);

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error fetching topics" });
  }
});


// ================= DELETE =================
router.delete("/delete/:id", async (req, res) => {
  try {
    await Topic.findByIdAndDelete(req.params.id);
    res.json({ msg: "Topic Deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error deleting topic" });
  }
});


// ================= UPDATE =================
router.put("/update/:id", async (req, res) => {
  try {
    const { title, language } = req.body;

    const updated = await Topic.findByIdAndUpdate(
      req.params.id,
      { title, language },
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error updating topic" });
  }
});

module.exports = router;