import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClass, getCourses } from '../../api';
import { getErrorMessage } from '../../api/client';
import { Card, Button, Input, Select, Breadcrumbs } from '../../components/common';

const createClassSchema = z.object({
  courseId: z.number().min(1, 'Course choice is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  semester: z.number().min(1, 'Minimum 1 semester').max(20, 'Maximum 20 semesters'),
  section: z.string().min(1, 'Section is required'),
  className: z.string().optional(),
});

type CreateClassForm = z.infer<typeof createClassSchema>;

export function ClassCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: () => getCourses(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClassForm>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      semester: 1,
      section: 'A',
    },
  });

  const createMutation = useMutation({
    mutationFn: createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      navigate('/classes');
    },
    onError: (error) => {
      const { message } = getErrorMessage(error);
      setServerError(message);
    },
  });

  const onSubmit = (data: CreateClassForm) => {
    setServerError(null);
    createMutation.mutate(data);
  };

  const courses = coursesData?.data || [];

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <div className="mb-4">
          <Breadcrumbs 
            items={[
              { label: 'Classes', path: '/classes' },
              { label: 'Instantiate' }
            ]} 
          />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Instantiate Class</h1>
        <p className="mt-2 text-slate-500 font-medium">
          Organize a new cohort by binding a course, semester, and section.
        </p>
      </header>

      <Card>
        {serverError && (
          <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Select
            label="Degree Program"
            options={courses.map((c) => ({ value: c.courseId, label: c.courseName }))}
            {...register('courseId', { valueAsNumber: true })}
            error={errors.courseId?.message}
            placeholder="Select associated program"
          />

          <Input
            label="Academic Term / Year"
            placeholder="e.g. 2024 - 2025"
            {...register('academicYear')}
            error={errors.academicYear?.message}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="Active Semester"
              type="number"
              placeholder="1"
              {...register('semester', { valueAsNumber: true })}
              error={errors.semester?.message}
            />

            <Input
              label="Assigned Section"
              placeholder="Section A, B, C..."
              {...register('section')}
              error={errors.section?.message}
            />
          </div>

          <Input
            label="Alias / Class Name (Optional)"
            placeholder="e.g. AI-Major-Group-A"
            {...register('className')}
            error={errors.className?.message}
            helperText="Custom identifier for the cohort. System generates one if left empty."
          />

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/classes')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              className="px-10"
            >
              Instantiate
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
