import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Breadcrumbs, Loading, DetailGrid, DetailField } from '../../components/common';
import { getClassById } from '../../api/class';
import { getCourseById } from '../../api/course';
import { queryKeys } from '../../api/queryKeys';

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const classId = Number(id);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.classes.byId(classId),
    queryFn: () => getClassById(classId),
    enabled: Number.isFinite(classId),
  });

  const cls = data?.data;

  // ClassResponseDTO only carries courseId, not a course name.
  const { data: courseData } = useQuery({
    queryKey: queryKeys.courses.byId(cls?.courseId ?? -1),
    queryFn: () => getCourseById(cls!.courseId),
    enabled: !!cls?.courseId,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header>
        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Classes', path: '/classes' }, { label: 'Manage' }]} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isLoading ? 'Loading…' : cls?.className || 'Cohort'}
            </h1>
            <p className="mt-1 text-slate-500 font-medium">Cohort term, section and program.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/classes')}>Back to Cohorts</Button>
        </div>
      </header>

      {isLoading ? (
        <Card className="flex items-center justify-center py-16"><Loading text="Loading cohort…" /></Card>
      ) : isError || !cls ? (
        <Card><p className="text-center text-slate-500">Cohort not found.</p></Card>
      ) : (
        <Card>
          <DetailGrid>
            <DetailField label="Class / Alias" value={cls.className} />
            <DetailField label="Academic Year" value={cls.academicYear} />
            <DetailField label="Semester" value={cls.semester} />
            <DetailField label="Section" value={cls.section} />
            <DetailField label="Program" value={courseData?.data.courseName || `Course #${cls.courseId}`} />
            <DetailField label="Registered" value={new Date(cls.createdAt).toLocaleDateString()} />
          </DetailGrid>
        </Card>
      )}
    </div>
  );
}
