import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./FacultyDashboard.css";
import ChatBox from "./ChatBox";  

function FacultyDashboard() {

  const navigate = useNavigate();

  const [email, setEmail]                     = useState("");
  const [topics, setTopics]                   = useState([]);
  const [faculty, setFaculty]                 = useState({});
  const [students, setStudents]               = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [actionLoading, setActionLoading]     = useState(null);
  const [chatRoomId, setChatRoomId]           = useState(null);
  const [groupRequests, setGroupRequests]     = useState({});  // studentEmail → requestId

  const [editId, setEditId]           = useState(null);
  const [editTitle, setEditTitle]     = useState("");
  const [editLanguage, setEditLanguage] = useState("");

  // ── auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setEmail(user.email);
    });
    return () => unsubscribe();
  }, []);

  // ── fetchers ──────────────────────────────────────────────────────────────
  const fetchStudents = async () => {
    try {
      const res = await axios.get("https://project-proposal-0tba.onrender.com/api/students/all");
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.log(err); }
  };

  const fetchTopics = async () => {
    try {
      const res = await axios.get(`https://project-proposal-0tba.onrender.com/api/topics/${email}`);
      setTopics(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`https://project-proposal-0tba.onrender.com/api/faculty/${email}`);
      setFaculty(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await axios.get(
        `https://project-proposal-0tba.onrender.com/api/requests/pending?facultyEmail=${email}`
      );
      setPendingRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.log(err); }
  };

  const fetchGroupRequests = async () => {
    try {
      const res = await axios.get(
        `https://project-proposal-0tba.onrender.com/api/requests/approved-by-faculty?facultyEmail=${email}`
      );
      const map = {};
      res.data.forEach(r => { map[r.studentEmail] = r._id; });
      setGroupRequests(map);
    } catch (err) { console.log(err); }
  };

  useEffect(() => {
    fetchStudents();
    if (email) {
      fetchTopics();
      fetchProfile();
      fetchPendingRequests();
      fetchGroupRequests();
    }
  }, [email]);

  // ── approve ───────────────────────────────────────────────────────────────
  const handleApprove = async (requestId) => {
    setActionLoading(requestId);
    try {
      await axios.patch(`https://project-proposal-0tba.onrender.com/api/requests/approve/${requestId}`);
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
      fetchStudents();
      fetchGroupRequests(); // refresh chat map too
    } catch (err) {
      console.log(err);
      alert("Error approving request");
    } finally {
      setActionLoading(null);
    }
  };

  // ── reject ────────────────────────────────────────────────────────────────
  const handleReject = async (requestId) => {
    setActionLoading(requestId);
    try {
      await axios.patch(`https://project-proposal-0tba.onrender.com/api/requests/reject/${requestId}`);
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      console.log(err);
      alert("Error rejecting request");
    } finally {
      setActionLoading(null);
    }
  };

  // ── progress ──────────────────────────────────────────────────────────────
  const updateProgress = async (studentEmail, field, value) => {
    try {
      await axios.post("https://project-proposal-0tba.onrender.com/api/progress/update-progress", {
        studentEmail, field, value
      });
      if (selectedStudent?.email === studentEmail) {
        setSelectedStudent({
          ...selectedStudent,
          progress: { ...selectedStudent.progress, [field]: value }
        });
      }
      fetchStudents();
    } catch (err) { console.log(err); }
  };

  // ── topics ────────────────────────────────────────────────────────────────
  const deleteTopic = async (id) => {
    await axios.delete(`https://project-proposal-0tba.onrender.com/api/topics/delete/${id}`);
    fetchTopics();
  };

  const startEdit = (topic) => {
    setEditId(topic._id);
    setEditTitle(topic.title);
    setEditLanguage(topic.language);
  };

  const updateTopic = async () => {
    await axios.put(`https://project-proposal-0tba.onrender.com/api/topics/update/${editId}`, {
      title: editTitle, language: editLanguage
    });
    setEditId(null);
    fetchTopics();
  };

  // ── animations ────────────────────────────────────────────────────────────
  useGSAP(() => {
  gsap.from(".topBar", { y: -50, opacity: 0, duration: 1 });
}, []);

  useGSAP(() => {
    if (!topics.length) return;
    gsap.fromTo(".topic",
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, stagger: 0.2, duration: 0.5 }
    );
  }, [topics]);

  const assignedGroups = students.filter(
    s => s.assignedTopic && s.facultyEmail === email
  );

  return (
    <div className="faculty-container">

      {/* ── TOP BAR ── */}
      <div className="topBar">
        <div style={{ width: "120px" }}></div>
        <div className="headerCenter">
          <h2>Faculty Dashboard</h2>
          <p className="name">{faculty?.name || "No Name Added"}</p>
          <p className="spec">{faculty?.specialization?.join(", ") || "No Specialization"}</p>
        </div>
        <button className="profileBtn" onClick={() => navigate("/faculty-profile")}>
          Profile
        </button>
      </div>

      <div className="faculty-box">

        {/* ── PENDING REQUESTS ── */}
        <h3>
          Pending Requests
          {pendingRequests.length > 0 && (
            <span className="badge">{pendingRequests.length}</span>
          )}
        </h3>

        {pendingRequests.length === 0 ? (
          <p className="empty">No pending requests</p>
        ) : (
          pendingRequests.map((req) => (
            <div key={req._id} className="request-card">
              <p><b>Topic:</b> {req.topicTitle}</p>
              <p><b>Student:</b> {req.studentEmail}</p>

              {req.groupDetails?.length > 0 && (
                <details>
                  <summary className="group-summary">View Group Members</summary>
                  <div className="group-members">
                    {req.groupDetails.map((g, i) => (
                      <p key={i}>{g.name} — Roll: {g.roll}</p>
                    ))}
                  </div>
                </details>
              )}

              <div className="request-actions">
                <button
                  className="approve-btn"
                  disabled={actionLoading === req._id}
                  onClick={() => handleApprove(req._id)}
                >
                  {actionLoading === req._id ? "Processing…" : "✅ Approve"}
                </button>
                <button
                  className="reject-btn"
                  disabled={actionLoading === req._id}
                  onClick={() => handleReject(req._id)}
                >
                  {actionLoading === req._id ? "Processing…" : "❌ Reject"}
                </button>
              </div>
            </div>
          ))
        )}

        {/* ── ASSIGNED GROUPS ── */}
        <h3>Assigned Groups ({assignedGroups.length})</h3>

        {assignedGroups.length > 0 ? (
          assignedGroups.map((s, i) => (
            <div
              key={i}
              className="topic"
              onClick={() => {
                setSelectedStudent(s);
                setChatRoomId(null); // close chat when switching group
              }}
            >
              <h4>{s.assignedTopic}</h4>
              <p><b>Leader:</b> {s.email}</p>
            </div>
          ))
        ) : (
          <p>No assigned groups</p>
        )}

        {/* ── GROUP DETAIL PANEL ── */}
        {selectedStudent && (
          <div className="faculty-box">
            <button onClick={() => { setSelectedStudent(null); setChatRoomId(null); }}>
              Close
            </button>
            <br /><br />

            <h3>Group Details</h3>
            <p><b>Topic:</b> {selectedStudent.assignedTopic}</p>
            <p><b>Leader:</b> {selectedStudent.email}</p>

            <h4 className="sectionHeader">Members Progress</h4>
            {selectedStudent.groupDetails?.map((g, i) => (
              <p key={i}>{g.name} ({g.roll})</p>
            ))}

            <div className="progressRow rightAlign">
              <div className="progressItem">
                <input type="checkbox"
                  checked={selectedStudent.progress?.synopsis || false}
                  onChange={(e) => updateProgress(selectedStudent.email, "synopsis", e.target.checked)}
                />
                <span>Synopsis</span>
              </div>
            </div>

            <div className="progressRow rightAlign">
              <div className="progressItem">
                <input type="checkbox"
                  checked={selectedStudent.progress?.presentation || false}
                  onChange={(e) => updateProgress(selectedStudent.email, "presentation", e.target.checked)}
                />
                <span>Presentation</span>
              </div>
            </div>

            <div className="progressRow rightAlign">
              <div className="progressItem">
                <input type="checkbox"
                  checked={selectedStudent.progress?.submission || false}
                  onChange={(e) => updateProgress(selectedStudent.email, "submission", e.target.checked)}
                />
                <span>Final Submission</span>
              </div>
            </div>

            {/* ── CHAT BUTTON ── */}
<button
  style={{ marginTop: "16px" }}
  onClick={async () => {
    if (chatRoomId) {
      setChatRoomId(null);
      return;
    }
    try {
      const res = await axios.get(
        `https://project-proposal-0tba.onrender.com/api/requests/approved?studentEmail=${selectedStudent.email}`
      );
      if (res.data?._id) {
        setChatRoomId(res.data._id);
      } else {
        alert("Chat not available yet for this group.");
      }
    } catch (err) {
      alert("Could not load chat. Is the request approved?");
    }
  }}
>
  {chatRoomId ? "Close Chat" : "💬 Open Group Chat"}
</button>

{/* ── CHAT BOX ── */}
{chatRoomId && (
  <ChatBox
    roomId={chatRoomId}
    senderEmail={email}
    senderRole="faculty"
    senderName={faculty?.name || email}
    onClose={() => setChatRoomId(null)}
  />
)}
          </div>
        )}

        {/* ── MY TOPICS ── */}
        <h3>My Topics</h3>
        {topics.length === 0 ? (
          <p className="empty">No topics added yet</p>
        ) : (
          topics.map((t) => (
            <div key={t._id} className="topic">
              {editId === t._id ? (
                <>
                  <input value={editTitle}    onChange={(e) => setEditTitle(e.target.value)} />
                  <input value={editLanguage} onChange={(e) => setEditLanguage(e.target.value)} />
                  <button onClick={updateTopic}>Save</button>
                  <button onClick={() => setEditId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <b>{t.title}</b>
                  <p>{t.language}</p>
                  <button onClick={() => startEdit(t)}>Edit</button>
                  <button onClick={() => deleteTopic(t._id)}>Delete</button>
                </>
              )}
            </div>
          ))
        )}

      </div>
    </div>
  );
}

export default FacultyDashboard;
