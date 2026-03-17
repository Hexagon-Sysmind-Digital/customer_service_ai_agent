"use client";

import { useState, useEffect } from "react";
import { Reservation, ReservationTemplate } from "@/types";
import { createReservation } from "@/app/actions/reservationsApi";
import { fetchReservationTemplates } from "@/app/actions/reservationTemplatesApi";
import SearchableSelect from "@/components/ui/SearchableSelect";

interface ModalProps {
  tenantId: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function ReservationModal({
  tenantId,
  onClose,
  onSuccess,
  onError,
}: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<ReservationTemplate[]>([]);

  const [formData, setFormData] = useState<Partial<Reservation>>({
    template_id: "",
    resource_name: "",
    customer_name: "",
    customer_contact: "",
    start_time: "",
    service_name: "",
    notes: "",
  });

  useEffect(() => {
    async function loadTemplates() {
      const res = await fetchReservationTemplates(tenantId);
      if (res.success && res.data) {
        setTemplates(res.data);
      }
    }
    loadTemplates();
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.template_id || !formData.customer_name || !formData.start_time) {
      onError("Please fill in required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await createReservation(tenantId, formData);
      if (res.success) {
        onSuccess();
      } else {
        onError(res.error || "Failed to create reservation");
      }
    } catch (err: any) {
      onError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(4px)",
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div className="glass-card" style={{
        width: "100%",
        maxWidth: 540,
        maxHeight: "90vh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden" // handle scrolling in body
      }}>
        {/* Header */}
        <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            Create Reservation
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1={18} y1={6} x2={6} y2={18} />
              <line x1={6} y1={6} x2={18} y2={18} />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          <form id="reservation-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            <div className="form-group">
              <SearchableSelect
                label="Template *"
                options={templates}
                value={formData.template_id || ""}
                onSelect={(id) => setFormData({ ...formData, template_id: id })}
                placeholder="Select a template..."
                searchPlaceholder="Search templates..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Customer Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.customer_name}
                onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Customer Contact</label>
              <input
                type="text"
                className="form-input"
                value={formData.customer_contact}
                onChange={e => setFormData({ ...formData, customer_contact: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={formData.start_time}
                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                <label className="form-label">Resource Name</label>
                <input
                    type="text"
                    className="form-input"
                    value={formData.resource_name}
                    onChange={e => setFormData({ ...formData, resource_name: e.target.value })}
                />
                </div>
                
                <div className="form-group">
                <label className="form-label">Service Name</label>
                <input
                    type="text"
                    className="form-input"
                    value={formData.service_name}
                    onChange={e => setFormData({ ...formData, service_name: e.target.value })}
                />
                </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-input"
                rows={3}
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: 12, background: "var(--background)" }}>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" form="reservation-form" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
