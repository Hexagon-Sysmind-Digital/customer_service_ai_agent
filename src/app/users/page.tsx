"use client";

import { useState, useEffect, useCallback } from "react";
import UserModal from "@/components/users/UserModal";
import { fetchUsers, deleteUser } from "@/app/actions/users";

import { User } from "@/types";
import { PlusIcon, EditIcon, TrashIcon } from "@/components/icons";
import { showToast, showConfirm } from "@/lib/swal";


import { getMe } from "@/app/actions/auth";
import { notFound } from "next/navigation";

function SkeletonRow() {
  return (
    <div style={{ display: "flex", padding: "16px 20px", borderBottom: "1px solid var(--border-color)", gap: 16 }}>
      <div className="skeleton" style={{ width: "30%", height: 20 }} />
      <div className="skeleton" style={{ width: "40%", height: 20 }} />
      <div className="skeleton" style={{ width: "15%", height: 24, borderRadius: 12 }} />
      <div className="skeleton" style={{ width: "15%", height: 20 }} />
    </div>
  );
}

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchUsers();
      if (res.success) {
        setUsers(res.data);
      } else {
        throw new Error(res.error || "Failed to fetch users");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAccess = async () => {
      const res = await getMe();
      if (res.success) {
        const user = res.data;
        setCurrentUser(user);
        if (user.role === "user") {
          setAccessDenied(true);
        } else {
          loadUsers();
        }
      } else {
        setError("Failed to verify access.");
        setLoading(false);
      }
    };
    checkAccess();
  }, [loadUsers]);

  if (accessDenied) {
    return notFound();
  }



  const handleCreateNew = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirm("Are you sure?", "You want to delete this user?");
    if (!result.isConfirmed) return;

    try {
      const res = await deleteUser(id);
      if (res.success) {
        showToast("success", "User deleted successfully");
        loadUsers();
      } else {
        showToast("error", res.error || "Failed to delete user");
      }
    } catch (err) {
      showToast("error", "Network error");
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    showToast("success", `User successfully ${selectedUser ? "updated" : "created"}`);
    loadUsers();
  };

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
                Users
              </h1>
              {!loading && (
                <span className="badge badge-count" style={{ fontSize: 13 }}>
                  {users.length}
                </span>
              )}
            </div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
              Manage users and their permissions
            </p>
          </div>
          <button className="btn-primary" onClick={handleCreateNew}>
            <PlusIcon />
            Add User
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div style={{
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
          }}>
            <span>⚠️ {error}</span>
            <button className="btn-secondary" style={{ padding: "6px 14px", fontSize: 13 }} onClick={loadUsers}>
              Retry
            </button>
          </div>
        )}

        {/* Users Table / List */}
        <div className="glass-card" style={{ overflow: "hidden" }}>
          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 2fr 1fr 1fr",
            padding: "16px 20px",
            background: "rgba(99, 115, 171, 0.04)",
            borderBottom: "1px solid var(--border-color)",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-tertiary)"
          }}>
            <div>Name</div>
            <div>Email</div>
            <div>Role</div>
            <div style={{ textAlign: "right" }}>Actions</div>
          </div>

          {/* Loading State */}
          {loading && (
            <div>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          )}

          {/* Data Rows */}
          {!loading && !error && users.length > 0 && (
            <div>
              {users.map((user) => (
                <div key={user.id} style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 2fr 1fr 1fr",
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border-color)",
                  alignItems: "center",
                  fontSize: 14,
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99, 115, 171, 0.02)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div style={{ fontWeight: 500 }}>{user.name}</div>
                  <div style={{ color: "var(--text-secondary)" }}>{user.email}</div>
                  <div>
                    <span className="badge" style={{ 
                      background: user.role === 'admin' || user.role === 'owner' ? "rgba(99,102,241,0.1)" : "var(--accent-primary-bg)", 
                      color: user.role === 'admin' || user.role === 'owner' ? "#818cf8" : "var(--foreground)"
                    }}>
                      {user.role}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button
                      onClick={() => handleEdit(user)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-tertiary)",
                        padding: 6,
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "flex"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-primary)"; e.currentTarget.style.background = "var(--accent-primary-bg)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.background = "transparent"; }}
                      title="Edit User"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-tertiary)",
                        padding: 6,
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "flex"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-red)"; e.currentTarget.style.background = "var(--accent-red-bg)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.background = "transparent"; }}
                      title="Delete User"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && users.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: "rgba(99,115,171,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", color: "var(--text-tertiary)"
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px 0" }}>No users found</h3>
              <p style={{ color: "var(--text-secondary)", margin: "0 0 20px 0", fontSize: 14 }}>
                Get started by creating your first user.
              </p>
              <button className="btn-secondary" onClick={handleCreateNew}>
                Add User
              </button>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <UserModal
          user={selectedUser}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          onError={(msg) => showToast("error", msg)}
        />
      )}


    </div>
  );
}
