"use client";

import { useState } from "react";
import { ReservationTemplate, OperatingHours } from "@/types";
import { createReservationTemplate, updateReservationTemplate } from "@/app/actions/reservationTemplatesApi";
import { CloseIcon } from "@/components/icons";

interface ReservationTemplateModalProps {
  template?: ReservationTemplate | null;
  tenantId: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

const ALL_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export default function ReservationTemplateModal({ template, tenantId, onClose, onSuccess, onError }: ReservationTemplateModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!template;

  const [formData, setFormData] = useState({
    name: template?.name || "",
    template_type: template?.template_type || "professional",
    time_policy: template?.time_policy || "fixed_slot",
    slot_duration_minutes: template?.slot_duration_minutes || 30,
  });

  const [resources, setResources] = useState<string[]>(template?.resources || []);
  const [newResource, setNewResource] = useState("");

  const [services, setServices] = useState<string[]>(template?.services || []);
  const [newService, setNewService] = useState("");

  const getInitialHours = (): Record<string, { enabled: boolean; open: string; close: string }> => {
    const result: Record<string, { enabled: boolean; open: string; close: string }> = {};
    ALL_DAYS.forEach(day => {
      const slot = template?.operating_hours?.[day as keyof OperatingHours];
      result[day] = {
        enabled: !!slot,
        open: slot?.open || "09:00",
        close: slot?.close || "17:00",
      };
    });
    return result;
  };

  const [hours, setHours] = useState(getInitialHours);

  const [metadataEntries, setMetadataEntries] = useState<{ key: string; value: string }[]>(() => {
    if (template?.metadata && typeof template.metadata === "object") {
      return Object.entries(template.metadata).map(([key, value]) => ({
        key,
        value: String(value),
      }));
    }
    return [];
  });

  const addResource = () => {
    const trimmed = newResource.trim();
    if (trimmed && !resources.includes(trimmed)) {
      setResources([...resources, trimmed]);
      setNewResource("");
    }
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const addService = () => {
    const trimmed = newService.trim();
    if (trimmed && !services.includes(trimmed)) {
      setServices([...services, trimmed]);
      setNewService("");
    }
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const addMetadataEntry = () => {
    setMetadataEntries([...metadataEntries, { key: "", value: "" }]);
  };

  const removeMetadataEntry = (index: number) => {
    setMetadataEntries(metadataEntries.filter((_, i) => i !== index));
  };

  const updateMetadataEntry = (index: number, field: "key" | "value", val: string) => {
    const updated = [...metadataEntries];
    updated[index] = { ...updated[index], [field]: val };
    setMetadataEntries(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!tenantId) {
      onError("Tenant ID is required.");
      setLoading(false);
      return;
    }

    const operatingHours: Record<string, { open: string; close: string }> = {};
    ALL_DAYS.forEach(day => {
      if (hours[day].enabled) {
        operatingHours[day] = { open: hours[day].open, close: hours[day].close };
      }
    });

    const metadata: Record<string, unknown> = {};
    metadataEntries.forEach(entry => {
      if (entry.key.trim()) {
        const num = Number(entry.value);
        metadata[entry.key.trim()] = isNaN(num) ? entry.value : num;
      }
    });

    const payload: Record<string, unknown> = {
      name: formData.name,
      template_type: formData.template_type,
      time_policy: formData.time_policy,
      slot_duration_minutes: formData.slot_duration_minutes,
      resources,
      services,
      operating_hours: operatingHours,
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    };

    try {
      let result;
      if (isEditing && template) {
        result = await updateReservationTemplate(tenantId, template.id, payload);
      } else {
        result = await createReservationTemplate(tenantId, payload);
      }

      if (result.success) {
        onSuccess();
      } else {
        onError(result.error || `Failed to ${isEditing ? "update" : "create"} template`);
      }
    } catch {
      onError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
    background: "rgba(99,115,171,0.08)",
    color: "var(--text-secondary)",
  };

  const removeChipBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "var(--text-tertiary)",
    cursor: "pointer",
    padding: 0,
    fontSize: 14,
    lineHeight: 1,
    display: "flex",
  };

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: 8,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: 700,
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s ease-out",
          maxHeight: "90vh",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              {isEditing ? "Edit Template" : "Add Template"}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              borderRadius: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--foreground)";
              e.currentTarget.style.background = "var(--accent-primary-bg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-tertiary)";
              e.currentTarget.style.background = "none";
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", flex: 1 }}>

          {/* Basic Info */}
          <div className="form-group">
            <label className="form-label" htmlFor="tpl-name">Template Name</label>
            <input
              id="tpl-name"
              type="text"
              className="form-input"
              placeholder="e.g. Vet Appointment"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="tpl-type">Type</label>
              <select
                id="tpl-type"
                className="form-input"
                value={formData.template_type}
                onChange={(e) => setFormData(prev => ({ ...prev, template_type: e.target.value }))}
                style={{ background: "var(--background)", borderColor: "var(--card-border)" }}
              >
                <option value="professional">Professional</option>
                <option value="property">Property</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="tpl-policy">Time Policy</label>
              <select
                id="tpl-policy"
                className="form-input"
                value={formData.time_policy}
                onChange={(e) => setFormData(prev => ({ ...prev, time_policy: e.target.value }))}
                style={{ background: "var(--background)", borderColor: "var(--card-border)" }}
              >
                <option value="fixed_slot">Fixed Slot</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="tpl-duration">Duration (min)</label>
              <input
                id="tpl-duration"
                type="number"
                className="form-input"
                min={5}
                max={480}
                value={formData.slot_duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, slot_duration_minutes: parseInt(e.target.value) || 30 }))}
                required
              />
            </div>
          </div>

          {/* Resources */}
          <div>
            <p style={sectionHeadingStyle}>Resources</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Dr. Cat Care"
                value={newResource}
                onChange={(e) => setNewResource(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addResource(); } }}
                style={{ flex: 1 }}
              />
              <button type="button" className="btn-secondary" onClick={addResource} style={{ whiteSpace: "nowrap" }}>
                + Add
              </button>
            </div>
            {resources.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {resources.map((r, i) => (
                  <span key={i} style={chipStyle}>
                    {r}
                    <button type="button" style={removeChipBtnStyle} onClick={() => removeResource(i)}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Services */}
          <div>
            <p style={sectionHeadingStyle}>Services</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. General Checkup"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addService(); } }}
                style={{ flex: 1 }}
              />
              <button type="button" className="btn-secondary" onClick={addService} style={{ whiteSpace: "nowrap" }}>
                + Add
              </button>
            </div>
            {services.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {services.map((s, i) => (
                  <span key={i} style={chipStyle}>
                    {s}
                    <button type="button" style={removeChipBtnStyle} onClick={() => removeService(i)}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Operating Hours */}
          <div>
            <p style={sectionHeadingStyle}>Operating Hours</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ALL_DAYS.map(day => (
                <div key={day} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: hours[day].enabled ? "rgba(16,185,129,0.04)" : "transparent",
                  border: `1px solid ${hours[day].enabled ? "rgba(16,185,129,0.15)" : "var(--border-color)"}`,
                  transition: "all 0.2s",
                }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", minWidth: 120 }}>
                    <input
                      type="checkbox"
                      checked={hours[day].enabled}
                      onChange={(e) => setHours(prev => ({ ...prev, [day]: { ...prev[day], enabled: e.target.checked } }))}
                      style={{ accentColor: "#10b981" }}
                    />
                    <span style={{
                      fontSize: 13,
                      fontWeight: 500,
                      textTransform: "capitalize",
                      color: hours[day].enabled ? "var(--foreground)" : "var(--text-tertiary)",
                    }}>
                      {day}
                    </span>
                  </label>
                  {hours[day].enabled && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="time"
                        className="form-input"
                        value={hours[day].open}
                        onChange={(e) => setHours(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))}
                        style={{ width: 120, padding: "4px 8px", fontSize: 13 }}
                      />
                      <span style={{ color: "var(--text-tertiary)", fontSize: 13 }}>to</span>
                      <input
                        type="time"
                        className="form-input"
                        value={hours[day].close}
                        onChange={(e) => setHours(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))}
                        style={{ width: 120, padding: "4px 8px", fontSize: 13 }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ ...sectionHeadingStyle, marginBottom: 0 }}>Metadata (optional)</p>
              <button type="button" className="btn-secondary" onClick={addMetadataEntry} style={{ fontSize: 12, padding: "4px 10px" }}>
                + Add Field
              </button>
            </div>
            {metadataEntries.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {metadataEntries.map((entry, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Key"
                      value={entry.key}
                      onChange={(e) => updateMetadataEntry(i, "key", e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Value"
                      value={entry.value}
                      onChange={(e) => updateMetadataEntry(i, "value", e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => removeMetadataEntry(i)}
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "none",
                        color: "var(--accent-red)",
                        padding: "6px 8px",
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "flex",
                        fontSize: 13,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div
            style={{
              paddingTop: 20,
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 4,
            }}
          >
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ minWidth: 120, justifyContent: "center" }}
            >
              {loading ? "Saving..." : isEditing ? "Update Template" : "Create Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
