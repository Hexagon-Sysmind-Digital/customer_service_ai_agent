"use client";

import { useState, useEffect } from "react";
import { fetchSessionMessages } from "@/app/actions/sessionsApi";
import { CloseIcon } from "@/components/icons";

interface SessionModalProps {
  tenantId: string;
  sessionId: string;
  onClose: () => void;
  onError: (msg: string) => void;
}

export default function SessionModal({ tenantId, sessionId, onClose, onError }: SessionModalProps) {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const res = await fetchSessionMessages(tenantId, sessionId, 50);
        if (res.success) {
          setMessages(res.data || []);
        } else {
          onError(res.error || "Failed to fetch session messages");
        }
      } catch (err: any) {
        onError(err.message || "Network error");
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [tenantId, sessionId, onError]);

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: 700,
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#818cf8",
              }}
            >
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
               </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                Session Conversation
              </h2>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>ID: {sessionId}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              borderRadius: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--foreground)";
              e.currentTarget.style.background = "var(--accent-primary-bg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-tertiary)";
              e.currentTarget.style.background = "none";
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content Area */}
        <div style={{ 
            flex: 1, 
            overflowY: "auto", 
            padding: 24, 
            display: "flex", 
            flexDirection: "column", 
            gap: 20,
            background: "rgba(99, 115, 171, 0.02)"
        }}>
          {loading ? (
             <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                 <p style={{ color: "var(--text-secondary)" }}>Loading messages...</p>
             </div>
          ) : messages.length === 0 ? (
            <div style={{ 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center", 
                justifyContent: "center", 
                height: "100%",
                color: "var(--text-tertiary)",
                opacity: 0.7
            }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>No messages found</p>
                <p style={{ margin: "8px 0 0 0", fontSize: 13 }}>This session does not have any recorded messages.</p>
            </div>
          ) : (
            messages.map((msg: any, idx) => {
                const isUser = msg.role === 'user';
                return (
                <div key={msg.id || idx} style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isUser ? "flex-end" : "flex-start",
                    maxWidth: "100%",
                }}>
                    <div style={{
                        maxWidth: "80%",
                        padding: "12px 16px",
                        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        background: isUser ? "var(--accent-primary)" : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                        color: "#fff",
                        border: "none",
                        boxShadow: isUser 
                            ? "0 4px 12px rgba(99, 102, 241, 0.2)" 
                            : "0 4px 12px rgba(139, 92, 246, 0.2)",
                        fontSize: 15,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap"
                    }}>
                        {msg.content || msg.text || JSON.stringify(msg)}
                    </div>
                    <span style={{ 
                        fontSize: 11, 
                        color: "var(--text-tertiary)", 
                        marginTop: 6,
                        padding: "0 4px"
                    }}>
                        {isUser ? "User" : "AI"} {(msg.timestamp || msg.created_at) && `• ${formatTime(msg.timestamp || msg.created_at)}`}
                    </span>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
