"use client";

import { useState } from "react";
import { Knowledge } from "@/types";
import { createKnowledge, updateKnowledge } from "@/app/actions/knowledge";
import { CloseIcon } from "@/components/icons";

interface KnowledgeModalProps {
  knowledge?: Knowledge | null;
  tenantId: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function KnowledgeModal({ knowledge, tenantId, onClose, onSuccess, onError }: KnowledgeModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!knowledge;

  const [formData, setFormData] = useState({
    content: knowledge?.content || "",
    source: knowledge?.source || "manual",
    metadata: knowledge?.metadata ? JSON.stringify(knowledge.metadata, null, 2) : "{\n  \"version\": \"1.0\",\n  \"department\": \"general\"\n}",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!tenantId) {
      onError("Tenant ID is required to create or update Knowledge.");
      setLoading(false);
      return;
    }

    let parsedMetadata = null;
    if (formData.metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(formData.metadata);
      } catch {
        onError("Invalid JSON format in metadata field.");
        setLoading(false);
        return;
      }
    }

    const payload = {
      content: formData.content,
      source: formData.source,
      metadata: parsedMetadata,
    };

    try {
      let result;
      if (isEditing && knowledge) {
        result = await updateKnowledge(tenantId, knowledge.id, payload);
      } else {
        result = await createKnowledge(tenantId, payload);
      }

      if (result.success) {
        onSuccess();
      } else {
        onError(result.error || `Failed to ${isEditing ? "update" : "create"} Knowledge`);
      }
    } catch {
      onError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
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
          maxWidth: 600,
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s ease-out",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#818cf8",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              {isEditing ? "Edit Knowledge" : "Add Knowledge"}
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

        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="content">Content</label>
            <textarea
              id="content"
              className="form-input"
              placeholder="e.g. Cancellation policy details..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              required
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Source</label>
            <div className="chip-grid">
              {[
                { value: "manual", label: "Manual", active: "active-blue" },
                { value: "database", label: "Database", active: "active-green" },
                { value: "file", label: "File", active: "active-purple" },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, source: s.value }))}
                  className={`chip-button ${formData.source === s.value ? s.active : ""}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="metadata">Metadata (Optional JSON)</label>
            <textarea
              id="metadata"
              className="form-input"
              placeholder="e.g. { &quot;version&quot;: &quot;1.0&quot; }"
              value={formData.metadata}
              onChange={(e) => setFormData(prev => ({ ...prev, metadata: e.target.value }))}
              rows={4}
              style={{ fontFamily: "monospace", fontSize: 13 }}
            />
          </div>

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
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ minWidth: 100, justifyContent: "center" }}
            >
              {loading ? "Saving..." : "Save Knowledge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
