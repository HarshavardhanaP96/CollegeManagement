import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  BarChart3,
  Building2,
  Layers,
  GraduationCap,
  BookOpen,
  Users,
  UserRound,
  School,
  ClipboardCheck,
  FileText,
  UserCircle,
  CirclePlus,
  ClipboardList,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  analytics: BarChart3,
  colleges: Building2,
  departments: Layers,
  courses: GraduationCap,
  subjects: BookOpen,
  students: Users,
  teachers: UserRound,
  classes: School,
  attendance: ClipboardCheck,
  marks: FileText,
  profile: UserCircle,
  plus: CirclePlus,
  'clipboard-list': ClipboardList,
};

export function NavIcon({ name, className, size = 20 }: { name?: string; className?: string; size?: number }) {
  const Icon = (name && ICONS[name]) || LayoutDashboard;
  return <Icon className={className} size={size} strokeWidth={2} />;
}
