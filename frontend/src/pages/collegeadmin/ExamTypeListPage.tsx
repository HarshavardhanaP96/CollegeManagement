import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Loading } from '../../components/common';
import { getExamTypes } from '../../api/examType';
import { queryKeys } from '../../api/queryKeys';
import { Can } from '../../hooks/Can';

export function ExamTypeListPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.examTypes.all,
    queryFn: () => getExamTypes(),
  });

  const examTypes = data?.data || [];

  return (
    <div className="flex flex-col h-full space-y-4">
      <header className="flex items-center justify-between px-2 shrink-0">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold text-slate-900">Exam types</h1>
          <p className="text-slate-500 text-sm">Assessment categories used when entering marks (Internal, External, ...).</p>
        </div>
        <Can action="create" resource="examTypes">
          <Button onClick={() => navigate('/exam-types/new')} className="px-5 h-10 font-medium text-sm">
            Add exam type
          </Button>
        </Can>
      </header>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Card className="h-full flex items-center justify-center">
            <Loading size="lg" text="Loading exam types…" />
          </Card>
        ) : examTypes.length === 0 ? (
          <Card><p className="text-center text-slate-500 py-8">No exam types yet.</p></Card>
        ) : (
          <Card noPadding className="border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam type</TableHead>
                  <TableHead>Maximum marks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examTypes.map((examType) => (
                  <TableRow key={examType.examTypeId}>
                    <TableCell className="font-semibold text-slate-900">{examType.examTypeName}</TableCell>
                    <TableCell>{examType.maxMarks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
