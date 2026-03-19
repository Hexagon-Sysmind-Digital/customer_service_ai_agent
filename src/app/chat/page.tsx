"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchTenants, fetchTenantById } from "@/app/actions/tenants";
import { sendChatMessage } from "@/app/actions/chatApi";
import { getMe } from "@/app/actions/auth";
import { Tenant, User } from "@/types";

import SearchableSelect from "@/components/ui/SearchableSelect";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");

  const [loadingTenants, setLoadingTenants] = useState(true);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionId] = useState(() => `visitor-${Math.random().toString(36).substring(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadInitialData = useCallback(async () => {
    try {
      setLoadingTenants(true);
      setError(null);

      const userRes = await getMe();
      if (!userRes.success) {
        setError("Failed to fetch user profile: " + (userRes.error || "Unknown error"));
        return;
      }
      
      const user = userRes.data;
      setCurrentUser(user);

      // Fetch all tenants authorized for this user
      const res = await fetchTenants(user.id);
      
      let finalTenants = [];
      if (res.success && res.data.length > 0) {
        finalTenants = res.data;
      } else if (user.tenant_id) {
        // Fallback: fetch the single tenant they are explicitly assigned to
        const tenantRes = await fetchTenantById(user.tenant_id);
        if (tenantRes.success) {
          finalTenants = [tenantRes.data];
        } else if (user.role === 'user') {
          // If we can't fetch tenant info but we have the ID, create a minimal placeholder
          // this prevents the whole page from failing for regular users (fixed 503/403 issue)
          finalTenants = [{ id: user.tenant_id, name: user.name || 'My Agent' } as any];
        } else if (!res.success) {
           setError("Failed to fetch tenant info: " + (tenantRes.error || "Unknown error"));
        }
      } else if (!res.success) {
        setError("Failed to fetch tenants: " + (res.error || "Unknown error"));
      }

      setTenants(finalTenants);
      if (finalTenants.length > 0) {
        const storedId = sessionStorage.getItem("tenant_id");
        if (storedId && finalTenants.some((t: Tenant) => t.id === storedId)) {
          setSelectedTenantId(storedId);
        } else {
          const defaultId = finalTenants[0].id;
          setSelectedTenantId(defaultId);
          sessionStorage.setItem("tenant_id", defaultId);
        }
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoadingTenants(false);
    }
  }, []);


  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (selectedTenantId) {
      sessionStorage.setItem("tenant_id", selectedTenantId);
    }
  }, [selectedTenantId]);


  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedTenantId || isSending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsSending(true);
    setError(null);

    try {
      const selectedTenant = tenants.find(t => t.id === selectedTenantId);
      const storedApiKey = sessionStorage.getItem("api_key");
      const apiKeyToUse = storedApiKey || selectedTenant?.api_key || currentUser?.api_key || "";
      
      const res = await sendChatMessage(selectedTenantId, apiKeyToUse, sessionId, userMsg.content);
      
      if (res.success) {
        let aiContent = "Received response from AI.";
        if (res.data && typeof res.data === 'string') {
            aiContent = res.data;
        } else if (res.data && res.data.content) {
            aiContent = res.data.content;
        } else if (res.data && res.data.message) {
            aiContent = res.data.message;
        } else if (res.data && res.data.response) {
            aiContent = res.data.response;
        } else if (res.data && res.data.text) {
            aiContent = res.data.text;
        }

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: aiContent,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(res.error || "Failed to get AI response");
      }
    } catch (err: any) {
      setError(err.message || "Network error while sending message");
      
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: `Error: ${err.message || "Failed to get AI response"}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "32px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", width: "100%", flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>
            Chat Simulator
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
            Session ID: <code style={{ background: "rgba(99,115,171,0.1)", padding: "2px 6px", borderRadius: 4 }}>{sessionId}</code>
          </p>
        </div>

        {/* Tenant Selector */}
        {!loadingTenants && tenants.length > 1 && (
          <div style={{ marginBottom: 24, padding: "16px 20px", background: "var(--card-bg)", borderRadius: 12, border: "1px solid var(--border-color)" }}>
            <SearchableSelect
              label="Select Tenant:"
              options={tenants}
              value={selectedTenantId}
              onSelect={(id) => {
                setSelectedTenantId(id);
                setMessages([]); 
                setError(null);
              }}
              loading={loadingTenants}
              style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
            />
          </div>
        )}


        {/* Error state (General) */}
        {error && !messages.length && (
          <div style={{
            padding: "16px 20px",
            background: "var(--accent-red-bg)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: 12,
            color: "var(--accent-red)",
            marginBottom: 24,
            fontSize: 14,
          }}>
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Chat Interface Container */}
        <div className="glass-card" style={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column", 
            overflow: "hidden",
            height: "60vh", 
            maxHeight: 700
        }}>
          
          {/* Messages Area */}
          <div style={{ 
              flex: 1, 
              overflowY: "auto", 
              padding: 24, 
              display: "flex", 
              flexDirection: "column", 
              gap: 20,
              background: "rgba(99, 115, 171, 0.02)"
          }}>
            {messages.length === 0 ? (
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
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>No messages yet</p>
                    <p style={{ margin: "8px 0 0 0", fontSize: 13 }}>Send a message to start chatting with the AI agent</p>
                </div>
            ) : (
                messages.map((msg) => (
                    <div key={msg.id} style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                        maxWidth: "100%",
                    }}>
                        <div style={{
                            maxWidth: "80%",
                            padding: "12px 16px",
                            borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            background: msg.role === "user" ? "var(--accent-primary)" : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                            color: "#fff",
                            border: "none",
                            boxShadow: msg.role === "user" 
                                ? "0 4px 12px rgba(99, 102, 241, 0.2)" 
                                : "0 4px 12px rgba(139, 92, 246, 0.2)",
                            fontSize: 15,
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap"
                        }}>
                            {msg.content}
                        </div>
                        <span style={{ 
                            fontSize: 11, 
                            color: "var(--text-tertiary)", 
                            marginTop: 6,
                            padding: "0 4px"
                        }}>
                            {msg.role === "user" ? "You" : "AI"} • {formatTime(msg.timestamp)}
                        </span>
                    </div>
                ))
            )}
            
            {isSending && (
                <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    maxWidth: "100%",
                }}>
                    <div style={{
                        padding: "16px 20px",
                        borderRadius: "18px 18px 18px 4px",
                        background: "var(--card-bg)",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        gap: 4
                    }}>
                        <span className="typing-dot" style={{ animationDelay: "0ms", width: 6, height: 6, background: "var(--text-tertiary)", borderRadius: "50%", display: "inline-block", animation: "typing 1.4s infinite ease-in-out both" }}></span>
                        <span className="typing-dot" style={{ animationDelay: "150ms", width: 6, height: 6, background: "var(--text-tertiary)", borderRadius: "50%", display: "inline-block", animation: "typing 1.4s infinite ease-in-out both" }}></span>
                        <span className="typing-dot" style={{ animationDelay: "300ms", width: 6, height: 6, background: "var(--text-tertiary)", borderRadius: "50%", display: "inline-block", animation: "typing 1.4s infinite ease-in-out both" }}></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ 
              padding: 16, 
              borderTop: "1px solid var(--border-color)",
              background: "var(--background)"
          }}>
            <form 
                onSubmit={handleSendMessage}
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-end"
                }}
            >
                <textarea
                    className="form-input"
                    placeholder=""
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={!selectedTenantId || isSending}
                    rows={1}
                    style={{
                        resize: "none",
                        minHeight: 44,
                        maxHeight: 120,
                        overflowY: "auto",
                        borderRadius: 22,
                        padding: "10px 16px",
                        lineHeight: 1.5
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                />
                <button
                    type="submit"
                    title="Send Message"
                    disabled={!inputText.trim() || !selectedTenantId || isSending}
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: !inputText.trim() || !selectedTenantId || isSending ? "var(--border-color)" : "var(--accent-primary)",
                        color: "#fff",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: !inputText.trim() || !selectedTenantId || isSending ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                        flexShrink: 0
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </form>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes typing {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
      `}} />
    </div>
  );
}
