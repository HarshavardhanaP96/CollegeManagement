import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Breadcrumbs, Loading, DetailGrid, DetailField } from '../../components/common';
import { getCourseById } from '../../api/course';
import { queryKeys } from '../../api/queryKeys';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const courseId = Number(id);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.courses.byId(courseId),
    queryFn: () => getCourseById(courseId),
    enabled: Number.isFinite(courseId),
  });

  const course = data?.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header>
        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Courses', path: '/courses' }, { label: 'Manage' }]} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isLoading ? 'Loading…' : course?.courseName || 'Course'}
            </h1>
            <p className="mt-1 text-slate-500 font-medium">Program structure and duration.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/courses')}>Back to Courses</Button>
        </div>
      </header>

      {isLoading ? (
        <Card className="flex items-center justify-center py-16"><Loading text="Loading course…" /></Card>
      ) : isError || !course ? (
        <Card><p className="text-center text-slate-500">Course not found.</p></Card>
      ) : (
        <Card>
          <DetailGrid>
            <DetailField label="Course Name" value={course.courseName} />
            <DetailField label="Course Code" value={course.courseCode} />
            <DetailField label="Duration" value={`${course.durationYears} years`} />
            <DetailField label="Total Semesters" value={course.totalSemesters} />
            <DetailField label="Registered" value={new Date(course.createdAt).toLocaleDateString()} />
          </DetailGrid>
        </Card>
      )}
    </div>
  );
}
