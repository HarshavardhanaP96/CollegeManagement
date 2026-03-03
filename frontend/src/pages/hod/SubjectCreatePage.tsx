import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createSubject } from '../../api/subject';
import { getErrorMessage } from '../../api/client';
import { Card, Button, Input, Select, Breadcrumbs } from '../../components/common';

const createSubjectSchema = z.object({
  subjectCode: z.string().min(1, 'Subject code is required'),
  subjectName: z.string().min(1, 'Subject name is required'),
  credits: z.number().min(1, 'Minimum 1 credit').max(10, 'Maximum 10 credits'),
  subjectType: z.string().min(1, 'Subject type is required'),
});

type CreateSubjectForm = z.infer<typeof createSubjectSchema>;

export function SubjectCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSubjectForm>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      credits: 3,
      subjectType: 'Theory',
    },
  });

  const createMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      navigate('/subjects');
    },
    onError: (error) => {
      const { message } = getErrorMessage(error);
      setServerError(message);
    },
  });

  const onSubmit = (data: CreateSubjectForm) => {
    setServerError(null);
    createMutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <div className="mb-4">
          <Breadcrumbs 
            items={[
              { label: 'Subjects', path: '/subjects' },
              { label: 'Induct' }
            ]} 
          />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Induct Subject</h1>
        <p className="mt-2 text-slate-500 font-medium">
          Add a new subject to the departmental course catalog.
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
            label="Subject Name"
            placeholder="e.g. Advanced Operating Systems"
            {...register('subjectName')}
            error={errors.subjectName?.message}
          />

          <Input
            label="Subject Code"
            placeholder="e.g. CS-401"
            {...register('subjectCode')}
            error={errors.subjectCode?.message}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="Credits"
              type="number"
              placeholder="3"
              {...register('credits', { valueAsNumber: true })}
              error={errors.credits?.message}
            />

            <Select
              label="Subject Classification"
              options={[
                { value: 'Theory', label: 'Theory' },
                { value: 'Practical', label: 'Practical' },
                { value: 'Lab', label: 'Lab' },
                { value: 'Seminar', label: 'Seminar' },
              ]}
              {...register('subjectType')}
              error={errors.subjectType?.message}
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/subjects')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              className="px-10"
            >
              Induct Subject
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
