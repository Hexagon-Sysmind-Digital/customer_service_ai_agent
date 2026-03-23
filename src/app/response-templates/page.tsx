"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTenants, fetchTenantById } from "@/app/actions/tenants";
import { getTranslationTemplates, deleteTranslationTemplate } from "@/app/actions/translationsApi";
import { getMe } from "@/app/actions/auth";
import { Tenant, User } from "@/types";
import { PlusIcon, EditIcon, TrashIcon } from "@/components/icons";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { showToast, showConfirm } from "@/lib/swal";
import ResponseTemplateModal from "@/components/response-templates/ResponseTemplateModal";

export default function ResponseTemplatesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [selectedLang, setSelectedLang] = useState<string>("id");
  const [templates, setTemplates] = useState<any[]>([]);

  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

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

  const loadTemplates = useCallback(async (tenantId: string, lang: string) => {
    if (!tenantId) return;
    try {
      setLoadingTemplates(true);
      setError(null);
      const res = await getTranslationTemplates(tenantId, lang);
      if (res.success) {
        // The API returns the templates inside data or directly on the response, usually inside an array
        let data = [];
        if (Array.isArray(res.data)) data = res.data;
        else if (Array.isArray((res as any).templates)) data = (res as any).templates;
        else if (Array.isArray(res)) data = res as any;
        else if (res.data === undefined && res.success) data = []; // If empty list returned nicely
        else data = res.data ? [res.data] : [];
        setTemplates(data);
      } else {
        setError(res.error || "Failed to fetch templates");
        setTemplates([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (selectedTenantId) {
      loadTemplates(selectedTenantId, selectedLang);
      sessionStorage.setItem("tenant_id", selectedTenantId);
    }
  }, [selectedTenantId, selectedLang, loadTemplates]);

  const handleCreateNew = () => {
    if (!selectedTenantId) {
        showToast("error", "Please select a tenant first");
        return;
    }
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tpl: any) => {
    setSelectedTemplate(tpl);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirm("Are you sure?", "You want to delete this response template?");
    if (!result.isConfirmed) return;
    
    try {
      const res = await deleteTranslationTemplate(id);
      if (res.success) {
        showToast("success", "Template deleted");
        loadTemplates(selectedTenantId, selectedLang);
      } else {
        showToast("error", res.error || "Failed to delete template");
      }
    } catch {
      showToast("error", "Network error");
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    showToast("success", `Template successfully ${selectedTemplate ? "updated" : "created"}`);
    if (selectedTenantId) loadTemplates(selectedTenantId, selectedLang);
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
                Response Templates
              </h1>
              {!loadingTemplates && selectedTenantId && (
                <span className="badge badge-count" style={{ fontSize: 13 }}>
                  {Array.isArray(templates) ? templates.length : 0}
                </span>
              )}
            </div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
              Manage preset AI responses and translation texts
            </p>
          </div>
          {(currentUser?.role === "admin" || currentUser?.role === "owner" || currentUser?.role === "user") && (
            <button className="btn-primary" onClick={handleCreateNew} disabled={!selectedTenantId}>
              <PlusIcon />
              Add Template
            </button>
          )}
        </div>

        {/* Filters and Selectors */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
            {/* Tenant Selector */}
            {!loadingTenants && tenants.length > 1 && (
            <div style={{ flex: 1, minWidth: 300, padding: "16px 20px", background: "rgba(99, 115, 171, 0.04)", borderRadius: 12, border: "1px solid var(--border-color)" }}>
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

            {/* Language Selector */}
            <div style={{ minWidth: 200, padding: "16px 20px", background: "rgba(99, 115, 171, 0.04)", borderRadius: 12, border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 16 }}>
               <label style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>Language:</label>
               <select 
                    className="form-input" 
                    value={selectedLang} 
                    onChange={(e) => setSelectedLang(e.target.value)}
                    style={{ flex: 1, height: 38, minHeight: 38 }}
               >
                   <option value="id">Indonesian (id)</option>
                   <option value="en">English (en)</option>
               </select>
            </div>
        </div>

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

        {/* Templates List */}
        <div className="glass-card" style={{ overflow: "hidden" }}>
          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 3fr 1fr",
            padding: "16px 20px",
            background: "rgba(99, 115, 171, 0.04)",
            borderBottom: "1px solid var(--border-color)",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-tertiary)"
          }}>
            <div>Key</div>
            <div>Response Text</div>
            <div style={{ textAlign: "right" }}>Actions</div>
          </div>

          {/* Loading State */}
          {loadingTemplates && (
            <div>
              <div style={{ display: "flex", padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
                  <div className="skeleton" style={{ width: "100%", height: 20 }} />
              </div>
              <div style={{ display: "flex", padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
                  <div className="skeleton" style={{ width: "100%", height: 20 }} />
              </div>
            </div>
          )}

          {/* Data Rows */}
          {!loadingTemplates && !error && Array.isArray(templates) && templates.length > 0 && (
            <div>
              {templates.map((tpl) => (
                <div key={tpl.id} style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 3fr 1fr",
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border-color)",
                  alignItems: "center",
                  fontSize: 14,
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99, 115, 171, 0.02)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div style={{ fontWeight: 600, color: "var(--foreground)" }}>
                    <code style={{ background: "rgba(99, 115, 171, 0.08)", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>
                        {tpl.key}
                    </code>
                  </div>
                  <div style={{ color: "var(--text-secondary)", whiteSpace: "pre-wrap", display: "flex", flexDirection: "column" }}>
                      <span>{tpl.text}</span>
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>Last updated: {formatDate(tpl.updated_at || tpl.created_at)}</span>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    {(currentUser?.role === "admin" || currentUser?.role === "owner" || currentUser?.role === "user") && (
                        <>
                        <button
                          onClick={() => handleEdit(tpl)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-tertiary)",
                            padding: 6,
                            borderRadius: 6,
                            cursor: "pointer",
                            display: "flex"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-primary)"; e.currentTarget.style.background = "var(--accent-primary-bg)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.background = "transparent"; }}
                          title="Edit Template"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(tpl.id)}
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
                          title="Delete Template"
                        >
                          <TrashIcon />
                        </button>
                        </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loadingTemplates && !error && tenants.length > 0 && selectedTenantId && (!Array.isArray(templates) || templates.length === 0) && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: "rgba(99,115,171,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", color: "var(--text-tertiary)"
              }}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M8 10h.01" />
                  <path d="M12 10h.01" />
                  <path d="M16 10h.01" />
                 </svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px 0" }}>No templates found</h3>
              <p style={{ color: "var(--text-secondary)", margin: "0 0 20px 0", fontSize: 14 }}>
                There are no response templates for the selected language ('{selectedLang}').
              </p>
              <button className="btn-secondary" onClick={handleCreateNew}>
                Add Template
              </button>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ResponseTemplateModal
          tenantId={selectedTenantId}
          template={selectedTemplate}
          fixedLang={selectedTemplate?.lang || selectedLang}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          onError={(msg) => showToast("error", msg)}
        />
      )}
    </div>
  );
}
