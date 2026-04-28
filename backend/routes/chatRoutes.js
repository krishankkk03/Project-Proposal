const router  = require("express").Router();
const Message = require("../models/Chat");
const Request = require("../models/Request");

// ── helper: verify user belongs to this approved request ─────────────────────
async function verifyAccess(requestId, email) {
  const req = await Request.findById(requestId);
  if (!req)                      return { ok: false, error: "Request not found" };
  if (req.status !== "Approved") return { ok: false, error: "Chat only available after request is approved" };

  // include leader, all group members
  const members = (req.groupDetails || []).map(m => m.email || m);
  const allowed = [req.facultyEmail, req.studentEmail, ...members];

  if (!allowed.includes(email)) return { ok: false, error: "Access denied" };
  return { ok: true, request: req };
}

// GET /api/chat/:requestId?email=xxx
router.get("/:requestId", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "email query param required" });

  const { ok, error } = await verifyAccess(req.params.requestId, email);
  if (!ok) return res.status(403).json({ error });

  try {
    const messages = await Message.find({ roomId: req.params.requestId })
      .sort({ createdAt: 1 }).lean();
    res.json(messages);
  } catch {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /api/chat/:requestId
router.post("/:requestId", async (req, res) => {
  const { senderEmail, senderRole, senderName, message } = req.body;
  if (!senderEmail || !senderRole || !message)
    return res.status(400).json({ error: "senderEmail, senderRole and message are required" });

  const { ok, error } = await verifyAccess(req.params.requestId, senderEmail);
  if (!ok) return res.status(403).json({ error });

  try {
    const saved = await Message.create({
      roomId: req.params.requestId,
      senderEmail, senderRole,
      senderName: senderName || "",
      message,
    });
    res.status(201).json(saved);
  } catch {
    res.status(500).json({ error: "Failed to save message" });
  }
});

module.exports = router;
