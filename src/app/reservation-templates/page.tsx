"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTenants, fetchTenantById } from "@/app/actions/tenants";
import { fetchReservationTemplates, deleteReservationTemplate } from "@/app/actions/reservationTemplatesApi";
import { getMe } from "@/app/actions/auth";
import { Tenant, ReservationTemplate, OperatingHours, User } from "@/types";
import { PlusIcon, EditIcon, TrashIcon } from "@/components/icons";
import ReservationTemplateModal from "@/components/reservation-templates/ReservationTemplateModal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { showToast, showConfirm } from "@/lib/swal";


export default function ReservationTemplatesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [templates, setTemplates] = useState<ReservationTemplate[]>([]);

  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReservationTemplate | null>(null);

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


  const loadTemplates = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    try {
      setLoadingTemplates(true);
      setError(null);
      const res = await fetchReservationTemplates(tenantId);
      if (res.success) {
        setTemplates(res.data);
      } else {
        setError(res.error || "Failed to fetch templates");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);


  useEffect(() => {
    if (selectedTenantId) {
      loadTemplates(selectedTenantId);
      sessionStorage.setItem("tenant_id", selectedTenantId);
    }
  }, [selectedTenantId, loadTemplates]);



  const handleCreateNew = () => {
    if (!selectedTenantId) {
      showToast("error", "Please select a tenant first");
      return;
    }
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tpl: ReservationTemplate) => {
    setSelectedTemplate(tpl);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirm("Are you sure?", "You want to delete this template?");
    if (!result.isConfirmed) return;
    if (!selectedTenantId) return;

    try {
      const res = await deleteReservationTemplate(selectedTenantId, id);
      if (res.success) {
        showToast("success", "Template deleted successfully");
        loadTemplates(selectedTenantId);
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
    if (selectedTenantId) loadTemplates(selectedTenantId);
  };

  const getActiveDays = (hours: OperatingHours): string[] => {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
    return days.filter(d => hours[d]);
  };

  const typeBadge: Record<string, { bg: string; color: string; label: string }> = {
    professional: { bg: "rgba(59,130,246,0.12)", color: "#3b82f6", label: "Professional" },
    property: { bg: "rgba(168,85,247,0.12)", color: "#a855f7", label: "Property" },
  };

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
                Reservation Templates
              </h1>
              {!loadingTemplates && selectedTenantId && (
                <span className="badge badge-count" style={{ fontSize: 13 }}>
                  {templates.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
              Manage booking &amp; reservation templates for AI scheduling
            </p>
          </div>
          {(currentUser?.role === "admin" || currentUser?.role === "owner" || currentUser?.role === "user") && (
            <button className="btn-primary" onClick={handleCreateNew} disabled={!selectedTenantId}>
              <PlusIcon />
              Add Template
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
        {loadingTemplates && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="skeleton" style={{ height: 160, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 160, borderRadius: 12 }} />
          </div>
        )}

        {/* Zero Tenants State */}
        {!loadingTenants && tenants.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(99, 115, 171, 0.04)", borderRadius: 12, border: "1px dashed var(--border-color)" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>No tenants found. Please create a tenant first.</p>
          </div>
        )}

        {/* Templates List */}
        {!loadingTemplates && selectedTenantId && templates.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {templates.map(tpl => {
              const tBadge = typeBadge[tpl.template_type] || { bg: "rgba(99,115,171,0.1)", color: "var(--text-secondary)", label: tpl.template_type };
              const activeDays = getActiveDays(tpl.operating_hours || {});

              return (
                <div key={tpl.id} className="glass-card" style={{ padding: 24, position: "relative" }}>
                  {/* Edit/Delete */}
                  {(currentUser?.role === "admin" || currentUser?.role === "owner" || currentUser?.role === "user") && (
                    <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleEdit(tpl)}
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
                        title="Edit Template"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(tpl.id)}
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
                        title="Delete Template"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}


                  {/* Card Content */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingRight: 80 }}>
                    {/* Name + Icon */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.15))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#10b981",
                        flexShrink: 0,
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div>
                        <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--foreground)", margin: 0, lineHeight: 1.3 }}>
                          {tpl.name}
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                          <span className="badge" style={{
                            background: tBadge.bg,
                            color: tBadge.color,
                            fontSize: 11,
                            textTransform: "uppercase",
                            fontWeight: 600,
                          }}>
                            {tBadge.label}
                          </span>
                          <span className="badge" style={{
                            background: "rgba(245,158,11,0.12)",
                            color: "#f59e0b",
                            fontSize: 11,
                            fontWeight: 600,
                          }}>
                            {tpl.slot_duration_minutes} min
                          </span>
                          <span className="badge" style={{
                            background: "rgba(99,115,171,0.08)",
                            color: "var(--text-secondary)",
                            fontSize: 11,
                            fontWeight: 500,
                          }}>
                            {tpl.time_policy === "fixed_slot" ? "Fixed Slot" : tpl.time_policy}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingLeft: 50 }}>
                      {/* Resources */}
                      {tpl.resources && tpl.resources.length > 0 && (
                        <div>
                          <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Resources
                          </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                            {tpl.resources.map((r, i) => (
                              <span key={i} style={{
                                fontSize: 12,
                                padding: "3px 10px",
                                borderRadius: 20,
                                background: "rgba(59,130,246,0.08)",
                                color: "#3b82f6",
                                fontWeight: 500,
                              }}>
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Services */}
                      {tpl.services && tpl.services.length > 0 && (
                        <div>
                          <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Services
                          </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                            {tpl.services.map((s, i) => (
                              <span key={i} style={{
                                fontSize: 12,
                                padding: "3px 10px",
                                borderRadius: 20,
                                background: "rgba(168,85,247,0.08)",
                                color: "#a855f7",
                                fontWeight: 500,
                              }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Operating Days */}
                    {activeDays.length > 0 && (
                      <div style={{ paddingLeft: 50 }}>
                        <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Operating Days
                        </span>
                        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                          {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(day => {
                            const isActive = activeDays.includes(day);
                            const slot = tpl.operating_hours[day as keyof OperatingHours];
                            return (
                              <div
                                key={day}
                                title={isActive && slot ? `${slot.open} - ${slot.close}` : "Closed"}
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  textTransform: "capitalize",
                                  background: isActive ? "rgba(16,185,129,0.1)" : "rgba(99,115,171,0.05)",
                                  color: isActive ? "#10b981" : "var(--text-tertiary)",
                                  cursor: "default",
                                  transition: "all 0.2s",
                                }}
                              >
                                {day.slice(0, 3)}
                                {isActive && slot && (
                                  <span style={{ fontWeight: 400, marginLeft: 4, fontSize: 10, opacity: 0.8 }}>
                                    {slot.open}–{slot.close}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loadingTemplates && selectedTenantId && !error && templates.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(99, 115, 171, 0.04)", borderRadius: 12, border: "1px dashed var(--border-color)" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.12))",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", color: "#10b981"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px 0" }}>No Templates found</h3>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 20px 0", fontSize: 14 }}>
              This tenant doesn&apos;t have any reservation templates yet. Create one to enable AI-powered bookings.
            </p>
            <button className="btn-secondary" onClick={handleCreateNew}>
              Add Template
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ReservationTemplateModal
          template={selectedTemplate}
          tenantId={selectedTenantId}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          onError={(msg) => showToast("error", msg)}
        />
      )}


    </div>
  );
}
