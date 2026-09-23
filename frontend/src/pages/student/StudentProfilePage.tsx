import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Input, Loading } from '../../components/common';
import { getMyProfile, updateMyProfile } from '../../api/student';
import { getErrorMessage } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import { Can } from '../../hooks/Can';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

const profileSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().email('Invalid email').optional(),
  address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function StudentProfilePage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.studentProfile.all,
    queryFn: () => getMyProfile(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: data?.data
      ? {
          phone: data.data.phone,
          email: data.data.email,
          parentPhone: data.data.parentPhone,
          parentEmail: data.data.parentEmail,
          address: data.data.address,
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      setIsEditing(false);
      setServerError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.studentProfile.all });
    },
    onError: (error) => {
      const { message } = getErrorMessage(error);
      setServerError(message);
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    setServerError(null);
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return <Loading text="Loading profile..." />;
  }

  const profile = data?.data;

  if (!profile) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Profile</h1>
          <p className="text-sm text-slate-600">View and update your profile information</p>
        </div>
        {!isEditing && (
          <Can action="update" resource="profile">
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          </Can>
        )}
      </div>

      <Card>
        {serverError && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                {...register('phone')}
                error={errors.phone?.message}
              />
              <Input
                label="Email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Parent Phone"
                {...register('parentPhone')}
                error={errors.parentPhone?.message}
              />
              <Input
                label="Parent Email"
                type="email"
                {...register('parentEmail')}
                error={errors.parentEmail?.message}
              />
            </div>
            <Input
              label="Address"
              {...register('address')}
              error={errors.address?.message}
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  reset();
                  setServerError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="mb-2 font-semibold">Personal Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {profile.fullName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {profile.email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {profile.phone}
                  </div>
                  <div>
                    <span className="font-medium">Roll Number:</span> {profile.rollNumber}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Academic Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Department:</span> {profile.deptName}
                  </div>
                  <div>
                    <span className="font-medium">Course:</span> {profile.courseName}
                  </div>
                  <div>
                    <span className="font-medium">Current Semester:</span> {profile.currentSemester}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Parent/Guardian Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {profile.parentName}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {profile.parentPhone}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {profile.parentEmail}
                </div>
                <div>
                  <span className="font-medium">Address:</span> {profile.address}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
