"use client";

import { useState, useEffect } from "react";
import { Action, ReservationTemplate } from "@/types";
import { createAction, updateAction } from "@/app/actions/actionsApi";
import { fetchReservationTemplates } from "@/app/actions/reservationTemplatesApi";
import { CloseIcon } from "@/components/icons";
import SearchableSelect from "@/components/ui/SearchableSelect";

interface ActionModalProps {
  action?: Action | null;
  tenantId: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function ActionModal({ action, tenantId, onClose, onSuccess, onError }: ActionModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!action;

  const [formData, setFormData] = useState({
    name: action?.name || "",
    description: action?.description || "",
    keyword_pattern: action?.keyword_pattern || "",
    action_type: action?.action_type || "webhook",
    api_endpoint: action?.api_endpoint || "",
    api_method: action?.api_method || "GET",
    template_id: action?.template_id || "",
  });

  const [templates, setTemplates] = useState<ReservationTemplate[]>([]);

  useEffect(() => {
    const loadTemplates = async () => {
      if (!tenantId) return;
      const res = await fetchReservationTemplates(tenantId);
      if (res.success) {
        setTemplates(res.data);
      }
    };
    loadTemplates();
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!tenantId) {
      onError("Tenant ID is required.");
      setLoading(false);
      return;
    }

    const payload: Record<string, unknown> = {
      name: formData.name,
      description: formData.description,
      keyword_pattern: formData.keyword_pattern,
      action_type: formData.action_type,
    };

    if (formData.action_type === "webhook") {
      payload.api_endpoint = formData.api_endpoint;
      payload.api_method = formData.api_method;
    } else if (formData.action_type === "reservation") {
      payload.template_id = formData.template_id;
    }

    try {
      let result;
      if (isEditing && action) {
        result = await updateAction(tenantId, action.id, payload);
      } else {
        result = await createAction(tenantId, payload);
      }

      if (result.success) {
        onSuccess();
      } else {
        onError(result.error || `Failed to ${isEditing ? "update" : "create"} action`);
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
          maxWidth: 640,
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s ease-out",
          maxHeight: "90vh",
          overflow: "auto",
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
                background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(249,115,22,0.2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f59e0b",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              {isEditing ? "Edit Action" : "Add Action"}
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
          <div className="form-group">
            <label className="form-label" htmlFor="action-name">Name</label>
            <input
              id="action-name"
              type="text"
              className="form-input"
              placeholder=""
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="action-description">Description</label>
            <textarea
              id="action-description"
              className="form-input"
              placeholder=""
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="action-keywords">Keyword Pattern</label>
            <input
              id="action-keywords"
              type="text"
              className="form-input"
              placeholder=""
              value={formData.keyword_pattern}
              onChange={(e) => setFormData(prev => ({ ...prev, keyword_pattern: e.target.value }))}
              required
            />
            <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>
              Comma-separated keywords that trigger this action
            </span>
          </div>

          <div className="form-group">
            <SearchableSelect
              label="Action Type"
              options={[
                { id: "webhook", name: "Webhook" },
                { id: "reservation", name: "Reservation" },
              ]}
              value={formData.action_type}
              onSelect={(val) => setFormData(prev => ({ ...prev, action_type: val as any }))}
              placeholder="Select action type..."
            />
          </div>

          {/* Conditional: Webhook fields */}
          {formData.action_type === "webhook" && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="action-endpoint">API Endpoint</label>
                <input
                  id="action-endpoint"
                  type="url"
                  className="form-input"
                   placeholder=""
                  value={formData.api_endpoint}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_endpoint: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <SearchableSelect
                  label="API Method"
                  options={[
                    { id: "GET", name: "GET" },
                    { id: "POST", name: "POST" },
                    { id: "PUT", name: "PUT" },
                    { id: "DELETE", name: "DELETE" },
                  ]}
                  value={formData.api_method}
                  onSelect={(val) => setFormData(prev => ({ ...prev, api_method: val }))}
                  placeholder="Select API method..."
                />
              </div>
            </>
          )}

          {/* Conditional: Reservation field */}
          {formData.action_type === "reservation" && (
            <div className="form-group">
              <SearchableSelect
                label="Reservation Template *"
                options={templates}
                value={formData.template_id}
                onSelect={(id) => setFormData(prev => ({ ...prev, template_id: id }))}
                placeholder="Select a template..."
                searchPlaceholder="Search templates..."
              />
            </div>
          )}

          {/* Buttons */}
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
              {loading ? "Saving..." : isEditing ? "Update Action" : "Create Action"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
