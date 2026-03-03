import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createCourse } from '../../api/course';
import { getErrorMessage } from '../../api/client';
import { Card, Button, Input, Breadcrumbs } from '../../components/common';

const createCourseSchema = z.object({
  courseName: z.string().min(1, 'Course name is required'),
  courseCode: z.string().min(1, 'Course code is required'),
  durationYears: z.number().min(1, 'Minimum 1 year').max(10, 'Maximum 10 years'),
  totalSemesters: z.number().min(1, 'Minimum 1 semester').max(20, 'Maximum 20 semesters'),
});

type CreateCourseForm = z.infer<typeof createCourseSchema>;

export function CourseCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCourseForm>({
    resolver: zodResolver(createCourseSchema),
  });

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      navigate('/courses');
    },
    onError: (error) => {
      const { message } = getErrorMessage(error);
      setServerError(message);
    },
  });

  const onSubmit = (data: CreateCourseForm) => {
    setServerError(null);
    createMutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <div className="mb-4">
          <Breadcrumbs 
            items={[
              { label: 'Courses', path: '/courses' },
              { label: 'Formulate' }
            ]} 
          />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Formulate Course</h1>
        <p className="mt-2 text-slate-500 font-medium">
          Define a new academic curriculum with duration and semester structure.
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
            label="Course Name"
            placeholder="e.g. Bachelor of Technology"
            {...register('courseName')}
            error={errors.courseName?.message}
          />

          <Input
            label="Course Code"
            placeholder="e.g. BTECH-CS"
            {...register('courseCode')}
            error={errors.courseCode?.message}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="Duration (Years)"
              type="number"
              placeholder="4"
              {...register('durationYears', { valueAsNumber: true })}
              error={errors.durationYears?.message}
            />

            <Input
              label="Total Semesters"
              type="number"
              placeholder="8"
              {...register('totalSemesters', { valueAsNumber: true })}
              error={errors.totalSemesters?.message}
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/courses')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              className="px-10"
            >
              Formulate
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
