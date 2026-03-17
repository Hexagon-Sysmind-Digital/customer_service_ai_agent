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

    const text = await res.text();
    
    // Try parsing as single JSON object first
    try {
        const json = JSON.parse(text);
        return { success: true, data: json.data || json };
    } catch (e) {
        // Handle specialized stream-style format (e.g., "1:{\"success\":true,...}")
        const lines = text.split("\n");
        // Iterate backwards to find the most relevant response chunk
        for (const line of [...lines].reverse()) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // Remove numeric prefix like "1:", "2:", etc. if present
            const jsonStr = trimmedLine.replace(/^\d+:/, "");
            
            try {
                const parsed = JSON.parse(jsonStr);
                // If it contains the successful data payload, treat this as the result
                if (parsed.success && parsed.data) {
                    return { success: true, data: parsed.data };
                }
                // Fallback for objects that might just be the data itself
                if (parsed.content || parsed.message) {
                    return { success: true, data: parsed };
                }
            } catch (innerError) {
                // Not a JSON line, skip
                continue;
            }
        }
        
        // If no JSON found, return the last non-empty line as content fallback
        return { success: true, data: { content: text } };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Error sending chat message" };
  }
}
