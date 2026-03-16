"use server";

import { cookies } from "next/headers";

const API_BASE = "https://triad.my.id/api/v1";

export async function fetchKnowledge(tenantId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/knowledge`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to fetch Knowledge base" };
    return { success: true, data: data.data || [] };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function createKnowledge(tenantId: string, payload: Record<string, unknown>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/knowledge`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to create Knowledge" };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function updateKnowledge(tenantId: string, knowledgeId: string, payload: Record<string, unknown>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/knowledge/${knowledgeId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to update Knowledge" };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function deleteKnowledge(tenantId: string, knowledgeId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/knowledge/${knowledgeId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to delete Knowledge" };
    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}
