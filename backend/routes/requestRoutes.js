const router = require("express").Router();
const Request = require("../models/Request");
const sendEmail = require("../utils/sendEmail");
const Faculty = require("../models/Faculty");
const Student = require("../models/Student");
const Topic = require("../models/Topic");


// ================= SEND REQUEST =================
router.post("/send", async (req, res) => {
  try {
    const { facultyEmail, studentEmail, topicTitle, topicId, groupDetails } = req.body;

    const request = new Request({
      facultyEmail,
      studentEmail,
      topicTitle,
      topicId,
      groupDetails
    });

    await request.save();

    // Email is now just a notification — no approve/reject links needed
    const message = `
New Project Request Received

Student: ${studentEmail}
Topic: ${topicTitle}

Group Members:
${groupDetails.map(g => `Name: ${g.name}, Roll: ${g.roll}`).join("\n")}

------------------------------
Please open your Faculty Dashboard to approve or reject this request.
    `;

    await sendEmail(facultyEmail, "New Project Request", message);

    res.json({ msg: "Request Sent" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error sending request" });
  }
});


// ================= GET PENDING REQUESTS (for dashboard) =================
router.get("/pending", async (req, res) => {
  try {
    const { facultyEmail } = req.query;
    if (!facultyEmail) return res.status(400).json({ msg: "facultyEmail required" });

    const requests = await Request.find({ facultyEmail, status: "Pending" });
    res.json(requests);

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error fetching requests" });
  }
});


// ================= APPROVE REQUEST (PATCH — called from dashboard) =================
router.patch("/approve/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: "Request not found" });

    // 1. mark approved
    request.status = "Approved";
    await request.save();

    // 2. update student
    const student = await Student.findOne({ email: request.studentEmail });
    if (student) {
      student.assignedTopic = request.topicTitle;
      student.facultyEmail  = request.facultyEmail;
      student.progress = { synopsis: false, presentation: false, submission: false };
      await student.save();
    }

    // 3. lock the topic
    if (request.topicId) {
      await Topic.findByIdAndUpdate(request.topicId, { isAssigned: true });
    }

    // 4. notify student by email
    await sendEmail(
      request.studentEmail,
      "Request Approved ✅",
      `Your project "${request.topicTitle}" has been approved by the faculty.`
    );

    // 5. check faculty group limit
    const count = await Request.countDocuments({
      facultyEmail: request.facultyEmail,
      status: "Approved"
    });
    if (count >= 3) {
      await Faculty.updateOne({ email: request.facultyEmail }, { isAvailable: false });
    }

    res.json({ msg: "Approved" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error approving request" });
  }
});


// ================= REJECT REQUEST (PATCH — called from dashboard) =================
router.patch("/reject/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: "Request not found" });

    request.status = "Rejected";
    await request.save();

    await sendEmail(
      request.studentEmail,
      "Request Rejected ❌",
      `Your project request for "${request.topicTitle}" was rejected. Please choose another topic.`
    );

    res.json({ msg: "Rejected" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error rejecting request" });
  }
});


// ================= GET APPROVED (for chat feature) =================
router.get("/approved", async (req, res) => {
  try {
    const { studentEmail } = req.query;
    if (!studentEmail) return res.status(400).json({ error: "studentEmail required" });

    const request = await Request.findOne({ studentEmail, status: "Approved" });
    if (!request) return res.status(404).json({ error: "No approved request found" });

    res.json(request);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});


// ================= GET APPROVED BY FACULTY (for chat feature) =================
router.get("/approved-by-faculty", async (req, res) => {
  try {
    const { facultyEmail } = req.query;
    if (!facultyEmail) return res.status(400).json({ error: "facultyEmail required" });

    const requests = await Request.find({ facultyEmail, status: "Approved" });
    res.json(requests);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});


// ── Keep old GET approve/reject routes so existing email links still work ────
router.get("/approve/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.send("Request not found");
    if (request.status === "Approved") return res.send("Already approved ✅");

    request.status = "Approved";
    await request.save();

    const student = await Student.findOne({ email: request.studentEmail });
    if (student) {
      student.assignedTopic = request.topicTitle;
      student.facultyEmail  = request.facultyEmail;
      student.progress = { synopsis: false, presentation: false, submission: false };
      await student.save();
    }

    if (request.topicId) {
      await Topic.findByIdAndUpdate(request.topicId, { isAssigned: true });
    }

    await sendEmail(request.studentEmail, "Request Approved ✅",
      `Your project "${request.topicTitle}" has been approved.`);

    const count = await Request.countDocuments({
      facultyEmail: request.facultyEmail, status: "Approved"
    });
    if (count >= 3) {
      await Faculty.updateOne({ email: request.facultyEmail }, { isAvailable: false });
    }

    res.send("Request Approved ✅");
  } catch (err) {
    console.log(err);
    res.send("Error");
  }
});

router.get("/reject/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.send("Request not found");
    if (request.status === "Rejected") return res.send("Already rejected ❌");

    request.status = "Rejected";
    await request.save();

    await sendEmail(request.studentEmail, "Request Rejected ❌",
      `Your project request for "${request.topicTitle}" was rejected.`);

    res.send("Request Rejected ❌");
  } catch (err) {
    console.log(err);
    res.send("Error");
  }
});

router.get("/pending-by-student", async (req, res) => {
  try {
    const { studentEmail } = req.query;
    if (!studentEmail) return res.status(400).json({ error: "studentEmail required" });

    const request = await Request.findOne({
      studentEmail,
      status: "Pending"
    });

    res.json(request || null);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
