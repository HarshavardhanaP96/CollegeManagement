import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Breadcrumbs, Loading, DetailGrid, DetailField } from '../../components/common';
import { getCollegeById } from '../../api/college';
import { queryKeys } from '../../api/queryKeys';

export function CollegeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const collegeId = Number(id);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.colleges.byId(collegeId),
    queryFn: () => getCollegeById(collegeId),
    enabled: Number.isFinite(collegeId),
  });

  const college = data?.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header>
        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Colleges', path: '/colleges' }, { label: 'Profile' }]} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isLoading ? 'Loading…' : college?.collegeName || 'Institution'}
            </h1>
            <p className="mt-1 text-slate-500 font-medium">Institution profile and contact details.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/colleges')}>Back to Colleges</Button>
        </div>
      </header>

      {isLoading ? (
        <Card className="flex items-center justify-center py-16"><Loading text="Loading institution…" /></Card>
      ) : isError || !college ? (
        <Card><p className="text-center text-slate-500">Institution not found.</p></Card>
      ) : (
        <Card>
          <DetailGrid>
            <DetailField label="Institution Name" value={college.collegeName} />
            <DetailField label="Code" value={college.collegeCode} />
            <DetailField label="Address" value={college.address} />
            <DetailField label="Contact Email" value={college.contactEmail} />
            <DetailField label="Contact Phone" value={college.contactPhone} />
            <DetailField label="Departments" value={college.totalDepartments} />
            <DetailField label="Teachers" value={college.totalTeachers} />
            <DetailField label="Students" value={college.totalStudents} />
            <DetailField label="Registered" value={new Date(college.createdAt).toLocaleDateString()} />
          </DetailGrid>
        </Card>
      )}
    </div>
  );
}
