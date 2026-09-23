import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createTeacher } from '../../api/teacher';
import { getErrorMessage } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import { Card, Button, Input, Breadcrumbs } from '../../components/common';

const createTeacherSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  qualification: z.string().min(1, 'Qualification is required'),
  specialization: z.string().min(1, 'Specialization is required'),
  hireDate: z.string().min(1, 'Hire date is required'),
});

type CreateTeacherForm = z.infer<typeof createTeacherSchema>;

export function TeacherCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTeacherForm>({
    resolver: zodResolver(createTeacherSchema),
  });

  const createMutation = useMutation({
    mutationFn: createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.all });
      navigate('/teachers');
    },
    onError: (error) => {
      const { message } = getErrorMessage(error);
      setServerError(message);
    },
  });

  const onSubmit = (data: CreateTeacherForm) => {
    setServerError(null);
    createMutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <div className="mb-4">
          <Breadcrumbs 
            items={[
              { label: 'Teachers', path: '/teachers' },
              { label: 'Onboard Faculty' }
            ]} 
          />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Onboard Faculty</h1>
        <p className="mt-2 text-slate-500 font-medium">
          Register a new educator into the departmental workforce.
        </p>
      </header>

      <Card>
        {serverError && (
          <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1 border-l-4 border-sky-500 pl-4">Account Credentials</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Login Username"
                placeholder="e.g. jdoe_cse"
                {...register('username')}
                error={errors.username?.message}
              />
              <Input
                label="System Password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
              />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1 border-l-4 border-sky-500 pl-4">Personal Details</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <Input
                  label="Full Legal Name"
                  placeholder="e.g. Dr. Jane Smith"
                  {...register('fullName')}
                  error={errors.fullName?.message}
                />
              </div>
              <Input
                label="Email Address"
                type="email"
                placeholder="jane.smith@college.edu"
                {...register('email')}
                error={errors.email?.message}
              />
              <Input
                label="Primary Phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                {...register('phone')}
                error={errors.phone?.message}
              />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1 border-l-4 border-sky-500 pl-4">Professional Profile</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Employee ID"
                placeholder="e.g. EMP-2024-001"
                {...register('employeeId')}
                error={errors.employeeId?.message}
              />
              <Input
                label="Highest Qualification"
                placeholder="e.g. Ph.D. in Computer Science"
                {...register('qualification')}
                error={errors.qualification?.message}
              />
              <Input
                label="Area of Specialization"
                placeholder="e.g. Machine Learning, NLP"
                {...register('specialization')}
                error={errors.specialization?.message}
              />
              <Input
                label="Date of Joining"
                type="date"
                {...register('hireDate')}
                error={errors.hireDate?.message}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/teachers')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              className="px-10"
            >
              Onboard Faculty
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
