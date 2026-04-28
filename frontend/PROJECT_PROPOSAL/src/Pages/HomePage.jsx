import React from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useNavigate } from "react-router-dom";
import './HomePage.css'
import logo from "./logo_project.jpg";
import Instruction from "./Instruction.jsx"

const HomePage = () => {
  const navigate = useNavigate();

  useGSAP(() => {
    gsap.from("#navbar", { y: -60, opacity: 0, duration: 0.8 });
    gsap.from(".hero-text h1", { y: 40, opacity: 0, duration: 0.8, delay: 0.3 });
    gsap.from(".hero-text p",  { y: 30, opacity: 0, duration: 0.8, delay: 0.5 });
    gsap.from(".hero-buttons", { y: 20, opacity: 0, duration: 0.8, delay: 0.7 });
    gsap.from(".hero-image",   { x: 60, opacity: 0, duration: 0.9, delay: 0.4 });
  });

  return (
    <div className="home-container">

      <div id="navbar">
        <div className="nav-brand">
          <img src={logo} alt="logo" />
          <div className="nav-brand-text">
            <h3>Project Allocator</h3>
          </div>
        </div>

        <div id="nav2">
          <button className="nav-link" onClick={() => {
            document.getElementById("about").scrollIntoView({ behavior: "smooth" });
          }}>
            Home
          </button>
          <button className="nav-link" onClick={() => {
            document.getElementById("features-section").scrollIntoView({ behavior: "smooth" });
          }}>
            Features
          </button>
          <button className="nav-btn-login" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="nav-btn-signup" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
        </div>
      </div>

      <div className="hero">
        <div className="hero-text">
          <h1>Organize. Connect.<br /><span>Manage.</span></h1>
          <p>Effortlessly manage your projects and team collaborations.</p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate("/signup")}>
              Get Started
            </button>
            <button className="btn-secondary" onClick={() => {
              document.getElementById("about").scrollIntoView({ behavior: "smooth" });
            }}>
              Learn More
            </button>
          </div>
        </div>

        <div className="hero-image">
          <img src={logo} alt="hero" />
        </div>
      </div>

      <div id="features-section" className="features">
        <div className="feature-card">
          <div className="feature-icon" style={{ background: "#f0fdf4" }}>🔗</div>
          <h4>Connect Teams</h4>
          <p>Collaborate seamlessly with your team members.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: "#fefce8" }}>⚡</div>
          <h4>Fast Access</h4>
          <p>Quickly access important files and tasks.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon" style={{ background: "#fdf4ff" }}>📊</div>
          <h4>Track Progress</h4>
          <p>Monitor project status and progress in real-time.</p>
        </div>
      </div>

      <Instruction />

      <div id="about">
        <h2>About Us</h2>
        <p>
          Project Allocator is a smart platform that connects students and faculty for
          seamless project allocation. Faculty can add topics, students can select them,
          and approvals are managed efficiently through the system. It also tracks project
          progress from synopsis to final submission, making the entire process organized,
          transparent, and easy to manage.
        </p>
      </div>

      <div id="footer">
        <p>📧 dishu.project135@gmail.com</p>
        <p>📞 9999453245</p>
      </div>

    </div>
  );
}

export default HomePage;
