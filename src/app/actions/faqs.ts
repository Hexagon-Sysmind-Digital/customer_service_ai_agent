"use server";

import { cookies } from "next/headers";

const API_BASE = "https://triad.my.id/api/v1";

export async function fetchFaqs(tenantId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/faqs`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to fetch FAQs" };
    return { success: true, data: data.data || [] };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function createFaq(tenantId: string, payload: Record<string, unknown>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/faqs`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to create FAQ" };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function updateFaq(tenantId: string, faqId: string, payload: Record<string, unknown>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/faqs/${faqId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to update FAQ" };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function deleteFaq(tenantId: string, faqId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE}/faqs/${faqId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
      },
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "Failed to delete FAQ" };
    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}
