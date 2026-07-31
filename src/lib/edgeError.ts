// Extracts the real error message from a failed supabase.functions.invoke call.
// supabase-js only exposes a generic "non-2xx status code" message, while the
// actual reason lives in the (unread) response body.
export async function getEdgeFunctionError(error: unknown, fallback: string): Promise<string> {
  const anyErr = error as { message?: string; context?: Response };
  const res = anyErr?.context;
  if (res && typeof res.text === 'function') {
    try {
      const raw = await res.clone().text();
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.error) return String(parsed.error);
          if (parsed?.message) return String(parsed.message);
        } catch {
          return raw.slice(0, 300);
        }
      }
    } catch {
      // ignore body read failures
    }
  }
  return anyErr?.message || fallback;
}
