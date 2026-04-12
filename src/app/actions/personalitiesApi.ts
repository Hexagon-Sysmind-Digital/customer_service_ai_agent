"use server";

import { cookies } from "next/headers";

const API_BASE_URL = "https://triad.my.id/api/v1";

export async function createPersonality(payload: { name: string, tone: string, language: string, instructions: string }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const response = await fetch(`${API_BASE_URL}/personalities`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating personality:", error);
    return { success: false, error: "Failed to create personality" };
  }
}

export async function getPersonalities() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const response = await fetch(`${API_BASE_URL}/personalities`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      cache: 'no-store'
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting personalities:", error);
    return { success: false, error: "Failed to fetch personalities" };
  }
}

export async function getPersonalityById(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const response = await fetch(`${API_BASE_URL}/personalities/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      cache: 'no-store'
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting personality by ID:", error);
    return { success: false, error: "Failed to fetch personality" };
  }
}

export async function activatePersonality(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const response = await fetch(`${API_BASE_URL}/personalities/${id}/activate`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error activating personality:", error);
    return { success: false, error: "Failed to activate personality" };
  }
}

export async function updatePersonality(id: string, payload: { name?: string, tone?: string, language?: string, instructions?: string }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const response = await fetch(`${API_BASE_URL}/personalities/${id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating personality:", error);
    return { success: false, error: "Failed to update personality" };
  }
}

export async function deletePersonality(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const response = await fetch(`${API_BASE_URL}/personalities/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting personality:", error);
    return { success: false, error: "Failed to delete personality" };
  }
}
