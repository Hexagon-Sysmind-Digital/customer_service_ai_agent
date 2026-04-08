"use client";

import { useState, useEffect, useMemo } from "react";
import { CheckIcon, TrashIcon, CloseIcon, SearchIcon, AlertCircleIcon } from "@/components/icons";
import { showToast, showConfirm } from "@/lib/swal";
import { fetchPayments, verifyPayment, rejectPayment } from "@/app/actions/paymentsApi";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await fetchPayments();
    if (res.success) setPayments(res.data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filteredPayments = useMemo(() => {
    if (filter === 'all') return payments;
    return payments.filter(p => p.status === filter);
  }, [payments, filter]);

  const handleVerify = async (id: string) => {
    const confirm = await showConfirm("Verify Payment", "Are you sure you want to approve this payment?");
    if (!confirm.isConfirmed) return;
    
    setProcessing(true);
    const res = await verifyPayment(id);
    if (res.success) {
      showToast("success", "Payment verified and credits added");
      setSelectedPayment(null);
      loadData();
    } else {
      showToast("error", res.error || "Failed to verify");
    }
    setProcessing(false);
  };

  const handleReject = async (id: string) => {
    const confirm = await showConfirm("Reject Payment", "This will notify the user of the rejection.");
    if (!confirm.isConfirmed) return;
    
    setProcessing(true);
    const res = await rejectPayment(id);
    if (res.success) {
      showToast("success", "Payment rejected");
      setSelectedPayment(null);
      loadData();
    } else {
      showToast("error", res.error || "Failed to reject");
    }
    setProcessing(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

  return (
    <div style={{ minHeight: "100vh", padding: "40px 24px", color: "var(--foreground)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Payment Management</h1>
            <p style={{ color: "var(--text-secondary)", margin: "4px 0 0" }}>Approve or reject tenant payment transfers</p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, padding: 6, background: "rgba(99, 115, 171, 0.05)", borderRadius: 12, width: "fit-content" }}>
            {['pending', 'success', 'rejected', 'all'].map(f => (
                <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{ 
                        padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", 
                        textTransform: "capitalize", transition: "0.2s",
                        background: filter === f ? "var(--accent-primary)" : "transparent",
                        color: filter === f ? "#fff" : "var(--text-secondary)"
                    }}
                >
                    {f}
                </button>
            ))}
        </div>

        {/* Table View */}
        <div style={{ background: "var(--card-bg)", borderRadius: 20, border: "1px solid var(--card-border)", overflow: "hidden" }}>
            {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Fetching payments...</div>
            ) : filteredPayments.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center" }}>
                    <div style={{ fontWeight: 600 }}>No {filter !== 'all' ? filter : ''} payments found</div>
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", fontSize: 12, textTransform: "uppercase", color: "var(--text-tertiary)", background: "rgba(99, 115, 171, 0.04)" }}>
                                <th style={{ padding: "12px 24px" }}>Tenant ID</th>
                                <th style={{ padding: "12px 24px" }}>Date</th>
                                <th style={{ padding: "12px 24px" }}>Amount</th>
                                <th style={{ padding: "12px 24px" }}>Status</th>
                                <th style={{ padding: "12px 24px" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map(p => (
                                <tr key={p.id} style={{ borderBottom: "1px solid var(--card-border)", fontSize: 14 }}>
                                    <td style={{ padding: "16px 24px", color: "var(--text-secondary)", fontFamily: "monospace", fontSize: 12 }}>{p.tenant_id}</td>
                                    <td style={{ padding: "16px 24px" }}>{new Date(p.created_at).toLocaleString()}</td>
                                    <td style={{ padding: "16px 24px", fontWeight: 700, color: "var(--accent-primary)" }}>{formatCurrency(p.amount)}</td>
                                    <td style={{ padding: "16px 24px" }}>
                                        <span style={{ 
                                            padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                            background: p.status === 'success' ? "rgba(34,197,94,0.1)" : p.status === 'rejected' ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                                            color: p.status === 'success' ? "#22c55e" : p.status === 'rejected' ? "#ef4444" : "#f59e0b"
                                        }}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: "16px 24px" }}>
                                        <button 
                                            onClick={() => setSelectedPayment(p)}
                                            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                                        >
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* Review Modal */}
        {selectedPayment && (
            <div className="modal-overlay">
                <div className="modal-card" style={{ maxWidth: 800, width: "95%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Review Payment</h2>
                        <button onClick={() => setSelectedPayment(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><CloseIcon /></button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                        {/* Proof Image */}
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>Payment Proof</div>
                            {selectedPayment.proof_url ? (
                                <a href={selectedPayment.proof_url} target="_blank" rel="noopener noreferrer">
                                    <img src={selectedPayment.proof_url} style={{ width: "100%", borderRadius: 16, border: "1px solid var(--border-color)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} alt="Proof" />
                                </a>
                            ) : (
                                <div style={{ width: "100%", height: 200, borderRadius: 16, background: "rgba(99, 115, 171, 0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>No image provided</div>
                            )}
                        </div>

                        {/* Details & Actions */}
                        <div>
                             <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 16 }}>Transaction Details</div>
                             <div style={{ display: "grid", gap: 16 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Amount</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: "var(--accent-primary)" }}>{formatCurrency(selectedPayment.amount)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Method</div>
                                    <div style={{ fontWeight: 600 }}>{selectedPayment.payment_method.replace('_', ' ')}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Tenant ID</div>
                                    <div style={{ fontFamily: "monospace", fontSize: 12 }}>{selectedPayment.tenant_id}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase" }}>User Notes</div>
                                    <div style={{ fontSize: 14 }}>{selectedPayment.notes || 'No notes provided'}</div>
                                </div>
                             </div>

                             {selectedPayment.status === 'pending' && (
                                <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
                                    <button 
                                        className="btn-primary" 
                                        onClick={() => handleVerify(selectedPayment.id)}
                                        disabled={processing}
                                        style={{ flex: 2, justifyContent: "center", background: "#22c55e" }}
                                    >
                                        <CheckIcon /> Approve
                                    </button>
                                    <button 
                                        className="btn-secondary" 
                                        onClick={() => handleReject(selectedPayment.id)}
                                        disabled={processing}
                                        style={{ flex: 1, justifyContent: "center", color: "#ef4444" }}
                                    >
                                        <TrashIcon /> Reject
                                    </button>
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}
