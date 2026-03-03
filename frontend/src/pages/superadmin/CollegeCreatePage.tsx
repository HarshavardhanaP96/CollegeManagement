import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createCollege } from '../../api/college';
import { getErrorMessage } from '../../api/client';
import { Card, Button, Input, Breadcrumbs } from '../../components/common';

const createCollegeSchema = z.object({
  collegeName: z.string().min(1, 'College name is required'),
  collegeCode: z.string().min(1, 'College code is required'),
  address: z.string().min(1, 'Address is required'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().min(1, 'Contact phone is required'),
});

type CreateCollegeForm = z.infer<typeof createCollegeSchema>;

export function CollegeCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCollegeForm>({
    resolver: zodResolver(createCollegeSchema),
  });

  const createMutation = useMutation({
    mutationFn: createCollege,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colleges'] });
      navigate('/colleges');
    },
    onError: (error) => {
      const { message } = getErrorMessage(error);
      setServerError(message);
    },
  });

  const onSubmit = (data: CreateCollegeForm) => {
    setServerError(null);
    createMutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <div className="mb-4">
          <Breadcrumbs 
            items={[
              { label: 'Colleges', path: '/colleges' },
              { label: 'Register Institution' }
            ]} 
          />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Register College</h1>
        <p className="mt-2 text-slate-500 font-medium">Add a new institution to the global academic network.</p>
      </header>

      <Card>
        {serverError && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600 border border-red-100">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                label="Institution Name"
                placeholder="e.g. Stanford University"
                {...register('collegeName')}
                error={errors.collegeName?.message}
              />
            </div>
            <Input
              label="Unique College Code"
              placeholder="e.g. SU-001"
              {...register('collegeCode')}
              error={errors.collegeCode?.message}
            />
            <Input
              label="Primary Contact Email"
              type="email"
              placeholder="admin@college.edu"
              {...register('contactEmail')}
              error={errors.contactEmail?.message}
            />
            <Input
              label="Official Contact Phone"
              placeholder="+1 (555) 000-0000"
              {...register('contactPhone')}
              error={errors.contactPhone?.message}
            />
            <div className="md:col-span-2">
              <Input
                label="Physical Address"
                placeholder="Full campus address"
                {...register('address')}
                error={errors.address?.message}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-50">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/colleges')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              className="px-8"
            >
              Register College
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
