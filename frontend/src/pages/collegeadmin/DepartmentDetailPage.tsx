import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Breadcrumbs, Loading, DetailGrid, DetailField } from '../../components/common';
import { getDepartmentById } from '../../api/department';
import { queryKeys } from '../../api/queryKeys';

export function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const deptId = Number(id);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.departments.byId(deptId),
    queryFn: () => getDepartmentById(deptId),
    enabled: Number.isFinite(deptId),
  });

  const dept = data?.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header>
        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Departments', path: '/departments' }, { label: 'Profile' }]} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isLoading ? 'Loading…' : dept?.deptName || 'Department'}
            </h1>
            <p className="mt-1 text-slate-500 font-medium">Department profile and leadership.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/departments')}>Back to Departments</Button>
        </div>
      </header>

      {isLoading ? (
        <Card className="flex items-center justify-center py-16"><Loading text="Loading department…" /></Card>
      ) : isError || !dept ? (
        <Card><p className="text-center text-slate-500">Department not found.</p></Card>
      ) : (
        <Card>
          <DetailGrid>
            <DetailField label="Department Name" value={dept.deptName} />
            <DetailField label="Code" value={dept.deptCode} />
            <DetailField label="Head of Department" value={dept.deptHeadName || 'Unassigned'} />
            <DetailField label="Registered" value={new Date(dept.createdAt).toLocaleDateString()} />
          </DetailGrid>
        </Card>
      )}
    </div>
  );
}
