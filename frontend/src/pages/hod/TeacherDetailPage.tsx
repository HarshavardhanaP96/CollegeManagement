import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Breadcrumbs, Loading, DetailGrid, DetailField } from '../../components/common';
import { getTeacherById } from '../../api/teacher';
import { queryKeys } from '../../api/queryKeys';

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const teacherId = Number(id);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.teachers.byId(teacherId),
    queryFn: () => getTeacherById(teacherId),
    enabled: Number.isFinite(teacherId),
  });

  const teacher = data?.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header>
        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Teachers', path: '/teachers' }, { label: 'Details' }]} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isLoading ? 'Loading…' : teacher?.fullName || 'Faculty'}
            </h1>
            <p className="mt-1 text-slate-500 font-medium">Faculty profile and specialization.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/teachers')}>Back to Faculty</Button>
        </div>
      </header>

      {isLoading ? (
        <Card className="flex items-center justify-center py-16"><Loading text="Loading faculty member…" /></Card>
      ) : isError || !teacher ? (
        <Card><p className="text-center text-slate-500">Faculty member not found.</p></Card>
      ) : (
        <Card>
          <DetailGrid>
            <DetailField label="Full Name" value={teacher.fullName} />
            <DetailField label="Employee ID" value={teacher.employeeId} />
            <DetailField label="Email" value={teacher.email} />
            <DetailField label="Phone" value={teacher.phone} />
            <DetailField label="Department" value={teacher.deptName} />
            <DetailField label="Qualification" value={teacher.qualification} />
            <DetailField label="Specialization" value={teacher.specialization} />
            <DetailField label="Hire Date" value={teacher.hireDate ? new Date(teacher.hireDate).toLocaleDateString() : undefined} />
            <DetailField label="Status" value={teacher.isActive ? 'Active' : 'Inactive'} />
          </DetailGrid>
        </Card>
      )}
    </div>
  );
}
