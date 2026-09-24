import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createExamType } from '../../api/examType';
import { getErrorMessage } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import { Card, Button, Input, Breadcrumbs } from '../../components/common';

const createExamTypeSchema = z.object({
  examTypeName: z.string().min(1, 'Exam type name is required').max(50, 'Maximum 50 characters'),
  maxMarks: z.number().min(1, 'Minimum 1 mark'),
});

type CreateExamTypeForm = z.infer<typeof createExamTypeSchema>;

export function ExamTypeCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateExamTypeForm>({
    resolver: zodResolver(createExamTypeSchema),
  });

  const createMutation = useMutation({
    mutationFn: createExamType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.examTypes.all });
      navigate('/exam-types');
    },
    onError: (error) => {
      const { message } = getErrorMessage(error);
      setServerError(message);
    },
  });

  const onSubmit = (data: CreateExamTypeForm) => {
    setServerError(null);
    createMutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <div className="mb-4">
          <Breadcrumbs
            items={[
              { label: 'Exam Types', path: '/exam-types' },
              { label: 'Define' },
            ]}
          />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Define Exam Type</h1>
        <p className="mt-2 text-slate-500 font-medium">
          Create a new assessment category (e.g. Internal, External, Mid-Semester) with its maximum marks.
        </p>
      </header>

      <Card>
        {serverError && (
          <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Exam Type Name"
            placeholder="e.g. Internal, External, Mid-Semester"
            {...register('examTypeName')}
            error={errors.examTypeName?.message}
          />

          <Input
            label="Maximum Marks"
            type="number"
            placeholder="100"
            {...register('maxMarks', { valueAsNumber: true })}
            error={errors.maxMarks?.message}
          />

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => navigate('/exam-types')}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending} className="px-10">
              Define
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
