const router = require("express").Router();
const Student = require("../models/Student");

// ── GET /api/students/exists?email=xxx ────────────────────────────────────────
// Check if an email is registered (used during group creation validation)
router.get("/exists", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "email required" });

    const student = await Student.findOne({ email });
    res.json({ exists: !!student });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/students/all ─────────────────────────────────────────────────────
router.get("/all", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error fetching students" });
  }
});

// ── GET /api/students/me?email=xxx ────────────────────────────────────────────
// Returns the full student record for any group member.
// If the email is a group leader → return their own record.
// If the email is a group member → return the leader's record (has assignedTopic, progress etc.)
router.get("/me", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "email required" });

    // 1. Check if this email is part of any LOCKED group (as leader or member)
    const lockedGroup = await Student.findOne({
      "groupDetails.email": email,
      isLocked: true
    });

    if (lockedGroup) {
      const role = lockedGroup.email === email ? "leader" : "member";
      return res.json({ ...lockedGroup.toObject(), role });
    }

    // 2. If not part of any locked group, check if they have an empty record (e.g. just signed up)
    const emptyRecord = await Student.findOne({ email });
    if (emptyRecord) {
      return res.json({ ...emptyRecord.toObject(), role: "leader" });
    }

    // 3. Not found at all
    return res.json({ groupDetails: [], isLocked: false });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/students/save ───────────────────────────────────────────────────
router.post("/save", async (req, res) => {
  try {
    const { email, groupDetails } = req.body;

    // Initialize statuses: leader is 'accepted', others are 'pending'
    const updatedGroupDetails = (groupDetails || []).map(member => ({
      ...member,
      status: member.email === email ? "accepted" : "pending"
    }));

    let student = await Student.findOne({ email });

    if (student) {
      // don't overwrite if already locked with members
      if (student.isLocked && student.groupDetails?.length > 0) {
        return res.json({ msg: "Already saved" });
      }
      student.groupDetails = updatedGroupDetails;
      student.isLocked = (updatedGroupDetails.length > 0);
    } else {
      student = new Student({
        email,
        groupDetails: updatedGroupDetails,
        isLocked: (updatedGroupDetails.length > 0)
      });
    }

    await student.save();
    res.json({ msg: "Saved" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error saving student" });
  }
});

// ── POST /api/students/accept-invitation ──────────────────────────────────────
router.post("/accept-invitation", async (req, res) => {
  try {
    const { leaderEmail, memberEmail } = req.body;
    const student = await Student.findOne({ email: leaderEmail });
    if (!student) return res.status(404).json({ error: "Group not found" });

    student.groupDetails = student.groupDetails.map(member =>
      member.email === memberEmail ? { ...member, status: "accepted" } : member
    );

    await student.save();
    res.json({ msg: "Invitation accepted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/students/:email ──────────────────────────────────────────────────
router.get("/:email", async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.params.email });
    if (!student) return res.json({ groupDetails: [], isLocked: false });
    res.json(student);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error fetching student" });
  }
});

module.exports = router;
