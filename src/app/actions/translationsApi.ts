"use server";

import { cookies } from "next/headers";

const API_BASE_URL = "https://triad.my.id/api/v1";

// 1. POST /translations/templates
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
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText || "Failed to create translation template" };
    }

    const json = await res.json();
    return { success: true, ...json };
  } catch (err: any) {
    return { success: false, error: err.message || "Error creating translation template" };
  }
}

// 2. GET /translations/templates?lang={lang}
export async function getTranslationTemplates(
  tenantId: string,
  lang: string = "id"
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Unauthorized" };
    }

    const res = await fetch(`${API_BASE_URL}/translations/templates?lang=${lang}`, {
      method: "GET",
      headers: {
        "X-Tenant-ID": tenantId,
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText || "Failed to fetch translation templates" };
    }

    const json = await res.json();
    return { success: true, ...json };
  } catch (err: any) {
    return { success: false, error: err.message || "Error fetching translation templates" };
  }
}

// 3. DELETE /translations/templates/{id}
export async function deleteTranslationTemplate(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Unauthorized" };
    }

    const res = await fetch(`${API_BASE_URL}/translations/templates/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText || "Failed to delete translation template" };
    }

    const json = await res.json();
    return { success: true, ...json };
  } catch (err: any) {
    return { success: false, error: err.message || "Error deleting translation template" };
  }
}

// 4. POST /translations/keywords
export async function createTranslationKeyword(
  tenantId: string,
  payload: { lang: string; keyword_type: string; words: string[] }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Unauthorized" };
    }

    const res = await fetch(`${API_BASE_URL}/translations/keywords`, {
      method: "POST",
      headers: {
        "X-Tenant-ID": tenantId,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText || "Failed to create translation keyword" };
    }

    const json = await res.json();
    return { success: true, ...json };
  } catch (err: any) {
    return { success: false, error: err.message || "Error creating translation keyword" };
  }
}

// 5. PATCH /translations/templates/{id}
export async function updateTranslationTemplate(
  id: string,
  payload: { text: string }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Unauthorized" };
    }

    const res = await fetch(`${API_BASE_URL}/translations/templates/${id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText || "Failed to update translation template" };
    }

    const json = await res.json();
    return { success: true, ...json };
  } catch (err: any) {
    return { success: false, error: err.message || "Error updating translation template" };
  }
}

// 6. PATCH /translations/keywords/{id}
export async function updateTranslationKeyword(
  id: string,
  payload: { words: string[] }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Unauthorized" };
    }

    const res = await fetch(`${API_BASE_URL}/translations/keywords/${id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText || "Failed to update translation keyword" };
    }

    const json = await res.json();
    return { success: true, ...json };
  } catch (err: any) {
    return { success: false, error: err.message || "Error updating translation keyword" };
  }
}
