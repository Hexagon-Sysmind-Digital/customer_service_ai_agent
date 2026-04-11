"use server";

import { cookies } from "next/headers";

const BASE_URL = "https://triad.my.id/api/v1";

export async function fetchOrders(tenantId?: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Authentication token not found. Please relogin." };
    }

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    if (tenantId) {
      headers["X-Tenant-ID"] = tenantId;
    }

    const res = await fetch(`${BASE_URL}/products/orders`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text();
        return { success: false, error: `API Error (${res.status}): ${text || res.statusText}` };
    }

    const data = await res.json();
    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("DEBUG [fetchOrders] Error:", error);
    return { success: false, error: message };
  }
}

export async function fetchOrderById(orderId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return { success: false, error: "Unauthorized" };

    const res = await fetch(`${BASE_URL}/products/orders/${orderId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return { success: false, error: `API Error ${res.status}` };

    const data = await res.json();
    return data;
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return { success: false, error: "Unauthorized" };

    const res = await fetch(`${BASE_URL}/products/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) return { success: false, error: `Failed to update status (${res.status})` };

    const data = await res.json();
    return data;
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
