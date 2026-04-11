"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTenants, fetchTenantById } from "@/app/actions/tenants";
import { fetchReservations, updateReservationStatus, cancelReservation, deleteReservation } from "@/app/actions/reservationsApi";
import { getMe } from "@/app/actions/auth";
import { Tenant, Reservation, User } from "@/types";
import { PlusIcon, TrashIcon } from "@/components/icons";
import ReservationModal from "@/components/reservations/ReservationModal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { showToast, showConfirm } from "@/lib/swal";
import PageHeader from "@/components/ui/PageHeader";


export default function ReservationsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

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


  const loadReservations = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    try {
      setLoadingReservations(true);
      setError(null);
      const res = await fetchReservations(tenantId);
      if (res.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        setReservations(data);
      } else {
        if (res.status === 403 || res.error?.includes('403') || res.error?.includes('forbidden') || res.error?.includes('Forbidden')) {
          setReservations([]);
        } else {
          setError(res.error || "Failed to fetch reservations");
          setReservations([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setReservations([]);
    } finally {
      setLoadingReservations(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);


  useEffect(() => {
    if (selectedTenantId) {
      loadReservations(selectedTenantId);
      sessionStorage.setItem("tenant_id", selectedTenantId);
    }
  }, [selectedTenantId, loadReservations]);



  const handleCreateNew = () => {
    if (!selectedTenantId) {
      showToast("error", "Please select a tenant first");
      return;
    }
    setIsModalOpen(true);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    if (!selectedTenantId) return;
    try {
      const res = await updateReservationStatus(selectedTenantId, id, status);
      if (res.success) {
        showToast("success", `Status updated to ${status}`);
        loadReservations(selectedTenantId);
      } else {
        showToast("error", res.error || "Failed to update status");
      }
    } catch {
      showToast("error", "Network error");
    }
  };

  const handleCancel = async (id: string) => {
    const result = await showConfirm("Are you sure?", "You want to cancel this reservation?");
    if (!result.isConfirmed) return;
    try {
      const res = await cancelReservation(id);
      if (res.success) {
        showToast("success", "Reservation cancelled");
        if (selectedTenantId) loadReservations(selectedTenantId);
      } else {
        showToast("error", res.error || "Failed to cancel reservation");
      }
    } catch {
      showToast("error", "Network error");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirm("Are you sure?", "You want to delete this reservation?");
    if (!result.isConfirmed) return;
    if (!selectedTenantId) return;
    try {
      const res = await deleteReservation(selectedTenantId, id);
      if (res.success) {
        showToast("success", "Reservation deleted");
        loadReservations(selectedTenantId);
      } else {
        showToast("error", res.error || "Failed to delete reservation");
      }
    } catch {
      showToast("error", "Network error");
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    showToast("success", "Reservation successfully created");
    if (selectedTenantId) loadReservations(selectedTenantId);
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
        <PageHeader 
          title="Reservations" 
          description="Manage customer appointments and bookings processed by your AI agents."
          badge={
            !loadingReservations && selectedTenantId && (
              <span className="badge badge-count" style={{ fontSize: 13 }}>
                {Array.isArray(reservations) ? reservations.length : 0}
              </span>
            )
          }
          action={
            (currentUser?.role === "admin" || currentUser?.role === "owner" || currentUser?.role === "user") && (
              <button className="btn-primary" onClick={handleCreateNew} disabled={!selectedTenantId}>
                <PlusIcon />
                Add Reservation
              </button>
            )
          }
        />


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

        {/* Loading State for initial fetch */}
        {loadingTenants && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="skeleton" style={{ height: 160, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 160, borderRadius: 12 }} />
          </div>
        )}

        {/* Zero Tenants State */}
        {!loadingTenants && tenants.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(99, 115, 171, 0.04)", borderRadius: 12, border: "1px dashed var(--border-color)" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>No tenants found. Access might be restricted for your account.</p>
          </div>
        )}

        {/* Loading State for Reservations */}
        {!loadingTenants && loadingReservations && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="skeleton" style={{ height: 160, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 160, borderRadius: 12 }} />
          </div>
        )}

        {/* List */}
        {!loadingTenants && !loadingReservations && selectedTenantId && Array.isArray(reservations) && reservations.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {reservations.map(res => (
               <div key={res.id} className="glass-card" style={{ padding: 24, position: "relative" }}>
                  {(currentUser?.role === "admin" || currentUser?.role === "owner" || currentUser?.role === "user") && (
                   <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 8 }}>
                      {res.status !== 'cancelled' && (
                          <button
                          onClick={() => handleCancel(res.id)}
                          className="btn-secondary"
                          style={{ padding: "4px 8px", fontSize: 12, height: 'auto' }}
                          >
                          Cancel
                          </button>
                      )}
                      <button
                        onClick={() => handleDelete(res.id)}
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
                        title="Delete Reservation"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}

                  
                  <div style={{ paddingRight: 100 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
                            {res.customer_name}
                        </h3>
                        <span className="badge" style={{
                            background: res.status === 'confirmed' ? "rgba(16,185,129,0.12)" : res.status === 'cancelled' ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                            color: res.status === 'confirmed' ? "#10b981" : res.status === 'cancelled' ? "var(--accent-red)" : "#f59e0b",
                            textTransform: "uppercase",
                            fontSize: 11,
                            fontWeight: 600
                        }}>
                            {res.status}
                        </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                        <div>
                            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Contact</p>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{res.customer_contact || "N/A"}</p>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Start Time</p>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{formatDate(res.start_time)}</p>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Service</p>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{res.service_name || "N/A"}</p>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Resource</p>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--accent-primary)" }}>{res.resource_name || "N/A"}</p>
                        </div>
                    </div>
                    
                    {res.notes && (
                      <div style={{ marginTop: 16, padding: 12, background: "rgba(99, 115, 171, 0.04)", borderRadius: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                          <strong>Notes:</strong> {res.notes}
                      </div>
                    )}

                    {/* Status Actions */}
                    {res.status !== 'cancelled' && (currentUser?.role === "admin" || currentUser?.role === "owner" || currentUser?.role === "user") && (
                        <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-tertiary)", marginRight: 4 }}>Update Status:</span>
                            {['pending', 'confirmed', 'completed', 'no_show'].map(status => (
                            <button
                                key={status}
                                className={res.status === status ? "btn-primary" : "btn-secondary"}
                                style={{ padding: "4px 10px", fontSize: 12, height: "auto" }}
                                onClick={() => handleStatusUpdate(res.id, status)}
                                disabled={res.status === status}
                            >
                                {status === 'confirmed' ? 'Confirmed' : status.replace('_', ' ')}
                            </button>
                            ))}
                        </div>
                    )}

                  </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State - show when no reservations or reservations is not a valid array */}
        {!loadingTenants && !loadingReservations && selectedTenantId && (!Array.isArray(reservations) || reservations.length === 0) && (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "rgba(99, 115, 171, 0.08)", borderRadius: 16, border: "2px dashed rgba(99, 115, 171, 0.2)" }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px", color: "var(--accent-primary)"
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px 0" }}>No Reservations Found</h3>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 24px 0", fontSize: 15, maxWidth: 400, marginInline: 'auto' }}>
              We couldn&apos;t find any active reservations for this tenant. 
              {currentUser?.role === 'user' && " Access to historic data might be restricted."}
            </p>
            <button className="btn-primary" onClick={handleCreateNew}>
              <PlusIcon />
              Add Reservation
            </button>
          </div>
        )}
        {/* Catch-all: if everything loaded but nothing shows */}
        {!loadingTenants && !loadingReservations && tenants.length > 0 && !selectedTenantId && (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "rgba(99, 115, 171, 0.08)", borderRadius: 16, border: "2px dashed rgba(99, 115, 171, 0.2)" }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px", color: "var(--accent-primary)"
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px 0" }}>No Reservations Found</h3>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 24px 0", fontSize: 15 }}>
              No tenant selected. Please select a tenant to view reservations.
            </p>
          </div>
        )}

      </div>

      {isModalOpen && (
        <ReservationModal
          tenantId={selectedTenantId}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          onError={(msg) => showToast("error", msg)}
        />
      )}


    </div>
  );
}
