"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTenants, fetchTenantById } from "@/app/actions/tenants";
import { fetchSessions, deleteSession } from "@/app/actions/sessionsApi";
import { getMe } from "@/app/actions/auth";
import { Tenant, User } from "@/types";
import { TrashIcon } from "@/components/icons";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { showToast, showConfirm } from "@/lib/swal";
import SessionModal from "@/components/sessions/SessionModal";

export default function SessionsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [sessions, setSessions] = useState<any[]>([]);

  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      setError(null);
      let user = null;
      const storedRole = sessionStorage.getItem("user_role");
      
      const userRes = await getMe();
      if (userRes.success) {
        user = userRes.data;
        setCurrentUser(user);
        sessionStorage.setItem("user_role", user.role);
      } else if (storedRole) {
        user = { role: storedRole } as User;
        setCurrentUser(user);
      } else {
        setError(`Failed to fetch user profile: ${userRes.error}`);
        setLoadingTenants(false);
        return;
      }

      const cachedTenants = sessionStorage.getItem("tenants_list");
      if (cachedTenants) {
        try {
          const parsed = JSON.parse(cachedTenants);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTenants(parsed);
            setLoadingTenants(false);
          }
        } catch (e) {
          console.error("Failed to parse cached tenants", e);
        }
      }

      const res = await fetchTenants(user.id);
      
      let finalTenants = [];
      let fetchError = null;

      if (res.success && res.data && res.data.length > 0) {
        finalTenants = res.data;
      } else if (user.tenant_id) {
        const tenantRes = await fetchTenantById(user.tenant_id);
        if (tenantRes.success) {
          finalTenants = [tenantRes.data];
        } else if (user.role === 'user' && (tenantRes.error?.includes('403') || tenantRes.error?.includes('Forbidden'))) {
          finalTenants = [{ id: user.tenant_id, name: '' } as any];
        } else {
           fetchError = tenantRes.error || "Failed to fetch tenant info.";
        }
      } else if (!res.success) {
        fetchError = res.error || "Failed to fetch tenants.";
      }

      if (finalTenants.length > 0) {
        setTenants(finalTenants);
        sessionStorage.setItem("tenants_list", JSON.stringify(finalTenants));
        
        const storedId = sessionStorage.getItem("tenant_id");
        if (storedId && finalTenants.some((t: Tenant) => t.id === storedId)) {
          setSelectedTenantId(storedId);
        } else {
          const defaultId = finalTenants[0].id;
          setSelectedTenantId(defaultId);
          sessionStorage.setItem("tenant_id", defaultId);
        }
      }
      
      if (fetchError) setError(fetchError);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoadingTenants(false);
    }
  }, []);

  const loadSessions = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    try {
      setLoadingSessions(true);
      setError(null);
      const res = await fetchSessions(tenantId);
      if (res.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        setSessions(data);
      } else {
        setError(res.error || "Failed to fetch sessions");
        setSessions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (selectedTenantId) {
      loadSessions(selectedTenantId);
      sessionStorage.setItem("tenant_id", selectedTenantId);
    }
  }, [selectedTenantId, loadSessions]);

  const handleDelete = async (id: string) => {
    const result = await showConfirm("Are you sure?", "You want to delete this session? All messages inside it will also be deleted.");
    if (!result.isConfirmed) return;
    if (!selectedTenantId) return;
    
    try {
      const res = await deleteSession(selectedTenantId, id);
      if (res.success) {
        showToast("success", "Session deleted");
        loadSessions(selectedTenantId);
      } else {
        showToast("error", res.error || "Failed to delete session");
      }
    } catch {
      showToast("error", "Network error");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(d);
  };

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
                Sessions
              </h1>
              {!loadingSessions && selectedTenantId && (
                <span className="badge badge-count" style={{ fontSize: 13 }}>
                  {Array.isArray(sessions) ? sessions.length : 0}
                </span>
              )}
            </div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
              Manage chat sessions and conversation history
            </p>
          </div>
        </div>

        {/* Tenant Selector */}
        {!loadingTenants && tenants.length > 1 && (
          <div style={{ marginBottom: 32, padding: "16px 20px", background: "rgba(99, 115, 171, 0.04)", borderRadius: 12, border: "1px solid var(--border-color)" }}>
            <SearchableSelect
              label="Select Tenant:"
              options={tenants}
              value={selectedTenantId}
              onSelect={setSelectedTenantId}
              loading={loadingTenants}
              style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
            />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{
            padding: "16px 20px",
            background: "var(--accent-red-bg)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: 12,
            color: "var(--accent-red)",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 14,
          }}>
            <span>⚠️ {error}</span>
            <button className="btn-secondary" style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => loadInitialData()}>
              Retry
            </button>
          </div>
        )}

        {/* Sessions Table */}
        <div className="glass-card" style={{ overflow: "hidden" }}>
          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.5fr 1fr 1fr",
            padding: "16px 20px",
            background: "rgba(99, 115, 171, 0.04)",
            borderBottom: "1px solid var(--border-color)",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-tertiary)"
          }}>
            <div>Session ID</div>
            <div>Platform / Origin</div>
            <div>Created At</div>
            <div style={{ textAlign: "right" }}>Actions</div>
          </div>

          {/* Loading State */}
          {loadingSessions && (
            <div>
              <div style={{ display: "flex", padding: "16px 20px", gap: 16 }}><div className="skeleton" style={{ width: "100%", height: 20 }} /></div>
              <div style={{ display: "flex", padding: "16px 20px", gap: 16 }}><div className="skeleton" style={{ width: "100%", height: 20 }} /></div>
            </div>
          )}

          {/* Data Rows */}
          {!loadingSessions && !error && Array.isArray(sessions) && sessions.length > 0 && (
            <div>
              {sessions.map((session) => (
                <div key={session.id} style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.5fr 1fr 1fr",
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border-color)",
                  alignItems: "center",
                  fontSize: 14,
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99, 115, 171, 0.02)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-primary)" }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {session.id}
                  </div>
                  <div style={{ color: "var(--text-secondary)" }}>{session.platform || "API / Web"}</div>
                  <div style={{ color: "var(--text-secondary)" }}>
                    {formatDate(session.created_at || session.timestamp)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button
                      onClick={() => setSelectedSessionId(session.id)}
                      className="btn-secondary"
                      style={{ padding: "4px 10px", fontSize: 13, height: "auto" }}
                      title="View Conversation"
                    >
                      View Thread
                    </button>
                    {(currentUser?.role === "admin" || currentUser?.role === "owner" || currentUser?.role === "user") && (
                        <button
                          onClick={() => handleDelete(session.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-tertiary)",
                            padding: 6,
                            borderRadius: 6,
                            cursor: "pointer",
                            display: "flex"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-red)"; e.currentTarget.style.background = "var(--accent-red-bg)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.background = "transparent"; }}
                          title="Delete Session"
                        >
                          <TrashIcon />
                        </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loadingSessions && !error && tenants.length > 0 && selectedTenantId && (!Array.isArray(sessions) || sessions.length === 0) && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: "rgba(99,115,171,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", color: "var(--text-tertiary)"
              }}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px 0" }}>No sessions found</h3>
              <p style={{ color: "var(--text-secondary)", margin: "0 0 20px 0", fontSize: 14 }}>
                There is no conversation history for this tenant yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedSessionId && selectedTenantId && (
        <SessionModal
          tenantId={selectedTenantId}
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
          onError={(msg) => showToast("error", msg)}
        />
      )}
    </div>
  );
}
