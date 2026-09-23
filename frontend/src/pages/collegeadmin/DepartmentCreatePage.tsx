import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createDepartment } from '../../api/department';
import { getErrorMessage } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import { Card, Button, Input, Breadcrumbs } from '../../components/common';

const createDeptSchema = z.object({
  deptName: z.string().min(1, 'Department name is required'),
  deptCode: z.string().min(1, 'Department code is required'),
});

type CreateDeptForm = z.infer<typeof createDeptSchema>;

export function DepartmentCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateDeptForm>({
    resolver: zodResolver(createDeptSchema),
  });

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      navigate('/departments');
    },
    onError: (error) => {
      const { message } = getErrorMessage(error);
      setServerError(message);
    },
  });

  const onSubmit = (data: CreateDeptForm) => {
    setServerError(null);
    createMutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <div className="mb-4">
          <Breadcrumbs 
            items={[
              { label: 'Departments', path: '/departments' },
              { label: 'Establish' }
            ]} 
          />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Establish Department</h1>
        <p className="mt-2 text-slate-500 font-medium">
          Create a new academic or administrative unit within your college.
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
            label="Department Name"
            placeholder="e.g. Computer Science and Engineering"
            {...register('deptName')}
            error={errors.deptName?.message}
          />

          <Input
            label="Department Code"
            placeholder="e.g. CSE"
            {...register('deptCode')}
            error={errors.deptCode?.message}
          />

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/departments')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              className="px-10"
            >
              Establish
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
