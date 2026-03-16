"use server";

import { cookies } from "next/headers";

const API_BASE_URL = "https://triad.my.id/api/v1";

// Sessions API

export async function fetchSessions(
  tenantId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Unauthorized" };
    }

    const res = await fetch(`${API_BASE_URL}/sessions`, {
      method: "GET",
      headers: {
        "X-Tenant-ID": tenantId,
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: errText || `Failed with status ${res.status}` };
    }

    const json = await res.json();
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch sessions" };
  }
}

export async function fetchSession(
  tenantId: string,
  id: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("auth_token")?.value;
  
      if (!token) {
        return { success: false, error: "Unauthorized" };
      }
  
      const res = await fetch(`${API_BASE_URL}/sessions/${id}`, {
        method: "GET",
        headers: {
          "X-Tenant-ID": tenantId,
          "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
      });
  
      if (!res.ok) {
          const errText = await res.text();
          return { success: false, error: errText || `Failed with status ${res.status}` };
      }
  
      const json = await res.json();
      return { success: true, data: json.data || json };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to fetch session" };
    }
}
