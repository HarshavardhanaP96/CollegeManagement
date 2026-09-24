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
    <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <header className="flex items-center justify-between px-2 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Exam Types</h1>
          <p className="text-slate-500 font-medium text-sm">Assessment categories used when entering marks (Internal, External, ...).</p>
        </div>
        <Can action="create" resource="examTypes">
          <Button onClick={() => navigate('/exam-types/new')} className="px-6 h-10 shadow-lg shadow-sky-500/20 font-black uppercase tracking-widest text-[10px]">
            Define
          </Button>
        </Can>
      </header>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Card className="h-full flex items-center justify-center">
            <Loading size="lg" text="Loading exam types..." />
          </Card>
        ) : examTypes.length === 0 ? (
          <Card><p className="text-center text-slate-500 py-8">No exam types defined yet.</p></Card>
        ) : (
          <Card noPadding className="shadow-2xl shadow-slate-200/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Type</TableHead>
                  <TableHead>Maximum Marks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examTypes.map((examType) => (
                  <TableRow key={examType.examTypeId}>
                    <TableCell className="font-bold text-slate-900">{examType.examTypeName}</TableCell>
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
