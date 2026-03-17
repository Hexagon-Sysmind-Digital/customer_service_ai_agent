"use client";

import { useState, useEffect } from "react";
import { createUser, updateUser } from "@/app/actions/users";
import { fetchTenants } from "@/app/actions/tenants";

import { User, Tenant } from "@/types";
import { CloseIcon } from "@/components/icons";
import SearchableSelect from "@/components/ui/SearchableSelect";

interface UserModalProps {
  user?: User | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function UserModal({ user, onClose, onSuccess, onError }: UserModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!user;

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "", // Password always empty initially
    role: user?.role || "user",
    tenant_id: user?.tenant_id || "",
  });

  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    const loadTenants = async () => {
      const res = await fetchTenants();
      if (res.success) {
        setTenants(res.data);
      }
    };
    loadTenants();
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // For editing, X-Tenant-ID is required
    if (isEditing && !formData.tenant_id) {
      onError("Tenant ID is required to update a user.");
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("role", formData.role);
    if (formData.password) {
      data.append("password", formData.password);
    }
    if (formData.tenant_id) {
      data.append("tenant_id", formData.tenant_id);
    }

    try {
      let result;
      if (isEditing && user) {
        result = await updateUser(user.id, data);
      } else {
        result = await createUser(data);
      }

      if (result.success) {
        onSuccess();
      } else {
        onError(result.error || `Failed to ${isEditing ? "update" : "create"} user`);
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
                background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#818cf8",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              {isEditing ? "Edit User" : "Add New User"}
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
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder=""
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder=""
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <div className="chip-grid">
                {[
                  { value: "user", label: "User", active: "active-blue" },
                  { value: "admin", label: "Admin", active: "active-orange" },
                  { value: "owner", label: "Owner", active: "active-purple" },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: r.value }))}
                    className={`chip-button ${formData.role === r.value ? r.active : ""}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                {isEditing ? "New Password" : "Password"}
                {isEditing && <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: 6 }}>(Leave blank to keep current)</span>}
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder=""
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required={!isEditing}
              />
            </div>
          </div>

          <div className="form-group">
            <SearchableSelect
              label={
                <>
                  Tenant
                  {isEditing && <span style={{ color: "var(--accent-red)", marginLeft: 4 }}>*</span>}
                </> as any
              }
              options={tenants}
              value={formData.tenant_id}
              onSelect={(id) => setFormData(prev => ({ ...prev, tenant_id: id }))}
              placeholder="Select tenant..."
              searchPlaceholder="Search tenants..."
            />
            {isEditing && (
              <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "4px 0 0 0" }}>
                Required for updating the user.
              </p>
            )}
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
              {loading ? "Saving..." : "Save User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
