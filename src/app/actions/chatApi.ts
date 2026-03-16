"use server";

const API_BASE_URL = "https://triad.my.id/api/v1";

export async function sendChatMessage(
  tenantId: string,
  token: string,
  sessionId: string,
  message: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "X-Tenant-ID": tenantId,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: message
      }),
    });

    if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: errText || "Failed to send chat message" };
    }
    const json = await res.json();
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || "Error sending chat message" };
  }
}
