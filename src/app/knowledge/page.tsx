"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTenants } from "@/app/actions/tenants";
import { fetchKnowledge, deleteKnowledge } from "@/app/actions/knowledge";
import { Tenant, Knowledge } from "@/types";
import { PlusIcon, EditIcon, TrashIcon } from "@/components/icons";
import KnowledgeModal from "@/components/knowledge/KnowledgeModal";

export default function KnowledgePage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [knowledgeList, setKnowledgeList] = useState<Knowledge[]>([]);
  
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState<Knowledge | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadTenants = useCallback(async () => {
    try {
      setLoadingTenants(true);
      const res = await fetchTenants();
      if (res.success && res.data.length > 0) {
        setTenants(res.data);
        setSelectedTenantId(res.data[0].id); // Auto-select the first tenant
      } else if (res.success) {
        setTenants([]);
      } else {
        setError("Failed to fetch tenants.");
      }
    } catch {
      setError("Network error fetching tenants.");
    } finally {
      setLoadingTenants(false);
    }
  }, []);

  const loadKnowledge = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    try {
      setLoadingKnowledge(true);
      setError(null);
      const res = await fetchKnowledge(tenantId);
      if (res.success) {
        setKnowledgeList(res.data);
      } else {
        throw new Error(res.error || "Failed to fetch Knowledge");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoadingKnowledge(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    if (selectedTenantId) {
      loadKnowledge(selectedTenantId);
    }
  }, [selectedTenantId, loadKnowledge]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateNew = () => {
    if (!selectedTenantId) {
      showToast("error", "Please select a tenant first");
      return;
    }
    setSelectedKnowledge(null);
    setIsModalOpen(true);
  };

  const handleEdit = (knowledge: Knowledge) => {
    setSelectedKnowledge(knowledge);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this Knowledge item?")) return;
    if (!selectedTenantId) return;

    try {
      const res = await deleteKnowledge(selectedTenantId, id);
      if (res.success) {
        showToast("success", "Knowledge deleted successfully");
        loadKnowledge(selectedTenantId);
      } else {
        showToast("error", res.error || "Failed to delete Knowledge");
      }
    } catch {
      showToast("error", "Network error");
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    showToast("success", `Knowledge successfully ${selectedKnowledge ? "updated" : "created"}`);
    if (selectedTenantId) loadKnowledge(selectedTenantId);
  };

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
                Knowledge Base
              </h1>
              {!loadingKnowledge && selectedTenantId && (
                <span className="badge badge-count" style={{ fontSize: 13 }}>
                  {knowledgeList.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
              Manage foundational data and policies for AI Agents
            </p>
          </div>
          <button className="btn-primary" onClick={handleCreateNew} disabled={!selectedTenantId}>
            <PlusIcon />
            Add Knowledge
          </button>
        </div>

        {/* Tenant Selector */}
        {!loadingTenants && tenants.length > 0 && (
          <div style={{ marginBottom: 32, padding: "16px 20px", background: "rgba(99, 115, 171, 0.04)", borderRadius: 12, border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
              Select Tenant:
            </label>
            <select
              className="form-input"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              style={{ maxWidth: 300, background: "var(--background)", borderColor: "var(--card-border)" }}
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
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
          </div>
        )}

        {/* Loading State */}
        {loadingKnowledge && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="skeleton" style={{ height: 100, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 100, borderRadius: 12 }} />
          </div>
        )}

        {/* Zero Tenants State */}
        {!loadingTenants && tenants.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(99, 115, 171, 0.04)", borderRadius: 12, border: "1px dashed var(--border-color)" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>No tenants found. Please create a tenant first.</p>
          </div>
        )}

        {/* Knowledge List */}
        {!loadingKnowledge && selectedTenantId && knowledgeList.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {knowledgeList.map(knowledge => (
              <div key={knowledge.id} className="glass-card" style={{ padding: 24, position: "relative" }}>
                 <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleEdit(knowledge)}
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
                      title="Edit Knowledge"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(knowledge.id)}
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
                      title="Delete Knowledge"
                    >
                      <TrashIcon />
                    </button>
                 </div>

                 <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingRight: 80 }}>
                    <div style={{ 
                      padding: "16px", 
                      background: "rgba(99, 115, 171, 0.04)", 
                      borderRadius: 12, 
                      borderLeft: "3px solid var(--accent-primary)",
                      color: "var(--foreground)",
                      fontSize: 15,
                      lineHeight: 1.6
                    }}>
                      {knowledge.content}
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
                      <span style={{ color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        Source: <strong style={{ color: "var(--text-secondary)" }}>{knowledge.source}</strong>
                      </span>
                      
                      {knowledge.metadata && Object.keys(knowledge.metadata).length > 0 && (
                        <>
                          <span style={{ color: "var(--border-color)" }}>|</span>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {Object.entries(knowledge.metadata).map(([key, value]) => (
                               <span key={key} className="badge" style={{ background: "var(--accent-primary-bg)", color: "var(--text-secondary)", fontSize: 11 }}>
                                 {key}: {String(value)}
                               </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loadingKnowledge && selectedTenantId && !error && knowledgeList.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(99, 115, 171, 0.04)", borderRadius: 12, border: "1px dashed var(--border-color)" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: "rgba(99,102,241,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", color: "#818cf8"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px 0" }}>No knowledge base found</h3>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 20px 0", fontSize: 14 }}>
              This tenant doesn&apos;t have any knowledge base yet. Upload or write one to start.
            </p>
            <button className="btn-secondary" onClick={handleCreateNew}>
              Add Knowledge
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <KnowledgeModal
          knowledge={selectedKnowledge}
          tenantId={selectedTenantId}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          onError={(msg) => showToast("error", msg)}
        />
      )}

      {/* Toast */}
      {toast && (
         <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
         {toast.type === "success" ? "✓" : "✕"} {toast.message}
       </div>
      )}
    </div>
  );
}
