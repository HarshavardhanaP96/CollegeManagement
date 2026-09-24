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
  ListChecks,
  NotebookPen,
  UserCircle,
  CirclePlus,
  LifeBuoy,
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
  examTypes: ListChecks,
  profile: UserCircle,
  plus: CirclePlus,
  support: LifeBuoy,
};

export function NavIcon({ name, className, size = 20 }: { name?: string; className?: string; size?: number }) {
  const Icon = (name && ICONS[name]) || LayoutDashboard;
  return <Icon className={className} size={size} strokeWidth={2} />;
}
