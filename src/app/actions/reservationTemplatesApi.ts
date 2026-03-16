"use server";

import { cookies } from "next/headers";

const API_BASE = "https://triad.my.id/api/v1";

export async function fetchReservationTemplates(tenantId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/reservation-templates`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to fetch reservation templates" };
    return { success: true, data: data.data || [] };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function fetchReservationTemplate(tenantId: string, templateId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/reservation-templates/${templateId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to fetch reservation template" };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function createReservationTemplate(tenantId: string, payload: Record<string, unknown>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/reservation-templates`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to create reservation template" };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function updateReservationTemplate(tenantId: string, templateId: string, payload: Record<string, unknown>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/reservation-templates/${templateId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to update reservation template" };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function deleteReservationTemplate(tenantId: string, templateId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/reservation-templates/${templateId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to delete reservation template" };
    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}
