"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTenants, fetchTenantById } from "@/app/actions/tenants";
import { fetchActions, deleteAction } from "@/app/actions/actionsApi";
import { getMe } from "@/app/actions/auth";
import { Tenant, Action, User } from "@/types";
import { PlusIcon, EditIcon, TrashIcon } from "@/components/icons";
import ActionModal from "@/components/actions/ActionModal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { showToast, showConfirm } from "@/lib/swal";


export default function ActionsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [actions, setActions] = useState<Action[]>([]);

  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingActions, setLoadingActions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      setError(null);

      // 1. Get User Profile
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

      // 2. Get Tenants
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
      if (res.success && res.data.length > 0) {
        finalTenants = res.data;
      } else if (user.tenant_id) {
        const tenantRes = await fetchTenantById(user.tenant_id);
        if (tenantRes.success) {
          finalTenants = [tenantRes.data];
        } else if (user.role === 'user' && (tenantRes.error?.includes('403') || tenantRes.error?.includes('Forbidden'))) {
          finalTenants = [{ id: user.tenant_id, name: '' } as any];
        } else if (!res.success) {
           setError("Failed to fetch tenant info.");
        }
      } else if (!res.success) {
        setError("Failed to fetch tenants.");
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
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoadingTenants(false);
    }
  }, []);


  const loadActions = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    try {
      setLoadingActions(true);
      setError(null);
      const res = await fetchActions(tenantId);
      if (res.success) {
        setActions(res.data);
      } else {
        setError(res.error || "Failed to fetch actions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoadingActions(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);


  useEffect(() => {
    if (selectedTenantId) {
      loadActions(selectedTenantId);
      sessionStorage.setItem("tenant_id", selectedTenantId);
    }
  }, [selectedTenantId, loadActions]);



  const handleCreateNew = () => {
    if (!selectedTenantId) {
      showToast("error", "Please select a tenant first");
      return;
    }
    setSelectedAction(null);
    setIsModalOpen(true);
  };

  const handleEdit = (action: Action) => {
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirm("Are you sure?", "You want to delete this action?");
    if (!result.isConfirmed) return;
    if (!selectedTenantId) return;

    try {
      const res = await deleteAction(selectedTenantId, id);
      if (res.success) {
        showToast("success", "Action deleted successfully");
        loadActions(selectedTenantId);
      } else {
        showToast("error", res.error || "Failed to delete action");
      }
    } catch {
      showToast("error", "Network error");
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    showToast("success", `Action successfully ${selectedAction ? "updated" : "created"}`);
    if (selectedTenantId) loadActions(selectedTenantId);
  };

  const typeBadgeColors: Record<string, { bg: string; color: string }> = {
    webhook: { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
    reservation: { bg: "rgba(168,85,247,0.12)", color: "#a855f7" },
  };

  const methodBadgeColors: Record<string, { bg: string; color: string }> = {
    GET: { bg: "rgba(34,197,94,0.12)", color: "#22c55e" },
    POST: { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
    PUT: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
    DELETE: { bg: "rgba(239,68,68,0.12)", color: "#ef4444" },
  };

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
                Actions
              </h1>
              {!loadingActions && selectedTenantId && (
                <span className="badge badge-count" style={{ fontSize: 13 }}>
                  {actions.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
              Manage AI-powered actions — webhooks &amp; reservations
            </p>
          </div>
          {(currentUser?.role === "admin" || currentUser?.role === "owner" || currentUser?.role === "user") && (
            <button className="btn-primary" onClick={handleCreateNew} disabled={!selectedTenantId}>
              <PlusIcon />
              Add Action
            </button>
          )}
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

        {/* Empty State */}
        {!loadingActions && selectedTenantId && !error && actions.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(99, 115, 171, 0.04)", borderRadius: 12, border: "1px dashed var(--border-color)" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(249,115,22,0.12))",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", color: "#f59e0b"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px 0" }}>No Actions found</h3>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 20px 0", fontSize: 14 }}>
              This tenant doesn&apos;t have any actions yet. Create one to automate AI responses.
            </p>
            <button className="btn-secondary" onClick={handleCreateNew}>
              Add Action
            </button>
          </div>
        )}


        {/* Loading State */}
        {loadingActions && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
          </div>
        )}

        {/* Zero Tenants State */}
        {!loadingTenants && tenants.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(99, 115, 171, 0.04)", borderRadius: 12, border: "1px dashed var(--border-color)" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>No tenants found. Please create a tenant first.</p>
          </div>
        )}

        {/* Actions List */}
        {!loadingActions && selectedTenantId && actions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {actions.map(action => {
              const typeStyle = typeBadgeColors[action.action_type] || { bg: "rgba(99,115,171,0.1)", color: "var(--text-secondary)" };
              const methodStyle = action.api_method ? (methodBadgeColors[action.api_method] || { bg: "rgba(99,115,171,0.1)", color: "var(--text-secondary)" }) : null;

              return (
                <div key={action.id} className="glass-card" style={{ padding: 24, position: "relative" }}>
                  {/* Action Buttons */}
                  {(currentUser?.role === "admin" || currentUser?.role === "owner" || currentUser?.role === "user") && (
                    <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleEdit(action)}
                        style={{
                          background: "rgba(99, 115, 171, 0.08)",
                          border: "none",
                          color: "var(--text-tertiary)",
                          padding: 6,
                          borderRadius: 6,
                          cursor: "pointer",
                          display: "flex",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-primary)"; e.currentTarget.style.background = "var(--accent-primary-bg)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.background = "rgba(99, 115, 171, 0.08)"; }}
                        title="Edit Action"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(action.id)}
                        style={{
                          background: "rgba(99, 115, 171, 0.08)",
                          border: "none",
                          color: "var(--text-tertiary)",
                          padding: 6,
                          borderRadius: 6,
                          cursor: "pointer",
                          display: "flex",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-red)"; e.currentTarget.style.background = "var(--accent-red-bg)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.background = "rgba(99, 115, 171, 0.08)"; }}
                        title="Delete Action"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}


                  {/* Card Content */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingRight: 80 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.15))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#f59e0b",
                        flexShrink: 0,
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", margin: 0, lineHeight: 1.4 }}>
                          {action.name}
                        </h3>
                      </div>
                    </div>

                    <p style={{
                      fontSize: 14,
                      color: "var(--text-secondary)",
                      margin: 0,
                      lineHeight: 1.6,
                      paddingLeft: 46,
                    }}>
                      {action.description}
                    </p>

                    {/* Badges Row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", paddingLeft: 46 }}>
                      <span className="badge" style={{
                        background: typeStyle.bg,
                        color: typeStyle.color,
                        fontSize: 11,
                        textTransform: "uppercase",
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                      }}>
                        {action.action_type}
                      </span>

                      {action.action_type === "webhook" && action.api_method && methodStyle && (
                        <span className="badge" style={{
                          background: methodStyle.bg,
                          color: methodStyle.color,
                          fontSize: 11,
                          fontWeight: 600,
                          fontFamily: "monospace",
                        }}>
                          {action.api_method}
                        </span>
                      )}

                      {action.action_type === "webhook" && action.api_endpoint && (
                        <span style={{
                          fontSize: 12,
                          color: "var(--text-tertiary)",
                          fontFamily: "monospace",
                          background: "rgba(99,115,171,0.06)",
                          padding: "3px 8px",
                          borderRadius: 6,
                          maxWidth: 320,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {action.api_endpoint}
                        </span>
                      )}

                      {action.action_type === "reservation" && action.template_id && (
                        <span style={{
                          fontSize: 12,
                          color: "var(--text-tertiary)",
                          fontFamily: "monospace",
                          background: "rgba(99,115,171,0.06)",
                          padding: "3px 8px",
                          borderRadius: 6,
                        }}>
                          Template: {action.template_id}
                        </span>
                      )}
                    </div>

                    {/* Keywords */}
                    {action.keyword_pattern && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", paddingLeft: 46 }}>
                        <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginRight: 2 }}>Keywords:</span>
                        {action.keyword_pattern.split(",").map((kw, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 11,
                              color: "var(--text-secondary)",
                              background: "rgba(99,115,171,0.08)",
                              padding: "2px 8px",
                              borderRadius: 20,
                              fontWeight: 500,
                            }}
                          >
                            {kw.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {isModalOpen && (
        <ActionModal
          action={selectedAction}
          tenantId={selectedTenantId}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          onError={(msg) => showToast("error", msg)}
        />
      )}


    </div>
  );
}
