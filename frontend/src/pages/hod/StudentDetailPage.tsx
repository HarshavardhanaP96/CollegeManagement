import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Breadcrumbs, Loading, DetailGrid, DetailField } from '../../components/common';
import { getStudentById } from '../../api/student';
import { queryKeys } from '../../api/queryKeys';

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const studentId = Number(id);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.students.byId(studentId),
    queryFn: () => getStudentById(studentId),
    enabled: Number.isFinite(studentId),
  });

  const student = data?.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header>
        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Students', path: '/students' }, { label: 'Profile' }]} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isLoading ? 'Loading…' : student?.fullName || 'Scholar'}
            </h1>
            <p className="mt-1 text-slate-500 font-medium">Scholar profile and academic standing.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/students')}>Back to Registry</Button>
        </div>
      </header>

      {isLoading ? (
        <Card className="flex items-center justify-center py-16"><Loading text="Loading scholar…" /></Card>
      ) : isError || !student ? (
        <Card><p className="text-center text-slate-500">Scholar not found.</p></Card>
      ) : (
        <div className="space-y-6">
          <Card title="Personal Information">
            <DetailGrid>
              <DetailField label="Full Name" value={student.fullName} />
              <DetailField label="Roll Number" value={student.rollNumber} />
              <DetailField label="Email" value={student.email} />
              <DetailField label="Phone" value={student.phone} />
              <DetailField label="Status" value={student.isActive ? 'Active' : 'Inactive'} />
            </DetailGrid>
          </Card>
          <Card title="Academic Information">
            <DetailGrid>
              <DetailField label="Department" value={student.deptName} />
              <DetailField label="Course" value={student.courseName} />
              <DetailField label="Admission Year" value={student.admissionYear} />
              <DetailField label="Current Semester" value={student.currentSemester} />
            </DetailGrid>
          </Card>
          <Card title="Parent / Guardian">
            <DetailGrid>
              <DetailField label="Name" value={student.parentName} />
              <DetailField label="Phone" value={student.parentPhone} />
              <DetailField label="Email" value={student.parentEmail} />
              <DetailField label="Address" value={student.address} />
            </DetailGrid>
          </Card>
        </div>
      )}
    </div>
  );
}
