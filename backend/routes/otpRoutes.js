const router    = require("express").Router();
const Otp       = require("../models/Otp");
const sendEmail = require("../utils/sendEmail");
const Verified = require("../models/Verified");

// ── helper: generate 6-digit OTP ─────────────────────────────────────────────
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
// POST /api/otp/verify
router.post("/verify", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ msg: "Email and OTP required" });

    const record = await Otp.findOne({ email });
    if (!record)            return res.status(400).json({ msg: "OTP expired. Please request a new one." });
    if (record.otp !== otp) return res.status(400).json({ msg: "Incorrect OTP. Please try again." });

    await Otp.deleteMany({ email });

    // ── mark this email as verified ──
    await Verified.create({ email }).catch(() => {}); // ignore if already exists

    res.json({ msg: "Verified" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error verifying OTP" });
  }
});

router.get("/is-verified", async (req, res) => {
  try {
    const { email } = req.query;
    const record = await Verified.findOne({ email });
    res.json({ verified: !!record });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
// POST /api/otp/send
// Called after Firebase createUser — sends OTP to email
router.post("/send", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });

    const otp = generateOtp();

    // delete any existing OTP for this email first
    await Otp.deleteMany({ email });

    // save new OTP
    await Otp.create({ email, otp });

    // send email
    await sendEmail(
      email,
      "Your Verification Code — Project Allocator",
      `Hello,

Your verification code for Project Allocator is:

${otp}

This code expires in 10 minutes.
Do not share this code with anyone.

— Project Allocator Team`
    );

    res.json({ msg: "OTP sent" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error sending OTP" });
  }
});

module.exports = router;
