export function maskApiKey(key: string) {
  if (!key) return "—";
  if (key.length <= 10) return key;
  return key.slice(0, 6) + "••••••••" + key.slice(-4);
}

export function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}
