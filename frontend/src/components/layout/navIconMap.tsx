import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  BrainCircuit,
  Landmark,
  Building2,
  Library,
  BookOpen,
  Users,
  UserRound,
  School,
  ClipboardCheck,
  NotebookPen,
  UserCircle,
  CirclePlus,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  analytics: BrainCircuit,
  colleges: Landmark,
  departments: Building2,
  courses: Library,
  subjects: BookOpen,
  students: Users,
  teachers: UserRound,
  classes: School,
  attendance: ClipboardCheck,
  marks: NotebookPen,
  profile: UserCircle,
  plus: CirclePlus,
};

export function NavIcon({ name, className, size = 20 }: { name?: string; className?: string; size?: number }) {
  const Icon = (name && ICONS[name]) || LayoutDashboard;
  return <Icon className={className} size={size} strokeWidth={2} />;
}
