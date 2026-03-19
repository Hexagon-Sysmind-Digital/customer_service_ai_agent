"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTenants, fetchTenantById } from "@/app/actions/tenants";
import { fetchFaqs, deleteFaq } from "@/app/actions/faqs";
import { getMe } from "@/app/actions/auth";
import { Tenant, Faq, User } from "@/types";
import { PlusIcon, EditIcon, TrashIcon } from "@/components/icons";
import FaqModal from "@/components/faqs/FaqModal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { showToast, showConfirm } from "@/lib/swal";


export default function FaqsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [faqs, setFaqs] = useState<Faq[]>([]);
  
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null);

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
          finalTenants = [{ id: user.tenant_id, name: "Workspace" } as any];
        } else if (!res.success) {
           setError(`Failed to fetch tenant info: ${tenantRes.error}`);
        }
      } else if (!res.success) {
        setError(`Failed to fetch tenants: ${res.error}`);
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


  const loadFaqs = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    try {
      setLoadingFaqs(true);
      setError(null);
      const res = await fetchFaqs(tenantId);
      if (res.success) {
        setFaqs(res.data);
      } else {
        setError(res.error || "Failed to fetch FAQs");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoadingFaqs(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);


  useEffect(() => {
    if (selectedTenantId) {
      loadFaqs(selectedTenantId);
      sessionStorage.setItem("tenant_id", selectedTenantId);
    }
  }, [selectedTenantId, loadFaqs]);



  const handleCreateNew = () => {
    if (!selectedTenantId) {
      showToast("error", "Please select a tenant first");
      return;
    }
    setSelectedFaq(null);
    setIsModalOpen(true);
  };

  const handleEdit = (faq: Faq) => {
    setSelectedFaq(faq);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirm("Are you sure?", "You want to delete this FAQ?");
    if (!result.isConfirmed) return;
    if (!selectedTenantId) return;

    try {
      const res = await deleteFaq(selectedTenantId, id);
      if (res.success) {
        showToast("success", "FAQ deleted successfully");
        loadFaqs(selectedTenantId);
      } else {
        showToast("error", res.error || "Failed to delete FAQ");
      }
    } catch {
      showToast("error", "Network error");
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    showToast("success", `FAQ successfully ${selectedFaq ? "updated" : "created"}`);
    if (selectedTenantId) loadFaqs(selectedTenantId);
  };

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
                FAQs
              </h1>
              {!loadingFaqs && selectedTenantId && (
                <span className="badge badge-count" style={{ fontSize: 13 }}>
                  {faqs.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
              Manage Knowledge Base and Frequently Asked Questions
            </p>
          </div>
          {(currentUser?.role === "admin" || currentUser?.role === "owner" || currentUser?.role === "user") && (
            <button className="btn-primary" onClick={handleCreateNew} disabled={!selectedTenantId}>
              <PlusIcon />
              Add FAQ
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

        {/* Loading State */}
        {loadingFaqs && (
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

        {/* FAQs List */}
        {!loadingFaqs && selectedTenantId && faqs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {faqs.map(faq => (
              <div key={faq.id} className="glass-card" style={{ padding: 24, position: "relative" }}>
                  {(currentUser?.role === "admin" || currentUser?.role === "owner" || currentUser?.role === "user") && (
                    <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleEdit(faq)}
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
                        title="Edit FAQ"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
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
                        title="Delete FAQ"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}


                  <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingRight: 80 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", margin: 0, lineHeight: 1.4 }}>
                      {faq.question}
                    </h3>
                    <div style={{ 
                      padding: "12px 16px", 
                      background: "rgba(99, 115, 171, 0.04)", 
                      borderRadius: 8, 
                      borderLeft: "3px solid var(--accent-primary)",
                      color: "var(--text-secondary)",
                      fontSize: 14,
                      lineHeight: 1.6
                    }}>
                      {faq.answer}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <span className="badge" style={{ background: "var(--accent-yellow-bg)", color: "var(--accent-yellow)", fontSize: 11, textTransform: "uppercase" }}>
                        {faq.category}
                      </span>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loadingFaqs && selectedTenantId && !error && faqs.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(99, 115, 171, 0.04)", borderRadius: 12, border: "1px dashed var(--border-color)" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: "rgba(99,102,241,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", color: "#818cf8"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px 0" }}>No FAQs found</h3>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 20px 0", fontSize: 14 }}>
              This tenant doesn&apos;t have any FAQs yet. Create one to improve the AI&apos;s knowledge base.
            </p>
            <button className="btn-secondary" onClick={handleCreateNew}>
              Add FAQ
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <FaqModal
          faq={selectedFaq}
          tenantId={selectedTenantId}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          onError={(msg) => showToast("error", msg)}
        />
      )}


    </div>
  );
}
