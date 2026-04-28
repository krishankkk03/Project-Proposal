import { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./StudentProfile.css";
import { useNavigate } from "react-router-dom";

function StudentProfile() {

  const [email, setEmail] = useState("");
  const [groupDetails, setGroupDetails] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [memberCount, setMemberCount] = useState(null);
  const [validating, setValidating] = useState(false); // loading state for validation
  const [emailErrors, setEmailErrors] = useState([]);   // per-member email errors
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setEmail(user.email);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!email) return;
    const fetchStudent = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/students/me?email=${email}`);
        if (res.data && res.data.groupDetails?.length > 0) {
          setGroupDetails(res.data.groupDetails);
          setIsLocked(true);
          setMemberCount(res.data.groupDetails.length);
        }
      } catch (err) { console.log(err); }
    };
    fetchStudent();
  }, [email]);

  const handleChange = (index, field, value) => {
    const updated = [...groupDetails];
    updated[index][field] = value;
    setGroupDetails(updated);

    // clear email error when user types
    if (field === "email") {
      const errs = [...emailErrors];
      errs[index] = "";
      setEmailErrors(errs);
    }
  };

  const createInputs = (count) => {
    if (isLocked) return alert("Group already created. Cannot edit.");
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({ name: "", email: "", roll: "", classSec: "", course: "" });
    }
    setMemberCount(count);
    setGroupDetails(arr);
    setEmailErrors(new Array(count).fill(""));
  };

  const saveData = async () => {
    if (!email) return alert("User not logged in");
    if (isLocked) return alert("Group already saved!");

    // basic field validation
    for (let g of groupDetails) {
      if (!g.name || !g.roll || !g.email) {
        alert("Please fill Name, Email and Roll for all members!");
        return;
      }
    }

    setValidating(true);
    const errors = new Array(groupDetails.length).fill("");
    let hasError = false;

    // validate each member email exists in DB
    for (let i = 0; i < groupDetails.length; i++) {
      const memberEmail = groupDetails[i].email.trim();

      // leader's own email is always valid
      if (memberEmail === email) continue;

      try {
        const res = await axios.get(
          `http://localhost:5000/api/students/exists?email=${memberEmail}`
        );
        if (!res.data.exists) {
          errors[i] = `${memberEmail} is not registered. Ask them to signup first.`;
          hasError = true;
        }
      } catch (err) {
        errors[i] = "Could not verify email. Try again.";
        hasError = true;
      }
    }

    setEmailErrors(errors);
    setValidating(false);

    if (hasError) return;

    // all emails valid — save
    try {
      await axios.post("http://localhost:5000/api/students/save", {
        email,
        groupDetails
      });
      alert("Group Saved!");
      setIsLocked(true);
      navigate("/student");
    } catch (err) {
      console.log(err);
      alert("Error saving data");
    }
  };

  return (
    <div className="student-profile-container">

      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate("/student")}>
          ← Back
        </button>
        <h2>Student Profile</h2>
        <div style={{ width: "80px" }}></div>
      </div>

      {!isLocked && !memberCount && (
        <div className="member-select">
          <p>How many members in your group?</p>
          <div className="member-btns">
            <button className="action-btn" onClick={() => createInputs(1)}>1 Member</button>
            <button className="action-btn" onClick={() => createInputs(2)}>2 Members</button>
            <button className="action-btn" onClick={() => createInputs(3)}>3 Members</button>
          </div>
        </div>
      )}

      {groupDetails.length > 0 && (
        <>
          <p className="member-count">Total Members: {groupDetails.length}</p>

          {groupDetails.map((g, i) => (
            <div key={i} className="form-row">
              <p className="member-label">Member {i + 1}</p>

              <input
                placeholder="Name *"
                value={g.name}
                disabled={isLocked}
                onChange={(e) => handleChange(i, "name", e.target.value)}
              />
              <div style={{ position: "relative" }}>
                <input
                  placeholder="Email * (must be registered)"
                  value={g.email}
                  disabled={isLocked}
                  onChange={(e) => handleChange(i, "email", e.target.value)}
                  style={{
                    borderColor: emailErrors[i] ? "#ef4444" : undefined,
                    width: "100%"
                  }}
                />
                {emailErrors[i] && (
                  <p style={{
                    color: "#ef4444",
                    fontSize: "12px",
                    margin: "4px 0 0",
                    fontWeight: 500
                  }}>
                    ⚠️ {emailErrors[i]}
                  </p>
                )}
              </div>
              <input
                placeholder="Roll Number *"
                value={g.roll}
                disabled={isLocked}
                onChange={(e) => handleChange(i, "roll", e.target.value)}
              />
              <input
                placeholder="Class & Section"
                value={g.classSec}
                disabled={isLocked}
                onChange={(e) => handleChange(i, "classSec", e.target.value)}
              />
              <input
                placeholder="Course"
                value={g.course}
                disabled={isLocked}
                onChange={(e) => handleChange(i, "course", e.target.value)}
              />
            </div>
          ))}

          {!isLocked && (
            <button
              onClick={saveData}
              className="action-btn save-group-btn"
              disabled={validating}
            >
              {validating ? "Validating emails…" : "Save Group"}
            </button>
          )}

          {isLocked && (
            <p className="locked-msg">✅ Group saved and locked</p>
          )}
        </>
      )}

    </div>
  );
}

export default StudentProfile;
