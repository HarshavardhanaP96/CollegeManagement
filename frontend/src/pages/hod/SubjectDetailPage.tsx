import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Breadcrumbs, Loading, DetailGrid, DetailField } from '../../components/common';
import { getSubjectById } from '../../api/subject';
import { queryKeys } from '../../api/queryKeys';

export function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const subjectId = Number(id);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.subjects.byId(subjectId),
    queryFn: () => getSubjectById(subjectId),
    enabled: Number.isFinite(subjectId),
  });

  const subject = data?.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header>
        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Subjects', path: '/subjects' }, { label: 'Details' }]} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isLoading ? 'Loading…' : subject?.subjectName || 'Subject'}
            </h1>
            <p className="mt-1 text-slate-500 font-medium">Catalog entry and weightage.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/subjects')}>Back to Subjects</Button>
        </div>
      </header>

      {isLoading ? (
        <Card className="flex items-center justify-center py-16"><Loading text="Loading subject…" /></Card>
      ) : isError || !subject ? (
        <Card><p className="text-center text-slate-500">Subject not found.</p></Card>
      ) : (
        <Card>
          <DetailGrid>
            <DetailField label="Subject Name" value={subject.subjectName} />
            <DetailField label="Subject Code" value={subject.subjectCode} />
            <DetailField label="Credits" value={subject.credits} />
            <DetailField label="Classification" value={subject.subjectType} />
            <DetailField label="Registered" value={new Date(subject.createdAt).toLocaleDateString()} />
          </DetailGrid>
        </Card>
      )}
    </div>
  );
}
