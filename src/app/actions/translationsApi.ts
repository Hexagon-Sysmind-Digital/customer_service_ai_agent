"use server";

import { cookies } from "next/headers";

const API_BASE_URL = "https://triad.my.id/api/v1";

// Translations Templates API

export async function createTranslationTemplate(
  tenantId: string,
  payload: { key: string; lang: string; text: string }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Unauthorized" };
    }

    const res = await fetch(`${API_BASE_URL}/translations/templates`, {
      method: "POST",
      headers: {
        "X-Tenant-ID": tenantId,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText || "Failed to create translation template" };
    }

    const json = await res.json();
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || "Error creating translation template" };
  }
}
