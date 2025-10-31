import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import apiClient from "../api/client";

export default function EmailChangeConfirm() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"idle"|"ok"|"error">("idle");
  const [message, setMessage] = useState<string>("");
  useEffect(() => {
    const token = params.get("token");
    if (!token) { setStatus("error"); setMessage("Missing token"); return; }
    (async () => {
      try {
        const res = await apiClient.get("/api/users/email-change/confirm", { params: { token } });
        setStatus("ok");
        setMessage(res.data?.message || "Email updated");
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.response?.data?.error || e?.message || "Failed to confirm");
      }
    })();
  }, [params]);
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className={`rounded-xl border px-6 py-5 ${status === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : status === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white'}`}>
        <div className="text-lg font-semibold mb-2">{status === 'ok' ? 'Email change confirmed' : (status === 'error' ? 'Email change failed' : 'Confirming...')}</div>
        <div className="mb-3">{message}</div>
        <div className="text-sm"><Link className="underline" to="/login">Go to login</Link></div>
      </div>
    </div>
  );
}

