"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTenants, fetchTenantById } from "@/app/actions/tenants";
import { getMe } from "@/app/actions/auth";
import { Tenant, Knowledge, User } from "@/types";
import { PlusIcon, EditIcon, TrashIcon, CheckIcon } from "@/components/icons";
import { createKnowledge, fetchKnowledge, deleteKnowledge } from "@/app/actions/knowledge";
import KnowledgeModal from "@/components/knowledge/KnowledgeModal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { showToast, showConfirm } from "@/lib/swal";
import PageHeader from "@/components/ui/PageHeader";


export default function KnowledgePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [knowledgeList, setKnowledgeList] = useState<Knowledge[]>([]);
  
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState<Knowledge | null>(null);

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
        } else {
          // Fallback: Prevent UI lock if tenant fetch fails (503, etc.)
          console.warn('DEBUG [KnowledgePage] Tenant fetch failed, using fallback:', tenantRes.error);
          finalTenants = [{ id: user.tenant_id, name: "Your Workspace" } as any];
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


  const loadKnowledge = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    try {
      setLoadingKnowledge(true);
      setError(null);
      const res = await fetchKnowledge(tenantId);
      if (res.success) {
        setKnowledgeList(res.data);
      } else {
        // Silent error for 503/403 to avoid annoying red boxes
        console.warn(`[Knowledge] Failed to load data (${res.error}). Backend might be unstable.`);
        setKnowledgeList([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoadingKnowledge(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);


  useEffect(() => {
    if (selectedTenantId) {
      loadKnowledge(selectedTenantId);
      sessionStorage.setItem("tenant_id", selectedTenantId);
    }
  }, [selectedTenantId, loadKnowledge]);



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
    const result = await showConfirm("Are you sure?", "You want to delete this Knowledge item?");
    if (!result.isConfirmed) return;
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

  const deployOutOfTopicTemplate = async () => {
    if (!selectedTenantId) return;
    
    const payload = {
      content: "ini pesan d isi sama user buat template jawaban kalo pertanyaannya kagajelas",
      source: "out_of_topic",
      metadata: { department: "system", version: "1.0" }
    };

    try {
      setLoadingKnowledge(true);
      const res = await createKnowledge(selectedTenantId, payload);
      if (res.success) {
        showToast("success", "Out of Topic template deployed successfully");
        loadKnowledge(selectedTenantId);
      } else {
        showToast("error", res.error || "Failed to deploy template");
      }
    } catch {
      showToast("error", "Network error");
    } finally {
      setLoadingKnowledge(false);
    }
  };

  const hasOutOfTopic = knowledgeList.some(k => k.source === "out_of_topic");

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        
        {/* Header */}
        <PageHeader 
          title="Knowledge" 
          description="Manage foundational data, policies, and system templates that serve as your AI Agent's brain."
          badge={
            !loadingKnowledge && selectedTenantId && (
              <span className="badge badge-count" style={{ fontSize: 13 }}>
                {knowledgeList.length}
              </span>
            )
          }
          action={
            (currentUser?.role === "admin" || currentUser?.role === "owner" || currentUser?.role === "user") && (
              <button className="btn-primary" onClick={handleCreateNew} disabled={!selectedTenantId}>
                <PlusIcon />
                Add Knowledge
              </button>
            )
          }
        />


        {/* Tenant Selector & System Templates */}
        {!loadingTenants && tenants.length > 1 && (
          <div style={{ marginBottom: 32, display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ padding: "16px 20px", background: "rgba(99, 115, 171, 0.04)", borderRadius: 12, border: "1px solid var(--border-color)" }}>
              <SearchableSelect
                label="Select Tenant:"
                options={tenants}
                value={selectedTenantId}
                onSelect={setSelectedTenantId}
                loading={loadingTenants}
                style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
              />
            </div>


            {(currentUser?.role === "admin" || currentUser?.role === "owner" || currentUser?.role === "user") && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                <div className="glass-card" style={{ 
                  padding: "20px 24px", 
                  borderLeft: `4px solid ${hasOutOfTopic ? "#22c55e" : "#818cf8"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(99, 115, 171, 0.02)"
                }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 600 }}>Default System Template</h4>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
                      Template jawaban otomatis untuk pertanyaan di luar topik (Out of Topic).
                    </p>
                  </div>
                  <button 
                    className={hasOutOfTopic ? "btn-secondary" : "btn-primary"}
                    onClick={deployOutOfTopicTemplate}
                    disabled={hasOutOfTopic || loadingKnowledge}
                    style={{ minWidth: 160 }}
                  >
                    {hasOutOfTopic ? (
                      <>
                        <CheckIcon /> Deployed
                      </>
                    ) : (
                      <>Deploy Template</>
                    )}
                  </button>
                </div>
              </div>
            )}
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
                  {knowledge.source !== "out_of_topic" && (currentUser?.role === "admin" || currentUser?.role === "owner" || currentUser?.role === "user") && (
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
                  )}


                  <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingRight: knowledge.source === "out_of_topic" ? 0 : 80 }}>
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


    </div>
  );
}
