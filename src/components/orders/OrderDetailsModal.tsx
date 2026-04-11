"use client";

import React from "react";
import { CheckIcon, CloseIcon, UserIcon, MailIcon, CalendarIcon } from "@/components/icons";

import { Order } from "@/types";

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus?: (id: string, status: string) => void;
  loadingStatus?: boolean;
}

export default function OrderDetailsModal({ order, onClose, onUpdateStatus, loadingStatus }: OrderDetailsModalProps) {
  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return "#10b981";
      case "pending": return "#f59e0b";
      case "cancelled": return "#ef4444";
      case "completed": return "#3b82f6";
      default: return "var(--text-tertiary)";
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass-card p-0" 
        style={{ width: "100%", maxWidth: 700, overflow: "hidden", animation: "modalSlideUp 0.3s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "24px 32px", background: "rgba(99, 102, 241, 0.05)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Order Detail</h2>
              <span className="badge" style={{ 
                background: `${getStatusColor(order.status)}15`, 
                color: getStatusColor(order.status),
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase"
              }}>
                {order.status}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>ID: {order.id}</p>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ background: "rgba(99, 115, 171, 0.1)" }}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: 32, maxHeight: "70vh", overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 40 }}>
            {/* Customer Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.05em", margin: 0 }}>Customer Info</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ color: "var(--accent-primary)" }}><UserIcon size={18} /></div>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{order.customer_name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ color: "var(--accent-primary)" }}><MailIcon size={18} /></div>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{order.customer_contact}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ color: "var(--accent-primary)" }}><CalendarIcon size={18} /></div>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{new Date(order.created_at).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.05em", margin: 0 }}>Payment Summary</h4>
              <div className="glass-card" style={{ padding: 20, background: "rgba(99, 102, 241, 0.03)", border: "1px solid rgba(99, 102, 241, 0.1)" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Total Amount</span>
                 </div>
                 <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <h3 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "var(--accent-primary)" }}>
                      {formatCurrency(order.total_price)}
                    </h3>
                 </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: 32 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.05em", marginBottom: 16 }}>Items ({order.items?.length})</h4>
            <div className="glass-card" style={{ overflow: "hidden", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "12px 16px", background: "rgba(99, 115, 171, 0.05)", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                <div>Product</div>
                <div>Price</div>
                <div style={{ textAlign: "center" }}>Qty</div>
                <div style={{ textAlign: "right" }}>Subtotal</div>
              </div>
              {order.items?.map((item, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "16px", borderTop: "1px solid var(--border-color)", fontSize: 13, alignItems: "center" }}>
                  <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                  <div style={{ color: "var(--text-secondary)" }}>{formatCurrency(item.unit_price)}</div>
                  <div style={{ textAlign: "center", fontWeight: 500 }}>{item.quantity}</div>
                  <div style={{ textAlign: "right", fontWeight: 700, color: "var(--foreground)" }}>{formatCurrency(item.subtotal)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{ marginBottom: 32 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.05em", marginBottom: 12 }}>Notes</h4>
              <div style={{ padding: 16, background: "rgba(99, 115, 171, 0.04)", borderRadius: 12, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {order.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: "24px 32px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: 12, background: "rgba(99, 115, 171, 0.02)" }}>
          <button className="btn-secondary" onClick={onClose} disabled={loadingStatus}>Close</button>
          
          {order.status === "pending" && onUpdateStatus && (
            <button 
              className="btn-primary" 
              onClick={() => onUpdateStatus(order.id, "confirmed")}
              disabled={loadingStatus}
            >
              <CheckIcon size={18} />
              {loadingStatus ? "Updating..." : "Confirm Order"}
            </button>
          )}

          {order.status === "confirmed" && onUpdateStatus && (
            <button 
              className="btn-primary" 
              onClick={() => onUpdateStatus(order.id, "completed")}
              disabled={loadingStatus}
              style={{ background: "#3b82f6" }}
            >
              <CheckIcon size={18} />
              {loadingStatus ? "Updating..." : "Mark Completed"}
            </button>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
