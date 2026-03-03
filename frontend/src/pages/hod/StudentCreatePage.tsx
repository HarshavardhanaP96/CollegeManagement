import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createStudent } from '../../api/student';
import { getDepartments } from '../../api/department';
import { getCourses } from '../../api/course';
import { getErrorMessage } from '../../api/client';
import { Card, Button, Input, Select, Breadcrumbs } from '../../components/common';

const createStudentSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
  rollNumber: z.string().min(1, 'Roll number is required'),
  deptId: z.number().min(1, 'Department is required'),
  courseId: z.number().min(1, 'Course is required'),
  admissionYear: z.number().min(2000, 'Invalid year').max(2100, 'Invalid year'),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
});

type CreateStudentForm = z.infer<typeof createStudentSchema>;

export function StudentCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: deptsData } = useQuery({ queryKey: ['departments'], queryFn: () => getDepartments() });
  const { data: coursesData } = useQuery({ queryKey: ['courses'], queryFn: () => getCourses() });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateStudentForm>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      admissionYear: new Date().getFullYear(),
    },
  });

  const createMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      navigate('/students');
    },
    onError: (error) => {
      const { message } = getErrorMessage(error);
      setServerError(message);
    },
  });

  const onSubmit = (data: CreateStudentForm) => {
    setServerError(null);
    createMutation.mutate({
      ...data,
      parentEmail: data.parentEmail || undefined,
    });
  };

  const departments = deptsData?.data || [];
  const courses = coursesData?.data || [];

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header>
        <div className="mb-4">
          <Breadcrumbs 
            items={[
              { label: 'Students', path: '/students' },
              { label: 'Enroll New Student' }
            ]} 
          />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Enroll Student</h1>
        <p className="mt-2 text-slate-500 font-medium">
          Create a new student identity and associate them with a course and department.
        </p>
      </header>

      <Card>
        {serverError && (
          <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
          {/* Section: Account & Identity */}
          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1 border-l-4 border-sky-500 pl-4">Registry Identity</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Login Username"
                placeholder="e.g. st_2024_001"
                {...register('username')}
                error={errors.username?.message}
              />
              <Input
                label="Account Password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
              />
              <div className="md:col-span-2">
                 <Input
                    label="Full Legal Name"
                    placeholder="e.g. Alexander Pierce"
                    {...register('fullName')}
                    error={errors.fullName?.message}
                  />
              </div>
              <Input
                label="Official Email"
                type="email"
                placeholder="student@college.edu"
                {...register('email')}
                error={errors.email?.message}
              />
              <Input
                label="Contact Phone"
                placeholder="10-digit mobile number"
                {...register('phone')}
                error={errors.phone?.message}
              />
            </div>
          </div>

          {/* Section: Academic Binding */}
          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1 border-l-4 border-indigo-500 pl-4">Academic Binding</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Roll Number / Student ID"
                placeholder="e.g. CSE-24-001"
                {...register('rollNumber')}
                error={errors.rollNumber?.message}
              />
              <Input
                label="Admission Year"
                type="number"
                {...register('admissionYear', { valueAsNumber: true })}
                error={errors.admissionYear?.message}
              />
              <Select
                label="Department"
                options={departments.map(d => ({ value: d.deptId, label: d.deptName }))}
                {...register('deptId', { valueAsNumber: true })}
                error={errors.deptId?.message}
                placeholder="Select Department"
              />
              <Select
                label="Degree Program"
                options={courses.map(c => ({ value: c.courseId, label: c.courseName }))}
                {...register('courseId', { valueAsNumber: true })}
                error={errors.courseId?.message}
                placeholder="Select Course"
              />
            </div>
          </div>

          {/* Section: Guardian & Personal */}
          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1 border-l-4 border-emerald-500 pl-4">Guardian & Personal</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Guardian Name"
                placeholder="Parent or Guardian full name"
                {...register('parentName')}
                error={errors.parentName?.message}
              />
              <Input
                label="Guardian Phone"
                placeholder="Contact for emergencies"
                {...register('parentPhone')}
                error={errors.parentPhone?.message}
              />
              <Input
                label="Date of Birth"
                type="date"
                {...register('dateOfBirth')}
                error={errors.dateOfBirth?.message}
              />
              <Input
                label="Guardian Email (Optional)"
                type="email"
                {...register('parentEmail')}
                error={errors.parentEmail?.message}
              />
              <div className="md:col-span-2">
                <Input
                  label="Residential Address"
                  placeholder="Complete permanent address"
                  {...register('address')}
                  error={errors.address?.message}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/students')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              className="px-12"
            >
              Enroll Student
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
