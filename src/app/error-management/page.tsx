"use client";

import { useState, useEffect, useCallback } from "react";
import ErrorModal from "@/components/errors/ErrorModal";
import { AppError } from "@/types";
import { PlusIcon, EditIcon, TrashIcon } from "@/components/icons";
import { fetchAppErrors, deleteAppError } from "@/app/actions/errors";
import { getMe } from "@/app/actions/auth";
import { User } from "@/types";
import { showToast, showConfirm } from "@/lib/swal";
import { formatDate } from "@/lib/utils";
import NotFound from "@/app/not-found";

function ErrorRow({ error, onEdit, onDelete }: { error: AppError, onEdit: (e: AppError) => void, onDelete: (id: string) => void }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.2s" }} className="table-row-hover">
      <td style={{ padding: "16px 12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 600, color: "var(--foreground)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
            {error.error_code}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            ID: {error.id.substring(0, 8)}...
          </span>
        </div>
      </td>
      <td style={{ padding: "16px 12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{error.message}</span>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontStyle: "italic" }}>{error.description || "No description"}</span>
        </div>
      </td>
      <td style={{ padding: "16px 12px" }}>
        <span className={`badge ${error.http_status >= 500 ? "badge-inactive" : "badge-active"}`} style={{ minWidth: 40, justifyContent: "center" }}>
          {error.http_status}
        </span>
      </td>
      <td style={{ padding: "16px 12px" }}>
        <span className={`badge ${error.is_active ? "badge-active" : "badge-inactive"}`}>
          {error.is_active ? "Active" : "Inactive"}
        </span>
      </td>
      <td style={{ padding: "16px 12px", textAlign: "right" }}>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={() => onEdit(error)}
            className="btn-icon"
            title="Edit Error"
          >
            <EditIcon />
          </button>
          <button
            onClick={() => onDelete(error.id)}
            className="btn-icon btn-icon-danger"
            title="Delete Error"
          >
            <TrashIcon />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ErrorManagementPage() {
  const [errors, setErrors] = useState<AppError[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedError, setSelectedError] = useState<AppError | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorState(null);
      
      const userRes = await getMe();
      if (userRes.success) {
        setCurrentUser(userRes.data);
        if (userRes.data.role === "user") {
          setIsAuthorized(false);
          setLoading(false);
          return;
        } else {
          setIsAuthorized(true);
        }
      } else {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      const res = await fetchAppErrors();
      if (res.success) {
        setErrors(res.data);
      } else {
        setErrorState(res.error || "Failed to fetch errors");
      }
    } catch (err) {
      setErrorState("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateNew = () => {
    setSelectedError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (error: AppError) => {
    setSelectedError(error);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirm("Are you sure?", "You want to delete this error code? This might affect API responses.");
    if (!result.isConfirmed) return;

    try {
      const res = await deleteAppError(id);
      if (res.success) {
        showToast("success", "Error code deleted successfully");
        loadData();
      } else {
        showToast("error", res.error || "Failed to delete error code");
      }
    } catch (err) {
      showToast("error", "Network error");
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    showToast("success", `Error code successfully ${selectedError ? "updated" : "created"}`);
    loadData();
  };

  if (isAuthorized === false) {
    return <NotFound />;
  }

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
                Error Management
              </h1>
              {!loading && (
                <span className="badge badge-count" style={{ fontSize: 13 }}>
                  {errors.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
              Manage application error codes, messages, and HTTP statuses
            </p>
          </div>
          <button className="btn-primary" onClick={handleCreateNew}>
            <PlusIcon />
            Add Error Code
          </button>
        </div>

        {/* Error State */}
        {errorState && (
          <div className="alert alert-error mb-6">
            <span>⚠️ {errorState}</span>
            <button className="btn-secondary btn-sm" onClick={loadData}>Retry</button>
          </div>
        )}

        {/* Table/List */}
        <div className="glass-card overflow-hidden">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(99, 115, 171, 0.04)", borderBottom: "1px solid var(--border-color)" }}>
                  <th style={{ padding: "12px 12px", fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Error Code</th>
                  <th style={{ padding: "12px 12px", fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Display Message / Description</th>
                  <th style={{ padding: "12px 12px", fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "12px 12px", fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Active</th>
                  <th style={{ padding: "12px 12px", fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td colSpan={5} style={{ padding: "20px 12px" }}>
                        <div className="skeleton" style={{ height: 20, width: "100%" }} />
                      </td>
                    </tr>
                  ))
                ) : errors.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "80px 20px", textAlign: "center" }}>
                      <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
                      <h3 style={{ margin: "0 0 8px 0" }}>No error codes found</h3>
                      <p style={{ color: "var(--text-secondary)", margin: 0 }}>Start by adding a new application error code.</p>
                    </td>
                  </tr>
                ) : (
                  errors.map((error) => (
                    <ErrorRow key={error.id} error={error} onEdit={handleEdit} onDelete={handleDelete} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ErrorModal
          error={selectedError}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          onError={(msg) => showToast("error", msg)}
        />
      )}
    </div>
  );
}
