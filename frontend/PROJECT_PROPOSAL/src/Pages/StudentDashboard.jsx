import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./StudentDashboard.css";
import { useNavigate } from "react-router-dom";
import ChatBox from "./ChatBox";

function StudentDashboard() {

  const [email, setEmail] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [topics, setTopics] = useState({});
  const [student, setStudent] = useState({ groupDetails: [] });
  const [pendingRequest, setPendingRequest] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  const navigate = useNavigate();

  // ── auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setEmail(user.email);
    });
    return () => unsubscribe();
  }, []);

  // ── fetch all topics grouped by facultyId ─────────────────────────────────
  const fetchAllTopics = useCallback(async () => {
    try {
      const res = await axios.get("/api/topics");
      const grouped = {};
      res.data.forEach((t) => {
        if (!grouped[t.facultyId]) grouped[t.facultyId] = [];
        grouped[t.facultyId].push(t);
      });
      setTopics(grouped);
    } catch (err) { console.log(err); }
  }, []);

  // ── fetch faculties ───────────────────────────────────────────────────────
  const fetchFaculties = useCallback(async () => {
    try {
      const res = await axios.get("/api/faculty/all");
      setFaculties(res.data);
    } catch (err) { console.log(err); }
  }, []);

  // ── fetch pending request for the group ──────────────────────────────────
  const fetchPendingRequest = useCallback(async (leaderEmail) => {
    try {
      const res = await axios.get(
        `/api/requests/pending-by-student?studentEmail=${leaderEmail}`
      );
      setPendingRequest(res.data || null);
    } catch (err) { console.log(err); }
  }, []);

  // ── fetch approved requestId for chat ────────────────────────────────────
  const fetchRequestId = useCallback(async (leaderEmail) => {
    try {
      const res = await axios.get(
        `/api/requests/approved?studentEmail=${leaderEmail}`
      );
      if (res.data?._id) setRequestId(res.data._id);
    } catch (err) { console.log(err); }
  }, []);

  // ── fetch student (works for both leader and member via /me) ─────────────
  const fetchStudent = useCallback(async () => {
    if (!email) return;
    try {
      const res = await axios.get(
        `/api/students/me?email=${email}`
      );
      if (res.data) {
        setStudent(res.data);
        const leaderEmail = res.data.email;

        if (res.data.assignedTopic) {
          fetchRequestId(leaderEmail);
        } else if (res.data.groupDetails?.length > 0) {
          // group exists but no topic yet — check for pending request
          fetchPendingRequest(leaderEmail);
          fetchAllTopics(); // refresh topics so isAssigned is up to date
        }
      }
    } catch (err) { console.log(err); }
  }, [email, fetchRequestId, fetchPendingRequest, fetchAllTopics]);

  // ── initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (email) {
      fetchFaculties();
      fetchStudent();
      fetchAllTopics();
    }
  }, [email]);

  // ── real-time polling every 3s ────────────────────────────────────────────
  useEffect(() => {
    if (!email) return;
    const interval = setInterval(() => {
      fetchStudent();
      fetchAllTopics(); // keep topic availability in sync
    }, 3000);
    return () => clearInterval(interval);
  }, [email]);

  // ── send request — any group member can trigger this ─────────────────────
  const sendRequest = async (topic, facultyEmail) => {
    if (!student?.groupDetails?.length) {
      alert("Please create a group first!");
      return;
    }
    if (pendingRequest) {
      alert("You already have a pending request. Wait for faculty response.");
      return;
    }

    setSendingRequest(true);
    try {
      await axios.post("/api/requests/send", {
        facultyEmail,
        studentEmail: student.email, // always leader's email
        topicId: topic._id,
        topicTitle: topic.title,
        groupDetails: student.groupDetails
      });

      // immediately refresh so all members see pending state
      await fetchStudent();
      await fetchAllTopics();
      alert("Request Sent! Waiting for faculty approval.");
    } catch (err) {
      console.log(err);
      alert("Error sending request. Try again.");
    } finally {
      setSendingRequest(false);
    }
  };

  // ── accept invitation ──────────────────────────────────────────────────────
  const acceptInvitation = async () => {
    try {
      await axios.post("/api/students/accept-invitation", {
        leaderEmail: student.email,
        memberEmail: email
      });
      alert("Invitation Accepted!");
      fetchStudent();
    } catch (err) {
      console.log(err);
      alert("Error accepting invitation");
    }
  };

  // find current user's name from group for chat
  const myGroupDetail = student.groupDetails?.find(g => g.email === email);
  const myName = myGroupDetail?.name || email;
  const myStatus = myGroupDetail?.status || "accepted";

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="student-container">

      <div className="topBar">
        <h2>Student Dashboard</h2>
        <button onClick={() => navigate("/student-profile")}>Profile</button>
      </div>

      {student?.groupDetails?.length > 0 && myStatus === "pending" ? (
        // ══ PENDING INVITATION VIEW ══
        <div className="student-box" style={{ textAlign: "center", padding: "40px" }}>
          <h3 style={{ marginBottom: "16px", color: "#1a2b4a" }}>📩 Group Invitation</h3>
          <p style={{ fontSize: "16px", color: "#6b7c93", marginBottom: "24px" }}>
            You have been invited to join a project group by <b>{student.groupDetails.find(g => g.email === student.email)?.name || student.email}</b>.
            <br /><br />
            Accept this invitation to view your group's unified dashboard and participate in topic selection.
          </p>
          <button onClick={acceptInvitation} style={{ background: "#10b981", padding: "12px 24px", fontSize: "16px" }}>
            ✅ Accept Invitation
          </button>
        </div>
      ) : student?.assignedTopic ? (
        // ══ ASSIGNED TOPIC VIEW ══

        <div className="student-box">
          <h3>✅ Allocated Project</h3>
          <br />
          <p><b>Topic:</b> {student.assignedTopic}</p>
          <p><b>Faculty:</b> {student.facultyEmail}</p>

          <h4 style={{ marginTop: "16px", marginBottom: "8px", color: "#1a2b4a" }}>
            Group Members
          </h4>
          {student.groupDetails?.map((g, i) => (
            <div key={i} style={{ fontSize: "14px", color: "#374151", marginBottom: "6px" }}>
              • {g.name} — {g.email}
              {g.email === student.email && (
                <span style={{
                  marginLeft: "8px", background: "#dbeafe", color: "#2563eb",
                  fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px"
                }}>Leader</span>
              )}
              {g.email === email && g.email !== student.email && (
                <span style={{
                  marginLeft: "8px", background: "#f0fdf4", color: "#16a34a",
                  fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px"
                }}>You</span>
              )}
            </div>
          ))}

          <h4 style={{ marginTop: "20px", marginBottom: "8px", color: "#1a2b4a" }}>Progress</h4>
          <div className="checkbox-item">
            <input type="checkbox" checked={student.progress?.synopsis || false} readOnly />
            <span>Synopsis</span>
          </div>
          <div className="checkbox-item">
            <input type="checkbox" checked={student.progress?.presentation || false} readOnly />
            <span>Presentation</span>
          </div>
          <div className="checkbox-item">
            <input type="checkbox" checked={student.progress?.submission || false} readOnly />
            <span>Final Submission</span>
          </div>

          {/* CHAT */}
          {requestId && (
            <button
              style={{ marginTop: "20px" }}
              onClick={() => setChatRoomId(chatRoomId ? null : requestId)}
            >
              {chatRoomId ? "Close Chat" : "💬 Open Group Chat"}
            </button>
          )}
          {chatRoomId && (
            <ChatBox
              roomId={chatRoomId}
              senderEmail={email}
              senderRole="student"
              senderName={myName}
              onClose={() => setChatRoomId(null)}
            />
          )}
        </div>

      ) : (
        // ══ NO TOPIC YET VIEW ══
        <>

          {/* NO GROUP YET */}
          {!student?.groupDetails?.length && (
            <div className="student-box" style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ fontSize: "16px", color: "#6b7c93", marginBottom: "16px" }}>
                You need to create or join a group before selecting a topic.
              </p>
              <button onClick={() => navigate("/student-profile")}>
                👥 Create Group
              </button>
            </div>
          )}

          {/* GROUP DETAILS */}
          {student?.groupDetails?.length > 0 && (
            <div className="student-box">
              <h3>My Group</h3>
              {student.groupDetails.map((g, i) => (
                <div key={i}>
                  <p>
                    <b>{g.name}</b>
                    {g.email === student.email && (
                      <span style={{
                        marginLeft: "8px", background: "#dbeafe", color: "#2563eb",
                        fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px"
                      }}>Leader</span>
                    )}
                    {g.email === email && g.email !== student.email && (
                      <span style={{
                        marginLeft: "8px", background: "#f0fdf4", color: "#16a34a",
                        fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px"
                      }}>You</span>
                    )}
                  </p>
                  <p style={{ color: "#6b7c93", fontSize: "13px" }}>{g.email} • Roll: {g.roll}</p>
                  <hr />
                </div>
              ))}
            </div>
          )}

          {/* PENDING REQUEST BANNER */}
          {pendingRequest && (
            <div className="student-box" style={{
              borderLeft: "4px solid #f59e0b",
              background: "#fffbeb"
            }}>
              <h3 style={{ color: "#92400e" }}>⏳ Request Pending</h3>
              <p><b>Topic:</b> {pendingRequest.topicTitle}</p>
              <p><b>Faculty:</b> {pendingRequest.facultyEmail}</p>
              <p style={{ color: "#92400e", fontSize: "13px", marginTop: "8px" }}>
                Waiting for faculty approval. You cannot select another topic until this is resolved.
              </p>
            </div>
          )}

          {/* FACULTY & TOPICS */}
          {student?.groupDetails?.length > 0 && (
            faculties.map((f) => (
              <div key={f._id} className="student-box">
                <h3>{f.name || "No Name"}</h3>
                <p>{f.specialization?.join(", ")}</p>
                {(topics[f._id] || []).map((t) => (
                  <div key={t._id} className="topic1">
                    <b>{t.title}</b>
                    <p>{t.language}</p>
                    <button
                      disabled={t.isAssigned || !!pendingRequest || sendingRequest}
                      onClick={() => sendRequest(t, f.email)}
                      style={
                        (pendingRequest || sendingRequest) && !t.isAssigned
                          ? { background: "#cbd5e1", cursor: "not-allowed" }
                          : {}
                      }
                    >
                      {t.isAssigned
                        ? "Closed"
                        : pendingRequest
                          ? "⏳ Pending"
                          : sendingRequest
                            ? "Sending…"
                            : "Select"}
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}

        </>
      )}

    </div>
  );
}

export default StudentDashboard;
