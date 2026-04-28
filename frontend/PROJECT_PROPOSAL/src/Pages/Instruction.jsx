import { useState } from "react";
import "./Instruction.css";

function Instruction() {
  const [activeBox, setActiveBox] = useState(null);

  const toggleBox = (box) => {
    setActiveBox(activeBox === box ? null : box);
  };

  return (
  <div className="home-instruction-container">

    <div className="home-box" onClick={() => toggleBox("enrollment")}>
      <h3>Enrollment</h3>

      {activeBox === "enrollment" && (
        <ul className="instructions">
          <li>Students must Sign Up first.</li>
          <li>Students need to enter their Roll Number.</li>
          <li>Faculty only Login / Sign Up (no Roll Number).</li>
          <li>After login, dashboard will open.</li>
          <li>Complete profile details on dashboard.</li>
        </ul>
      )}
    </div>

    <div className="home-box" onClick={() => toggleBox("topic")}>
      <h3>Topic Selection</h3>

      {activeBox === "topic" && (
        <ul className="instructions">
          <li>Faculty will add project topics with required language.</li>
          <li>Topics are visible to all students.</li>
          <li>Students can select only available topics.</li>
          <li>Request email is sent to faculty.</li>
          <li>Faculty approves or rejects request.</li>
          <li>If approved, student gets confirmation email.</li>
          <li>Dashboard updates for both student and faculty.</li>
        </ul>
      )}
    </div>

    <div className="home-box" onClick={() => toggleBox("submission")}>
      <h3>Submission</h3>

      {activeBox === "submission" && (
        <ul className="instructions">
          <li>Submit Synopsis first.</li>
          <li>Then submit Presentation.</li>
          <li>Finally submit the Project.</li>
          <li>Faculty reviews each stage.</li>
          <li>Checkboxes are marked after approval.</li>
          <li>Progress is visible on dashboard.</li>
        </ul>
      )}
    </div>

  </div>
);
}

export default Instruction;