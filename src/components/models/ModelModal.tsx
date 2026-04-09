"use client";

import { useState, FormEvent } from "react";
import { createModel, updateModel } from "@/app/actions/models";
import { Model } from "@/types";

interface ModelModalProps {
  model?: Model | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function ModelModal({ model, onClose, onSuccess, onError }: ModelModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!model;

  const [form, setForm] = useState({
    model_name: model?.model_name || "",
    model_code: model?.model_code || "",
  });

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.model_name.trim() || !form.model_code.trim()) return;

    try {
      setSubmitting(true);
      
      let res;
      if (isEditing && model) {
        res = await updateModel(model.id, form);
      } else {
        res = await createModel(form);
      }

      if (res.success) {
        onSuccess();
      } else {
        throw new Error(res.error || `Failed to ${isEditing ? 'update' : 'create'} model`);
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
      <div className="modal-content" style={{ maxWidth: 450 }}>
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
            {isEditing ? "Edit Model" : "Create New Model"}
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
          {/* Model Name */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Model Name *</label>
            <input
              className="input-field"
              type="text"
              value={form.model_name}
              onChange={(e) => updateField("model_name", e.target.value)}
              required
            />
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>The display name for the model</p>
          </div>

          {/* Model Code */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Model Code *</label>
            <input
              className="input-field"
              type="text"
              value={form.model_code}
              onChange={(e) => updateField("model_code", e.target.value)}
              required
            />
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>The technical identifier used for API calls</p>
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
            <button type="submit" className="btn-primary" disabled={submitting || !form.model_name.trim() || !form.model_code.trim()}>
              {submitting ? (
                <>
                  <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : (
                 isEditing ? "Save Changes" : "Create Model"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
