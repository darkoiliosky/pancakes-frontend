import { useEffect } from "react";
import { useToast } from "../context/ToastContext";

export default function SessionToast() {
  const toast = useToast();
  useEffect(() => {
    try {
      const flag = sessionStorage.getItem("sessionExpired");
      if (flag === "1") {
        toast.info("Session expired, please log in again");
        sessionStorage.removeItem("sessionExpired");
      }
    } catch {}
  }, [toast]);
  return null;
}

