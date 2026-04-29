import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './login.css'; 
import logo from "./logo_project.jpg";

function Signup() {

  const [role, setRole]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  const [step, setStep]         = useState("form");
  const [otpInput, setOtpInput] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const navigate = useNavigate();

  useGSAP(() => {
    gsap.from("#main_box", { y: 60, opacity: 0, duration: 0.8 });
  });

  const signupUser = async () => {
    setError("");
    if (!role)     return setError("Please select a role");
    if (!email)    return setError("Please enter your email");
    if (!password) return setError("Please enter a password");

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await axios.post("/api/otp/send", { email });
      setStep("otp");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setStep("alreadyExists");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError(err.message || "Signup failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    if (!otpInput || otpInput.length !== 6) return setError("Please enter the 6-digit code");

    setLoading(true);
    try {
      await axios.post("/api/otp/verify", { email, otp: otpInput });

      if (role === "student") {
        await axios.post("/api/students/save", { email, groupDetails: [] });
        navigate("/student");
      } else if (role === "faculty") {
        await axios.post("/api/faculty/create", { email });
        navigate("/faculty");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setOtpInput("");
    setLoading(true);
    try {
      await axios.post("/api/otp/send", { email });
      setError("New code sent! Check your inbox.");
    } catch {
      setError("Could not resend. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <div id="main_box">
        <div className="login-brand">
          <img src={logo} alt="logo" />
          <div className="login-brand-text">
            <h4>Online Project Proposal</h4>
            <span>and Allocation System</span>
          </div>
        </div>

        <h1 id="title">Verify Email 📧</h1>

        <p style={{ fontSize: "13px", color: "#6b7c93", textAlign: "center", marginBottom: "20px" }}>
          We sent a 6-digit code to<br /><b style={{ color: "#1a2b4a" }}>{email}</b>
        </p>

        {error && (
          <p style={{ color: error.includes("sent") ? "#38a169" : "#e53e3e", fontSize: "13px", marginBottom: "12px", textAlign: "center" }}>
            {error}
          </p>
        )}

        <div className="inputField">
          <div className="input-wrapper">
            <span className="input-icon">🔢</span>
            <input
              className="input_field"
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-digit code"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
              style={{ textAlign: "center", fontSize: "20px", letterSpacing: "8px", paddingLeft: "14px" }}
            />
          </div>
        </div>

        <button id="signupBtn" onClick={verifyOtp} disabled={loading}>
          {loading ? "Verifying…" : "Verify & Continue"}
        </button>

        <p className="auth-footer">
          Didn't receive it?{" "}
          <span onClick={resendOtp} style={{ color: "#2563eb", cursor: "pointer", fontWeight: 600 }}>
            Resend code
          </span>
        </p>

        <p className="auth-footer">
          <span onClick={() => setStep("form")} style={{ color: "#6b7c93", cursor: "pointer" }}>
            ← Back
          </span>
        </p>
      </div>
    );
  }

  if (step === "alreadyExists") {
    return (
      <div id="main_box">
        <div className="login-brand">
          <img src={logo} alt="logo" />
          <div className="login-brand-text">
            <h4>Online Project Proposal</h4>
            <span>and Allocation System</span>
          </div>
        </div>

        <h1 id="title">Already Registered</h1>

        <p style={{ fontSize: "14px", color: "#6b7c93", textAlign: "center", marginBottom: "20px" }}>
          This email is already registered.
        </p>

        <button id="signupBtn" onClick={() => navigate("/login")}>
          Go to Login
        </button>

        <p className="auth-footer">
          <span onClick={() => setStep("form")} style={{ color: "#6b7c93", cursor: "pointer" }}>
            ← Use different email
          </span>
        </p>
      </div>
    );
  }

  return (
    <div id="main_box">

      <div className="login-brand">
        <img src={logo} alt="logo" />
        <div className="login-brand-text">
          <h4>Online Project Proposal</h4>
          <span>and Allocation System</span>
        </div>
      </div>

      <h1 id="title">Create Account 🚀</h1>

      {error && (
        <p style={{ color: "#e53e3e", fontSize: "13px", marginBottom: "12px", textAlign: "center" }}>
          {error}
        </p>
      )}

      <div className="inputField">
        <div className="input-wrapper">
          <span className="input-icon">👤</span>
          <select
            className="input_field"
            onChange={(e) => setRole(e.target.value)}
            value={role}
          >
            <option value="">Select Role</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
          </select>
        </div>

        <div className="input-wrapper">
          <span className="input-icon">✉️</span>
          <input
            className="input_field"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-wrapper">
          <span className="input-icon">🔒</span>
          <input
            className="input_field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <button id="signupBtn" onClick={signupUser} disabled={loading}>
        {loading ? "Please wait…" : "Sign Up"}
      </button>

      <p className="auth-footer">
        Already have an account? <a href="/login">Login</a>
      </p>

    </div>
  );
}

export default Signup;
