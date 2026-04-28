const router = require("express").Router();
const Faculty = require("../models/Faculty");

router.get("/all", async (req, res) => {
  const data = await Faculty.find();
  res.json(data);
});

router.post("/create", async (req, res) => {
  try {
    const { email } = req.body;

    const existing = await Faculty.findOne({ email });

    if (existing) {
      return res.json({ msg: "Already exists" });
    }

    const faculty = new Faculty({
      email,
      name: "",
      specialization: []
    });

    await faculty.save();

    res.json({ msg: "Faculty created" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error creating faculty" });
  }
});


router.post("/save-profile", async (req, res) => {
  try {
    const { email, name, specialization } = req.body;

    let faculty = await Faculty.findOne({ email });

    if (!faculty) {
      faculty = new Faculty({ email });
    }

    faculty.name = name;
    faculty.specialization = specialization;

    await faculty.save();

    res.json({ msg: "Profile Saved" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error saving profile" });
  }
});


router.get("/:email", async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ email: req.params.email });

    if (!faculty) {
      return res.json({ msg: "Faculty not found" });
    }

    res.json(faculty);

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error fetching faculty" });
  }
});


module.exports = router;