const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "dishu.project135@gmail.com", 
        pass: "avxw kqam ctrn kvjh"        
      }
    });

    await transporter.sendMail({
      from: "dishu.project135@gmail.com",
      to,
      subject,
      text
    });

    console.log("Email sent to:", to);

  } catch (err) {
    console.log("Email Error:", err);
  }
};

module.exports = sendEmail;