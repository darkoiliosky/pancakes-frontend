export function parseAxiosError(err: any): string {
  try {
    const msg = err?.response?.data?.error || err?.message || "Request failed";
    if (typeof msg === "string" && msg.trim().length > 0) return msg;
  } catch {}
  return "Request failed";
}

