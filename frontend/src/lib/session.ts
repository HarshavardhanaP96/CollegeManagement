import { useAuthStore } from '../store/authStore';
import type { Role } from './mock-data';

export function useRole(): Role {
  const user = useAuthStore((state) => state.user);
  if (!user) return "student"; // default fallback

  const roleName = (user.roleName || "").toUpperCase();
  if (roleName.includes("SUPERADMIN")) return "superadmin";
  if (roleName.includes("COLLEGEADMIN") || roleName.includes("ADMIN") || roleName.includes("HOD")) return "admin";
  if (roleName.includes("TEACHER") || roleName.includes("FACULTY")) return "teacher";
  return "student";
}

export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}
