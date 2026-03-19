"use server";

import { cookies } from "next/headers";
import { Reservation } from "@/types";

const API_BASE_URL = "https://triad.my.id//api/v1";

export async function fetchReservations(tenantId: string): Promise<{ success: boolean; data?: Reservation[]; error?: string; status?: number }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/reservations`, {
      method: "GET",
      headers: {
        "X-Tenant-ID": tenantId,
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: errText || `Error ${res.status}`, status: res.status };
    }

    const json = await res.json();
    const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
    return { success: true, data: list };

  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch reservations" };
  }
}

export async function fetchReservation(tenantId: string, id: string): Promise<{ success: boolean; data?: Reservation; error?: string }> {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return { success: false, error: "Unauthorized" };

    try {
      const res = await fetch(`${API_BASE_URL}/reservations/${id}`, {
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
      return { success: false, error: err.message || "Failed to fetch reservation" };
    }
  }

export async function createReservation(
  tenantId: string,
  data: Partial<Reservation>
): Promise<{ success: boolean; data?: Reservation; error?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/reservations`, {
      method: "POST",
      headers: {
        "X-Tenant-ID": tenantId,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: errText || "Failed to create reservation" };
    }
    const json = await res.json();
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || "Error creating reservation" };
  }
}

export async function updateReservationStatus(
  tenantId: string,
  id: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/reservations/${id}/status`, {
      method: "PATCH",
      headers: {
        "X-Tenant-ID": tenantId,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: errText || "Failed to update reservation status" };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Error updating reservation status" };
  }
}

export async function cancelReservation(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return { success: false, error: "Unauthorized" };

    try {
      const res = await fetch(`${API_BASE_URL}/reservations/${id}/cancel`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
  
      if (!res.ok) {
          const errText = await res.text();
          return { success: false, error: errText || "Failed to cancel reservation" };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Error canceling reservation" };
    }
}

export async function deleteReservation(
  tenantId: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/reservations/${id}`, {
      method: "DELETE",
      headers: {
        "X-Tenant-ID": tenantId,
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: errText || "Failed to delete reservation" };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Error deleting reservation" };
  }
}
