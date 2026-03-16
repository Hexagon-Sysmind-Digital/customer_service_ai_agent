"use server";

import { cookies } from "next/headers";

const API_BASE = "https://triad.my.id/api/v1";

export async function fetchActions(tenantId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/actions`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to fetch actions" };
    return { success: true, data: data.data || [] };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function fetchAction(tenantId: string, actionId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/actions/${actionId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to fetch action" };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function createAction(tenantId: string, payload: Record<string, unknown>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/actions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to create action" };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function updateAction(tenantId: string, actionId: string, payload: Record<string, unknown>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/actions/${actionId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to update action" };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function deleteAction(tenantId: string, actionId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/actions/${actionId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to delete action" };
    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}
