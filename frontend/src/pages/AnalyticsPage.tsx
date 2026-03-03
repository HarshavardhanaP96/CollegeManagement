import { useQuery } from '@tanstack/react-query';
import { getColleges } from '../api/college';
import { getDepartments } from '../api/department';
import { getCourses } from '../api/course';
import { getTeachers } from '../api/teacher';
import { getStudents } from '../api/student';
import { getSubjects } from '../api/subject';
import { getClasses } from '../api/class';
import { Card, Loading } from '../components/common';

export function AnalyticsPage() {
  // Fetch all data for high-level stats
  const { data: collegesData, isLoading: collegesLoading } = useQuery({ queryKey: ['colleges-all'], queryFn: () => getColleges({ size: 100 }) });
  const { data: deptsData, isLoading: deptsLoading } = useQuery({ queryKey: ['depts-all'], queryFn: () => getDepartments() });
  const { data: coursesData, isLoading: coursesLoading } = useQuery({ queryKey: ['courses-all'], queryFn: () => getCourses() });
  const { data: teachersData, isLoading: teachersLoading } = useQuery({ queryKey: ['teachers-all'], queryFn: () => getTeachers() });
  const { data: studentsData, isLoading: studentsLoading } = useQuery({ queryKey: ['students-all'], queryFn: () => getStudents() });
  const { data: subjectsData, isLoading: subjectsLoading } = useQuery({ queryKey: ['subjects-all'], queryFn: () => getSubjects() });
  const { data: classesData, isLoading: classesLoading } = useQuery({ queryKey: ['classes-all'], queryFn: () => getClasses() });

  const isLoading = collegesLoading || deptsLoading || coursesLoading || teachersLoading || studentsLoading || subjectsLoading || classesLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loading size="lg" text="Aggregating global intelligence..." />
      </div>
    );
  }

  const colleges = collegesData?.data?.content || [];
  const departments = deptsData?.data || [];
  const courses = coursesData?.data || [];
  const teachers = teachersData?.data || [];
  const students = studentsData?.data || [];
  const subjects = subjectsData?.data || [];
  const classes = classesData?.data || [];

  const sections = [
    {
      title: 'Institutional Infrastructure',
      stats: [
        { label: 'Total Institutions', value: colleges.length, color: 'sky' },
        { label: 'Academic Units (Depts)', value: departments.length, color: 'indigo' },
        { label: 'Degree Programs', value: courses.length, color: 'violet' },
      ]
    },
    {
       title: 'Personnel Matrix',
       stats: [
         { label: 'Total Professionals', value: teachers.length, color: 'emerald' },
         { label: 'Student Population', value: students.length, color: 'amber' },
         { label: 'Specialized Expertise', value: new Set(teachers.map(t => t.specialization)).size, color: 'rose' },
       ]
    },
    {
       title: 'Academic Logistics',
       stats: [
         { label: 'Active Cohorts', value: classes.length, color: 'blue' },
         { label: 'Course Catalog', value: subjects.length, color: 'cyan' },
         { label: 'Avg Study Period', value: (courses.reduce((acc, curr) => acc + (curr.durationYears || 0), 0) / (courses.length || 1)).toFixed(1) + 'y', color: 'slate' },
       ]
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="px-2">
         <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-2">Intelligence Hub</h1>
         <p className="text-slate-500 font-medium mt-1">Global oversight and real-time metric aggregation across the network.</p>
      </header>

      <div className="space-y-12">
        {sections.map((section) => (
          <section key={section.title} className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 whitespace-nowrap">{section.title}</h2>
              <div className="h-[1px] w-full bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {section.stats.map((stat) => (
                <Card key={stat.label} className={`p-8 bg-white border-slate-200/60 shadow-xl shadow-slate-200/40 border-l-4 transition-all hover:scale-[1.02] hover:shadow-2xl ${
                  stat.color === 'sky' ? 'border-l-sky-500' :
                  stat.color === 'indigo' ? 'border-l-indigo-500' :
                  stat.color === 'violet' ? 'border-l-violet-500' :
                  stat.color === 'emerald' ? 'border-l-emerald-500' :
                  stat.color === 'amber' ? 'border-l-amber-500' :
                  stat.color === 'rose' ? 'border-l-rose-500' :
                  stat.color === 'blue' ? 'border-l-blue-500' :
                  stat.color === 'cyan' ? 'border-l-cyan-500' : 'border-l-slate-500'
                }`}>
                  <p className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
                  <p className="text-5xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                  <div className="mt-4 flex items-center gap-2">
                     <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                        stat.color === 'sky' ? 'bg-sky-500' :
                        stat.color === 'emerald' ? 'bg-emerald-500' : 'bg-slate-300'
                     }`} />
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Real-time Verified</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
