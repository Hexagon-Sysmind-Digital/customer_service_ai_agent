"use client";

import { useState, useEffect, useCallback } from "react";
import ModelModal from "@/components/models/ModelModal";
import { Model, User } from "@/types";
import { formatDate } from "@/lib/utils";
import { PlusIcon, EditIcon, TrashIcon, GridIcon } from "@/components/icons";
import { fetchModels, deleteModel } from "@/app/actions/models";
import { getMe } from "@/app/actions/auth";
import { showToast, showConfirm } from "@/lib/swal";

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get User Profile to check role
      const userRes = await getMe();
      if (userRes.success) {
        setCurrentUser(userRes.data);
      }

      const res = await fetchModels();
      if (res.success) {
        setModels(res.data);
      } else {
        setError(res.error || "Failed to fetch models");
      }
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
    setSelectedModel(null);
    setIsModalOpen(true);
  };

  const handleEdit = (model: Model) => {
    setSelectedModel(model);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirm("Are you sure?", "You want to delete this AI model?");
    if (!result.isConfirmed) return;

    try {
      const res = await deleteModel(id);
      if (res.success) {
        showToast("success", "Model deleted successfully");
        loadData();
      } else {
        showToast("error", res.error || "Failed to delete model");
      }
    } catch (err) {
      showToast("error", "Network error");
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    showToast("success", `Model successfully ${selectedModel ? "updated" : "created"}`);
    loadData();
  };

  if (currentUser && currentUser.role !== "admin" && currentUser.role !== "owner") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh" }}>
        <p style={{ color: "var(--text-tertiary)" }}>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
                AI Models
              </h1>
              {!loading && (
                <span className="badge badge-count" style={{ fontSize: 13 }}>
                  {models.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
              Manage available AI models for your agent deployments
            </p>
          </div>
          <button className="btn-primary" onClick={handleCreateNew}>
            <PlusIcon />
            Add Model
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div style={{ padding: "16px 20px", background: "var(--accent-red-bg)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 12, color: "var(--accent-red)", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14 }}>
            <span>⚠️ {error}</span>
            <button className="btn-secondary" style={{ padding: "6px 14px", fontSize: 13 }} onClick={loadData}>Retry</button>
          </div>
        )}

        {/* Table/List */}
        <div className="glass-card overflow-hidden">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", background: "rgba(99, 115, 171, 0.04)", borderBottom: "1px solid var(--card-border)" }}>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Model</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Code</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Added On</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <td colSpan={4} style={{ padding: 24 }}><div className="skeleton" style={{ height: 20, width: "100%" }} /></td>
                  </tr>
                ))
              ) : models.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-tertiary)" }}>
                    No models found. Create one to get started.
                  </td>
                </tr>
              ) : (
                models.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid var(--card-border)", transition: "background 0.2s" }} className="hover:bg-[rgba(99,115,171,0.02)]">
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(99, 102, 241, 0.1)", color: "var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <GridIcon size={18} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{m.model_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <code style={{ fontSize: 12, background: "rgba(99, 115, 171, 0.06)", padding: "4px 8px", borderRadius: 6, color: "var(--text-secondary)" }}>
                        {m.model_code}
                      </code>
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: 13, color: "var(--text-tertiary)" }}>
                      {m.created_at ? formatDate(m.created_at) : "—"}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 8 }}>
                        <button
                          onClick={() => handleEdit(m)}
                          className="p-2 rounded-lg hover:bg-[var(--accent-primary-bg)] hover:text-[var(--accent-primary)] text-[var(--text-tertiary)] transition-all"
                          title="Edit"
                        >
                          <EditIcon size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-2 rounded-lg hover:bg-[var(--accent-red-bg)] hover:text-[var(--accent-red)] text-[var(--text-tertiary)] transition-all"
                          title="Delete"
                        >
                          <TrashIcon size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <ModelModal
          model={selectedModel}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          onError={(msg) => showToast("error", msg)}
        />
      )}
    </div>
  );
}
