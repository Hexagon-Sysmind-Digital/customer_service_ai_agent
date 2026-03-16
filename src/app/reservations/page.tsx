"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTenants } from "@/app/actions/tenants";
import { fetchReservations, updateReservationStatus, cancelReservation, deleteReservation } from "@/app/actions/reservationsApi";
import { Tenant, Reservation } from "@/types";
import { PlusIcon, TrashIcon } from "@/components/icons";
import ReservationModal from "@/components/reservations/ReservationModal";

export default function ReservationsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadTenants = useCallback(async () => {
    try {
      setLoadingTenants(true);
      const res = await fetchTenants();
      if (res.success && res.data.length > 0) {
        setTenants(res.data);
        setSelectedTenantId(res.data[0].id);
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

  const loadReservations = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    try {
      setLoadingReservations(true);
      setError(null);
      const res = await fetchReservations(tenantId);
      if (res.success) {
        setReservations(res.data || []);
      } else {
        throw new Error(res.error || "Failed to fetch reservations");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoadingReservations(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    if (selectedTenantId) {
      loadReservations(selectedTenantId);
    }
  }, [selectedTenantId, loadReservations]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

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
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
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
    if (!window.confirm("Are you sure you want to delete this reservation?")) return;
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
                Reservations
              </h1>
              {!loadingReservations && selectedTenantId && (
                <span className="badge badge-count" style={{ fontSize: 13 }}>
                  {reservations.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
              Manage customer reservations and appointments
            </p>
          </div>
          <button className="btn-primary" onClick={handleCreateNew} disabled={!selectedTenantId}>
            <PlusIcon />
            Add Reservation
          </button>
        </div>

        {/* Tenant Selector */}
        {!loadingTenants && tenants.length > 0 && (
          <div style={{ marginBottom: 32, padding: "16px 20px", background: "var(--card-bg)", borderRadius: 12, border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 16 }}>
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
        {loadingReservations && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="skeleton" style={{ height: 160, borderRadius: 12 }} />
            <div className="skeleton" style={{ height: 160, borderRadius: 12 }} />
          </div>
        )}

        {/* Zero Tenants State */}
        {!loadingTenants && tenants.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--card-bg)", borderRadius: 12, border: "1px dashed var(--border-color)" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>No tenants found. Please create a tenant first.</p>
          </div>
        )}

        {/* List */}
        {!loadingReservations && selectedTenantId && reservations.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {reservations.map(res => (
              <div key={res.id} className="glass-card" style={{ padding: 24, position: "relative" }}>
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
                  
                  <div style={{ paddingRight: 100 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
                            {res.customer_name}
                        </h3>
                        <span className="badge" style={{
                            background: res.status === 'confirmed' || res.status === 'confirmeds' ? "rgba(16,185,129,0.12)" : res.status === 'cancelled' ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                            color: res.status === 'confirmed' || res.status === 'confirmeds' ? "#10b981" : res.status === 'cancelled' ? "var(--accent-red)" : "#f59e0b",
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
                      <div style={{ marginTop: 16, padding: 12, background: "var(--card-bg)", borderRadius: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                          <strong>Notes:</strong> {res.notes}
                      </div>
                    )}

                    {/* Status Actions */}
                    {res.status !== 'cancelled' && (
                        <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-tertiary)", marginRight: 4 }}>Update Status:</span>
                            {['pending', 'confirmeds', 'completed', 'no_show'].map(status => (
                            <button
                                key={status}
                                className={res.status === status ? "btn-primary" : "btn-secondary"}
                                style={{ padding: "4px 10px", fontSize: 12, height: "auto" }}
                                onClick={() => handleStatusUpdate(res.id, status)}
                                disabled={res.status === status}
                            >
                                {status === 'confirmeds' ? 'Confirmed' : status.replace('_', ' ')}
                            </button>
                            ))}
                        </div>
                    )}
                  </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loadingReservations && selectedTenantId && !error && reservations.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--card-bg)", borderRadius: 12, border: "1px dashed var(--border-color)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px 0" }}>No Reservations</h3>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 20px 0", fontSize: 14 }}>
              This tenant doesn&apos;t have any active reservations.
            </p>
            <button className="btn-secondary" onClick={handleCreateNew}>
              Add Reservation
            </button>
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

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.message}
        </div>
      )}
    </div>
  );
}
