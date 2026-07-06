import { useEffect, useState } from "react";
import type { Role } from "./mock-data";

const KEY = "edgepoint:role";

export function getStoredRole(): Role | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  if (v === "superadmin" || v === "admin" || v === "teacher" || v === "student") return v;
  return null;
}

export function setStoredRole(role: Role) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, role);
  window.dispatchEvent(new Event("edgepoint:role-change"));
}

export function clearStoredRole() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("edgepoint:role-change"));
}

export function useRole(): Role | null {
  const [role, setRole] = useState<Role | null>(() => getStoredRole());
  useEffect(() => {
    const update = () => setRole(getStoredRole());
    window.addEventListener("edgepoint:role-change", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("edgepoint:role-change", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return role;
}
