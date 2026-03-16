"use client";

import { useState, useEffect, useCallback } from "react";
import CreditModal from "@/components/credits/CreditModal";
import { fetchCredits, deleteCredit, sendReminders, fetchPaymentStatus } from "@/app/actions/credits";
import { Credit, PaymentStatus } from "@/types";
import { PlusIcon, EditIcon, TrashIcon } from "@/components/icons";

function SkeletonRow() {
  return (
    <div style={{ display: "flex", padding: "16px 20px", borderBottom: "1px solid var(--border-color)", gap: 16 }}>
      <div className="skeleton" style={{ width: "20%", height: 20 }} />
      <div className="skeleton" style={{ width: "20%", height: 20 }} />
      <div className="skeleton" style={{ width: "20%", height: 20 }} />
      <div className="skeleton" style={{ width: "20%", height: 20 }} />
      <div className="skeleton" style={{ width: "15%", height: 24, borderRadius: 12 }} />
      <div className="skeleton" style={{ width: "5%", height: 20 }} />
    </div>
  );
}

export default function CreditsPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Based on actual user role fetching from context/API if possible, here using a state to determine UI variant.
  // Assuming a generic approach where admin toggle might be needed, but strictly we should check the token/user role.
  // For demonstration, let's assume we read role from somewhere, or fetch it. For now, true = Admin, false = User.
  const [isAdmin, setIsAdmin] = useState(true); // TODO: Replace with actual auth mechanism if available contextually

  const loadCredits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchCredits();
      if (res.success) {
        setCredits(res.data);
      } else {
        throw new Error(res.error || "Failed to fetch credits");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPaymentStatus = useCallback(async () => {
    try {
      setStatusLoading(true);
      const res = await fetchPaymentStatus(); // If admin wants specific user, pass userId
      if (res.success) {
        setPaymentStatus(res.data as PaymentStatus);
      }
    } catch (err) {
      console.error("Failed to load payment status", err);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCredits();
    loadPaymentStatus();
  }, [loadCredits, loadPaymentStatus]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateNew = () => {
    setSelectedCredit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (credit: Credit) => {
    setSelectedCredit(credit);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this credit?")) return;

    try {
      const res = await deleteCredit(id);
      if (res.success) {
        showToast("success", "Credit deleted successfully");
        loadCredits();
        loadPaymentStatus();
      } else {
        showToast("error", res.error || "Failed to delete credit");
      }
    } catch (err) {
      showToast("error", "Network error");
    }
  };

  const handleSendReminders = async () => {
     try {
       const res = await sendReminders();
       if (res.success) {
         showToast("success", res.message || "Reminders sent successfully");
       } else {
         showToast("error", res.error || "Failed to send reminders");
       }
     } catch (err) {
        showToast("error", "Network error");
     }
  }

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    showToast("success", `Credit successfully ${selectedCredit ? "updated" : "created"}`);
    loadCredits();
    loadPaymentStatus();
  };

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
                Credits
              </h1>
              {!loading && (
                <span className="badge badge-count" style={{ fontSize: 13 }}>
                  {credits.length}
                </span>
              )}
            </div>
             <div style={{display: "flex", alignItems: "center", gap: "10px", marginTop: "10px"}}>
               <label style={{ fontSize: 14 }}>View as Admin (Demo Toggle):</label>
               <input 
                 type="checkbox" 
                 checked={isAdmin} 
                 onChange={(e) => setIsAdmin(e.target.checked)} 
                 title="Toggle to test Admin vs User views"
               />
            </div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0, marginTop: "8px" }}>
              Manage subscription credits and payment statuses
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
             {isAdmin && (
                <button className="btn-secondary" onClick={handleSendReminders}>
                  Send Reminders
                </button>
             )}
            <button className="btn-primary" onClick={handleCreateNew}>
              <PlusIcon />
              Add Credit
            </button>
          </div>
        </div>

        {/* Payment Status Cards */}
         {!error && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                <div className="glass-card" style={{ padding: "20px" }}>
                  <div style={{ color: "var(--text-tertiary)", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>Total Credits</div>
                  <div style={{ fontSize: "24px", fontWeight: 700 }}>
                    {statusLoading ? <div className="skeleton" style={{width: 60, height: 28}} /> : (paymentStatus?.total_credits || 0)}
                  </div>
                </div>
                 <div className="glass-card" style={{ padding: "20px", borderLeft: "4px solid #22c55e" }}>
                  <div style={{ color: "var(--text-tertiary)", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>Total Paid</div>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: "#22c55e" }}>
                     {statusLoading ? <div className="skeleton" style={{width: 60, height: 28}} /> : (paymentStatus?.total_paid || 0)}
                  </div>
                </div>
                <div className="glass-card" style={{ padding: "20px", borderLeft: "4px solid #ef4444" }}>
                  <div style={{ color: "var(--text-tertiary)", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>Total Unpaid</div>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: "#ef4444" }}>
                     {statusLoading ? <div className="skeleton" style={{width: 60, height: 28}} /> : (paymentStatus?.total_unpaid || 0)}
                  </div>
                </div>
                <div className="glass-card" style={{ padding: "20px" }}>
                  <div style={{ color: "var(--text-tertiary)", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>Unpaid Invoices</div>
                   <div style={{ fontSize: "24px", fontWeight: 700 }}>
                     {statusLoading ? <div className="skeleton" style={{width: 60, height: 28}} /> : (paymentStatus?.unpaid_invoices || 0)}
                  </div>
                </div>
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
            <button className="btn-secondary" style={{ padding: "6px 14px", fontSize: 13 }} onClick={() => { loadCredits(); loadPaymentStatus(); }}>
              Retry
            </button>
          </div>
        )}

        {/* Credits Table / List */}
        <div className="glass-card" style={{ overflow: "hidden", overflowX: "auto" }}>
          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 80px",
            padding: "16px 20px",
            background: "rgba(99, 115, 171, 0.04)",
            borderBottom: "1px solid var(--border-color)",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-tertiary)",
            minWidth: "800px"
          }}>
            <div>Notes</div>
            <div>Amount (IDR)</div>
            <div>Billing Month</div>
            <div>Due Date</div>
            <div>Status</div>
            <div style={{ textAlign: "right" }}>Actions</div>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{ minWidth: "800px" }}>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          )}

          {/* Data Rows */}
          {!loading && !error && credits.length > 0 && (
            <div style={{ minWidth: "800px" }}>
              {credits.map((credit) => (
                <div key={credit.id} style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 80px",
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border-color)",
                  alignItems: "center",
                  fontSize: 14,
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99, 115, 171, 0.02)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: "10px" }} title={credit.notes}>{credit.notes || "-"}</div>
                  <div style={{ color: "var(--text-secondary)" }}>{credit.amount?.toLocaleString('id-ID') || 0}</div>
                  <div style={{ color: "var(--text-secondary)" }}>{credit.billing_month}</div>
                  <div style={{ color: "var(--text-secondary)" }}>{credit.due_date}</div>
                  <div>
                    <span className="badge" style={{ 
                      background: credit.status === 'paid' ? "rgba(34, 197, 94, 0.1)" : credit.status === 'unpaid' ? "var(--accent-red-bg)" : "var(--accent-primary-bg)", 
                      color: credit.status === 'paid' ? "#22c55e" : credit.status === 'unpaid' ? "var(--accent-red)" : "var(--foreground)"
                    }}>
                      {credit.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button
                      onClick={() => handleEdit(credit)}
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
                      title="Edit Status"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(credit.id)}
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
                      title="Delete Credit"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && credits.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", minWidth: "800px" }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: "rgba(99,115,171,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", color: "var(--text-tertiary)"
              }}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                 </svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px 0" }}>No credits found</h3>
              <p style={{ color: "var(--text-secondary)", margin: "0 0 20px 0", fontSize: 14 }}>
                Get started by creating your first credit record.
              </p>
              <button className="btn-secondary" onClick={handleCreateNew}>
                Add Credit
              </button>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CreditModal
          credit={selectedCredit}
          isAdmin={isAdmin}
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
