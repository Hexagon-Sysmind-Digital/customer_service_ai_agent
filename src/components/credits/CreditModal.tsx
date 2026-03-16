"use client";

import { useState, useRef, useEffect } from "react";
import { Credit } from "@/types";
import { createCredit, updateCreditStatus } from "@/app/actions/credits";

interface CreditModalProps {
  credit?: Credit | null;
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function CreditModal({ credit, isAdmin, onClose, onSuccess, onError }: CreditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(credit?.status || "unpaid");
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      if (credit) {
         // Update existing credit (can only update status as per requirements)
         const status = formData.get("status") as string;
         const res = await updateCreditStatus(credit.id, status);
         if (res.success) {
           onSuccess();
         } else {
           onError(res.error || "Failed to update credit");
         }
      } else {
        // Create new credit
        const res = await createCredit(formData, isAdmin);
        if (res.success) {
          onSuccess();
        } else {
          onError(res.error || "Failed to create credit");
        }
      }
    } catch (err) {
      onError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!credit;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.4)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    }}>
      <div 
        ref={modalRef}
        className="glass-card" 
        style={{
          width: "100%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "32px",
          position: "relative",
          animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "24px",
            right: "24px",
            background: "none",
            border: "none",
            color: "var(--text-tertiary)",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "6px",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--foreground)";
            e.currentTarget.style.background = "rgba(99, 115, 171, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-tertiary)";
            e.currentTarget.style.background = "none";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 4px 0" }}>
            {isEditing ? `Edit Credit ${isAdmin ? '(Status Only)' : ''}`  : "Create New Credit"}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
            {isEditing ? "Update the payment status" : "Fill out the details below to create a new credit record"}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
           {!isEditing && isAdmin && (
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">User ID <span style={{color: "var(--accent-red)"}}>*</span></label>
                <input
                  name="user_id"
                  className="form-input"
                  required
                  placeholder="Enter user ID"
                />
              </div>
              <div style={{ flex: 1 }}>
                 <label className="form-label">Tenant ID <span style={{color: "var(--accent-red)"}}>*</span></label>
                 <input
                  name="tenant_id"
                  className="form-input"
                  required
                  placeholder="Enter tenant ID"
                />
              </div>
            </div>
          )}

           {!isEditing && (
             <>
               <div>
                  <label className="form-label">Amount (IDR) <span style={{color: "var(--accent-red)"}}>*</span></label>
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    className="form-input"
                    required
                    placeholder="e.g. 150000"
                    defaultValue={150000}
                  />
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Billing Month <span style={{color: "var(--accent-red)"}}>*</span></label>
                     <input
                      name="billing_month"
                      type="date"
                      className="form-input"
                      required
                    />
                  </div>
                   <div style={{ flex: 1 }}>
                    <label className="form-label">Due Date <span style={{color: "var(--accent-red)"}}>*</span></label>
                     <input
                      name="due_date"
                      type="date"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Subscription Start <span style={{color: "var(--accent-red)"}}>*</span></label>
                     <input
                      name="subscription_start"
                      type="date"
                      className="form-input"
                      required
                    />
                  </div>
                   <div style={{ flex: 1 }}>
                    <label className="form-label">Subscription End <span style={{color: "var(--accent-red)"}}>*</span></label>
                     <input
                      name="subscription_end"
                      type="date"
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                 
               <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Next Renewal Date <span style={{color: "var(--accent-red)"}}>*</span></label>
                     <input
                      name="next_renewal_date"
                      type="date"
                      className="form-input"
                      required
                    />
                  </div>
               </div>
               
               <div>
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  className="form-input"
                  placeholder="e.g. Paket Bulanan Maret 2026"
                  rows={2}
                />
              </div>
             </>
           )}

            {isEditing && (
              <div>
                <label className="form-label">Status <span style={{color: "var(--accent-red)"}}>*</span></label>
                <input type="hidden" name="status" value={status} />
                <div className="chip-grid">
                  {[
                    { value: "unpaid", label: "Unpaid", active: "active-red" },
                    { value: "paid", label: "Paid", active: "active-green" },
                    { value: "cancelled", label: "Cancelled", active: "active-orange" },
                  ].map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStatus(s.value)}
                      className={`chip-button ${status === s.value ? s.active : ""}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Credit"}
            </button>
          </div>
        </form>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}
