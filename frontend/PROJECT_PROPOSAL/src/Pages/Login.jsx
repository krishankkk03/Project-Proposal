import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import axios from "axios";
import "./login.css";
import logo from "./logo_project.jpg";

function Login() {

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();

  useGSAP(() => {
    gsap.from("#main_box", { y: 60, opacity: 0, duration: 0.8 });
  });

  const loginUser = async () => {
    setError("");
    if (!role)     return setError("Please select a role");
    if (!email)    return setError("Please enter your email");
    if (!password) return setError("Please enter your password");

    setLoading(true);

    // Step 1 — Firebase login
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.log(err.code);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Incorrect email or password.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found. Please signup first.");
      } else {
        setError("Login failed. Please try again.");
      }
      setLoading(false);
      return;
    }

    // Step 2 — check OTP verification
    try {
      const verifyRes = await axios.get(
        `/api/otp/is-verified?email=${email}`
      );

      if (!verifyRes.data.verified) {
        await axios.post("/api/otp/send", { email });
        setError("Email not verified. A new code has been sent to your inbox.");
        setLoading(false);
        return;
      }

      // Step 3 — navigate
      if (role === "student") navigate("/student");
      else if (role === "faculty") navigate("/faculty");

    } catch (err) {
      console.log("Verification check error:", err);
      setError("Could not connect to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="main_box">

      <div className="login-brand">
        <img src={logo} alt="logo" />
        <div className="login-brand-text">
          <h4>Online Project Proposal</h4>
          <span>and Allocation System</span>
        </div>
      </div>

      <h1 id="title">Welcome Back 👋</h1>

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

      <button id="loginBtn" onClick={loginUser} disabled={loading}>
        {loading ? "Logging in…" : "Login"}
      </button>

      <p className="auth-footer">
        Don't have an account? <a href="/signup">Sign Up</a>
      </p>

    </div>
  );
}

export default Login;
