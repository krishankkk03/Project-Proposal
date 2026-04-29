import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import "./ChatBox.css";

const SOCKET_URL = "https://project-proposal-0tba.onrender.com";

function ChatBox({ roomId, senderEmail, senderRole, senderName, onClose }) {
  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState("");
  const [error, setError]         = useState("");
  const socketRef                 = useRef(null);
  const bottomRef                 = useRef(null);

  useEffect(() => {
    if (!roomId || !senderEmail) return;

    axios
      .get(`/api/chat/${roomId}?email=${senderEmail}`)
      .then(res => setMessages(res.data))
      .catch(err => setError(err.response?.data?.error || "Could not load messages"));

    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit("joinRoom", { roomId });

    socketRef.current.on("receiveMessage", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId, senderEmail]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    socketRef.current.emit("sendMessage", {
      roomId,
      senderEmail,
      senderRole,
      senderName,
      message: trimmed,
    });

    setText("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (error) {
    return (
      <div className="chatbox-container">
        <div className="chatbox-header">
          <span>Group Chat</span>
          {onClose && <button onClick={onClose}>✕</button>}
        </div>
        <p className="chatbox-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="chatbox-container">
      <div className="chatbox-header">
        <span>💬 Group Chat</span>
        {onClose && <button className="chatbox-close" onClick={onClose}>✕</button>}
      </div>

      <div className="chatbox-messages">
        {messages.length === 0 && (
          <p className="chatbox-empty">No messages yet. Say hi! 👋</p>
        )}

        {messages.map((m, i) => {
          const isMine = m.senderEmail === senderEmail;
          return (
            <div key={i} className={`chatbox-msg ${isMine ? "mine" : "theirs"}`}>
              {!isMine && (
                <span className="chatbox-sender">
                  {m.senderName || m.senderEmail} ({m.senderRole})
                </span>
              )}
              <div className="chatbox-bubble">{m.message}</div>
              <span className="chatbox-time">
                {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chatbox-input-row">
        <textarea
          rows={1}
          value={text}
          placeholder="Type a message…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatBox;
