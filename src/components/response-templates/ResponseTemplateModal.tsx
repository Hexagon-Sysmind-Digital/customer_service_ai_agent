"use client";

import { useState } from "react";
import { createTranslationTemplate, updateTranslationTemplate } from "@/app/actions/translationsApi";
import { CloseIcon } from "@/components/icons";

interface ResponseTemplateModalProps {
  tenantId: string;
  template?: any | null; // null if creating new
  fixedLang: string; // The language currently selected in the parent (e.g., 'id' or 'en')
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function ResponseTemplateModal({ tenantId, template, fixedLang, onClose, onSuccess, onError }: ResponseTemplateModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!template;

  const [formData, setFormData] = useState({
    key: template?.key || "",
    lang: template?.lang || fixedLang,
    text: template?.text || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isEditing && template) {
        // Update only takes text according to the API
        result = await updateTranslationTemplate(template.id, { text: formData.text });
      } else {
        // Create takes key, lang, text and tenantId
        result = await createTranslationTemplate(tenantId, {
            key: formData.key,
            lang: formData.lang,
            text: formData.text
        });
      }

      if (result.success) {
        onSuccess();
      } else {
        onError(result.error || `Failed to ${isEditing ? "update" : "create"} template`);
      }
    } catch (err) {
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
        {/* Header */}
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
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M8 10h.01" />
                <path d="M12 10h.01" />
                <path d="M16 10h.01" />
               </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              {isEditing ? "Edit Template" : "Add New Template"}
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Template Key</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. greeting"
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                required
                disabled={isEditing}
                style={{ opacity: isEditing ? 0.7 : 1, cursor: isEditing ? "not-allowed" : "text" }}
              />
              {isEditing && (
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "4px 0 0 0" }}>
                  Template key cannot be changed after creation.
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Language</label>
              <input
                type="text"
                className="form-input"
                value={formData.lang}
                onChange={(e) => setFormData(prev => ({ ...prev, lang: e.target.value }))}
                required
                disabled={isEditing}
                style={{ opacity: isEditing ? 0.7 : 1, cursor: isEditing ? "not-allowed" : "text" }}
              />
               {isEditing && (
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "4px 0 0 0" }}>
                  Language cannot be changed after creation.
                </p>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Response Text</label>
            <textarea
              className="form-input"
              placeholder="e.g. Halo %s! Ada yang bisa kami bantu?"
              value={formData.text}
              onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
              required
              rows={5}
              style={{ resize: "vertical", minHeight: 100 }}
            />
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "6px 0 0 0", lineHeight: 1.5 }}>
              Enter the exact text the AI should formulate responses around. You can use placeholders like `%s` if the backend supports replacing them.
            </p>
          </div>

          {/* Footer */}
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
              {loading ? "Saving..." : "Save Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
