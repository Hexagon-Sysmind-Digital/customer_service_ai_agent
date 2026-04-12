"use client";

import { useState, useEffect, useRef } from "react";
import { PlusIcon, CreditCardIcon, CheckIcon, CloseIcon, ChevronRightIcon } from "@/components/icons";
import { showToast } from "@/lib/swal";
import { fetchPayments, createPayment, uploadPaymentProof } from "@/app/actions/paymentsApi";
import { fetchCredits, fetchPaymentStatus } from "@/app/actions/credits";
import { Credit, PaymentStatus } from "@/types";

// ========== CUSTOM DROPDOWN COMPONENT ==========
function CustomDropdown({ label, items, value, onSelect }: { label: string, items: any[], value: string, onSelect: (v: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
  
    return (
      <div ref={ref} style={{ position: "relative", width: '100%' }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 14px", width: '100%',
            background: "var(--input-bg)", border: `1.5px solid ${isOpen ? "var(--accent-primary)" : "var(--input-border)"}`,
            borderRadius: 12, color: "var(--foreground)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s"
          }}
        >
          <span style={{ textTransform: 'capitalize' }}>{items.find(i => i.value === value)?.label || label}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" style={{ transition: "0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.5 }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
  
        {isOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, width: '100%', background: "var(--modal-bg)", 
            border: "1px solid var(--card-border)", borderRadius: 12, padding: "6px", zIndex: 1000, boxShadow: "0 10px 25px rgba(0,0,0,0.2)", backdropFilter: "blur(24px)"
          }}>
            {items.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => { onSelect(item.value); setIsOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px", border: "none", borderRadius: 8,
                  background: item.value === value ? "var(--accent-primary)" : "transparent",
                  color: item.value === value ? "#fff" : "var(--text-secondary)",
                  fontSize: 13, fontWeight: item.value === value ? 600 : 500, cursor: "pointer", textAlign: "left", transition: "0.15s"
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
}

export default function BillingPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [paymentStat, setPaymentStat] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: 0,
    payment_method: "bank_transfer",
    proof_url: "",
    notes: ""
  });

  const loadData = async () => {
    setLoading(true);
    const [resPayments, resCredits, resStatus] = await Promise.all([
        fetchPayments(),
        fetchCredits(),
        fetchPaymentStatus()
    ]);
    
    if (resPayments.success) setPayments(resPayments.data);
    if (resCredits.success) setCredits(resCredits.data);
    if (resStatus.success) setPaymentStat(resStatus.data as PaymentStatus);
    
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setSubmitting(true);
    const res = await uploadPaymentProof(fd);
    if (res.success) {
      setFormData(prev => ({ ...prev, proof_url: res.data.proof_url }));
      showToast("success", "Proof uploaded");
    } else {
      showToast("error", res.error || "Upload failed");
    }
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return showToast("error", "Amount required");
    if (!formData.proof_url) return showToast("error", "Upload proof first");
    
    setSubmitting(true);
    const res = await createPayment(formData);
    if (res.success) {
      showToast("success", "Payment submitted");
      setShowModal(false);
      loadData();
    } else {
      showToast("error", res.error || "Failed");
    }
    setSubmitting(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div>
                <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Billing</h1>
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>Subscriptions and credits</p>
            </div>
            <button className="btn-primary" onClick={() => setShowModal(true)} style={{ borderRadius: 12, padding: '10px 20px' }}>
                <PlusIcon /> Top Up
            </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
            <div style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", padding: 20, borderRadius: 20, color: "#fff", boxShadow: "0 8px 16px rgba(99,102,241,0.2)" }}>
                <div style={{ opacity: 0.8, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Available AI Credits</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{paymentStat?.total_credits ? formatCurrency(paymentStat.total_credits) : "0"}</div>
            </div>
            <div style={{ background: "var(--card-bg)", border: '1px solid var(--card-border)', padding: 20, borderRadius: 20 }}>
                <div style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Unpaid Subscriptions</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: (paymentStat?.unpaid_invoices || 0) > 0 ? "var(--accent-red)" : "var(--foreground)" }}>{paymentStat?.unpaid_invoices || 0}</div>
            </div>
            <div style={{ background: "var(--card-bg)", border: '1px solid var(--card-border)', padding: 20, borderRadius: 20 }}>
                <div style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Active Subscription End</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 6 }}>
                  {credits.length > 0 && credits[0].subscription_end ? new Date(credits[0].subscription_end).toLocaleDateString() : "No Active Pack"}
                </div>
            </div>
        </div>

        {/* AI Credits Subscriptions / Invoices (GetCredits) */}
        <div style={{ background: "var(--card-bg)", borderRadius: 20, border: "1px solid var(--card-border)", overflow: "hidden", marginBottom: 32 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)", fontWeight: 700 }}>AI Subscription Credits</div>
            {loading ? (
                <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>
            ) : credits.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)" }}>No subscription records found.</div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", fontSize: 11, color: "var(--text-tertiary)", background: "rgba(99, 115, 171, 0.04)" }}>
                                <th style={{ padding: "12px 20px" }}>Billing Month</th>
                                <th style={{ padding: "12px 20px" }}>Subscription Period</th>
                                <th style={{ padding: "12px 20px" }}>Due Date</th>
                                <th style={{ padding: "12px 20px" }}>Amount</th>
                                <th style={{ padding: "12px 20px" }}>Status</th>
                                <th style={{ padding: "12px 20px" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {credits.map(c => (
                                <tr key={c.id} style={{ borderBottom: "1px solid var(--card-border)", fontSize: 13 }}>
                                    <td style={{ padding: "14px 20px", fontWeight: 600 }}>{c.billing_month}</td>
                                    <td style={{ padding: "14px 20px", color: 'var(--text-secondary)' }}>
                                        {new Date(c.subscription_start).toLocaleDateString()} - {new Date(c.subscription_end).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: "14px 20px", color: 'var(--text-secondary)' }}>{new Date(c.due_date).toLocaleDateString()}</td>
                                    <td style={{ padding: "14px 20px", fontWeight: 700 }}>{formatCurrency(c.amount)}</td>
                                    <td style={{ padding: "14px 20px" }}>
                                        <span style={{ 
                                            padding: "4px 8px", borderRadius: 8, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                                            background: c.status === 'active' || c.status === 'paid' ? "rgba(34,197,94,0.1)" : c.status === 'overdue' ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                                            color: c.status === 'active' || c.status === 'paid' ? "#10b981" : c.status === 'overdue' ? "#ef4444" : "#f59e0b"
                                        }}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: "14px 20px" }}>
                                        {c.status !== 'paid' && c.status !== 'active' && (
                                            <button 
                                                onClick={() => {
                                                    setFormData({ ...formData, amount: c.amount, credit_id: c.id });
                                                    setShowModal(true);
                                                }}
                                                style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--accent-primary)", color: "var(--accent-primary)", background: "transparent", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                                            >
                                                Pay Now
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* History Table */}
        <div style={{ background: "var(--card-bg)", borderRadius: 20, border: "1px solid var(--card-border)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)", fontWeight: 700 }}>History</div>
            {loading ? (
                <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", fontSize: 11, color: "var(--text-tertiary)", background: "rgba(99, 115, 171, 0.04)" }}>
                                <th style={{ padding: "12px 20px" }}>Date</th>
                                <th style={{ padding: "12px 20px" }}>Method</th>
                                <th style={{ padding: "12px 20px" }}>Amount</th>
                                <th style={{ padding: "12px 20px" }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(p => (
                                <tr key={p.id} style={{ borderBottom: "1px solid var(--card-border)", fontSize: 13 }}>
                                    <td style={{ padding: "14px 20px", color: 'var(--text-secondary)' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: "14px 20px", textTransform: 'capitalize' }}>{p.payment_method.replace('_', ' ')}</td>
                                    <td style={{ padding: "14px 20px", fontWeight: 700 }}>{formatCurrency(p.amount)}</td>
                                    <td style={{ padding: "14px 20px" }}>
                                        <span style={{ 
                                            padding: "4px 8px", borderRadius: 8, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                                            background: p.status === 'success' ? "rgba(34,197,94,0.1)" : p.status === 'rejected' ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                                            color: p.status === 'success' ? "#10b981" : p.status === 'rejected' ? "#ef4444" : "#f59e0b"
                                        }}>
                                            {p.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* Modal Fixes */}
        {showModal && (
            <div className="modal-overlay">
                <div className="modal-content-compact">
                    <div className="modal-header-compact">
                        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Top Up / Pay</h2>
                        <button onClick={() => setShowModal(false)} className="close-btn-compact"><CloseIcon /></button>
                    </div>

                    <div className="modal-body-scroll">
                        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
                            <div className="form-group">
                                <label>Target Invoice / Credit</label>
                                <CustomDropdown 
                                    label="Select Invoice to Pay"
                                    items={credits.filter(c => c.status !== 'paid').map(c => ({ value: c.id, label: `${c.billing_month} - ${formatCurrency(c.amount)}` }))}
                                    value={(formData as any).credit_id || ""}
                                    onSelect={v => {
                                        const selected = credits.find(c => c.id === v);
                                        setFormData({...formData, credit_id: v, amount: selected ? selected.amount : formData.amount} as any);
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Amount (IDR)</label>
                                <div className="amount-input-box">
                                    <span>Rp</span>
                                    <input 
                                        type="number" required className="no-spinner"
                                        value={formData.amount || ""} 
                                        onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Method</label>
                                <CustomDropdown 
                                    label="Select"
                                    items={[{ value: "bank_transfer", label: "Bank Transfer" }, { value: "e_wallet", label: "E-Wallet" }]}
                                    value={formData.payment_method}
                                    onSelect={v => setFormData({...formData, payment_method: v})}
                                />
                            </div>

                            <div className="form-group">
                                <label>Notes (Optional)</label>
                                <input type="text" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="compact-input" />
                            </div>

                            <div className="form-group">
                                <label>Proof Receipt</label>
                                <div className="upload-box">
                                    <div className="receipt-preview" style={{ background: formData.proof_url ? `url(${formData.proof_url}) center/cover` : 'rgba(99, 115, 171, 0.05)' }}>
                                        {!formData.proof_url && <span>🖼️</span>}
                                    </div>
                                    <label className="upload-link">
                                        {submitting ? "..." : "Upload File"}
                                        <input type="file" hidden accept="image/*" onChange={handleFileUpload} disabled={submitting} />
                                    </label>
                                </div>
                            </div>

                            <button type="submit" className="btn-primary submit-compact" disabled={submitting}>
                                {submitting ? "Processing..." : "Submit Top Up"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )}

      </div>

      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
        .modal-content-compact { background: var(--modal-bg); border: 1px solid var(--card-border); border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); width: 100%; max-width: 420px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; animation: pop 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes pop { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .modal-header-compact { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--card-border); }
        .modal-body-scroll { padding: 24px; overflow-y: auto; flex: 1; }
        .close-btn-compact { background: transparent; border: none; cursor: pointer; color: var(--text-tertiary); padding: 4px; border-radius: 6px; }
        .close-btn-compact:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        .amount-input-box { position: relative; display: flex; align-items: center; }
        .amount-input-box span { position: absolute; left: 12px; font-weight: 700; color: var(--text-tertiary); font-size: 14px; }
        .amount-input-box input { width: 100%; padding: 10px 12px 10px 36px; border-radius: 10px; border: 1.5px solid var(--input-border); background: var(--input-bg); color: var(--foreground); font-size: 16px; font-weight: 700; outline: none; }
        .no-spinner::-webkit-inner-spin-button, .no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .quick-amounts { display: flex; gap: 8px; }
        .quick-amounts button { flex: 1; padding: 6px; border-radius: 8px; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); font-size: 11px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .quick-amounts button.active { background: var(--accent-primary); border-color: var(--accent-primary); color: #fff; }
        .compact-input { padding: 10px 12px; border-radius: 10px; border: 1.5px solid var(--input-border); background: var(--input-bg); color: var(--foreground); font-size: 13px; outline: none; }
        .upload-box { display: flex; gap: 12px; align-items: center; padding: 10px; background: rgba(99, 115, 171, 0.04); border: 1.5px dashed var(--border-color); border-radius: 12px; }
        .receipt-preview { width: 44px; height: 44px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 18px; overflow: hidden; }
        .upload-link { font-size: 12px; font-weight: 700; color: var(--accent-primary); cursor: pointer; }
        .submit-compact { margin-top: 8px; padding: 14px; border-radius: 14px; font-weight: 700; justify-content: center; font-size: 15px; }
      `}</style>
    </div>
  );
}
