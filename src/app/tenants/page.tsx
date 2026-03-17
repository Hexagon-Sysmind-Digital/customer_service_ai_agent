"use client";

import { useState, useEffect, useCallback } from "react";
import TenantModal from "@/components/tenants/TenantModal";
import { Tenant } from "@/types";
import { maskApiKey, formatDate } from "@/lib/utils";
import { CopyIcon, CheckIcon, PlusIcon, BotIcon, EditIcon, TrashIcon } from "@/components/icons";
import { fetchTenants, fetchTenantById, deleteTenant } from "@/app/actions/tenants";
import { getMe } from "@/app/actions/auth";
import { User } from "@/types";
import { showToast, showConfirm } from "@/lib/swal";




function TenantCard({ tenant, onEdit, onDelete, currentUser }: { tenant: Tenant, onEdit: (t: Tenant) => void, onDelete: (id: string) => void, currentUser: User | null }) {
  const [copied, setCopied] = useState(false);
  const canManage = currentUser?.role === "admin" || currentUser?.role === "owner";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tenant.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="glass-card p-6 flex flex-col gap-4" style={{ position: "relative" }}>
      {/* Edit/Delete Actions */}
      {canManage && (
        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 6 }}>
          <button
              onClick={() => onEdit(tenant)}
              style={{
                background: "rgba(99, 115, 171, 0.08)",
                border: "none",
                color: "var(--text-tertiary)",
                padding: 6,
                borderRadius: 6,
                cursor: "pointer",
                display: "flex",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-primary)"; e.currentTarget.style.background = "var(--accent-primary-bg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.background = "rgba(99, 115, 171, 0.08)"; }}
              title="Edit Tenant"
            >
              <EditIcon />
            </button>
            <button
              onClick={() => onDelete(tenant.id)}
              style={{
                background: "rgba(99, 115, 171, 0.08)",
                border: "none",
                color: "var(--text-tertiary)",
                padding: 6,
                borderRadius: 6,
                cursor: "pointer",
                display: "flex",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-red)"; e.currentTarget.style.background = "var(--accent-red-bg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.background = "rgba(99, 115, 171, 0.08)"; }}
              title="Delete Tenant"
            >
              <TrashIcon />
            </button>
        </div>
      )}


      {/* Header */}
      <div className="flex items-start justify-between" style={{ paddingRight: 60 }}>
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#818cf8",
            }}
          >
            <BotIcon />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
              {tenant.name}
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "2px 0 0 0" }}>
              {formatDate(tenant.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div>
         <span className={`badge ${tenant.is_active ? "badge-active" : "badge-inactive"}`}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
          {tenant.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* API Key */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "rgba(99, 115, 171, 0.06)",
          borderRadius: 10,
          fontSize: 13,
          fontFamily: "var(--font-mono), monospace",
          color: "var(--text-secondary)",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {maskApiKey(tenant.api_key)}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: copied ? "#22c55e" : "var(--text-tertiary)",
            padding: 4,
            display: "flex",
            transition: "color 0.2s",
          }}
          title="Copy API Key"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>

      {/* Config details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
        <div>
          <p style={{ color: "var(--text-tertiary)", margin: "0 0 2px 0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>
            Model
          </p>
          <p style={{ color: "var(--foreground)", margin: 0, fontWeight: 500 }}>
            {tenant.config?.model_name || "—"}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--text-tertiary)", margin: "0 0 2px 0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>
            Max Requests
          </p>
          <p style={{ color: "var(--foreground)", margin: 0, fontWeight: 500 }}>
            {(tenant.max_requests_per_day ?? 0).toLocaleString()}/day
          </p>
        </div>
        <div>
          <p style={{ color: "var(--text-tertiary)", margin: "0 0 2px 0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>
            Temperature
          </p>
          <p style={{ color: "var(--foreground)", margin: 0, fontWeight: 500 }}>
            {tenant.config?.temperature}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--text-tertiary)", margin: "0 0 2px 0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>
            Language
          </p>
          <p style={{ color: "var(--foreground)", margin: 0, fontWeight: 500 }}>
            {tenant.config?.language || "—"}
          </p>
        </div>
      </div>

      {/* Knowledge & FAQ badges */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {tenant.config?.knowledge_enabled && (
          <span className="badge" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>
            📚 Knowledge
          </span>
        )}
        {(tenant.config?.faq_threshold || 0) > 0 && (
          <span className="badge" style={{ background: "var(--accent-yellow-bg)", color: "var(--accent-yellow)" }}>
            FAQ: {tenant.config?.faq_threshold}
          </span>
        )}
      </div>

      {/* Welcome message preview */}
      {tenant.config?.welcome_message && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(99, 115, 171, 0.04)",
            borderRadius: 10,
            borderLeft: "3px solid var(--accent-primary)",
            fontSize: 13,
            color: "var(--text-secondary)",
            fontStyle: "italic",
            lineHeight: 1.5,
          }}
        >
          &ldquo;{tenant.config.welcome_message}&rdquo;
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 12 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: "60%", height: 16, marginBottom: 6 }} />
          <div className="skeleton" style={{ width: "30%", height: 12 }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: "100%", height: 36 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="skeleton" style={{ height: 36 }} />
        <div className="skeleton" style={{ height: 36 }} />
        <div className="skeleton" style={{ height: 36 }} />
        <div className="skeleton" style={{ height: 36 }} />
      </div>
      <div className="skeleton" style={{ width: "100%", height: 44 }} />
    </div>
  );
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userRes = await getMe();
      if (!userRes.success) {
        setError(`Failed to fetch user profile: ${userRes.error}`);
        return;
      }


      const user = userRes.data;
      setCurrentUser(user);

      let finalTenants = [];

      if (user.role === "user" && user.tenant_id) {
        // PER REQUEST: Fetch specific tenant for non-admin user
        const tenantRes = await fetchTenantById(user.tenant_id);
        if (tenantRes.success) {
          finalTenants = [tenantRes.data];
        } else {
          setError(tenantRes.error || "Failed to fetch your tenant.");
        }
      } else {
        // Admin/Owner: Fetch all authorized tenants
        const res = await fetchTenants(user.id);
        if (res.success && res.data.length > 0) {
          finalTenants = res.data;
        } else if (user.tenant_id) {
          // Fallback if the list call returns nothing but they have a specific ID
          const tenantRes = await fetchTenantById(user.tenant_id);
          if (tenantRes.success) {
            finalTenants = [tenantRes.data];
          } else if (!res.success) {
            setError(tenantRes.error || "Failed to fetch tenant info.");
          }
        } else if (!res.success) {
          setError(res.error || "Failed to fetch tenants.");
        }
      }

      setTenants(finalTenants);
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadData();
  }, [loadData]);




  const handleCreateNew = () => {
    setSelectedTenant(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirm("Are you sure?", "You want to delete this tenant?");
    if (!result.isConfirmed) return;

    try {
      const res = await deleteTenant(id);
      if (res.success) {
        showToast("success", "Tenant deleted successfully");
        loadData();
      } else {
        showToast("error", res.error || "Failed to delete tenant");
      }
    } catch (err) {
      showToast("error", "Network error");
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    showToast("success", `Tenant successfully ${selectedTenant ? "updated" : "created"}`);
    loadData();
  };


  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
                Tenants
              </h1>
              {!loading && (
                <span className="badge badge-count" style={{ fontSize: 13 }}>
                  {tenants.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
              Manage your AI agent configurations and deployments
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {(currentUser?.role === "admin" || currentUser?.role === "owner") && (
              <button className="btn-primary" onClick={handleCreateNew}>
                <PlusIcon />
                Add Tenant
              </button>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div
            style={{
              padding: "16px 20px",
              background: "var(--accent-red-bg)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: 12,
              color: "var(--accent-red)",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 14,
            }}
          >
            <span>⚠️ {error}</span>
            <button className="btn-secondary" style={{ padding: "6px 14px", fontSize: 13 }} onClick={loadData}>
              Retry
            </button>
          </div>
        )}


        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: 20,
          }}
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : tenants.map((tenant) => (
               <TenantCard 
                 key={tenant.id} 
                 tenant={tenant} 
                 onEdit={handleEdit} 
                 onDelete={handleDelete} 
                 currentUser={currentUser}
               />
            ))
          }

        </div>

        {/* Empty state */}
        {!loading && !error && tenants.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 36,
              }}
            >
              🤖
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px 0" }}>No tenants yet</h3>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 24px 0", fontSize: 15 }}>
              Create your first AI agent tenant to get started
            </p>
            <button className="btn-primary" onClick={handleCreateNew}>
              <PlusIcon />
              Create Tenant
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <TenantModal
          tenant={selectedTenant}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          onError={(msg) => showToast("error", msg)}
        />
      )}


    </div>
  );
}
