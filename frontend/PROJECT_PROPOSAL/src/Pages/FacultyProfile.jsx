import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./FacultyProfile.css";

function FacultyProfile() {

  const navigate = useNavigate();

  const [email, setEmail]                   = useState("");
  const [name, setName]                     = useState("");
  const [specialization, setSpecialization] = useState("");
  const [isEditing, setIsEditing]           = useState(false);
  const [saved, setSaved]                   = useState(false);

  const [topics, setTopics]       = useState([]);
  const [newTitle, setNewTitle]   = useState("");
  const [newLang, setNewLang]     = useState("");
  const [editId, setEditId]       = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLang, setEditLang]   = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setEmail(user.email);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!email) return;
    fetchProfile();
    fetchTopics();
  }, [email]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`https://project-proposal-0tba.onrender.com/api/faculty/${email}`);
      if (res.data) {
        setName(res.data.name || "");
        setSpecialization(res.data.specialization?.join(", ") || "");
        // if profile already saved, show compact view
        if (res.data.name) setIsEditing(false);
        else setIsEditing(true);
      }
    } catch (err) { console.log(err); }
  };

  const fetchTopics = async () => {
    try {
      const res = await axios.get(`https://project-proposal-0tba.onrender.com/api/topics/${email}`);
      setTopics(res.data);
    } catch (err) { console.log(err); }
  };

  const saveProfile = async () => {
    if (!name) return alert("Please enter your name");
    try {
      await axios.post("https://project-proposal-0tba.onrender.com/api/faculty/save-profile", {
        email,
        name,
        specialization: specialization.split(",").map(s => s.trim()).filter(Boolean)
      });
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.log(err);
      alert("Error saving profile");
    }
  };

  const addTopic = async () => {
    if (!newTitle || !newLang) return alert("Please enter both title and language");
    try {
      await axios.post("https://project-proposal-0tba.onrender.com/api/topics/add", {
        title: newTitle,
        language: newLang,
        email
      });
      setNewTitle("");
      setNewLang("");
      fetchTopics();
    } catch (err) { console.log(err); alert("Error adding topic"); }
  };

  const deleteTopic = async (id) => {
    await axios.delete(`https://project-proposal-0tba.onrender.com/api/topics/delete/${id}`);
    fetchTopics();
  };

  const startEdit = (topic) => {
    setEditId(topic._id);
    setEditTitle(topic.title);
    setEditLang(topic.language);
  };

  const updateTopic = async () => {
    await axios.put(`https://project-proposal-0tba.onrender.com/api/topics/update/${editId}`, {
      title: editTitle, language: editLang
    });
    setEditId(null);
    fetchTopics();
  };

  return (
    <div className="profile-container">

      <div className="profile-topBar">
        <button className="back-btn" onClick={() => navigate("/faculty")}>
          ← Back
        </button>
        <h2>Faculty Profile</h2>
        <div style={{ width: "80px" }}></div>
      </div>

      {/* ── PROFILE BOX ── */}
      <div className="profile-box">
        <p className="profile-email">{email}</p>

        {isEditing ? (
          <>
            <label>Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label style={{ marginTop: "8px" }}>Specialization</label>
            <input
              type="text"
              placeholder="e.g. AI, Web Development, Data Science"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
            />
            <small>Separate multiple specializations with commas</small>

            <button className="save-btn" onClick={saveProfile}>
              Save Profile
            </button>

            {saved && <p className="success-msg">✅ Profile saved successfully!</p>}
          </>
        ) : (
          <div className="profile-compact">
            <p className="compact-name">{name || "No name added"}</p>
            <p className="compact-spec">{specialization || "No specialization added"}</p>
            <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
              ✏️ Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* ── TOPICS BOX ── */}
      <div className="profile-box" style={{ marginTop: "20px" }}>
        <h3 style={{ color: "#2c3e50", marginBottom: "12px" }}>My Topics</h3>

        <label>Topic Title</label>
        <input
          type="text"
          placeholder="Enter topic title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />

        <label style={{ marginTop: "8px" }}>Language / Technology</label>
        <input
          type="text"
          placeholder="e.g. React, Python, Java"
          value={newLang}
          onChange={(e) => setNewLang(e.target.value)}
        />

        <button className="save-btn" onClick={addTopic}>
          + Add Topic
        </button>

        {topics.length === 0 ? (
          <p style={{ color: "gray", marginTop: "12px" }}>No topics added yet</p>
        ) : (
          topics.map((t) => (
            <div key={t._id} className="topic-card">
              {editId === t._id ? (
                <>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <input value={editLang}  onChange={(e) => setEditLang(e.target.value)} />
                  <div className="topic-actions">
                    <button className="save-btn" onClick={updateTopic}>Save</button>
                    <button className="delete-btn" onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <b>{t.title}</b>
                  <p style={{ color: "gray", margin: "4px 0" }}>{t.language}</p>
                  {t.isAssigned && <span className="assigned-tag">Assigned</span>}
                  <div className="topic-actions">
                    <button className="edit-btn" onClick={() => startEdit(t)}>Edit</button>
                    <button className="delete-btn" onClick={() => deleteTopic(t._id)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default FacultyProfile;
