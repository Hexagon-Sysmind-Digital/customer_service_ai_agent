"use client";

import { useState, FormEvent } from "react";
import { createTenant, updateTenant } from "@/app/actions/tenants";

import { Tenant } from "@/types";

interface TenantModalProps {
  tenant?: Tenant | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function TenantModal({ tenant, onClose, onSuccess, onError }: TenantModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!tenant;

  const [form, setForm] = useState({
    name: tenant?.name || "",
    welcome_message: tenant?.config?.welcome_message || "",
    model_name: tenant?.config?.model_name || "qwen-plus",
    temperature: tenant?.config?.temperature ?? 0.7,
    system_prompt: tenant?.config?.system_prompt || "",
    faq_threshold: tenant?.config?.faq_threshold ?? 0.8,
    knowledge_enabled: tenant?.config?.knowledge_enabled ?? false,
    fallback_threshold: tenant?.config?.fallback_threshold ?? 0.5,
    cs_webhook_url: tenant?.config?.cs_webhook_url || "",
    language: tenant?.config?.language || "id",
  });

  const updateField = (key: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setSubmitting(true);
      
      const payload = {
        name: form.name,
        config: {
          welcome_message: form.welcome_message,
          model_name: form.model_name,
          temperature: form.temperature,
          system_prompt: form.system_prompt,
          faq_threshold: form.faq_threshold,
          knowledge_enabled: form.knowledge_enabled,
          fallback_threshold: form.fallback_threshold,
          cs_webhook_url: form.cs_webhook_url,
          language: form.language,
        },
      };

      let res;
      if (isEditing && tenant) {
        res = await updateTenant(tenant.id, payload);
      } else {
        res = await createTenant(payload);
      }

      if (res.success) {
        onSuccess();
      } else {
        throw new Error(res.error || `Failed to ${isEditing ? 'update' : 'create'} tenant`);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-secondary)",
    marginBottom: 6,
  };

  const fieldGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--card-border)",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            {isEditing ? "Edit Tenant" : "Create New Tenant"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              fontSize: 20,
              padding: 4,
              lineHeight: 1,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Name */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Tenant Name *</label>
            <input
              className="input-field"
              type="text"
              placeholder=""
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </div>

          {/* Model & Language row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Model Name</label>
              <div className="chip-grid">
                {[
                  { value: "qwen-plus", label: "Qwen Plus" },
                  { value: "qwen-vl-max", label: "Qwen VL Max" },
                  { value: "qwen-vl-plus", label: "Qwen VL Plus" },
                  { value: "qwen-turbo", label: "Qwen Turbo" },
                ].map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => updateField("model_name", m.value)}
                    className={`chip-button ${form.model_name === m.value ? "active" : ""}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Language</label>
              <div className="chip-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
                {[
                  { value: "id", label: "🇮🇩 Indo" },
                  { value: "en", label: "🇬🇧 English" },
                  { value: "de", label: "🇩🇪 German" },
                  { value: "fr", label: "🇫🇷 French" },
                  { value: "es", label: "🇪🇸 Spanish" },
                  { value: "ja", label: "🇯🇵 Japan" },
                  { value: "zh", label: "🇨🇳 China" },
                  { value: "ko", label: "🇰🇷 Korea" },
                  { value: "ar", label: "🇸🇦 Arab" },
                ].map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => updateField("language", l.value)}
                    className={`chip-button ${form.language === l.value ? "active" : ""}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Temperature slider */}
          <div style={fieldGroupStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Temperature</label>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-primary)" }}>{form.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={form.temperature}
              onChange={(e) => updateField("temperature", parseFloat(e.target.value))}
              style={{
                width: "100%",
                accentColor: "var(--accent-primary)",
                height: 6,
                cursor: "pointer",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-tertiary)" }}>
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Welcome Message */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Welcome Message</label>
            <input
              className="input-field"
              type="text"
              placeholder=""
              value={form.welcome_message}
              onChange={(e) => updateField("welcome_message", e.target.value)}
            />
          </div>

          {/* System Prompt */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>System Prompt</label>
            <textarea
              className="input-field"
              placeholder=""
              value={form.system_prompt}
              onChange={(e) => updateField("system_prompt", e.target.value)}
              rows={3}
            />
          </div>

          {/* Thresholds row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>FAQ Threshold</label>
              <input
                className="input-field"
                type="number"
                min="0"
                max="1"
                step="0.01"
                placeholder=""
                value={form.faq_threshold}
                onChange={(e) => updateField("faq_threshold", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Fallback Threshold</label>
              <input
                className="input-field"
                type="number"
                min="0"
                max="1"
                step="0.01"
                placeholder=""
                value={form.fallback_threshold}
                onChange={(e) => updateField("fallback_threshold", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Knowledge toggle & Webhook */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "end" }}>
            <div style={{ ...fieldGroupStyle, alignItems: "flex-start" }}>
              <label style={labelStyle}>Knowledge</label>
              <div
                className={`toggle-switch ${form.knowledge_enabled ? "active" : ""}`}
                onClick={() => updateField("knowledge_enabled", !form.knowledge_enabled)}
              />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>CS Webhook URL</label>
              <input
                className="input-field"
                type="url"
                placeholder=""
                value={form.cs_webhook_url}
                onChange={(e) => updateField("cs_webhook_url", e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              paddingTop: 8,
              borderTop: "1px solid var(--card-border)",
            }}
          >
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || !form.name.trim()}>
              {submitting ? (
                <>
                  <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : (
                 isEditing ? "Save Changes" : "Create Tenant"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
