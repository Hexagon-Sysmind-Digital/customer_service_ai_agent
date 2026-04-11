"use server";

import { cookies } from "next/headers";

const API_BASE_URL = "https://triad.my.id/api/v1";

export async function applyPresetPersonality(presetName: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const response = await fetch(`${API_BASE_URL}/personalities/apply-preset`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ preset_name: presetName }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error applying preset personality:", error);
    return { success: false, error: "Failed to apply personality preset" };
  }
}

export async function getActivePersonality() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const response = await fetch(`${API_BASE_URL}/personalities/active`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      cache: 'no-store'
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting active personality:", error);
    return { success: false, error: "Failed to fetch active personality" };
  }
}
