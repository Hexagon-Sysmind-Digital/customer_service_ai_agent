"use client";

import { useState } from "react";
import { createAppError, updateAppError } from "@/app/actions/errors";
import { AppError } from "@/types";
import { CloseIcon } from "@/components/icons";

interface ErrorModalProps {
  error?: AppError | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function ErrorModal({ error, onClose, onSuccess, onError }: ErrorModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!error;

  const [formData, setFormData] = useState({
    error_code: error?.error_code || "",
    message: error?.message || "",
    http_status: error?.http_status || 400,
    description: error?.description || "",
    is_active: error?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isEditing && error) {
        result = await updateAppError(error.id, formData);
      } else {
        result = await createAppError(formData);
      }

      if (result.success) {
        onSuccess();
      } else {
        onError(result.error || `Failed to ${isEditing ? "update" : "create"} error`);
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
          maxWidth: 500,
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
                background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(248,113,113,0.2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-red)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              {isEditing ? "Edit Error Code" : "Add New Error Code"}
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
              <label className="form-label" htmlFor="error_code">Error Code</label>
              <input
                id="error_code"
                type="text"
                className="form-input"
                placeholder="e.g. USER_NOT_FOUND"
                value={formData.error_code}
                onChange={(e) => setFormData(prev => ({ ...prev, error_code: e.target.value.toUpperCase() }))}
                required
                disabled={isEditing} // Error code usually shouldn't change
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="http_status">HTTP Status</label>
              <input
                id="http_status"
                type="number"
                className="form-input"
                placeholder="400"
                value={formData.http_status}
                onChange={(e) => setFormData(prev => ({ ...prev, http_status: parseInt(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="message">User-facing Message</label>
            <input
              id="message"
              type="text"
              className="form-input"
              placeholder="The message displayed to the user"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Internal Description</label>
            <textarea
              id="description"
              className="form-input"
              placeholder="Developer-only technical description"
              style={{ minHeight: 80, resize: "vertical" }}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="form-group">
             <label className="form-label">Status</label>
             <div className="chip-grid">
               {[
                 { value: true, label: "Active", active: "active-green" },
                 { value: false, label: "Inactive", active: "active-red" },
               ].map((s) => (
                 <button
                   key={s.label}
                   type="button"
                   onClick={() => setFormData(prev => ({ ...prev, is_active: s.value }))}
                   className={`chip-button ${formData.is_active === s.value ? s.active : ""}`}
                 >
                   {s.label}
                 </button>
               ))}
             </div>
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
              {loading ? "Saving..." : "Save Error"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
